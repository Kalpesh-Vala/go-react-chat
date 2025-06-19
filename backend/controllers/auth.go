package controllers

import (
	"database/sql"
	"net/http"
	"time"

	"go-react-chat/kalpesh-vala/github.com/db/postgres"
	"go-react-chat/kalpesh-vala/github.com/models"

	"golang.org/x/crypto/bcrypt"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte("mysecretkey")

func Register(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input models.User
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
			return
		}
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)

		err := postgres.CreateUser(db, input.Username, input.Email, string(hashedPassword))
		if err != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Username or email already exists"})
			return
		}
		c.JSON(http.StatusCreated, gin.H{"message": "User registered"})
	}
}

func Login(db *sql.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		var input struct {
			Email    string `json:"email"`
			Password string `json:"password"`
		}
		if err := c.ShouldBindJSON(&input); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON"})
			return
		}

		user, err := postgres.GetUserByEmail(db, input.Email)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User does not exists"})
			return
		}

		err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
			return
		}

		// log.Printf("%T", user.ID)
		// log.Println(user.ID)

		token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
			"user_id":  user.ID,
			"username": user.Username,
			"exp":      time.Now().Add(24 * time.Hour).Unix(),
		})
		tokenString, _ := token.SignedString(jwtKey)

		c.JSON(http.StatusOK, gin.H{"token": tokenString})
	}
}
