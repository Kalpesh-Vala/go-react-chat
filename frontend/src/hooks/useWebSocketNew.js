import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useWebSocket = (roomId) => {
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

  // Configuration
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second
  const typingDelay = 3000; // Stop typing after 3 seconds

  const connect = useCallback(() => {
    if (!roomId || !user?.token) {
      console.log('Missing roomId or token for WebSocket connection');
      return;
    }

    try {
      // Clean up existing connection
      if (ws.current) {
        ws.current.close();
      }

      const wsUrl = `ws://localhost:8080/ws?room=${roomId}&token=${user.token}`;
      console.log('Connecting to WebSocket:', wsUrl);
      
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        console.log('WebSocket connected to room:', roomId);
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
              }
              break;

            case 'reaction':
              setMessages(prev => 
                prev.map(msg => {
                  if (msg.id === data.message_id || msg.message_id === data.message_id) {
                    const reactions = { ...msg.reactions };
                    
                    if (data.action === 'add') {
                      if (!reactions[data.emoji]) {
                        reactions[data.emoji] = [];
                      }
                      if (!reactions[data.emoji].includes(data.user_id.toString())) {
                        reactions[data.emoji].push(data.user_id.toString());
                      }
                    } else if (data.action === 'remove') {
                      if (reactions[data.emoji]) {
                        reactions[data.emoji] = reactions[data.emoji].filter(
                          uid => uid !== data.user_id.toString()
                        );
                        if (reactions[data.emoji].length === 0) {
                          delete reactions[data.emoji];
                        }
                      }
                    }
                    
                    return { ...msg, reactions };
                  }
                  return msg;
                })
              );
              break;

            case 'error':
              // Filter out less critical errors to reduce noise
              if (data.error !== 'Empty message') {
                console.error('WebSocket error:', data.error);
                setConnectionError(data.error);
              } else {
                // Just log empty message errors at debug level
                console.debug('Skipped empty message:', data.error);
              }
              break;

            case 'pong':
              // Response to ping - connection is alive
              break;

            default:
              console.log('Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionError('Connection error occurred');
        setIsConnected(false);
      };

      ws.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts < maxReconnectAttempts) {
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeout.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to create connection');
    }
  }, [roomId, user?.token, reconnectAttempts]);

  // Connect when component mounts or roomId/token changes
  useEffect(() => {
    if (roomId && user?.token) {
      connect();
    }

    return () => {
      // Cleanup on unmount or dependency change
      if (ws.current) {
        ws.current.close(1000, 'Component unmounting');
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
      }
    };
  }, [connect]);

  // Reset messages when room changes
  useEffect(() => {
    setMessages([]);
    setTypingUsers(new Set());
  }, [roomId]);

  const sendMessage = useCallback((messageData) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'message',
        room_id: roomId,
        sender_id: user?.id,
        content: messageData.content,
        is_group: messageData.is_group || false,
        attachment_url: messageData.attachment_url || '',
        attachment_type: messageData.attachment_type || ''
      };
      
      console.log('Sending message:', payload);
      ws.current.send(JSON.stringify(payload));
    } else {
      console.error('WebSocket is not connected');
    }
  }, [roomId, user?.id]);

  const sendReaction = useCallback((reactionData) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'reaction',
        message_id: reactionData.message_id,
        room_id: roomId,
        user_id: user?.id,
        emoji: reactionData.emoji,
        action: reactionData.action || 'add'
      };
      
      console.log('Sending reaction:', payload);
      ws.current.send(JSON.stringify(payload));
    }
  }, [roomId, user?.id]);

  const startTyping = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN && !isTyping.current) {
      isTyping.current = true;
      
      const payload = {
        type: 'typing',
        room_id: roomId,
        user_id: user?.id,
        username: user?.username || 'User',
        is_typing: true
      };
      
      ws.current.send(JSON.stringify(payload));
    }
  }, [roomId, user?.id, user?.username]);

  const stopTyping = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN && isTyping.current) {
      isTyping.current = false;
      
      const payload = {
        type: 'typing',
        room_id: roomId,
        user_id: user?.id,
        username: user?.username || 'User',
        is_typing: false
      };
      
      ws.current.send(JSON.stringify(payload));
    }

    // Clear any existing typing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
      typingTimeout.current = null;
    }
  }, [roomId, user?.id, user?.username]);

  return {
    messages,
    isConnected,
    connectionError,
    typingUsers,
    sendMessage,
    sendReaction,
    startTyping,
    stopTyping,
    reconnect: connect
  };
};

export default useWebSocket;
