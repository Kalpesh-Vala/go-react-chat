import React, { forwardRef, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';

const MessageList = forwardRef(({ messages, currentUserId, onReaction, onDelete }, ref) => {
  const scrollContainerRef = useRef(null);
  const lastMessageRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Expose scroll methods via ref
  React.useImperativeHandle(ref, () => ({
    scrollToBottom: () => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    },
    scrollToTop: () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }));

  if (!messages || messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">💬</div>
          <p className="text-gray-500 text-sm">
            No messages yet. Start the conversation!
          </p>
        </div>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const messageDate = new Date(message.timestamp * 1000);
    const dateKey = messageDate.toDateString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {});

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div 
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
    >
      {Object.entries(groupedMessages).map(([dateKey, dayMessages], groupIndex) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex justify-center my-4">
            <div className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 shadow-sm border">
              {formatDateHeader(dateKey)}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-2">
            {dayMessages.map((message, index) => {
              const isLast = groupIndex === Object.keys(groupedMessages).length - 1 && 
                           index === dayMessages.length - 1;
              
              return (
                <div
                  key={message.id || `${message.timestamp}-${index}`}
                  ref={isLast ? lastMessageRef : null}
                >
                  <MessageBubble
                    message={message}
                    isOwn={message.sender_id?.toString() === currentUserId}
                    currentUserId={currentUserId}
                    onReaction={onReaction}
                    onDelete={onDelete}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
});

MessageList.displayName = 'MessageList';

export default MessageList;
