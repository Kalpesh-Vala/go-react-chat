import { useState, useEffect, useRef, useCallback } from 'react';
import { authUtils } from '../utils/auth';
import { debounce } from '../utils/helpers';

const WEBSOCKET_URL = 'ws://localhost:8080/ws';

export const useWebSocket = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const ws = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;

  // Debounced typing indicator
  const debouncedStopTyping = useCallback(
    debounce(() => {
      sendTypingIndicator(false);
    }, 2000),
    [roomId]
  );

  const connect = useCallback(() => {
    if (!roomId) return;

    const token = authUtils.getToken();
    if (!token) {
      setConnectionError('No authentication token found');
      return;
    }

    try {
      const wsUrl = `${WEBSOCKET_URL}?room=${encodeURIComponent(roomId)}&token=${encodeURIComponent(token)}`;
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected to room:', roomId);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttemptsRef.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Attempt to reconnect if not a normal closure
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          const timeout = Math.pow(2, reconnectAttemptsRef.current) * 1000; // Exponential backoff
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current += 1;
            console.log(`Reconnecting attempt ${reconnectAttemptsRef.current}...`);
            connect();
          }, timeout);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect. Please refresh the page.');
        }
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to connect to chat server');
    }
  }, [roomId]);

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'message':
        setMessages(prev => {
          // Check if message already exists to avoid duplicates
          const exists = prev.some(msg => msg.message_id === data.message_id);
          if (exists) return prev;
          
          return [...prev, {
            id: data.message_id,
            message_id: data.message_id,
            room_id: data.room_id,
            sender_id: data.sender_id,
            content: data.content,
            message: data.content, // Backend uses 'message' field
            timestamp: data.timestamp,
            is_group: data.is_group,
            attachment_url: data.attachment_url || '',
            attachment_type: data.attachment_type || '',
            status: 'delivered'
          }];
        });
        break;

      case 'typing':
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (data.is_typing) {
            newSet.add(data.username || data.user_id);
          } else {
            newSet.delete(data.username || data.user_id);
          }
          return newSet;
        });
        break;

      case 'reaction':
        setMessages(prev => prev.map(msg => {
          if (msg.message_id === data.message_id) {
            const reactions = { ...msg.reactions } || {};
            if (data.action === 'add') {
              if (!reactions[data.emoji]) reactions[data.emoji] = [];
              if (!reactions[data.emoji].includes(data.user_id)) {
                reactions[data.emoji].push(data.user_id);
              }
            } else if (data.action === 'remove') {
              if (reactions[data.emoji]) {
                reactions[data.emoji] = reactions[data.emoji].filter(id => id !== data.user_id);
                if (reactions[data.emoji].length === 0) {
                  delete reactions[data.emoji];
                }
              }
            }
            return { ...msg, reactions };
          }
          return msg;
        }));
        break;

      case 'error':
        console.error('WebSocket error message:', data.error);
        setConnectionError(data.error);
        break;

      default:
        console.log('Unknown WebSocket message type:', data.type);
    }
  };

  const sendMessage = useCallback((content, attachmentUrl = '', attachmentType = '') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    const user = authUtils.getUser();
    if (!user) {
      console.error('No user data found');
      return false;
    }

    const messagePayload = {
      type: 'message',
      room_id: roomId,
      sender_id: user.id,
      content: content.trim(),
      is_group: false,
      attachment_url: attachmentUrl,
      attachment_type: attachmentType
    };

    try {
      ws.current.send(JSON.stringify(messagePayload));
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [roomId]);

  const sendTypingIndicator = useCallback((isTyping) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return;

    const user = authUtils.getUser();
    if (!user) return;

    const typingPayload = {
      type: 'typing',
      room_id: roomId,
      user_id: user.id,
      username: user.username || user.email,
      is_typing: isTyping
    };

    try {
      ws.current.send(JSON.stringify(typingPayload));
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [roomId]);

  const sendReaction = useCallback((messageId, emoji, action = 'add') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) return false;

    const user = authUtils.getUser();
    if (!user) return false;

    const reactionPayload = {
      type: 'reaction',
      message_id: messageId,
      room_id: roomId,
      user_id: user.id,
      emoji: emoji,
      action: action
    };

    try {
      ws.current.send(JSON.stringify(reactionPayload));
      return true;
    } catch (error) {
      console.error('Error sending reaction:', error);
      return false;
    }
  }, [roomId]);

  const startTyping = useCallback(() => {
    sendTypingIndicator(true);
    debouncedStopTyping();
  }, [sendTypingIndicator, debouncedStopTyping]);

  const stopTyping = useCallback(() => {
    sendTypingIndicator(false);
    debouncedStopTyping.cancel();
  }, [sendTypingIndicator, debouncedStopTyping]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Component unmounting');
      ws.current = null;
    }
    
    setIsConnected(false);
    setMessages([]);
    setTypingUsers(new Set());
  }, []);

  // Effect to handle connection
  useEffect(() => {
    if (roomId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, connect, disconnect]);

  return {
    messages,
    isConnected,
    connectionError,
    typingUsers,
    sendMessage,
    sendReaction,
    startTyping,
    stopTyping,
    reconnect: connect,
    disconnect
  };
};

export default useWebSocket;
