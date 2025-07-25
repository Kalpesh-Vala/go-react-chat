# Environment Configuration

This project uses environment variables to configure different aspects of the application. All environment variables for the frontend must be prefixed with `VITE_` to be accessible in the browser.

## Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Update the values in `.env` according to your setup.

## Available Environment Variables

### API Configuration
- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:8080)
- `VITE_WS_BASE_URL`: WebSocket base URL (default: ws://localhost:8080)
- `VITE_API_TIMEOUT`: API request timeout in milliseconds (default: 10000)

### Environment
- `VITE_APP_ENV`: Application environment (development/production)

### WebSocket Configuration
- `VITE_WS_RECONNECT_INTERVAL`: Time between reconnection attempts in ms (default: 3000)
- `VITE_WS_MAX_RECONNECT_ATTEMPTS`: Maximum reconnection attempts (default: 5)

### Chat Configuration
- `VITE_MAX_MESSAGE_LENGTH`: Maximum message length (default: 1000)
- `VITE_TYPING_TIMEOUT`: Typing indicator timeout in ms (default: 3000)

### File Upload Configuration
- `VITE_MAX_FILE_SIZE`: Maximum file size in bytes (default: 10485760 = 10MB)
- `VITE_ALLOWED_FILE_TYPES`: Comma-separated list of allowed MIME types

### Debug Configuration
- `VITE_DEBUG_MODE`: Enable debug logging (true/false)

## Environment Files

- `.env` - Default environment variables (not committed to git)
- `.env.example` - Template for environment variables (committed to git)
- `.env.production.example` - Template for production environment

## Production Deployment

For production:

1. Copy `.env.production.example` to `.env.production`
2. Update the URLs to point to your production backend
3. Set `VITE_APP_ENV=production` and `VITE_DEBUG_MODE=false`
4. Build the application: `npm run build`

## Security Notes

- Never commit actual `.env` files to version control
- Environment variables prefixed with `VITE_` are exposed to the browser
- Don't put sensitive information in `VITE_` prefixed variables
