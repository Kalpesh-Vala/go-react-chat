import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ChatAPI } from '../services/api';
import useWebSocket from '../hooks/useWebSocket';
import { 
  Send, 
  Smile, 
  Paperclip, 
  Users, 
  Search, 
  MoreVertical,
  Phone,
  Video,
  X,
  ArrowLeft
} from 'lucide-react';
import MessageBubble from '../components/chat/MessageBubble';
import UserList from '../components/chat/UserList';
import TypingIndicator from '../components/chat/TypingIndicator';
import EmojiPicker from '../components/chat/EmojiPicker';

const Chat = () => {
  const { roomId: urlRoomId } = useParams();
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(urlRoomId || 'general');
  const [messageInput, setMessageInput] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messageEndRef = useRef(null);
  const inputRef = useRef(null);

  // WebSocket connection
  const {
    messages: realtimeMessages,
    isConnected,
    connectionError,
    typingUsers,
    sendMessage,
    sendReaction,
    startTyping,
    stopTyping
  } = useWebSocket(selectedRoom);

  // Update selected room when URL changes
  useEffect(() => {
    if (urlRoomId && urlRoomId !== selectedRoom) {
      setSelectedRoom(urlRoomId);
    }
  }, [urlRoomId, selectedRoom]);

  // Load chat history when room changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!selectedRoom) return;
      
      setIsLoadingHistory(true);
      try {
        const result = await ChatAPI.getChatHistory(selectedRoom);
        if (result.success) {
          setChatHistory(result.data.messages || []);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [selectedRoom]);

  // Load online users
  useEffect(() => {
    const loadOnlineUsers = async () => {
      try {
        const result = await ChatAPI.getOnlineUsers();
        if (result.success) {
          setOnlineUsers(result.data.online_users || []);
        }
      } catch (error) {
        console.error('Error loading online users:', error);
      }
    };

    loadOnlineUsers();
    // Refresh every 30 seconds
    const interval = setInterval(loadOnlineUsers, 30000);
    return () => clearInterval(interval);
  }, []);

  // Merge chat history with real-time messages
  const allMessages = React.useMemo(() => {
    const historyMessages = chatHistory.map(msg => ({
      ...msg,
      id: msg.id || msg.message_id,
      content: msg.message || msg.content,
      sender_id: msg.sender_id,
      timestamp: msg.timestamp,
      isFromHistory: true
    }));

    const realtimeMessagesFormatted = realtimeMessages.map(msg => ({
      ...msg,
      isFromHistory: false
    }));

    // Combine and remove duplicates based on message_id
    const combined = [...historyMessages, ...realtimeMessagesFormatted];
    const unique = combined.filter((msg, index, arr) => 
      arr.findIndex(m => m.id === msg.id || m.message_id === msg.message_id) === index
    );

    // Sort by timestamp
    return unique.sort((a, b) => a.timestamp - b.timestamp);
  }, [chatHistory, realtimeMessages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [allMessages]);

  // Handle message input change with typing indicator
  const handleInputChange = (e) => {
    setMessageInput(e.target.value);
    
    if (e.target.value.trim()) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  // Handle message send
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    const messageText = messageInput.trim();
    if (!messageText || !isConnected) return;

    // Send via WebSocket
    const success = sendMessage(messageText);
    
    if (success) {
      setMessageInput('');
      stopTyping();
      inputRef.current?.focus();
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setMessageInput(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  // Handle message reaction
  const handleReaction = (messageId, emoji, action = 'add') => {
    sendReaction(messageId, emoji, action);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="font-semibold text-gray-900">#{selectedRoom}</h1>
            <p className="text-xs text-gray-500">
              {isConnected ? `${onlineUsers.length} online` : 'Connecting...'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowUserList(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Users className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Phone className="h-5 w-5 text-gray-600" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <Video className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex h-screen lg:h-[calc(100vh-64px)]">
        {/* Sidebar - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:flex lg:w-80 bg-white border-r border-gray-200 flex-col">
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Chats</h2>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            
            {/* Search */}
            <div className="mt-3 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Room List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              {['general', 'random', 'development', 'design'].map((room) => (
                <button
                  key={room}
                  onClick={() => setSelectedRoom(room)}
                  className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                    selectedRoom === room ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      #{room.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">#{room}</p>
                    <p className="text-sm text-gray-500">Last message preview...</p>
                  </div>
                  {room === 'general' && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* User List */}
          <UserList 
            users={onlineUsers} 
            isVisible={showUserList}
            onClose={() => setShowUserList(false)}
          />
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header - Desktop */}
          <div className="hidden lg:flex bg-white border-b border-gray-200 px-6 py-4 justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">#{selectedRoom}</h1>
              <p className="text-sm text-gray-500">
                {isConnected ? (
                  <>
                    <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    {onlineUsers.length} members online
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                    Connecting...
                  </>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowUserList(!showUserList)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Users className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Phone className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Video className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="h-5 w-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 custom-scrollbar">
            {/* Connection Error */}
            {connectionError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">Connection Error: {connectionError}</p>
              </div>
            )}

            {/* Loading History */}
            {isLoadingHistory && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {allMessages.map((message, index) => (
                <MessageBubble
                  key={message.id || message.message_id || index}
                  message={message}
                  currentUserId={user?.id}
                  onReaction={handleReaction}
                />
              ))}
            </div>

            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <TypingIndicator users={Array.from(typingUsers)} />
            )}

            <div ref={messageEndRef} />
          </div>

          {/* Message Input */}
          <div className="bg-white border-t border-gray-200 p-4">
            <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
              <div className="flex-1 relative">
                <div className="flex items-center space-x-2 mb-2">
                  <button
                    type="button"
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Paperclip className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <Smile className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
                
                <div className="relative">
                  <textarea
                    ref={inputRef}
                    value={messageInput}
                    onChange={handleInputChange}
                    placeholder={`Message #${selectedRoom}...`}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none max-h-32"
                    rows={1}
                    style={{ minHeight: '40px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  
                  {/* Emoji Picker */}
                  {showEmojiPicker && (
                    <EmojiPicker
                      onEmojiSelect={handleEmojiSelect}
                      onClose={() => setShowEmojiPicker(false)}
                    />
                  )}
                </div>
              </div>
              
              <button
                type="submit"
                disabled={!messageInput.trim() || !isConnected}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </form>
          </div>
        </div>

        {/* User List Sidebar */}
        {showUserList && (
          <UserList 
            users={onlineUsers} 
            isVisible={showUserList}
            onClose={() => setShowUserList(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Chat;
