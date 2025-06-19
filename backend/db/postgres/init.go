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
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
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
}
