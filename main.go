package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

var db *sql.DB

func initDatabase() {
	var err error
	db, err = sql.Open("sqlite3", "./questionnaire.db")
	if err != nil {
		log.Fatal(err)
	}

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

type QuestionnaireSubmission struct {
	Answers   map[string]string `json:"answers"`
	Timestamp time.Time         `json:"timestamp"`
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
	answersJSON, _ := json.Marshal(submission.Answers)

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

func main() {
	initDatabase()
	defer db.Close()

	http.HandleFunc("/api/submit-questionnaire", handleSubmitQuestionnaire)

	port := "8080"
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}
