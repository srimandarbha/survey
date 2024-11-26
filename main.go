package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

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
        timestamp DATETIME
    )`
	_, err = db.Exec(createTableSQL)
	if err != nil {
		log.Fatal(err)
	}
}

// Updated struct to use a map of string to int for numeric indices
type QuestionnaireSubmission struct {
	Answers   map[string]int `json:"answers"`
	Timestamp time.Time      `json:"timestamp"`
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

	stmt, err := db.Prepare("INSERT INTO submissions(answers, timestamp) VALUES(?, ?)")
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	_, err = stmt.Exec(string(answersJSON), submission.Timestamp)
	if err != nil {
		http.Error(w, "Submission failed", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"status": "success",
	})
}

// Improved SPA handler with better routing
func spaHandler(w http.ResponseWriter, r *http.Request) {
	// Path to index.html
	indexPath := filepath.Join(staticPath, "index.html")

	// Requested path
	requestPath := r.URL.Path

	// Check if the request is for a static file
	filePath := filepath.Join(staticPath, requestPath)

	// Prevent directory traversal attacks
	if !strings.HasPrefix(filePath, staticPath) {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// Try to serve static files
	if fileInfo, err := os.Stat(filePath); err == nil && !fileInfo.IsDir() {
		http.ServeFile(w, r, filePath)
		return
	}

	// If no static file found, serve index.html (for SPA routing)
	if _, err := os.Stat(indexPath); err == nil {
		http.ServeFile(w, r, indexPath)
		return
	}

	// If index.html not found
	http.Error(w, "Not Found", http.StatusNotFound)
}

func main() {
	// Initialize database
	initDatabase()
	defer db.Close()

	// API routes
	http.HandleFunc("/api/submit-questionnaire", handleSubmitQuestionnaire)

	// Serve React build files and handle SPA routing
	http.HandleFunc("/", spaHandler)

	port := "8080"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
