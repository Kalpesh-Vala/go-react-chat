package mongodb

import (
	"context"
	"log"
	"os"
	"strings"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var Client *mongo.Client
var ChatDB *mongo.Database

func Init() {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	mongoURI := os.Getenv("MONGO_URI")
	if mongoURI == "" {
		log.Fatal("MONGO_URI environment variable is not set")
	}

	clientOptions := options.Client().ApplyURI(mongoURI)

	var err error
	Client, err = mongo.Connect(ctx, clientOptions)
	if err != nil {
		log.Fatal("MongoDB connection error:", err)
	}

	err = Client.Ping(ctx, nil)
	if err != nil {
		log.Fatal("MongoDB ping error:", err)
	}

	// Get database name from environment variable or extract from URI
	dbName := os.Getenv("MONGO_DB")
	if dbName == "" {
		// Extract database name from URI if not set in environment
		// Example: mongodb+srv://user:pass@cluster.mongodb.net/dbname?options
		if len(mongoURI) > 0 {
			// Simple extraction - you might want to use a proper URI parser
			parts := strings.Split(mongoURI, "/")
			if len(parts) > 3 {
				dbPart := parts[3]
				if questionMarkIndex := strings.Index(dbPart, "?"); questionMarkIndex != -1 {
					dbName = dbPart[:questionMarkIndex]
				} else {
					dbName = dbPart
				}
			}
		}
		if dbName == "" {
			dbName = "chatdb" // fallback default
		}
		log.Printf("Using database name from URI or default: %s", dbName)
	}

	ChatDB = Client.Database(dbName)
	log.Printf("Connected to MongoDB successfully. Using database: %s", dbName)
}
