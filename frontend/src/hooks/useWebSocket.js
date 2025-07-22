import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useWebSocket = (roomId) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  
  const ws = useRef(null);
  const pingInterval = useRef(null);
  const typingTimeout = useRef(null);
  const reconnectTimeout = useRef(null);
  const isTyping = useRef(false);

  // Configuration
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second
  const typingDelay = 3000; // Stop typing after 3 seconds

  // Store current room ID to detect changes
  const currentRoomRef = useRef(roomId);
  
  const connect = useCallback(() => {
    // Skip connection if no room or token
    if (!roomId || !user?.token) {
      console.log('WebSocket connection skipped - Missing roomId or token:', { 
        roomId, 
        hasToken: !!user?.token,
      });
      return;
    }
    
    // Check if room has changed
    const roomChanged = currentRoomRef.current !== roomId;
    currentRoomRef.current = roomId;
    
    try {
      // Clean up existing connection if room changed or connection is closed
      const needsNewConnection = 
        roomChanged || 
        !ws.current || 
        ws.current.readyState === WebSocket.CLOSED || 
        ws.current.readyState === WebSocket.CLOSING;
      
      // If we don't need a new connection and have a valid one, just keep it
      if (!needsNewConnection && 
          ws.current && 
          (ws.current.readyState === WebSocket.OPEN || ws.current.readyState === WebSocket.CONNECTING)) {
        console.log('Using existing WebSocket connection for room:', roomId);
        return;
      }
      
      console.log('Creating new WebSocket connection for room:', roomId);
      
      // Clean up existing connection before creating a new one
      if (ws.current) {
        console.log('Closing existing WebSocket connection');
        ws.current.onclose = null; // Prevent reconnect attempts from old connection
        ws.current.close(1000, 'Switching rooms');
        ws.current = null;
      }
      
      // Clear any existing intervals
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }

      const wsUrl = `ws://localhost:8080/ws?room=${roomId}&token=${user.token}`;
      console.log('Attempting WebSocket connection:', { roomId, userId: user.id });
      
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
        }, 45000); // Increased ping interval to reduce traffic
      };

      ws.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('WebSocket message received:', data);

          switch (data.type) {
            case 'message':
              const messageId = data.message_id || data.id;
              
              // Skip if we've already processed this message
              if (processedMessageIds.has(messageId)) {
                console.log('Skipping duplicate message:', messageId);
                break;
              }

              setProcessedMessageIds(prev => new Set(prev).add(messageId));
              setMessages(prev => {
                // Double-check for duplicates in the current messages array
                const exists = prev.some(msg => 
                  (msg.id === messageId) || 
                  (msg.message_id === messageId) ||
                  (msg.content === data.content && msg.sender_id === data.sender_id && Math.abs((msg.timestamp || 0) - (data.timestamp || Date.now() / 1000)) < 1)
                );
                
                if (exists) {
                  console.log('Message already exists in array:', messageId);
                  return prev;
                }
                
                const newMessage = {
                  id: messageId,
                  message_id: messageId,
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
                };
                
                console.log('Adding new message:', newMessage);
                return [...prev, newMessage];
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
              console.error('WebSocket error:', data.error);
              setConnectionError(data.error);
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
        console.log(`WebSocket closed for room ${roomId}:`, event.code, event.reason);
        setIsConnected(false);
        
        // Clear ping interval
        if (pingInterval.current) {
          clearInterval(pingInterval.current);
          pingInterval.current = null;
        }

        // Check if this is the current room's WebSocket
        if (roomId !== currentRoomRef.current) {
          console.log('WebSocket closed for previous room, skipping reconnection');
          return;
        }

        // Only attempt to reconnect if:
        // 1. Not intentionally closed (code !== 1000)
        // 2. Under max reconnect attempts
        // 3. This is still the current room
        if (event.code !== 1000 && 
            reconnectAttempts < maxReconnectAttempts &&
            roomId === currentRoomRef.current) {
          
          const delay = reconnectDelay * Math.pow(2, reconnectAttempts); // Exponential backoff
          console.log(`Attempting to reconnect to room ${roomId} in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          // Clear any existing reconnect timeout
          if (reconnectTimeout.current) {
            clearTimeout(reconnectTimeout.current);
          }
          
          reconnectTimeout.current = setTimeout(() => {
            // Double check that the room hasn't changed
            if (roomId === currentRoomRef.current) {
              setReconnectAttempts(prev => prev + 1);
              connect();
            }
          }, delay);
        } else if (reconnectAttempts >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      };

    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnectionError('Failed to create connection');
    }
  }, [roomId, user?.token]); // Removed reconnectAttempts to avoid endless reconnection loops

  // Connect when component mounts or roomId/token changes
  useEffect(() => {
    // Track if the room ID actually changed (not just a rerender)
    const roomChanged = currentRoomRef.current !== roomId;
    
    // Only connect if we have the required data
    if (roomId && user?.token) {
      if (roomChanged) {
        console.log(`Room changed to ${roomId}, initializing new WebSocket connection`);
        
        // Clean up existing WebSocket before creating a new one
        if (ws.current) {
          console.log(`Closing previous WebSocket for room ${currentRoomRef.current}`);
          ws.current.onclose = null; // Prevent reconnection attempts
          ws.current.close(1000, 'Switching rooms');
          ws.current = null;
        }
        
        // Reset all connection-related state
        setIsConnected(false);
        setConnectionError(null);
        setReconnectAttempts(0);
        setMessages([]);
        setTypingUsers(new Set());
        setProcessedMessageIds(new Set());
      }
      
      // Short delay before connecting to ensure clean transition
      const connectionTimer = setTimeout(() => {
        connect();
      }, roomChanged ? 50 : 0);
      
      return () => {
        clearTimeout(connectionTimer);
      };
    }

    // Cleanup function for when component unmounts or roomId/token changes
    return () => {
      // This cleanup runs when the component using the hook unmounts
      // or when roomId/token changes
      console.log(`Cleaning up WebSocket resources for room: ${roomId}`);
      
      // Close the WebSocket connection
      if (ws.current) {
        ws.current.onclose = null; // Prevent reconnection attempts
        ws.current.close(1000, 'Component unmounting or room changing');
        ws.current = null;
      }
      
      // Clear all intervals and timeouts
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
        pingInterval.current = null;
      }
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
        reconnectTimeout.current = null;
      }
      if (typingTimeout.current) {
        clearTimeout(typingTimeout.current);
        typingTimeout.current = null;
      }
    };
  }, [roomId, user?.token, connect]); // Added connect back to dependencies

  // No need for a separate reset effect, as we handle this in the main useEffect now

  const sendMessage = useCallback((messageData) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      // Build payload - retain message_id if it exists (from REST API)
      const payload = {
        type: 'message',
        room_id: roomId,
        sender_id: user?.id,
        content: messageData.content,
        is_group: messageData.is_group || false,
        attachment_url: messageData.attachment_url || '',
        attachment_type: messageData.attachment_type || ''
      };
      
      // If the message already has an ID (from REST API), include it
      if (messageData.message_id) {
        payload.message_id = messageData.message_id;
        payload.timestamp = messageData.timestamp || (Date.now() / 1000);
      }
      
      console.log('Sending message via WebSocket:', payload);
      ws.current.send(JSON.stringify(payload));
      
      // If we have a message ID, add to processed list to prevent duplication
      if (messageData.message_id) {
        setProcessedMessageIds(prev => new Set(prev).add(messageData.message_id));
      }
    } else {
      console.error('WebSocket is not connected');
      throw new Error('WebSocket is not connected');
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
