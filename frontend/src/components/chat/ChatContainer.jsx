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
          console.log('API Messages loaded:', apiMessages.length, 'messages');
          console.log('Deleted messages in API response:', apiMessages.filter(msg => msg.deleted).length);
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

  // Sync chatHistory with realtime messages to capture reactions, deletions, etc.
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      setChatHistory(prevHistory => {
        // Create a map of current history messages by ID for efficient lookups
        const historyMap = new Map();
        prevHistory.forEach(msg => {
          const msgId = msg.id || msg.message_id;
          historyMap.set(msgId, msg);
        });

        // Process realtime messages to update history
        realtimeMessages.forEach(realtimeMsg => {
          const msgId = realtimeMsg.id || realtimeMsg.message_id;
          const existingMsg = historyMap.get(msgId);
          
          if (existingMsg) {
            // Update existing message with realtime data (reactions, deletions, etc.)
            const updatedMsg = {
              ...existingMsg,
              ...realtimeMsg,
              id: msgId,
              content: realtimeMsg.content || existingMsg.content || existingMsg.message,
              reactions: realtimeMsg.reactions || existingMsg.reactions || {},
              deleted: realtimeMsg.deleted !== undefined ? realtimeMsg.deleted : existingMsg.deleted
            };
            historyMap.set(msgId, updatedMsg);
          } else {
            // Add new message
            const newMsg = {
              ...realtimeMsg,
              id: msgId,
              content: realtimeMsg.content || realtimeMsg.message,
              reactions: realtimeMsg.reactions || {},
              deleted: realtimeMsg.deleted || false
            };
            historyMap.set(msgId, newMsg);
          }
        });

        // Convert back to array and sort
        const updatedMessages = Array.from(historyMap.values()).sort((a, b) => 
          (a.timestamp || 0) - (b.timestamp || 0)
        );

        return updatedMessages;
      });
    }
  }, [realtimeMessages]);

  // Merge chat history with real-time messages for display
  const allMessages = React.useMemo(() => {
    const historyMessages = chatHistory.map(msg => ({
      ...msg,
      id: msg.id || msg.message_id,
      content: msg.message || msg.content,
      sender_id: msg.sender_id,
      timestamp: msg.timestamp,
      deleted: msg.deleted || false, // Ensure deleted property is preserved
      isOwn: msg.sender_id === user?.id
    }));

    // Sort by timestamp
    const sortedMessages = historyMessages.sort((a, b) => 
      (a.timestamp || 0) - (b.timestamp || 0)
    );
    
    // Debug: Log deleted messages count
    const deletedCount = sortedMessages.filter(msg => msg.deleted).length;
    if (deletedCount > 0) {
      console.log(`Rendering ${deletedCount} deleted messages out of ${sortedMessages.length} total`);
    }
    
    return sortedMessages;
  }, [chatHistory, user?.id]);

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
    if (action === 'add') {
      // For adding reactions, we'll let the backend handle the single-reaction logic
      // Optimistically update local state by removing any existing reaction from current user
      // and adding the new one
      setChatHistory(prevHistory => {
        const updatedHistory = prevHistory.map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            const currentUserId = user?.id.toString();
            
            // Remove user from any existing reactions
            Object.keys(reactions).forEach(existingEmoji => {
              if (reactions[existingEmoji]) {
                reactions[existingEmoji] = reactions[existingEmoji].filter(
                  uid => uid !== currentUserId
                );
                // Remove the emoji completely if no users left
                if (reactions[existingEmoji].length === 0) {
                  delete reactions[existingEmoji];
                }
              }
            });
            
            // Add user to the new emoji
            if (!reactions[emoji]) {
              reactions[emoji] = [];
            }
            if (!reactions[emoji].includes(currentUserId)) {
              reactions[emoji].push(currentUserId);
            }
            
            return { ...msg, reactions };
          }
          return msg;
        });
        return updatedHistory;
      });

      try {
        const reactionData = {
          message_id: messageId,
          emoji,
          user_id: user?.id.toString()
        };

        // Use add endpoint - backend will handle removing previous reaction
        await ChatAPI.addReaction(reactionData);
        
      } catch (error) {
        console.error('Error adding reaction:', error);
        
        // Revert local state on error - this is complex with single reaction logic
        // For now, we'll let the next WebSocket update correct the state
      }
      
    } else if (action === 'remove') {
      // For removing reactions
      setChatHistory(prevHistory => {
        const updatedHistory = prevHistory.map(msg => {
          if (msg.id === messageId) {
            const reactions = { ...msg.reactions };
            const currentUserId = user?.id.toString();
            
            if (reactions[emoji]) {
              reactions[emoji] = reactions[emoji].filter(
                uid => uid !== currentUserId
              );
              // Remove the emoji completely if no users left
              if (reactions[emoji].length === 0) {
                delete reactions[emoji];
              }
            }
            
            return { ...msg, reactions };
          }
          return msg;
        });
        return updatedHistory;
      });

      try {
        const reactionData = {
          message_id: messageId,
          emoji,
          user_id: user?.id.toString()
        };

        await ChatAPI.removeReaction(reactionData);
        
      } catch (error) {
        console.error('Error removing reaction:', error);
        
        // Revert local state on error
        setChatHistory(prevHistory => {
          const revertedHistory = prevHistory.map(msg => {
            if (msg.id === messageId) {
              const reactions = { ...msg.reactions };
              const currentUserId = user?.id.toString();
              
              // Re-add the reaction
              if (!reactions[emoji]) {
                reactions[emoji] = [];
              }
              if (!reactions[emoji].includes(currentUserId)) {
                reactions[emoji].push(currentUserId);
              }
              
              return { ...msg, reactions };
            }
            return msg;
          });
          return revertedHistory;
        });
      }
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
      // Call the API to delete the message with room_id
      const response = await ChatAPI.deleteMessage(messageId, selectedRoom);
      
      if (response.success) {
        console.log("Message deleted successfully:", messageId);
        
        // The WebSocket broadcast will be sent by the backend automatically
        // Update the local messages state to reflect deletion immediately for better UX
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
            currentUserId={user?.id?.toString()}
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
