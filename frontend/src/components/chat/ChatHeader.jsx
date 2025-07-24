import React from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Video, 
  MoreVertical,
  Wifi,
  WifiOff
} from 'lucide-react';

const ChatHeader = ({ chatPartner, isConnected, onBack }) => {
  const showComingSoonToast = (feature) => {
    // Create a simple toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed top-4 right-4 bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300';
    toast.innerHTML = `
      <div class="flex items-center space-x-2">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="font-medium">${feature} feature coming soon!</span>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  };

  if (!chatPartner) return null;

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white shadow-sm">
      {/* Left section */}
      <div className="flex items-center space-x-3">
        {/* Back button - visible on mobile */}
        <button
          onClick={onBack}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>

        {/* Avatar */}
        <div className="relative">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
            {chatPartner.avatar || chatPartner.username?.charAt(0).toUpperCase()}
          </div>
          {/* Online status indicator */}
          {chatPartner.isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
        </div>

        {/* User info */}
        <div className="flex flex-col">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {chatPartner.username}
          </h3>
          <div className="flex items-center space-x-2">
            {/* Connection status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="w-3 h-3 text-green-500" />
              ) : (
                <WifiOff className="w-3 h-3 text-red-500" />
              )}
              <span className="text-xs text-gray-500">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
            
            {/* Online status */}
            {chatPartner.isOnline && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-xs text-green-600">Online</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right section - Action buttons */}
      <div className="flex items-center space-x-2">
        {/* Voice call button */}
        <button 
          onClick={() => showComingSoonToast('Voice Call')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
          title="Voice Call"
        >
          <Phone className="w-5 h-5 text-gray-600" />
          
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Voice Call
          </div>
        </button>

        {/* Video call button */}
        <button 
          onClick={() => showComingSoonToast('Video Call')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
          title="Video Call"
        >
          <Video className="w-5 h-5 text-gray-600" />
          
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            Video Call
          </div>
        </button>

        {/* More options */}
        <button 
          onClick={() => showComingSoonToast('More Options')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors relative group"
          title="More Options"
        >
          <MoreVertical className="w-5 h-5 text-gray-600" />
          
          {/* Tooltip */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            More Options
          </div>
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
