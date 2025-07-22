import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = 'http://localhost:8080';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false, // Set to true if you need cookies
  timeout: 10000, // 10 second timeout
});

// Add request interceptor to include JWT token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - just clear the auth data
      Cookies.remove('token');
      Cookies.remove('user');
      // Don't automatically redirect - let the components handle it
    }
    return Promise.reject(error);
  }
);

export class ChatAPI {
  // Authentication endpoints
  static async register(userData) {
    try {
      console.log('Attempting registration with data:', { ...userData, password: '[HIDDEN]' });
      const response = await api.post('/register', userData);
      console.log('Registration response:', response.data);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Registration failed';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  static async login(credentials) {
    try {
      console.log('Attempting login with email:', credentials.email);
      const response = await api.post('/login', credentials);
      console.log('Login response received:', { success: !!response.data.token });
      
      if (response.data.token) {
        // Store token in cookie
        Cookies.set('token', response.data.token, { expires: 7 }); // 7 days
        return { success: true, data: response.data };
      }
      return { success: false, error: 'No token received' };
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          'Login failed';
      return { 
        success: false, 
        error: errorMessage
      };
    }
  }

  static logout() {
    Cookies.remove('token');
    Cookies.remove('user');
    window.location.href = '/login';
  }

  // Message endpoints
  static async sendMessage(messageData) {
    try {
      const response = await api.post('/message', messageData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to send message' 
      };
    }
  }

  static async getChatHistory(roomId) {
    try {
      // Special case for 'all' - get all conversations
      if (roomId === 'all') {
        const response = await api.get('/conversations');
        return { success: true, data: response.data };
      }
      
      // Regular case - get messages for a specific room
      const response = await api.get(`/messages?room_id=${roomId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to load chat history' 
      };
    }
  }

  // Reaction endpoints
  static async addReaction(reactionData) {
    try {
      const response = await api.post('/message/reaction/add', reactionData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to add reaction' 
      };
    }
  }

  static async removeReaction(reactionData) {
    try {
      const response = await api.post('/message/reaction/remove', reactionData);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to remove reaction' 
      };
    }
  }

  // Message management
  static async deleteMessage(messageId) {
    try {
      const response = await api.post('/message/delete', { message_id: messageId });
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to delete message' 
      };
    }
  }

  // User presence
  static async getOnlineUsers(roomId = null) {
    try {
      const params = roomId ? `?room=${roomId}` : '';
      const response = await api.get(`/online-users${params}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get online users' 
      };
    }
  }

  static async getOnlineUsersInRoom(roomId) {
    try {
      const response = await api.get(`/online-users?room=${roomId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get online users in room' 
      };
    }
  }

  static async getUserStatus() {
    try {
      const response = await api.get('/user-status');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get user status' 
      };
    }
  }

  // User search and management
  static async searchUsers(query) {
    try {
      // Real API call to backend
      const response = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error searching users:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to search users' 
      };
    }
  }

  // Get all users for discovery
  static async getAllUsers() {
    try {
      const response = await api.get('/users');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error getting users:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get users'
      };
    }
  }

  // Create room ID for private chat between two users
  static createPrivateRoomId(userId1, userId2) {
    // Validate user IDs
    if (!userId1 || !userId2) {
      console.error('Invalid user IDs provided to createPrivateRoomId:', { userId1, userId2 });
      return null;
    }
    
    // Create a consistent room ID by sorting user IDs
    const sortedIds = [userId1, userId2].sort((a, b) => a - b);
    return `private_${sortedIds[0]}_${sortedIds[1]}`;
  }

  // Create room ID for group chat
  static createGroupRoomId(groupName) {
    return `group_${groupName.toLowerCase().replace(/\s+/g, '_')}`;
  }

  static async getUserProfile(userId) {
    try {
      // TODO: Replace with actual API endpoint
      const response = await api.get(`/users/${userId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Failed to get user profile' 
      };
    }
  }

  // Health check
  static async ping() {
    try {
      const response = await api.get('/ping');
      return { success: true, data: response.data };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Server unreachable' 
      };
    }
  }
}

export default api;
