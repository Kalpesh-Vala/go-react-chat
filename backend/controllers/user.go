package controllers

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// SearchUsers searches for users by username or email
func SearchUsers(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		query := c.Query("q")
		if query == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"success": false,
				"error":   "Search query is required",
			})
			return
		}

		// Get current user ID from JWT token to exclude them from results
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "User not authenticated",
			})
			return
		}

		// Search for users by username or email (case insensitive)
		searchPattern := "%" + strings.ToLower(query) + "%"
		sqlQuery := `
			SELECT id, username, email, created_at 
			FROM users 
			WHERE (LOWER(username) LIKE $1 OR LOWER(email) LIKE $1) 
			AND id != $2 
			ORDER BY username 
			LIMIT 20
		`

		rows, err := db.Query(sqlQuery, searchPattern, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Database error",
			})
			return
		}
		defer rows.Close()

		var users []gin.H
		for rows.Next() {
			var id int
			var username, email, createdAt string

			err := rows.Scan(&id, &username, &email, &createdAt)
			if err != nil {
				continue
			}

			users = append(users, gin.H{
				"id":       id,
				"username": username,
				"email":    email,
				"avatar":   "👤",   // Default avatar
				"isOnline": false, // We'll check this separately if needed
			})
		}

		if users == nil {
			users = []gin.H{} // Return empty array instead of null
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"users": users,
				"count": len(users),
			},
		})
	}
}

// GetAllUsers returns all users (for debugging/admin purposes)
func GetAllUsers(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get current user ID to exclude them
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"error":   "User not authenticated",
			})
			return
		}

		sqlQuery := `
			SELECT id, username, email, created_at 
			FROM users 
			WHERE id != $1 
			ORDER BY username 
			LIMIT 50
		`

		rows, err := db.Query(sqlQuery, userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false,
				"error":   "Database error",
			})
			return
		}
		defer rows.Close()

		var users []gin.H
		for rows.Next() {
			var id int
			var username, email, createdAt string

			err := rows.Scan(&id, &username, &email, &createdAt)
			if err != nil {
				continue
			}

			users = append(users, gin.H{
				"id":       id,
				"username": username,
				"email":    email,
				"avatar":   "👤",
				"isOnline": false,
			})
		}

		if users == nil {
			users = []gin.H{}
		}

		c.JSON(http.StatusOK, gin.H{
			"success": true,
			"data": gin.H{
				"users": users,
				"count": len(users),
			},
		})
	}
}
