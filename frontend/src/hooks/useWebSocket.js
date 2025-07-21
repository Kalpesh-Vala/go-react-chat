import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useWebSocket = (roomId, token = null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const ws = useRef(null);
  const pingInterval = useRef(null);
  const typingTimeout = useRef(null);
  const reconnectTimeout = useRef(null);
  const isTyping = useRef(false);

  // Get token from user context or parameter
  const authToken = token || user?.token;

  // Connection configuration
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second
  const typingDelay = 3000; // Stop typing after 3 seconds

  const connect = useCallback(() => {
    if (!roomId || !authToken) {
      console.log('Missing roomId or token for WebSocket connection');
      return;
    }

    try {
      // Clean up existing connection
      if (ws.current) {
        ws.current.close();
      }

      const wsUrl = `ws://localhost:8080/ws?room=${roomId}&token=${authToken}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        setReconnectAttempts(0);

        // Setup ping interval to keep connection alive
        pingInterval.current = setInterval(() => {
          if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000); // Ping every 30 seconds
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'message':
              setMessages(prev => {
                // Avoid duplicates
                const exists = prev.some(msg => 
                  msg.id === data.message_id || msg.message_id === data.message_id
                );
                if (exists) return prev;
                
                return [...prev, {
                  id: data.message_id,
                  message_id: data.message_id,
                  room_id: data.room_id,
                  sender_id: data.sender_id,
                  content: data.content,
                  message: data.content, // Backwards compatibility
                  timestamp: data.timestamp || Date.now() / 1000,
                  is_group: data.is_group || false,
                  status: data.status || 'sent',
                  attachment_url: data.attachment_url || '',
                  attachment_type: data.attachment_type || '',
                  reactions: data.reactions || {}
                }];
              });
              break;

            case 'typing':
              if (data.user_id !== user?.id) {
                setTypingUsers(prev => {
                  const newSet = new Set(prev);
                  if (data.is_typing) {
                    newSet.add({
                      user_id: data.user_id,
                      username: data.username
                    });
                  } else {
                    // Remove user from typing
                    const filtered = Array.from(newSet).filter(u => u.user_id !== data.user_id);
                    return new Set(filtered);
                  }
                  return newSet;
                });

                // Auto-remove typing indicator after delay
                if (data.is_typing) {
                  setTimeout(() => {
                    setTypingUsers(prev => {
                      const newSet = new Set(prev);
                      const filtered = Array.from(newSet).filter(u => u.user_id !== data.user_id);
                      return new Set(filtered);
                    });
                  }, 5000);
                }
              }
              break;

            case 'reaction':
              setMessages(prev => prev.map(msg => {
                if (msg.id === data.message_id || msg.message_id === data.message_id) {
                  const reactions = { ...msg.reactions };
                  const emoji = data.emoji;
                  const userId = data.user_id.toString();

                  if (data.action === 'add') {
                    if (!reactions[emoji]) {
                      reactions[emoji] = [];
                    }
                    if (!reactions[emoji].includes(userId)) {
                      reactions[emoji].push(userId);
                    }
                  } else if (data.action === 'remove') {
                    if (reactions[emoji]) {
                      reactions[emoji] = reactions[emoji].filter(id => id !== userId);
                      if (reactions[emoji].length === 0) {
                        delete reactions[emoji];
                      }
                    }
                  }

                  return { ...msg, reactions };
                }
                return msg;
              }));
              break;

            case 'user_joined':
            case 'user_left':
              // Handle user presence updates
              console.log(`User ${data.type}:`, data);
              break;

            case 'error':
              console.error('WebSocket error:', data.error);
              setConnectionError(data.error);
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }

        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms...`);
          
          reconnectTimeout.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('Unable to connect to chat server. Please refresh the page.');
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to establish connection');
    }
  }, [roomId, authToken, user?.id, reconnectAttempts]);

  // Initialize connection
  useEffect(() => {
    connect();

    return () => {
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [connect]);

  // Clear messages when room changes
  useEffect(() => {
    setMessages([]);
    setTypingUsers(new Set());
  }, [roomId]);

  const sendMessage = useCallback((content, attachmentUrl = '', attachmentType = '') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    if (!content.trim()) {
      console.error('Message content is empty');
      return false;
    }

    const messagePayload = {
      type: 'message',
      room_id: roomId,
      sender_id: user?.id,
      content: content.trim(),
      is_group: true, // Most rooms are group chats
      attachment_url: attachmentUrl,
      attachment_type: attachmentType,
      timestamp: Math.floor(Date.now() / 1000)
    };

    try {
      ws.current.send(JSON.stringify(messagePayload));
      console.log('Message sent:', messagePayload);
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    }
  }, [roomId, user?.id]);

  const sendReaction = useCallback((messageId, emoji, action = 'add') => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return false;
    }

    const reactionPayload = {
      type: 'reaction',
      message_id: messageId,
      room_id: roomId,
      user_id: user?.id,
      emoji: emoji,
      action: action // 'add' or 'remove'
    };

    try {
      ws.current.send(JSON.stringify(reactionPayload));
      console.log('Reaction sent:', reactionPayload);
      return true;
    } catch (error) {
      console.error('Error sending reaction:', error);
      return false;
    }
  }, [roomId, user?.id]);

  const startTyping = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || isTyping.current) {
      return;
    }

    isTyping.current = true;
    
    const typingPayload = {
      type: 'typing',
      room_id: roomId,
      user_id: user?.id,
      username: user?.username || user?.email,
      is_typing: true
    };

    try {
      ws.current.send(JSON.stringify(typingPayload));
      console.log('Started typing');
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [roomId, user?.id, user?.username, user?.email]);

  const stopTyping = useCallback(() => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN || !isTyping.current) {
      return;
    }

    isTyping.current = false;

    const typingPayload = {
      type: 'typing',
      room_id: roomId,
      user_id: user?.id,
      username: user?.username || user?.email,
      is_typing: false
    };

    try {
      ws.current.send(JSON.stringify(typingPayload));
      console.log('Stopped typing');
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [roomId, user?.id, user?.username, user?.email]);

  // Auto-stop typing after delay
  const handleTyping = useCallback(() => {
    startTyping();
    
    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    // Set new timeout
    typingTimeout.current = setTimeout(() => {
      stopTyping();
    }, typingDelay);
  }, [startTyping, stopTyping]);

  return {
    messages,
    isConnected,
    connectionError,
    typingUsers,
    sendMessage,
    sendReaction,
    startTyping: handleTyping,
    stopTyping,
    reconnect: connect
  };
};

export default useWebSocket;
