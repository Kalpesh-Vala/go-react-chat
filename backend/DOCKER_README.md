# Docker Deployment Guide

## Quick Start

### Option 1: Using the build script (Recommended)
```bash
cd backend
./build-and-run.sh
```

### Option 2: Manual Docker commands

#### Build the image:
```bash
cd backend
docker build -t go-react-chat-backend .
```

#### Run the container:
```bash
# Run with environment file
docker run --env-file .env -p 8080:8080 go-react-chat-backend

# Or run with individual environment variables
docker run -e PORT=8080 \
  -e POSTGRES_USER=your_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=your_db \
  -e POSTGRES_HOST=your_host \
  -e POSTGRES_PORT=5432 \
  -e MONGO_URI=your_mongo_uri \
  -e REDIS_ADDR=your_redis_addr \
  -e REDIS_PASSWORD=your_redis_password \
  -p 8080:8080 \
  go-react-chat-backend
```

### Option 3: Using Docker Compose (Recommended for development)
```bash
cd backend
docker-compose up
```

For background execution:
```bash
docker-compose up -d
```

## Environment Variables

Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:
- `PORT`: Application port (default: 8080)
- `POSTGRES_USER`: PostgreSQL username
- `POSTGRES_PASSWORD`: PostgreSQL password
- `POSTGRES_DB`: PostgreSQL database name
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `MONGO_URI`: MongoDB connection string
- `REDIS_ADDR`: Redis address
- `REDIS_PASSWORD`: Redis password

## Health Check

The application provides a health check endpoint:
```bash
curl http://localhost:8080/ping
```

Expected response:
```json
{"messege": "pong"}
```

## Container Management

### View logs:
```bash
docker-compose logs -f backend
```

### Stop the container:
```bash
docker-compose down
```

### Rebuild and restart:
```bash
docker-compose up --build
```

### Access container shell:
```bash
docker-compose exec backend sh
```

## Production Deployment

For production deployment:

1. Use a reverse proxy (nginx/traefik)
2. Set up proper SSL certificates
3. Configure proper firewall rules
4. Use Docker secrets for sensitive data
5. Implement proper monitoring and logging

## Troubleshooting

### Common Issues:

1. **Port already in use:**
   ```bash
   docker-compose down
   # Or change PORT in .env file
   ```

2. **Database connection issues:**
   - Verify database credentials in `.env`
   - Ensure database servers are accessible from Docker container
   - Check firewall settings

3. **Build failures:**
   ```bash
   docker system prune -a
   docker-compose build --no-cache
   ```

### Debug Commands:
```bash
# Check container status
docker-compose ps

# View container resource usage
docker stats

# Inspect the image
docker inspect go-react-chat-backend
```
