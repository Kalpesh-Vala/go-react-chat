import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ChatAPI } from '../../services/api';
import { ChatHistoryManager } from '../../utils/chatHistory';
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

  // Store previous room to detect changes
  const previousRoomRef = useRef(selectedRoom);
  
  // WebSocket connection - Only create when we have a valid room
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
  
  // Log room changes
  useEffect(() => {
    if (previousRoomRef.current !== selectedRoom) {
      console.log(`Room changed from ${previousRoomRef.current} to ${selectedRoom}`);
      previousRoomRef.current = selectedRoom;
    }
  }, [selectedRoom]);

  // Debug: Log props and user (after WebSocket hook)
  console.log('ChatContainer - Selected Room:', selectedRoom);
  console.log('ChatContainer - User:', user);
  console.log('ChatContainer - WebSocket connected:', isConnected);
  console.log('ChatContainer - Connection error:', connectionError);

  // Load chat history when room changes
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!selectedRoom || !user?.id) return;
      
      setIsLoadingHistory(true);
      setChatHistory([]); // Clear previous history
      
      try {
        // First, load from localStorage for instant display
        const cachedMessages = ChatHistoryManager.loadChatMessages(selectedRoom, user.id);
        if (cachedMessages.length > 0) {
          setChatHistory(cachedMessages);
        }

        // Then, fetch from API for latest messages
        const result = await ChatAPI.getChatHistory(selectedRoom);
        if (result.success) {
          const apiMessages = result.data.messages || [];
          setChatHistory(apiMessages);
          
          // Save to localStorage for next time
          ChatHistoryManager.saveChatMessages(selectedRoom, apiMessages, user.id);
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Fallback to cached messages if API fails
        const cachedMessages = ChatHistoryManager.loadChatMessages(selectedRoom, user.id);
        setChatHistory(cachedMessages);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [selectedRoom, user?.id]);

  // Set chat partner based on room ID
  useEffect(() => {
    const fetchChatPartnerInfo = async () => {
      if (!selectedRoom || !user?.id) return;
      
      // First set temporary chat partner to show something immediately
      setChatPartner({
        id: selectedRoom,
        username: 'Loading...',
        email: '',
        isOnline: false,
        avatar: '👤'
      });
      
      try {
        // Try to get partner info from API
        if (selectedRoom.includes('private_')) {
          // Extract user IDs from private room format (private_userid1_userid2)
          const userIds = selectedRoom.replace('private_', '').split('_');
          // Find the other user's ID (not the current user)
          const partnerId = userIds.find(id => id !== user.id?.toString());
          
          if (partnerId) {
            // Fetch user profile from API
            const result = await ChatAPI.getUserProfile(partnerId);
            if (result.success) {
              setChatPartner({
                id: partnerId,
                username: result.data.username || 'User',
                email: result.data.email || '',
                isOnline: result.data.is_online || false,
                avatar: result.data.avatar || '👤'
              });
              return;
            }
          }
        } else if (selectedRoom.includes('group_')) {
          // Handle group chat rooms
          const groupName = selectedRoom.replace('group_', '').replace(/_/g, ' ');
          setChatPartner({
            id: selectedRoom,
            username: groupName,
            email: '',
            isOnline: true,
            isGroup: true,
            avatar: '👥'
          });
          return;
        }
        
        // Fallback if API call fails or for unknown room types
        const savedChats = ChatHistoryManager.loadChatList(user.id);
        const chatInfo = savedChats.find(chat => chat.roomId === selectedRoom);
        
        if (chatInfo) {
          setChatPartner({
            id: chatInfo.id,
            username: chatInfo.username,
            email: chatInfo.email || '',
            isOnline: chatInfo.isOnline || false,
            avatar: chatInfo.avatar || '👤'
          });
        } else {
          // Ultimate fallback - just use room ID
          setChatPartner({
            id: selectedRoom,
            username: selectedRoom.replace('private_', 'Chat ').replace('group_', 'Group '),
            email: '',
            isOnline: false,
            avatar: '👤'
          });
        }
      } catch (error) {
        console.error('Error fetching chat partner info:', error);
        // Fallback on error
        setChatPartner({
          id: selectedRoom,
          username: selectedRoom,
          email: '',
          isOnline: false,
          avatar: '👤'
        });
      }
    };
    
    fetchChatPartnerInfo();
  }, [selectedRoom, user?.id]);

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

  const handleSendMessage = useCallback(async (content, attachmentUrl = '', attachmentType = '') => {
    if (!content.trim() && !attachmentUrl) return;
    
    const trimmedContent = content.trim();
    // Generate a temporary client-side ID for deduplication
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    try {
      // Send via WebSocket for real-time delivery if connected
      if (isConnected) {
        console.log('Sending message via WebSocket');
        sendMessage({
          content: trimmedContent,
          is_group: false,
          attachment_url: attachmentUrl,
          attachment_type: attachmentType
        });
      } else {
        // Fallback to REST API if WebSocket is not connected
        console.log('WebSocket not connected, using REST API fallback');
        const response = await ChatAPI.sendMessage({
          room_id: selectedRoom,
          sender_id: user?.id,
          message: trimmedContent,
          is_group: false,
          status: 'sent',
          attachment_url: attachmentUrl,
          attachment_type: attachmentType
        });
        
        // If we got a message ID back from API, send it to WebSocket for broadcasting
        // This helps prevent duplicate storage
        if (response?.data?.message_id && isConnected) {
          console.log('Got message ID from API, notifying WebSocket', response.data.message_id);
          sendMessage({
            type: "message",
            message_id: response.data.message_id,
            room_id: selectedRoom,
            sender_id: user?.id,
            content: trimmedContent,
            timestamp: response.data.timestamp || Date.now()/1000,
            is_group: false,
            attachment_url: attachmentUrl,
            attachment_type: attachmentType
          });
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // If WebSocket failed and we haven't tried REST API yet, try REST as last resort
      if (isConnected && error) {
        try {
          console.log('WebSocket failed, falling back to REST API');
          await ChatAPI.sendMessage({
            room_id: selectedRoom,
            sender_id: user?.id,
            message: trimmedContent,
            is_group: false,
            status: 'sent',
            attachment_url: attachmentUrl,
            attachment_type: attachmentType
          });
        } catch (backupError) {
          console.error('Both WebSocket and REST API failed:', backupError);
        }
      }
    }
  }, [selectedRoom, user?.id, isConnected, sendMessage]);

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

  const handleDelete = async (messageId) => {
    try {
      // Call the API to delete the message
      const response = await ChatAPI.deleteMessage(messageId);
      
      if (response.success) {
        console.log("Message deleted successfully:", messageId);
        
        // Send a WebSocket notification about the deletion
        if (isConnected) {
          sendMessage({
            type: "deletion",
            message_id: messageId,
            room_id: selectedRoom,
            sender_id: user?.id,
          });
        }
        
        // Update the local messages state to reflect deletion
        setChatHistory(prevHistory => 
          prevHistory.map(msg => 
            msg.id === messageId ? {...msg, deleted: true} : msg
          )
        );
      } else {
        console.error("Failed to delete message:", response.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
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
            onDelete={handleDelete}
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
