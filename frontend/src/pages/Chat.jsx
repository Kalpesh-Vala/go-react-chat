import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatContainer from '../components/chat/ChatContainer';

const Chat = () => {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState(urlRoomId || null);
  const [showSidebar, setShowSidebar] = useState(true);

  // Debug: Log user and room data
  console.log('Chat component - User:', user);
  console.log('Chat component - URL Room ID:', urlRoomId);
  console.log('Chat component - Selected Room:', selectedRoom);

  // Update selected room when URL changes
  useEffect(() => {
    if (urlRoomId && urlRoomId !== selectedRoom) {
      setSelectedRoom(urlRoomId);
    }
  }, [urlRoomId, selectedRoom]);

  // Update URL when room selection changes
  useEffect(() => {
    if (selectedRoom && selectedRoom !== urlRoomId) {
      navigate(`/chat/${selectedRoom}`, { replace: true });
    }
  }, [selectedRoom, urlRoomId, navigate]);

  const handleRoomSelect = (roomId) => {
    setSelectedRoom(roomId);
    // Hide sidebar on mobile when a chat is selected
    if (window.innerWidth < 1024) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setShowSidebar(true);
    // On mobile, don't clear the selected room, just show the sidebar
    if (window.innerWidth >= 1024) {
      setSelectedRoom(null);
      navigate('/chat', { replace: true });
    }
  };

  const handleCreateRoom = () => {
    // For now, just trigger search mode in sidebar
    console.log('Create new room - this will trigger search in sidebar');
  };

  // Handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setShowSidebar(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Debug Info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-0 left-0 bg-red-100 p-2 text-xs z-50">
          User: {user?.username || 'None'} | Room: {selectedRoom || 'None'}
        </div>
      )}
      
      {/* Sidebar */}
      <div className={`${
        showSidebar ? 'block' : 'hidden'
      } w-full lg:w-80 lg:block bg-white border-r border-gray-200`}>
        <ChatSidebar
          selectedRoom={selectedRoom}
          onRoomSelect={handleRoomSelect}
          onCreateRoom={handleCreateRoom}
          className="h-full"
        />
      </div>

      {/* Main Chat Area */}
      <div className={`${
        showSidebar ? 'hidden' : 'block'
      } flex-1 lg:block`}>
        <ChatContainer
          selectedRoom={selectedRoom}
          onBackToList={handleBackToList}
        />
      </div>
    </div>
  );
};

export default Chat;
