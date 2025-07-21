import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Calendar, Settings, ArrowLeft, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const UserProfile = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    status: user?.status || 'online'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    // Here you would typically make an API call to update user profile
    updateUser(formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      status: user?.status || 'online'
    });
    setIsEditing(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Desktop Navigation */}
            <div className="hidden sm:flex items-center">
              <Link
                to="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mr-4"
              >
                <ArrowLeft className="h-5 w-5" />
                <span>Back to Dashboard</span>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">User Profile</h1>
            </div>

            {/* Mobile Navigation */}
            <div className="sm:hidden flex items-center justify-between w-full">
              <h1 className="text-lg font-semibold text-gray-900">Profile</h1>
              <button
                onClick={toggleMobileMenu}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>

            {/* Desktop Edit Button */}
            <div className="hidden sm:block">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
                <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="sm:hidden border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1 bg-white">
                <Link
                  to="/dashboard"
                  className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Dashboard</span>
                </Link>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center space-x-2 w-full text-left px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
                >
                  <Settings className="h-4 w-4" />
                  <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          {/* Profile Header */}
          <div className="px-6 py-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-6 space-y-4 sm:space-y-0">
                {/* Avatar */}
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto sm:mx-0">
                  <User className="h-10 w-10 text-blue-600" />
                </div>
                
                {/* User Info */}
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user?.username || 'User'}
                  </h2>
                  <p className="text-gray-600">{user?.email}</p>
                  <div className="flex items-center justify-center sm:justify-start space-x-2 mt-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-500">Online</span>
                  </div>
                </div>
              </div>
              
              {/* Edit Button - Mobile */}
              <div className="sm:hidden">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <p className="text-gray-900">{user?.username || 'Not set'}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                ) : (
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{user?.email}</p>
                  </div>
                )}
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                {isEditing ? (
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="online">Online</option>
                    <option value="away">Away</option>
                    <option value="busy">Busy</option>
                    <option value="offline">Offline</option>
                  </select>
                ) : (
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      user?.status === 'online' ? 'bg-green-500' :
                      user?.status === 'away' ? 'bg-yellow-500' :
                      user?.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                    }`}></div>
                    <p className="text-gray-900 capitalize">{user?.status || 'online'}</p>
                  </div>
                )}
              </div>

              {/* Join Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Member Since
                </label>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">January 2025</p>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bio
              </label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900">
                  {user?.bio || 'No bio available. Edit your profile to add one.'}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Account Settings */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Account Settings</h3>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Privacy Settings</h4>
                  <p className="text-sm text-gray-500">Control who can see your information</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Manage
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Notification Preferences</h4>
                  <p className="text-sm text-gray-500">Choose what notifications you receive</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Configure
                </button>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Change Password</h4>
                  <p className="text-sm text-gray-500">Update your account password</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;
