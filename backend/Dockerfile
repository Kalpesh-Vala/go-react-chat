# Stage 1: Build Go app
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o main .

# Add start.sh to builder stage
COPY start.sh .

# Stage 2: Final image
FROM alpine:latest

# Install Redis, certs, and timezone support
RUN apk --no-cache add ca-certificates tzdata redis bash

# Create non-root user
RUN adduser -D -s /bin/sh appuser

# Set workdir and copy files
WORKDIR /home/appuser/
COPY --from=builder /app/main .
COPY --from=builder /app/start.sh ./start.sh

# Fix permissions BEFORE switching user
RUN chmod +x ./start.sh

# Switch to non-root user
USER appuser

EXPOSE 8080 6379

CMD ["./start.sh"]
