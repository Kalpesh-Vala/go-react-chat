package postgres

import (
	"database/sql"
	"errors"
	"fmt"
	"go-react-chat/kalpesh-vala/github.com/models"
	"time"
)

func CreateUser(db *sql.DB, username, email, hashedPassword string) error {
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()

	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM users WHERE username = $1 OR email = $2)`
	err = tx.QueryRow(checkQuery, username, email).Scan(&exists)
	if err != nil {
		return fmt.Errorf("failed to check if user exists: %w", err)
	}
	if exists {
		return errors.New("username or email already exists")
	}

	insertQuery := `INSERT INTO users (username, email, password, created_at) VALUES ($1, $2, $3, $4)`
	_, err = tx.Exec(insertQuery, username, email, hashedPassword, time.Now())
	if err != nil {
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func GetUserByEmail(db *sql.DB, email string) (*models.User, error) {
	query := `SELECT id, username, email, password, created_at FROM users WHERE email = $1`
	row := db.QueryRow(query, email)

	var user models.User
	err := row.Scan(&user.ID, &user.Username, &user.Email, &user.Password, &user.CreatedAt)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

func GetUserByUsername(db *sql.DB, username string) (*models.User, error) {
	query := `SELECT id, username, password, created_at FROM users WHERE username = $1`
	row := db.QueryRow(query, username)

	var user models.User
	err := row.Scan(&user.ID, &user.Username, &user.Password, &user.CreatedAt)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}
