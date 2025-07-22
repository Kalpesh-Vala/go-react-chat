// Chat history management utilities
export class ChatHistoryManager {
  static STORAGE_KEY = 'chat_history';
  static CHAT_LIST_KEY = 'chat_list';
  static MAX_CACHE_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

  // Save chat list to localStorage
  static saveChatList(chatList, userId) {
    if (!userId) {
      console.error('Cannot save chat list: No user ID provided');
      return;
    }
    
    try {
      const key = `${this.CHAT_LIST_KEY}_${userId}`;
      const data = {
        chatList,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat list:', error);
    }
  }

  // Load chat list from localStorage
  static loadChatList(userId) {
    if (!userId) {
      console.error('Cannot load chat list: No user ID provided');
      return [];
    }
    
    try {
      const key = `${this.CHAT_LIST_KEY}_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Check if data is in new format
        if (data.chatList && data.timestamp) {
          // Check if data is too old
          if (Date.now() - data.timestamp > this.MAX_CACHE_AGE_MS) {
            console.log('Chat list cache expired. Returning empty list.');
            return [];
          }
          return data.chatList;
        } else {
          // Legacy format - just array
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading chat list:', error);
    }
    return [];
  }

  // Save individual chat messages to localStorage
  static saveChatMessages(roomId, messages, userId) {
    if (!userId || !roomId) {
      console.error('Cannot save chat messages: Missing required parameters', { userId, roomId });
      return;
    }
    
    try {
      const key = `${this.STORAGE_KEY}_${userId}_${roomId}`;
      const data = {
        messages,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving chat messages:', error);
    }
  }

  // Load chat messages from localStorage
  static loadChatMessages(roomId, userId) {
    if (!userId || !roomId) {
      console.error('Cannot load chat messages: Missing required parameters', { userId, roomId });
      return [];
    }
    
    try {
      const key = `${this.STORAGE_KEY}_${userId}_${roomId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        const data = JSON.parse(saved);
        
        // Check if data is in new format
        if (data.messages && data.timestamp) {
          // Check if data is too old
          if (Date.now() - data.timestamp > this.MAX_CACHE_AGE_MS) {
            console.log('Chat messages cache expired for room:', roomId);
            return [];
          }
          return data.messages;
        } else {
          // Legacy format - just array
          return data;
        }
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
    return [];
  }

  // Clear all chat data for a user
  static clearChatData(userId) {
    try {
      // Get all keys from localStorage
      const keys = Object.keys(localStorage);
      
      // Remove all chat-related keys for this user
      keys.forEach(key => {
        if (key.includes(`_${userId}_`) || key.includes(`_${userId}`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing chat data:', error);
    }
  }

  // Update last message in chat list
  static updateChatListLastMessage(chatList, roomId, message, userId) {
    const updatedList = chatList.map(chat => {
      if (chat.roomId === roomId) {
        return {
          ...chat,
          lastMessage: message.content || message.message || '',
          lastMessageTime: message.timestamp || Date.now() / 1000,
          unreadCount: 0 // Reset when viewing
        };
      }
      return chat;
    });
    
    this.saveChatList(updatedList, userId);
    return updatedList;
  }
}
