// Environment configuration utility
const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  WS_BASE_URL: import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8080',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,

  // Environment
  APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
  IS_DEVELOPMENT: import.meta.env.VITE_APP_ENV === 'development',
  IS_PRODUCTION: import.meta.env.VITE_APP_ENV === 'production',

  // WebSocket Configuration
  WS_RECONNECT_INTERVAL: parseInt(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 3000,
  WS_MAX_RECONNECT_ATTEMPTS: parseInt(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,

  // Chat Configuration
  MAX_MESSAGE_LENGTH: parseInt(import.meta.env.VITE_MAX_MESSAGE_LENGTH) || 1000,
  TYPING_TIMEOUT: parseInt(import.meta.env.VITE_TYPING_TIMEOUT) || 3000,

  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: (import.meta.env.VITE_ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/gif,application/pdf').split(','),

  // Debug Mode
  DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true',
};

// Helper function to log configuration in development
if (config.DEBUG_MODE && config.IS_DEVELOPMENT) {
  console.log('🔧 App Configuration:', config);
}

export default config;
