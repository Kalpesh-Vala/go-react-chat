# Use the official Go image as the base image
FROM golang:1.24.2-alpine AS builder

# Set the working directory inside the container
WORKDIR /app

# Install necessary packages
RUN apk add --no-cache git ca-certificates tzdata

# Copy go.mod and go.sum files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy the source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Use a minimal base image for the final stage
FROM alpine:latest

# Install ca-certificates for HTTPS requests and tzdata for timezone support
RUN apk --no-cache add ca-certificates tzdata

# Set the working directory
WORKDIR /root/

# Copy the binary from the builder stage
COPY --from=builder /app/main .

# Create a non-root user for security
RUN adduser -D -s /bin/sh appuser
USER appuser

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["./main"]
