#!/bin/bash

# Script to build and run the Go React Chat backend

echo "🚀 Building Docker image for Go React Chat Backend..."

# Build the Docker image
docker build -t go-react-chat-backend .

if [ $? -eq 0 ]; then
    echo "✅ Docker image built successfully!"
    echo ""
    echo "📋 Available commands:"
    echo "1. Run with docker run:"
    echo "   docker run --env-file .env -p 8080:8080 go-react-chat-backend"
    echo ""
    echo "2. Run with docker-compose:"
    echo "   docker-compose up"
    echo ""
    echo "3. Run in detached mode:"
    echo "   docker-compose up -d"
    echo ""
    echo "🔧 To stop the container:"
    echo "   docker-compose down"
    echo ""
    echo "📊 To view logs:"
    echo "   docker-compose logs -f backend"
else
    echo "❌ Docker build failed!"
    exit 1
fi
