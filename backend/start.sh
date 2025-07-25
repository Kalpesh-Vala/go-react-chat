#!/bin/bash

echo "Starting Redis server..."
redis-server &

echo "Starting Go application..."
./main
