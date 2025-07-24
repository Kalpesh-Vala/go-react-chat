package main

import (
	"go-react-chat/kalpesh-vala/github.com/config"
	"go-react-chat/kalpesh-vala/github.com/db/mongodb"
	"go-react-chat/kalpesh-vala/github.com/db/postgres"
	"go-react-chat/kalpesh-vala/github.com/db/redis"
	"go-react-chat/kalpesh-vala/github.com/routes"
	"log"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	config.LoadEnv()

	postgres.Init()
	mongodb.Init()
	redis.Init()

	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://10.21.22.226:5173", "http://172.17.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: false,
		MaxAge:           12 * time.Hour,
	}))

	routes.SetUpRoutes(r, postgres.DB)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
