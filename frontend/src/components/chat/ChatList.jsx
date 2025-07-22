import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MessageCircle, MoreVertical, Edit3 } from 'lucide-react';
import { ChatAPI } from '../../services/api';
import { formatDistanceToNow } from 'date-fns';

const ChatList = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock chat rooms - in real app, this would come from your backend
  const mockChatRooms = [
    {
      id: 'general',
      name: 'General',
      type: 'group',
      lastMessage: 'Hey everyone! How is everyone doing?',
      lastMessageTime: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      unreadCount: 3,
      avatar: null,
      isOnline: true
    },
    {
      id: 'development',
      name: 'Development',
      type: 'group',
      lastMessage: 'Can someone review this PR?',
      lastMessageTime: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      unreadCount: 1,
      avatar: null,
      isOnline: true
    },
    {
      id: 'design',
      name: 'Design Team',
      type: 'group',
      lastMessage: 'New mockups are ready for review',
      lastMessageTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      unreadCount: 0,
      avatar: null,
      isOnline: false
    },
    {
      id: 'random',
      name: 'Random',
      type: 'group',
      lastMessage: 'Anyone up for coffee?',
      lastMessageTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      unreadCount: 0,
      avatar: null,
      isOnline: false
    }
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load online users
        const usersResult = await ChatAPI.getOnlineUsers();
        if (usersResult.success) {
          setOnlineUsers(usersResult.data.online_users || []);
        }
        
        // Set mock chat rooms for now
        setChatRooms(mockChatRooms);
      } catch (error) {
        console.error('Error loading chat data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredChats = chatRooms.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Chat App</h1>
        <div className="flex items-center space-x-3">
          <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
            <Search className="h-5 w-5" />
          </button>
          <button className="p-2 hover:bg-green-700 rounded-full transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      {/* Online Users */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="p-3">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Online Users ({onlineUsers.length})</h3>
          <div className="flex space-x-3 overflow-x-auto">
            {onlineUsers.map((user, index) => (
              <Link
                key={user.id || user.user_id || index}
                to={`/chat/user-${user.id || user.user_id || index}`}
                className="flex-shrink-0 flex flex-col items-center space-y-1"
              >
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {(user.username || user.name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                </div>
                <span className="text-xs text-gray-600 max-w-[60px] truncate">
                  {user.username || user.name || 'User'}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle className="h-16 w-16 mb-4 text-gray-300" />
            <p className="text-lg mb-2">No chats found</p>
            <p className="text-sm">Start a conversation to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredChats.map((chat) => (
              <ChatItem key={chat.id} chat={chat} />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="absolute bottom-6 right-6">
        <button className="w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors">
          <Edit3 className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
};

const ChatItem = ({ chat }) => {
  return (
    <Link
      to={`/chat/${chat.id}`}
      className="flex items-center p-4 hover:bg-gray-50 transition-colors active:bg-gray-100"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0 mr-3">
        {chat.avatar ? (
          <img
            src={chat.avatar}
            alt={chat.name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <span className="text-white font-medium">
              {chat.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        {chat.isOnline && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-medium text-gray-900 truncate">
            {chat.name}
          </h3>
          <span className="text-xs text-gray-500 flex-shrink-0">
            {formatDistanceToNow(chat.lastMessageTime, { addSuffix: false })}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600 truncate flex-1 mr-2">
            {chat.lastMessage}
          </p>
          
          {chat.unreadCount > 0 && (
            <div className="flex-shrink-0 w-5 h-5 bg-green-600 text-white text-xs rounded-full flex items-center justify-center">
              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ChatList;
