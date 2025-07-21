import React from 'react';

const TypingIndicator = ({ users }) => {
  if (!users || users.length === 0) return null;

  const formatTypingText = () => {
    if (users.length === 1) {
      return `${users[0].username || users[0]} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].username || users[0]} and ${users[1].username || users[1]} are typing...`;
    } else {
      return `${users[0].username || users[0]} and ${users.length - 1} others are typing...`;
    }
  };

  return (
    <div className="flex items-center space-x-2 px-4 py-2 mb-2">
      <div className="flex items-center space-x-1">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
          <span className="text-xs font-medium text-gray-700">
            {users[0]?.username?.charAt(0).toUpperCase() || users[0]?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
      </div>
      
      <div className="bg-gray-200 rounded-2xl px-4 py-2 max-w-xs">
        <div className="flex items-center space-x-1">
          <span className="text-sm text-gray-600">
            {formatTypingText()}
          </span>
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
