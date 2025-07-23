#!/bin/bash

# Real-Time Message Deletion Test Script
# This script demonstrates the message deletion feature

echo "🧪 Real-Time Message Deletion Test"
echo "=================================="
echo ""

echo "Prerequisites:"
echo "1. Backend server running on http://localhost:8080"
echo "2. Frontend running on http://localhost:3000"
echo "3. Two browser windows open with different users logged in"
echo ""

echo "Test Steps:"
echo ""

echo "Step 1: Setup Chat Room"
echo "- Open browser window 1: Login as User A"
echo "- Open browser window 2: Login as User B"
echo "- Navigate both to the same chat room (e.g., /chat/test-room)"
echo ""

echo "Step 2: Send Test Messages"
echo "- User A: Send message 'Hello from User A!'"
echo "- User B: Send message 'Hello from User B!'"
echo "- User A: Send message 'This message will be deleted'"
echo ""

echo "Step 3: Test Real-Time Deletion"
echo "- User A: Click the three-dot menu on 'This message will be deleted'"
echo "- User A: Click 'Delete' option"
echo ""

echo "Expected Results:"
echo "✅ User A should see: '🗑️ You deleted this message' (blue text)"
echo "✅ User B should see: '🗑️ This message was deleted' (gray text)"
echo "✅ Both users see the change INSTANTLY without refresh"
echo "✅ Deleted message shows trash icon"
echo "✅ Message options (reply, reactions) are hidden for deleted messages"
echo ""

echo "API Calls Made:"
echo "1. POST /message/delete with message_id and room_id"
echo "2. WebSocket broadcast to all room participants"
echo ""

echo "WebSocket Event Structure:"
echo '{'
echo '  "type": "deletion",'
echo '  "message_id": "507f1f77bcf86cd799439011",'
echo '  "room_id": "test-room",'
echo '  "sender_id": 1'
echo '}'
echo ""

echo "Database Changes:"
echo "- Message record updated: deleted: true"
echo "- Original message content preserved"
echo "- Timestamp and other metadata unchanged"
echo ""

echo "🎯 Key Testing Points:"
echo "1. Instant propagation (no refresh needed)"
echo "2. Different text for sender vs receiver"  
echo "3. Visual consistency with trash icon"
echo "4. WebSocket connection resilience"
echo "5. Proper error handling if deletion fails"
echo ""

echo "🐛 Troubleshooting:"
echo "- If deletion doesn't appear instantly, check WebSocket console logs"
echo "- Verify backend /message/delete endpoint is accessible"
echo "- Ensure both users are in the same room"
echo "- Check network tab for API call success"
echo ""

echo "Test completed! Check the results in your browser windows."
