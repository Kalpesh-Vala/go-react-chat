import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle typing indicator
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      onTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        onTyping(false);
      }
    }, 1000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping, onTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    onSendMessage(message.trim());
    setMessage('');
    setIsTyping(false);
    onTyping(false);
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle file upload logic here
      console.log('File selected:', file);
      // For now, just log the file - implement actual upload logic later
    }
  };

  return (
    <div className="relative">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-4 z-50">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="p-4 bg-white border-t">
        <div className="flex items-end space-x-3">
          {/* Attachment button */}
          <div className="relative">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            />
            <label
              htmlFor="file-upload"
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </label>
          </div>

          {/* Message input area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={disabled ? 'Connecting...' : 'Type a message...'}
              disabled={disabled}
              className={`w-full resize-none rounded-lg border px-4 py-2 pr-10 min-h-[40px] max-h-32 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                disabled 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-900'
              }`}
              rows={1}
            />

            {/* Emoji button */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={disabled}
              className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full transition-colors ${
                disabled 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`p-2 rounded-full transition-all duration-200 ${
              message.trim() && !disabled
                ? 'bg-blue-600 text-white hover:bg-blue-700 scale-100'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed scale-95'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

        {/* Character count (optional) */}
        {message.length > 200 && (
          <div className="mt-1 text-right">
            <span className={`text-xs ${
              message.length > 1000 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {message.length}/1000
            </span>
          </div>
        )}
      </form>
    </div>
  );
};

export default MessageInput;
