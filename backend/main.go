package main

import (
	"go-react-chat/kalpesh-vala/github.com/config"
	"go-react-chat/kalpesh-vala/github.com/db/mongodb"
	"go-react-chat/kalpesh-vala/github.com/db/postgres"
	"go-react-chat/kalpesh-vala/github.com/db/redis"
	"go-react-chat/kalpesh-vala/github.com/routes"
	"log"
	"os"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

func main() {
	config.LoadEnv()

	postgres.Init()
	mongodb.Init()
	redis.Init()

	r := gin.Default()

	routes.SetUpRoutes(r, postgres.DB)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	if err := r.Run(":" + port); err != nil {
		log.Fatal("Server failed to start:", err)
	}
}
