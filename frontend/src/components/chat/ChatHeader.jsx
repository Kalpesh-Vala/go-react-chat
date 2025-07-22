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
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Phone className="w-5 h-5 text-gray-600" />
        </button>

        {/* Video call button */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <Video className="w-5 h-5 text-gray-600" />
        </button>

        {/* More options */}
        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <MoreVertical className="w-5 h-5 text-gray-600" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
