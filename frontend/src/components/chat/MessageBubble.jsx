import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Reply, Copy, Trash2 } from 'lucide-react';

const MessageBubble = ({ message, currentUserId, onReaction }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  const isOwn = message.sender_id === currentUserId;
  const timestamp = message.timestamp ? new Date(message.timestamp * 1000) : new Date();
  
  // Common reaction emojis
  const quickReactions = ['👍', '❤️', '😂', '😮', '😢', '🔥'];
  
  const handleReactionClick = (emoji) => {
    const reactions = message.reactions || {};
    const userReacted = reactions[emoji]?.includes(currentUserId?.toString());
    
    if (userReacted) {
      onReaction(message.id || message.message_id, emoji, 'remove');
    } else {
      onReaction(message.id || message.message_id, emoji, 'add');
    }
    setShowReactions(false);
  };

  const copyMessage = () => {
    navigator.clipboard.writeText(message.content || message.message);
    setShowMenu(false);
  };

  const replyToMessage = () => {
    // TODO: Implement reply functionality
    console.log('Reply to message:', message.id || message.message_id);
    setShowMenu(false);
  };

  const deleteMessage = () => {
    // TODO: Implement delete functionality
    console.log('Delete message:', message.id || message.message_id);
    setShowMenu(false);
  };

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-xs lg:max-w-md xl:max-w-lg ${isOwn ? 'order-2' : 'order-1'}`}>
        {/* Avatar for others' messages */}
        {!isOwn && (
          <div className="flex items-end space-x-2">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-medium text-gray-700">
                {message.sender_id?.toString().slice(-1) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <MessageContent 
                message={message}
                isOwn={isOwn}
                timestamp={timestamp}
                showReactions={showReactions}
                setShowReactions={setShowReactions}
                showMenu={showMenu}
                setShowMenu={setShowMenu}
                quickReactions={quickReactions}
                handleReactionClick={handleReactionClick}
                copyMessage={copyMessage}
                replyToMessage={replyToMessage}
                deleteMessage={deleteMessage}
                currentUserId={currentUserId}
              />
            </div>
          </div>
        )}

        {/* Own messages */}
        {isOwn && (
          <MessageContent 
            message={message}
            isOwn={isOwn}
            timestamp={timestamp}
            showReactions={showReactions}
            setShowReactions={setShowReactions}
            showMenu={showMenu}
            setShowMenu={setShowMenu}
            quickReactions={quickReactions}
            handleReactionClick={handleReactionClick}
            copyMessage={copyMessage}
            replyToMessage={replyToMessage}
            deleteMessage={deleteMessage}
            currentUserId={currentUserId}
          />
        )}
      </div>
    </div>
  );
};

const MessageContent = ({
  message,
  isOwn,
  timestamp,
  showReactions,
  setShowReactions,
  showMenu,
  setShowMenu,
  quickReactions,
  handleReactionClick,
  copyMessage,
  replyToMessage,
  deleteMessage,
  currentUserId
}) => {
  return (
    <div className="relative group">
      {/* Message bubble */}
      <div
        className={`relative px-4 py-2 rounded-2xl shadow-sm ${
          isOwn
            ? 'bg-blue-500 text-white'
            : 'bg-white text-gray-900 border border-gray-200'
        }`}
      >
        {/* Message content */}
        <div className="break-words">
          {message.content || message.message}
        </div>

        {/* Attachment */}
        {message.attachment_url && (
          <div className="mt-2">
            {message.attachment_type?.startsWith('image') ? (
              <img
                src={message.attachment_url}
                alt="Attachment"
                className="max-w-full h-auto rounded-lg"
              />
            ) : (
              <a
                href={message.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-sm underline ${
                  isOwn ? 'text-blue-100' : 'text-blue-600'
                }`}
              >
                View Attachment
              </a>
            )}
          </div>
        )}

        {/* Reactions display */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {Object.entries(message.reactions).map(([emoji, users]) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs transition-colors ${
                  users.includes(currentUserId?.toString())
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : isOwn
                    ? 'bg-blue-400 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{emoji}</span>
                <span>{users.length}</span>
              </button>
            ))}
          </div>
        )}

        {/* Message actions */}
        <div className="absolute top-0 -right-8 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center space-x-1">
            {/* Quick reactions */}
            <button
              onClick={() => setShowReactions(!showReactions)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Add reaction"
            >
              <span className="text-lg">😊</span>
            </button>
            
            {/* Menu */}
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreHorizontal className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Quick reactions panel */}
          {showReactions && (
            <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
              <div className="flex space-x-1">
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReactionClick(emoji)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title={`React with ${emoji}`}
                  >
                    <span className="text-lg">{emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action menu */}
          {showMenu && (
            <div className="absolute top-8 right-0 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
              <button
                onClick={replyToMessage}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Reply className="h-4 w-4" />
                <span>Reply</span>
              </button>
              <button
                onClick={copyMessage}
                className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
              {isOwn && (
                <button
                  onClick={deleteMessage}
                  className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
        {formatDistanceToNow(timestamp, { addSuffix: true })}
        {message.status && isOwn && (
          <span className="ml-2">
            {message.status === 'sent' && '✓'}
            {message.status === 'delivered' && '✓✓'}
            {message.status === 'read' && '✓✓'}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
