import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MessageCircle, Users, Zap, Shield, ArrowRight, User, LogOut, Menu, X } from 'lucide-react';

const Home = () => {
  const { isAuthenticated, user, logout } = useAuth();
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">ChatApp</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                // Authenticated user navigation
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.username || user?.email}
                  </span>
                  <Link
                    to="/dashboard"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                // Non-authenticated user navigation
                <>
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                {isAuthenticated ? (
                  // Authenticated mobile menu
                  <>
                    <div className="px-3 py-2 text-sm text-gray-700 border-b border-gray-100">
                      Welcome, {user?.username || user?.email}
                    </div>
                    <Link
                      to="/dashboard"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      <User className="h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        closeMobileMenu();
                      }}
                      className="flex items-center space-x-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </button>
                  </>
                ) : (
                  // Non-authenticated mobile menu
                  <>
                    <Link
                      to="/login"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      onClick={closeMobileMenu}
                      className="block px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Connect, Chat, and
            <span className="text-blue-600"> Collaborate</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Experience real-time messaging with our modern chat application. 
            Built with cutting-edge technology for seamless communication.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              // Authenticated user actions
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/profile"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  <User className="mr-2 h-5 w-5" />
                  My Profile
                </Link>
              </>
            ) : (
              // Non-authenticated user actions
              <>
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  Start Chatting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose Our Chat App?
            </h2>
            <p className="text-xl text-gray-600">
              Modern features for modern communication
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Real-time Messaging */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Messaging
              </h3>
              <p className="text-gray-600">
                Instant message delivery with WebSocket technology for seamless conversations.
              </p>
            </div>

            {/* User Presence */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Users className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                User Presence
              </h3>
              <p className="text-gray-600">
                See who's online and when they were last active with real-time presence indicators.
              </p>
            </div>

            {/* Message Reactions */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <MessageCircle className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Message Reactions
              </h3>
              <p className="text-gray-600">
                Express yourself with emoji reactions and engage more meaningfully.
              </p>
            </div>

            {/* Secure & Private */}
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Shield className="h-12 w-12 text-purple-500" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Secure & Private
              </h3>
              <p className="text-gray-600">
                Your conversations are protected with JWT authentication and secure protocols.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              Join thousands of users already chatting on our platform.
            </p>
            <Link
              to="/register"
              className="inline-flex items-center px-8 py-3 border border-transparent text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <MessageCircle className="h-6 w-6 text-blue-600" />
              <span className="text-lg font-semibold">ChatApp</span>
            </div>
            <p>&copy; 2025 ChatApp. Built with React and Go.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
