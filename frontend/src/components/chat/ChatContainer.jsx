import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChatAPI } from '../../services/api';
import useWebSocket from '../../hooks/useWebSocket';
import { 
  Send, 
  Smile, 
  Paperclip, 
  MoreVertical,
  Phone,
  Video,
  ArrowLeft,
  Search
} from 'lucide-react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import TypingIndicator from './TypingIndicator';

const ChatContainer = ({ selectedRoom, onBackToList }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [chatPartner, setChatPartner] = useState(null);
  const messageListRef = useRef(null);

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

  // Debug: Log props and user (after WebSocket hook)
  console.log('ChatContainer - Selected Room:', selectedRoom);
  console.log('ChatContainer - User:', user);
  console.log('ChatContainer - WebSocket connected:', isConnected);
  console.log('ChatContainer - Connection error:', connectionError);

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

  // Set chat partner based on room ID
  useEffect(() => {
    if (selectedRoom === 'ai-agent') {
      setChatPartner({
        id: 'ai-agent',
        username: 'AI Agent',
        email: 'ai@chatapp.com',
        isOnline: true,
        avatar: '🤖'
      });
    } else {
      // For user chats, extract user info from room ID or load from API
      setChatPartner({
        id: selectedRoom,
        username: selectedRoom,
        email: `${selectedRoom}@example.com`,
        isOnline: false,
        avatar: '👤'
      });
    }
  }, [selectedRoom]);

  // Merge chat history with real-time messages
  const allMessages = React.useMemo(() => {
    const historyMessages = chatHistory.map(msg => ({
      ...msg,
      id: msg.id || msg.message_id,
      content: msg.message || msg.content,
      sender_id: msg.sender_id,
      timestamp: msg.timestamp,
      isOwn: msg.sender_id === user?.id
    }));

    const realtimeMessagesMapped = realtimeMessages.map(msg => ({
      ...msg,
      id: msg.id || msg.message_id,
      content: msg.content || msg.message,
      isOwn: msg.sender_id === user?.id
    }));

    // Combine and deduplicate
    const combined = [...historyMessages, ...realtimeMessagesMapped];
    const uniqueMessages = combined.filter((msg, index, self) => 
      index === self.findIndex(m => m.id === msg.id)
    );

    // Sort by timestamp
    return uniqueMessages.sort((a, b) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );
  }, [chatHistory, realtimeMessages, user?.id]);

  const handleSendMessage = async (content, attachmentUrl = '', attachmentType = '') => {
    if (!content.trim() && !attachmentUrl) return;

    const messageData = {
      type: 'message',
      room_id: selectedRoom,
      sender_id: user?.id,
      content: content.trim(),
      is_group: false,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType
    };

    try {
      // Send via WebSocket for real-time delivery
      sendMessage(messageData);
      
      // Also send via REST API for reliability
      await ChatAPI.sendMessage({
        room_id: selectedRoom,
        sender_id: user?.id,
        message: content.trim(),
        is_group: false,
        status: 'sent',
        attachment_url: attachmentUrl,
        attachment_type: attachmentType
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleReaction = async (messageId, emoji, action = 'add') => {
    try {
      const reactionData = {
        message_id: messageId,
        emoji,
        user_id: user?.id.toString()
      };

      if (action === 'add') {
        await ChatAPI.addReaction(reactionData);
      } else {
        await ChatAPI.removeReaction(reactionData);
      }

      // Send via WebSocket for real-time updates
      sendReaction({
        type: 'reaction',
        message_id: messageId,
        room_id: selectedRoom,
        user_id: user?.id,
        emoji,
        action
      });
    } catch (error) {
      console.error('Error handling reaction:', error);
    }
  };

  const handleTyping = (isTyping) => {
    if (isTyping) {
      startTyping();
    } else {
      stopTyping();
    }
  };

  if (!selectedRoom) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">💬</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Select a conversation
          </h3>
          <p className="text-gray-600">
            Choose a chat from the sidebar to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      {/* Chat Header */}
      <ChatHeader 
        chatPartner={chatPartner}
        isConnected={isConnected}
        onBack={onBackToList}
      />

      {/* Connection Status */}
      {connectionError && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3">
          <div className="text-sm text-red-700">
            Connection error: {connectionError}
          </div>
        </div>
      )}

      {!isConnected && !connectionError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
          <div className="text-sm text-yellow-700">
            Connecting to chat...
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {isLoadingHistory ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <MessageList
            ref={messageListRef}
            messages={allMessages}
            currentUserId={user?.id}
            onReaction={handleReaction}
          />
        )}

        {/* Typing Indicator */}
        {typingUsers.size > 0 && (
          <TypingIndicator users={Array.from(typingUsers)} />
        )}

        {/* Message Input */}
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={!isConnected}
        />
      </div>
    </div>
  );
};

export default ChatContainer;
