import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Reply, Copy, Trash2 } from 'lucide-react';

// CSS animations for smooth transitions
const reactionAnimationStyles = `
  @keyframes reactionPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
  }
  
  @keyframes reactionFadeIn {
    0% { opacity: 0; transform: scale(0.8); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes reactionFadeOut {
    0% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.8); }
  }
  
  .reaction-pulse {
    animation: reactionPulse 0.3s ease-in-out;
  }
  
  .reaction-fade-in {
    animation: reactionFadeIn 0.2s ease-out;
  }
  
  .reaction-fade-out {
    animation: reactionFadeOut 0.2s ease-in;
  }
`;

// Inject styles if not already present
if (typeof document !== 'undefined' && !document.querySelector('#reaction-animations')) {
  const style = document.createElement('style');
  style.id = 'reaction-animations';
  style.textContent = reactionAnimationStyles;
  document.head.appendChild(style);
}

const MessageBubble = ({ message, isOwn, onReaction, onReply, onDelete, currentUserId }) => {
  const [showOptions, setShowOptions] = useState(false);
  const optionsRef = useRef(null);

  // Close options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleReaction = (emoji, action = 'add') => {
    // For single reaction per user, we always "add" the new reaction
    // The backend will handle removing the previous one
    onReaction?.(message.id, emoji, 'add');
  };

  // Find which emoji the current user has reacted with (if any)
  const getCurrentUserReaction = () => {
    if (!message.reactions || !currentUserId) return null;
    
    for (const [emoji, users] of Object.entries(message.reactions)) {
      if (users.includes(currentUserId.toString())) {
        return emoji;
      }
    }
    return null;
  };

  const currentUserReaction = getCurrentUserReaction();

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content || message.message);
    setShowOptions(false);
  };

  const reactionEmojis = ['👍', '❤️', '😂', '😮', '😢', '😡'];

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group relative`}>
      <div className={`relative max-w-xs sm:max-w-sm lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Message bubble */}
        <div
          className={`px-3 py-2 rounded-2xl relative ${
            isOwn
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
          } shadow-sm`}
        >
          {/* Message content */}
          {message.deleted || message.isDeleted ? (
            <div className={`flex items-center space-x-2 text-sm italic ${
              isOwn ? 'text-blue-300' : 'text-gray-500'
            }`}>
              <Trash2 className="w-4 h-4 flex-shrink-0" />
              <p>
                {isOwn ? "You deleted this message" : "This message was deleted"}
              </p>
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">
              {message.content || message.message}
            </p>
          )}

          {/* Attachment */}
          {!(message.deleted || message.isDeleted) && message.attachment_url && (
            <div className="mt-2">
              {message.attachment_type?.startsWith('image') ? (
                <img 
                  src={message.attachment_url} 
                  alt="Attachment" 
                  className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                  onClick={() => {
                    // Open image in full screen - implement modal later
                    window.open(message.attachment_url, '_blank');
                  }}
                />
              ) : (
                <a 
                  href={message.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={`inline-flex items-center space-x-1 underline hover:no-underline transition-colors ${
                    isOwn ? 'text-blue-100 hover:text-blue-200' : 'text-blue-600 hover:text-blue-800'
                  }`}
                >
                  <span>📎</span>
                  <span>{message.attachment_type || 'Attachment'}</span>
                </a>
              )}
            </div>
          )}

          {/* Timestamp and status */}
          <div className={`text-xs mt-1 flex items-center space-x-1 ${
            isOwn ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{formatTime(message.timestamp)}</span>
            {isOwn && message.status && (
              <>
                <span>•</span>
                <span className="capitalize">{message.status}</span>
              </>
            )}
          </div>
        </div>

        {/* Reactions */}
        {!(message.deleted || message.isDeleted) && message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {Object.entries(message.reactions)
              .filter(([emoji, users]) => users && users.length > 0) // Only show reactions with count > 0
              .map(([emoji, users]) => {
                const isCurrentUserReaction = currentUserReaction === emoji;
                const count = users.length;
                
                return (
                  <button
                    key={emoji}
                    onClick={() => {
                      if (isCurrentUserReaction) {
                        // Remove current user's reaction
                        handleReaction(emoji, 'remove');
                      } else {
                        // Add new reaction (backend will remove previous one)
                        handleReaction(emoji, 'add');
                      }
                    }}
                    className={`
                      rounded-full px-2 py-1 text-xs flex items-center space-x-1 
                      transition-all duration-300 ease-in-out transform hover:scale-105
                      border reaction-fade-in ${
                        isCurrentUserReaction
                          ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-sm reaction-pulse'
                          : 'bg-gray-100 hover:bg-gray-200 border-gray-200 text-gray-600'
                      }
                    `}
                  >
                    <span className="transition-transform duration-200 ease-in-out">{emoji}</span>
                    <span className={`font-medium transition-all duration-200 ${
                      isCurrentUserReaction ? 'text-blue-700' : 'text-gray-600'
                    }`}>
                      {count}
                    </span>
                  </button>
              );
            })}
          </div>
        )}

        {/* Quick reaction bar (appears on hover) - only shown for non-deleted messages */}
        {!(message.deleted || message.isDeleted) && (
          <div className={`absolute ${isOwn ? 'left-0 -ml-24' : 'right-0 -mr-24'} top-0 bg-white border border-gray-200 rounded-full shadow-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-1 z-10`}>
          {reactionEmojis.slice(0, 4).map((emoji) => {
            const isSelected = currentUserReaction === emoji;
            return (
              <button
                key={emoji}
                onClick={() => {
                  if (isSelected) {
                    // Remove current reaction
                    handleReaction(emoji, 'remove');
                  } else {
                    // Add new reaction (backend will remove previous one)
                    handleReaction(emoji, 'add');
                  }
                }}
                className={`
                  w-6 h-6 flex items-center justify-center rounded-full 
                  transition-all duration-150 text-sm transform hover:scale-110
                  ${isSelected 
                    ? 'bg-blue-100 text-blue-600 shadow-inner' 
                    : 'hover:bg-gray-100'
                  }
                `}
                title={isSelected ? `Remove ${emoji} reaction` : `React with ${emoji}`}
              >
                {emoji}
              </button>
            );
          })}
          
          {/* More options button */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <MoreVertical className="w-3 h-3 text-gray-500" />
          </button>
        </div>
        )}

        {/* Options dropdown */}
        {showOptions && !(message.deleted || message.isDeleted) && (
          <div 
            ref={optionsRef}
            className={`absolute top-8 ${isOwn ? 'left-0' : 'right-0'} bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20 min-w-[140px]`}
          >
            {/* All reaction emojis */}
            <div className="px-3 py-2 border-b border-gray-100">
              <div className="flex flex-wrap gap-1">
                {reactionEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={() => onReply?.(message)}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <Reply className="w-4 h-4" />
              <span>Reply</span>
            </button>
            <button
              onClick={copyMessage}
              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy text</span>
            </button>
            {isOwn && (
              <button
                onClick={() => {
                  onDelete?.(message.id);
                  setShowOptions(false);
                }}
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-red-600 flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
