import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Users, Settings, LogOut, User, Menu, X } from 'lucide-react';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">Chat App</h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.username || user?.email}
              </span>
              <Link
                to="/chat"
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>Chat</span>
              </Link>
              <Link
                to="/profile"
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <User className="h-4 w-4" />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="block h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                {/* User Info */}
                <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">
                  Welcome, {user?.username || user?.email}
                </div>
                
                {/* Mobile Navigation Links */}
                <Link
                  to="/chat"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>Chat</span>
                </Link>
                
                <Link
                  to="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <User className="h-4 w-4" />
                  <span>Profile</span>
                </Link>
                
                <button
                  onClick={() => {
                    handleLogout();
                    closeMobileMenu();
                  }}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors text-left"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-medium text-gray-900">Start Chatting</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Begin a new conversation or continue an existing one.
            </p>
            <Link
              to="/chat"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors block text-center"
            >
              Open Chat
            </Link>
          </div>

          {/* Online Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Users className="h-6 w-6 text-green-600" />
              <h2 className="text-lg font-medium text-gray-900">Online Users</h2>
            </div>
            <p className="text-gray-600 mb-4">
              See who's currently online and available to chat.
            </p>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-700">You</span>
              </div>
              <p className="text-sm text-gray-500">Loading other users...</p>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg shadow p-6 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-6 w-6 text-gray-600" />
              <h2 className="text-lg font-medium text-gray-900">Settings</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Customize your chat experience and preferences.
            </p>
            <Link
              to="/profile"
              className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors block text-center"
            >
              Open Settings
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-6">
              <p className="text-gray-500 text-center py-8">
                No recent activity. Start a conversation to see your chat history here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
