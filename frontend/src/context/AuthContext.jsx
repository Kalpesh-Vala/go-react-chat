import React, { createContext, useContext, useState, useEffect } from 'react';
import { authUtils } from '../utils/auth';
import { ChatAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from stored data
  useEffect(() => {
    const initializeAuth = () => {
      const token = authUtils.getToken();
      const userData = authUtils.getUser();
      
      if (token && userData && !authUtils.isTokenExpired(token)) {
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        // Clean up invalid/expired data
        authUtils.logout();
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setIsLoading(true);
      const result = await ChatAPI.login(credentials);
      
      if (result.success) {
        const { token } = result.data;
        
        // Parse user data from token (you might want to fetch user profile instead)
        const tokenData = authUtils.parseToken(token);
        const userData = {
          id: tokenData.user_id || tokenData.sub,
          email: credentials.email,
          // Add other user fields as needed
        };
        
        authUtils.setToken(token);
        authUtils.setUser(userData);
        setUser(userData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const result = await ChatAPI.register(userData);
      
      if (result.success) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authUtils.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    authUtils.setUser(updatedUser);
    setUser(updatedUser);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
