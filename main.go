package main

import (
	"context"
	"database/sql"
	"embed"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	_ "github.com/mattn/go-sqlite3"
)

//go:embed frontend/build/*
var content embed.FS

var db *sql.DB
var staticPath = "frontend/build" // Configurable static file path

func initDatabase() {
	var err error
	db, err = sql.Open("sqlite3", "./questionnaire.db")
	if err != nil {
		log.Fatal(err)
	}

	// Updated table to ensure numeric indices are stored
	createTableSQL := `
    CREATE TABLE IF NOT EXISTS submissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        answers TEXT,
        timestamp DATETIME,
		team TEXT UNIQUE,
		score TEXT,
		previous_score INTEGER
    )`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}

//func logError(err error, context string) {
//	log.Printf("Error in %s: %v", context, err)
//}

func loadConfig() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found")
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	staticPath = os.Getenv("STATIC_PATH")
	if staticPath == "" {
		staticPath = "frontend/build"
	}
}

func validateAnswers(answers map[string]int) bool {
	// Example validation logic
	for _, value := range answers {
		if value < 0 || value > 10 {
			return false
		}
	}
	return true
}

func corsMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}

// Fetch all submissions
func handleFetchSubmissions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	rows, err := db.Query("SELECT id, answers, timestamp, team, score, previous_score FROM submissions")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var submissions []QuestionnaireSubmission
	for rows.Next() {
		var id int
		var answersJSON string
		var timestamp time.Time
		var team string
		var score string
		var previousScore int

		if err := rows.Scan(&id, &answersJSON, &timestamp, &team, &score, &previousScore); err != nil {
			http.Error(w, "Error reading data", http.StatusInternalServerError)
			return
		}

		var answers map[string]int
		if err := json.Unmarshal([]byte(answersJSON), &answers); err != nil {
			http.Error(w, "Error processing data", http.StatusInternalServerError)
			return
		}

		submissions = append(submissions, QuestionnaireSubmission{
			ID:            id,
			Answers:       answers,
			Timestamp:     timestamp,
			Team:          team,
			Score:         score,
			PreviousScore: previousScore,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(submissions)
}

// Update a submission
func handleUpdateSubmission(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var submission struct {
		ID            int            `json:"id"`
		Answers       map[string]int `json:"answers"`
		Timestamp     time.Time      `json:"timestamp"`
		Team          string         `json:"team"`
		Score         string         `json:"score"`
		PreviousScore int            `json:"previous_score"`
	}

	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&submission); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	answersJSON, err := json.Marshal(submission.Answers)
	if err != nil {
		http.Error(w, "Error processing answers", http.StatusInternalServerError)
		return
	}

	stmt, err := db.Prepare(`
			UPDATE submissions
			SET answers = ?, team = ?, score = ?, previous_score = ? 
			WHERE id = ?
			`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(string(answersJSON), submission.Team, submission.Score, submission.PreviousScore, submission.ID)
	if err != nil {
		http.Error(w, "Update failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
	})
}

// Updated struct to use a map of string to int for numeric indices
type QuestionnaireSubmission struct {
	ID            int            `json:"id"`
	Answers       map[string]int `json:"answers"`
	Timestamp     time.Time      `json:"timestamp"`
	Team          string         `json:"team"`
	Score         string         `json:"score"`
	PreviousScore int            `json:"previous_score"`
}

func handleSubmitQuestionnaire(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var submission QuestionnaireSubmission
	decoder := json.NewDecoder(r.Body)
	if err := decoder.Decode(&submission); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	defer r.Body.Close()

	// In handleSubmitQuestionnaire
	if !validateAnswers(submission.Answers) {
		http.Error(w, "Invalid answers", http.StatusBadRequest)
		return
	}

	if len(submission.Answers) == 0 {
		http.Error(w, "No answers provided", http.StatusBadRequest)
		return
	}

	submission.Timestamp = time.Now()
	answersJSON, err := json.Marshal(submission.Answers)
	if err != nil {
		http.Error(w, "Error processing answers", http.StatusInternalServerError)
		return
	}

	stmt, err := db.Prepare(`
		INSERT INTO submissions (answers, timestamp, team, score, previous_score) 
		VALUES (?, ?, ?, ?, ?)
	`)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(string(answersJSON), submission.Timestamp, submission.Team, submission.Score, submission.PreviousScore)
	if err != nil {
		http.Error(w, "Submission failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
	})
}

type Submission struct {
	ID            int             `json:"id"`
	Answers       json.RawMessage `json:"answers"`
	Timestamp     string          `json:"timestamp"`
	Team          string          `json:"team"`
	Score         string          `json:"score"`
	PreviousScore int             `json:"previous_score"`
	Version       int             `json:"version"`
}

func fetchSubmission(w http.ResponseWriter, r *http.Request) {
	idStr := r.URL.Query().Get("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		http.Error(w, "Invalid submission ID", http.StatusBadRequest)
		return
	}

	// Prepare query to fetch submission
	var submission Submission
	var answersStr string // Change this to string instead of json.RawMessage
	err = db.QueryRow("SELECT id, answers, timestamp, team, score, previous_score FROM submissions WHERE id = ?", id).Scan(
		&submission.ID,
		&answersStr, // Scan into a string first
		&submission.Timestamp,
		&submission.Team,
		&submission.Score,
		&submission.PreviousScore,
	)

	if err == sql.ErrNoRows {
		http.Error(w, "Submission not found", http.StatusNotFound)
		return
	} else if err != nil {
		log.Printf("Query error: %v", err)
		http.Error(w, "Database query error", http.StatusInternalServerError)
		return
	}

	// Convert the string to json.RawMessage
	submission.Answers = json.RawMessage(answersStr)

	// Set CORS and JSON headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.WriteHeader(http.StatusOK)

	// Encode and send response
	json.NewEncoder(w).Encode(submission)
}

func spaHandler(w http.ResponseWriter, r *http.Request) {
	// Remove the local filesystem checks and use the embedded filesystem
	filePath := strings.TrimPrefix(r.URL.Path, "/")

	// If root path or empty, serve index.html
	if filePath == "" {
		filePath = "index.html"
	}

	// Try to read the file from the embedded filesystem
	file, err := content.Open(filepath.Join("frontend/build", filePath))
	if err != nil {
		// If file not found, serve index.html for client-side routing
		file, err = content.Open("frontend/build/index.html")
		if err != nil {
			http.Error(w, "Not Found", http.StatusNotFound)
			return
		}
	}
	defer file.Close()

	// Determine content type based on file extension
	ext := filepath.Ext(filePath)
	contentType := "text/html"
	switch ext {
	case ".css":
		contentType = "text/css"
	case ".js":
		contentType = "application/javascript"
	case ".json":
		contentType = "application/json"
	case ".png":
		contentType = "image/png"
	case ".jpg", ".jpeg":
		contentType = "image/jpeg"
	case ".svg":
		contentType = "image/svg+xml"
	}

	// Set the content type
	w.Header().Set("Content-Type", contentType)

	// Read and write the file content
	fileContent, err := io.ReadAll(file)
	if err != nil {
		http.Error(w, "Error reading file", http.StatusInternalServerError)
		return
	}
	w.Write(fileContent)
}

func main() {
	// Initialize database
	loadConfig()
	initDatabase()
	defer db.Close()

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	// API routes
	http.HandleFunc("/api/fetch-submissions", corsMiddleware(handleFetchSubmissions))
	http.HandleFunc("/api/fetch-submission", corsMiddleware(fetchSubmission))
	http.HandleFunc("/api/update-submission", handleUpdateSubmission)
	http.HandleFunc("/api/submit-questionnaire", handleSubmitQuestionnaire)

	// Serve React build files and handle SPA routing
	http.HandleFunc("/", spaHandler)

	// Create a channel to handle shutdown signals
	stop := make(chan os.Signal, 1)
	signal.Notify(stop, os.Interrupt, syscall.SIGTERM)

	// Configure database connection pool
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(25)
	db.SetConnMaxLifetime(5 * time.Minute)

	server := &http.Server{
		Addr:         ":" + port,
		Handler:      nil,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
	}

	go func() {
		log.Printf("Server starting on port %s", port)
		if err := server.ListenAndServe(); err != nil {
			log.Printf("Server error: %v", err)
		}
	}()

	// Block and wait for shutdown signal
	<-stop

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Printf("Server shutdown error: %v", err)
	}

	log.Println("Server stopped gracefully")
}
