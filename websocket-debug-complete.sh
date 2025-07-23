#!/bin/bash

# Comprehensive WebSocket Debugging Test

echo "🔧 WEBSOCKET DEBUGGING - Step by Step Guide"
echo "==========================================="

echo ""
echo "🎯 Goal: Fix real-time updates (reactions, messages, deletions)"
echo "📝 Problem: Changes only appear after page refresh"

echo ""
echo "PHASE 1: Backend Verification"
echo "============================"

echo ""
echo "Step 1.1: Start Backend Server"
echo "------------------------------"
echo "Run: cd backend && go run main.go"
echo "✅ Expected: Server starts on port 8080"
echo "✅ Look for: 'WebSocket hub initialized'"
echo "❌ Errors: Port already in use, database connection failed"

echo ""
echo "Step 1.2: Test REST API Endpoints"
echo "---------------------------------"
echo "Test message endpoint:"
echo 'curl -X POST http://localhost:8080/message -H "Content-Type: application/json" -d '"'"'{"room_id":"test_room","sender_id":1,"message":"test","is_group":false}'"'"''

echo ""
echo "Test reaction endpoint:"
echo 'curl -X POST http://localhost:8080/message/reaction/add -H "Content-Type: application/json" -d '"'"'{"message_id":"REPLACE_WITH_REAL_ID","emoji":"👍","user_id":"1"}'"'"''

echo ""
echo "✅ Expected: Both return 200 status"
echo "❌ If failing: Fix API endpoints first"

echo ""
echo "PHASE 2: WebSocket Connection Test"
echo "================================="

echo ""
echo "Step 2.1: Test WebSocket Endpoint"
echo "---------------------------------"
echo "Use a WebSocket testing tool or browser console:"
echo 'const ws = new WebSocket("ws://localhost:8080/ws?room=test_room&token=YOUR_JWT_TOKEN");'
echo 'ws.onopen = () => console.log("Connected");'
echo 'ws.onmessage = (e) => console.log("Message:", e.data);'
echo 'ws.onerror = (e) => console.log("Error:", e);'

echo ""
echo "✅ Expected: Connection successful"
echo "❌ If failing: Check JWT token, room parameter"

echo ""
echo "PHASE 3: Frontend Verification"
echo "=============================="

echo ""
echo "Step 3.1: Check Browser Console"
echo "-------------------------------"
echo "Open DevTools and look for these messages:"

echo ""
echo "✅ GOOD SIGNS:"
echo "• 'WebSocket connected to room: [room_id]'"
echo "• 'WebSocket message received: {...}'"
echo "• 'ChatContainer - WebSocket connected: true'"
echo "• 'Processing WebSocket reaction event: {...}'"

echo ""
echo "❌ BAD SIGNS:"
echo "• 'WebSocket connection skipped'"
echo "• 'WebSocket is not connected'"
echo "• 'Connection error occurred'"
echo "• 'Error handling reaction:'"

echo ""
echo "Step 3.2: Debug State Updates"
echo "----------------------------"
echo "Add these console commands in browser:"

echo ""
echo "Check WebSocket status:"
echo "console.log('WS Status:', {isConnected, connectionError, realtimeMessages: realtimeMessages.length});"

echo ""
echo "Check message sync:"
echo "console.log('Messages:', {chatHistory: chatHistory.length, realtimeMessages: realtimeMessages.length, allMessages: allMessages.length});"

echo ""
echo "Watch for reaction updates:"
echo "// This should log when reactions change"
echo "console.log('Current message reactions:', allMessages.map(m => ({id: m.id, reactions: m.reactions})));"

echo ""
echo "PHASE 4: Real-time Update Test"
echo "=============================="

echo ""
echo "Step 4.1: Two-Browser Test Setup"
echo "--------------------------------"
echo "1. Open two different browsers (Chrome + Firefox)"
echo "2. Login as different users in each"
echo "3. Join the same chat room"
echo "4. Open browser console in both"

echo ""
echo "Step 4.2: Message Test"
echo "---------------------"
echo "Browser A: Send message 'Test message'"
echo "Browser B: Should see message appear immediately"
echo ""
echo "✅ Working: Message appears without refresh"
echo "❌ Not working: Must refresh to see message"

echo ""
echo "Step 4.3: Reaction Test"
echo "----------------------"
echo "Browser A: Add 👍 reaction to message"
echo "Browser B: Should see reaction appear immediately"
echo ""
echo "✅ Working: Reaction appears without refresh"
echo "❌ Not working: Must refresh to see reaction"

echo ""
echo "PHASE 5: Advanced Debugging"
echo "=========================="

echo ""
echo "Step 5.1: Backend Logs"
echo "----------------------"
echo "In backend console, you should see:"
echo "• WebSocket connections: 'WebSocket connected to room: [room]'"
echo "• Message broadcasts: 'Broadcasting to room [room]'"
echo "• Reaction events: 'Reaction added/removed for message [id]'"

echo ""
echo "Step 5.2: Network Traffic"
echo "------------------------"
echo "In browser DevTools > Network > WS:"
echo "• Should see WebSocket connection established"
echo "• Should see messages flowing both directions"
echo "• Message format should match expected structure"

echo ""
echo "Step 5.3: Database Verification"
echo "-------------------------------"
echo "Check if data is persisted:"
echo 'curl -X GET "http://localhost:8080/messages?room_id=test_room"'
echo ""
echo "✅ Expected: Messages and reactions saved"
echo "❌ If empty: Database connection issue"

echo ""
echo "PHASE 6: Common Fixes"
echo "===================="

echo ""
echo "Fix 1: WebSocket Not Connecting"
echo "-------------------------------"
echo "• Check if user is authenticated (valid JWT)"
echo "• Verify room ID is not empty"
echo "• Ensure backend WebSocket handler is registered"
echo "• Check CORS configuration"

echo ""
echo "Fix 2: Messages Not Real-time"
echo "----------------------------"
echo "• Verify hub.Broadcast is called in backend"
echo "• Check WebSocket hub is running (go hub.Run())"
echo "• Ensure frontend processes 'message' events"
echo "• Verify message deduplication logic"

echo ""
echo "Fix 3: Reactions Not Real-time"
echo "-----------------------------"
echo "• Check reaction API calls WebSocket broadcast"
echo "• Verify frontend processes 'reaction' events"
echo "• Ensure reaction state sync in ChatContainer"
echo "• Check message ID matching logic"

echo ""
echo "Fix 4: State Not Updating"
echo "------------------------"
echo "• Verify setChatHistory is called"
echo "• Check useEffect dependencies"
echo "• Ensure message objects have consistent IDs"
echo "• Verify React state immutability"

echo ""
echo "🎯 SUCCESS CRITERIA:"
echo "==================="
echo "✅ WebSocket connects without errors"
echo "✅ Messages appear instantly across browsers"
echo "✅ Reactions appear instantly across browsers"
echo "✅ No console errors"
echo "✅ Network tab shows active WebSocket traffic"
echo "✅ Data persists after page refresh"

echo ""
echo "📞 If Still Not Working:"
echo "======================="
echo "1. Share console logs from both frontend and backend"
echo "2. Check WebSocket traffic in Network tab"
echo "3. Verify JWT token is valid and not expired"
echo "4. Test with simplified room/user setup"
echo "5. Check if firewall/proxy is blocking WebSocket"

echo ""
echo "Ready to debug! Run through each phase step by step. 🚀"
