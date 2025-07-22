import React, { useState, useEffect } from 'react';
import { Search, Plus, MessageCircle, Users, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ChatAPI } from '../../services/api';

const ChatSidebar = ({ selectedRoom, onRoomSelect, onCreateRoom, className = '' }) => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Debug: Log user data
  console.log('ChatSidebar - User:', user);

  // Initialize chat list with AI Agent
  useEffect(() => {
    setChatList([
      {
        id: 'ai-agent',
        roomId: 'ai-agent',
        username: 'AI Agent',
        email: 'ai@chatapp.com',
        avatar: '🤖',
        lastMessage: 'Hello! I\'m here to help you with anything.',
        lastMessageTime: Date.now() / 1000,
        unreadCount: 0,
        isOnline: true,
        isAI: true,
        isPrivate: false
      }
    ]);
  }, []);

  // Load online users
  useEffect(() => {
    const loadOnlineUsers = async () => {
      try {
        // Use general room for user discovery
        const result = await ChatAPI.getOnlineUsersInRoom('general');
        if (result.success) {
          setOnlineUsers(result.data.online_users || []);
        }
      } catch (error) {
        console.error('Error loading online users:', error);
      }
    };

    loadOnlineUsers();
    const interval = setInterval(loadOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search users
  useEffect(() => {
    const searchUsers = async () => {
      if (!searchTerm.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const result = await ChatAPI.searchUsers(searchTerm);
        if (result.success) {
          setSearchResults(result.data.users || []);
        } else {
          console.error('Search error:', result.error);
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return date.toLocaleDateString();
  };

  const handleUserSelect = (selectedUser) => {
    // Ensure we have the current user
    if (!user?.id) {
      console.error('Current user not available');
      return;
    }

    // Create private room ID between current user and selected user
    const roomId = ChatAPI.createPrivateRoomId(user.id, selectedUser.id);
    
    if (!roomId) {
      console.error('Failed to create room ID');
      return;
    }

    // Add to chat list if not already there
    setChatList(prev => {
      const exists = prev.find(chat => chat.roomId === roomId);
      if (!exists) {
        const newChat = {
          id: selectedUser.id,
          roomId: roomId,
          username: selectedUser.username,
          email: selectedUser.email,
          avatar: selectedUser.avatar || '👤',
          lastMessage: '',
          lastMessageTime: Date.now() / 1000,
          unreadCount: 0,
          isPrivate: true,
          isAI: false,
          isOnline: selectedUser.isOnline || false
        };
        return [newChat, ...prev];
      }
      return prev;
    });

    // Immediately select this room to start the conversation
    onRoomSelect(roomId);
    setSearchTerm('');
    setSearchResults([]);
  };  const handleChatSelect = (chat) => {
    onRoomSelect(chat.roomId);
  };

  return (
    <div className={`flex flex-col h-full bg-white border-r border-gray-200 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Chats</h2>
        <div className="flex items-center space-x-2">
          <button 
            onClick={onCreateRoom}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            title="New chat"
          >
            <Plus className="w-5 h-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Settings className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search people..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {searchTerm ? (
          /* Search Results */
          <div className="p-4">
            <h3 className="text-sm font-medium text-gray-500 mb-3">
              {isSearching ? 'Searching...' : `Search Results (${searchResults.length})`}
            </h3>
            
            {isSearching ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-2">
                {searchResults.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleUserSelect(user)}
                    className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors text-left"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.avatar || user.username?.charAt(0).toUpperCase()}
                      </div>
                      {user.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.username}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user.email}
                      </p>
                    </div>
                    {user.isOnline && (
                      <div className="text-xs text-green-600">Online</div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No users found</p>
                <p className="text-xs text-gray-400 mt-1">Try searching with a different term</p>
              </div>
            )}
          </div>
        ) : (
          /* Chat List */
          <div>
            {chatList.length > 0 ? (
              <div className="space-y-1">
                  {chatList.map((chat) => (
                    <button
                      key={chat.roomId}
                      onClick={() => handleChatSelect(chat)}
                      className={`w-full flex items-center space-x-3 p-4 hover:bg-gray-50 transition-colors text-left ${
                        selectedRoom === chat.roomId 
                          ? 'bg-blue-50 border-r-2 border-blue-500' 
                          : ''
                      }`}
                    >
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {chat.avatar || chat.username?.charAt(0).toUpperCase()}
                      </div>
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {chat.username}
                        </p>
                        {chat.lastMessageTime && (
                          <span className="text-xs text-gray-500">
                            {formatLastMessageTime(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500 truncate">
                          {chat.lastMessage || 'Start a conversation...'}
                        </p>
                        {chat.unreadCount > 0 && (
                          <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No conversations yet</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Search for people to start chatting with them
                </p>
                <button
                  onClick={() => document.querySelector('input[placeholder="Search people..."]').focus()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Find people
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer - Online status */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Online ({onlineUsers.length + 1})</span>
        </div>
      </div>
    </div>
  );
};

// Add error boundary wrapper
const ChatSidebarWithErrorBoundary = (props) => {
  try {
    return <ChatSidebar {...props} />;
  } catch (error) {
    console.error('ChatSidebar error:', error);
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200 p-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Chats</h2>
        <div className="text-red-500">
          Error loading chat sidebar. Please refresh the page.
        </div>
      </div>
    );
  }
};

export default ChatSidebarWithErrorBoundary;
