import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Paperclip, X, ImageIcon, FileIcon, MicIcon } from 'lucide-react';
import EmojiPicker from './EmojiPicker';

const MessageInput = ({ onSendMessage, onTyping, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const attachmentMenuRef = useRef(null);

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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  // Close attachment menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachmentMenuRef.current && !attachmentMenuRef.current.contains(event.target)) {
        setShowAttachmentMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    
    setShowAttachmentMenu(false);
  };

  return (
    <div className="relative bg-white border-t border-gray-200">
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 left-4 z-50">
          <EmojiPicker
            onEmojiSelect={handleEmojiSelect}
            onClose={() => setShowEmojiPicker(false)}
          />
        </div>
      )}

      {/* Attachment Menu */}
      {showAttachmentMenu && (
        <div 
          ref={attachmentMenuRef}
          className="absolute bottom-full mb-2 left-4 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]"
        >
          <button
            onClick={() => showComingSoonToast('Photo & Video')}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Photo & Video</div>
              <div className="text-sm text-gray-500">Share images and videos</div>
            </div>
          </button>
          
          <button
            onClick={() => showComingSoonToast('Document')}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FileIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Document</div>
              <div className="text-sm text-gray-500">Share files and documents</div>
            </div>
          </button>
          
          <button
            onClick={() => showComingSoonToast('Voice Recording')}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <MicIcon className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">Voice Recording</div>
              <div className="text-sm text-gray-500">Record and send audio</div>
            </div>
          </button>
        </div>
      )}

      {/* Message Input Form */}
      <form onSubmit={handleSubmit} className="px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-end space-x-2 sm:space-x-3">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
            disabled={disabled}
            className={`p-2 sm:p-2.5 rounded-full transition-all duration-200 flex-shrink-0 ${
              disabled 
                ? 'text-gray-400 cursor-not-allowed' 
                : showAttachmentMenu
                ? 'bg-blue-100 text-blue-600'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Message input container */}
          <div className="flex-1 relative">
            <div className="relative bg-gray-50 rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:bg-white transition-all duration-200">
              <textarea
                ref={textareaRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={disabled ? 'Connecting...' : 'Type a message...'}
                disabled={disabled}
                className={`w-full resize-none bg-transparent px-4 py-3 pr-12 min-h-[44px] max-h-[120px] focus:outline-none placeholder-gray-500 text-gray-900 ${
                  disabled ? 'cursor-not-allowed opacity-50' : ''
                }`}
                rows={1}
              />

              {/* Emoji button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1.5 rounded-full transition-all duration-200 ${
                  disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : showEmojiPicker
                    ? 'bg-blue-100 text-blue-600'
                    : 'text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }`}
              >
                <Smile className="w-5 h-5" />
              </button>
            </div>

            {/* Character count */}
            {message.length > 200 && (
              <div className="absolute -bottom-6 right-0">
                <span className={`text-xs font-medium ${
                  message.length > 1000 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {message.length}/1000
                </span>
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!message.trim() || disabled}
            className={`p-2.5 sm:p-3 rounded-full transition-all duration-200 flex-shrink-0 transform ${
              message.trim() && !disabled
                ? 'bg-blue-600 text-white hover:bg-blue-700 scale-100 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed scale-95'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageInput;
