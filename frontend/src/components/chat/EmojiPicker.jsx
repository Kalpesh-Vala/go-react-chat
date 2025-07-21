import React, { useRef, useEffect } from 'react';

const EmojiPicker = ({ onEmojiSelect, onClose }) => {
  const pickerRef = useRef(null);

  // Popular emojis organized by category
  const emojiCategories = {
    'Smileys': [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸'
    ],
    'Gestures': [
      '👍', '👎', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙',
      '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋',
      '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✊', '👊', '🤛', '🤜'
    ],
    'Hearts': [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'
    ],
    'Objects': [
      '🔥', '⭐', '🌟', '✨', '⚡', '💥', '💫', '💦', '💨', '💢',
      '💯', '💤', '💨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯'
    ]
  };

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleEmojiClick = (emoji) => {
    onEmojiSelect(emoji);
  };

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 w-80 max-h-64 overflow-y-auto"
    >
      <div className="space-y-3">
        {Object.entries(emojiCategories).map(([category, emojis]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-700 mb-2">{category}</h4>
            <div className="grid grid-cols-8 gap-1">
              {emojis.map((emoji, index) => (
                <button
                  key={`${category}-${index}`}
                  onClick={() => handleEmojiClick(emoji)}
                  className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors"
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick access popular emojis */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Frequently Used</h4>
        <div className="flex flex-wrap gap-1">
          {['👍', '❤️', '😂', '😮', '😢', '🔥', '🎉', '💯'].map((emoji, index) => (
            <button
              key={`popular-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center text-xl hover:bg-gray-100 rounded transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmojiPicker;
