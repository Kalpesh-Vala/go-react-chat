import Cookies from 'js-cookie';

export const AUTH_TOKEN_KEY = 'token';
export const USER_DATA_KEY = 'user';

export const authUtils = {
  // Token management
  getToken: () => {
    return Cookies.get(AUTH_TOKEN_KEY);
  },

  setToken: (token) => {
    Cookies.set(AUTH_TOKEN_KEY, token, { expires: 7 }); // 7 days
  },

  removeToken: () => {
    Cookies.remove(AUTH_TOKEN_KEY);
  },

  // User data management
  getUser: () => {
    const userData = Cookies.get(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  },

  setUser: (user) => {
    Cookies.set(USER_DATA_KEY, JSON.stringify(user), { expires: 7 });
  },

  removeUser: () => {
    Cookies.remove(USER_DATA_KEY);
  },

  // Authentication status
  isAuthenticated: () => {
    const token = Cookies.get(AUTH_TOKEN_KEY);
    return !!token;
  },

  // Logout utility (with redirect)
  logout: () => {
    Cookies.remove(AUTH_TOKEN_KEY);
    Cookies.remove(USER_DATA_KEY);
    window.location.href = '/login';
  },

  // Clear auth data without redirect
  clearAuth: () => {
    Cookies.remove(AUTH_TOKEN_KEY);
    Cookies.remove(USER_DATA_KEY);
  },

  // Parse JWT token (basic)
  parseToken: (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error parsing token:', error);
      return null;
    }
  },

  // Check if token is expired
  isTokenExpired: (token) => {
    const parsed = authUtils.parseToken(token);
    if (!parsed) return true;
    
    const currentTime = Date.now() / 1000;
    return parsed.exp < currentTime;
  }
};

export default authUtils;
