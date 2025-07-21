import React from 'react';
import { X, Circle } from 'lucide-react';

const UserList = ({ users, isVisible, onClose }) => {
  if (!isVisible) return null;

  const getUserStatus = (user) => {
    // This would typically come from your backend presence system
    // For now, we'll show all users as online since they're in the online users list
    return 'online';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'away':
        return 'text-yellow-500';
      case 'busy':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'away':
        return 'Away';
      case 'busy':
        return 'Busy';
      default:
        return 'Offline';
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* User list sidebar */}
      <div className={`
        fixed lg:relative 
        top-0 right-0 
        h-full w-80 
        bg-white border-l border-gray-200 
        z-50 lg:z-auto
        transform transition-transform duration-300 ease-in-out
        ${isVisible ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        flex flex-col
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Online Users ({users.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors lg:hidden"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Users list */}
        <div className="flex-1 overflow-y-auto">
          {users.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Circle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No users online</p>
            </div>
          ) : (
            <div className="p-2">
              {users.map((user, index) => (
                <UserItem 
                  key={user.id || user.user_id || user.username || index}
                  user={user}
                  status={getUserStatus(user)}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            Users are updated in real-time
          </p>
        </div>
      </div>
    </>
  );
};

const UserItem = ({ user, status, getStatusColor, getStatusText }) => {
  // Handle different user object structures
  const userId = user.id || user.user_id;
  const username = user.username || user.name || user.email || `User ${userId}`;
  const avatar = user.avatar || user.profile_picture;

  return (
    <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={username}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-700">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        
        {/* Status indicator */}
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
          status === 'online' ? 'bg-green-500' : 
          status === 'away' ? 'bg-yellow-500' : 
          status === 'busy' ? 'bg-red-500' : 'bg-gray-400'
        }`} />
      </div>

      {/* User info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-gray-900 truncate">
            {username}
          </p>
          <span className={`text-xs ${getStatusColor(status)}`}>
            {getStatusText(status)}
          </span>
        </div>
        
        {/* Additional info */}
        {user.email && user.email !== username && (
          <p className="text-xs text-gray-500 truncate">
            {user.email}
          </p>
        )}
        
        {/* Last seen or activity */}
        {user.last_seen && (
          <p className="text-xs text-gray-400">
            Last seen: {new Date(user.last_seen).toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default UserList;
