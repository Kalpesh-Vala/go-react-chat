package postgres

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Init() {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=require",
		os.Getenv("POSTGRES_HOST"),
		os.Getenv("POSTGRES_PORT"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"))

	var err error
	DB, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal("Postgres connection error: ", err)
	}

	err = DB.Ping()
	if err != nil {
		log.Fatal("Postgres ping error: ", err)
	}

	log.Println("Connected to PostgreSQL successfully")

	// Create tables if they don't exist
	createTables()
}

func createTables() {
	createUsersTable := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		username VARCHAR(50) UNIQUE NOT NULL,
		email VARCHAR(100) UNIQUE NOT NULL,
		password VARCHAR(255) NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`

	_, err := DB.Exec(createUsersTable)
	if err != nil {
		log.Printf("Error creating users table: %v", err)
	} else {
		log.Println("Users table ensured to exist")
	}
}
