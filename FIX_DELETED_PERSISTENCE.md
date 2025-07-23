# Fix: Deleted Messages Persistence After Page Refresh

## Problem
When users refresh the page, deleted messages disappear completely instead of showing as deleted placeholders. This creates inconsistency between real-time behavior and post-refresh behavior.

## Root Cause
The backend was filtering out deleted messages in the `GetMessagesByRoomID` function with this filter:
```go
filter := bson.M{
    "room_id": roomID,
    "deleted": bson.M{"$ne": true}, // This excluded deleted messages
}
```

## Solution Applied

### 1. Backend Fix - Include Deleted Messages in API Response

**File:** `backend/services/message_service.go`

**Before:**
```go
// Filter: get messages for room_id that are not deleted, sorted by timestamp
filter := bson.M{
    "room_id": roomID,
    "deleted": bson.M{"$ne": true}, // Exclude deleted messages
}
```

**After:**
```go
// Filter: get all messages for room_id, including deleted ones
filter := bson.M{
    "room_id": roomID,
}
```

### 2. Frontend Fix - Preserve Deleted Property in Message Mapping

**File:** `frontend/src/components/chat/ChatContainer.jsx`

**Enhancement:** Explicitly preserve the `deleted` property during message mapping:

```javascript
const historyMessages = chatHistory.map(msg => ({
    ...msg,
    id: msg.id || msg.message_id,
    content: msg.message || msg.content,
    sender_id: msg.sender_id,
    timestamp: msg.timestamp,
    deleted: msg.deleted || false, // Ensure deleted property is preserved
    isOwn: msg.sender_id === user?.id
}));
```

### 3. Added Debug Logging

Added console logging to help verify the fix:
- Logs count of deleted messages in API response
- Logs count of deleted messages being rendered
- Helps track message flow during development

## Expected Behavior After Fix

### Before Refresh (Real-time):
1. User A deletes a message
2. Both User A and User B see: 🗑️ "You/This message was deleted"

### After Refresh (Fixed):
1. User refreshes page
2. Messages are fetched from backend API
3. Deleted messages are included in response with `deleted: true`
4. Frontend renders deleted messages with placeholder text and trash icon
5. Both users continue to see: 🗑️ "You/This message was deleted"

## Testing the Fix

Run the test script:
```bash
./test-deleted-persistence.sh
```

### Test Steps:
1. Send several messages between two users
2. Delete one message (verify real-time deletion works)
3. Refresh both browser windows
4. Verify deleted message still shows as placeholder with trash icon

### Success Criteria:
✅ Deleted messages persist after page refresh  
✅ Show proper placeholder text with trash icon  
✅ Different text for sender ("You deleted") vs receiver ("This message was deleted")  
✅ Same behavior in both browser windows  
✅ No JavaScript errors in console  

## Technical Flow

```
Page Refresh → API Call (/messages?room_id=X) → Backend Returns ALL Messages → Frontend Maps Messages → MessageBubble Renders → Deleted Messages Show as Placeholders
```

### API Response Now Includes:
```json
{
  "messages": [
    {
      "id": "...",
      "message": "Regular message",
      "deleted": false,
      "sender_id": 1,
      ...
    },
    {
      "id": "...", 
      "message": "Original deleted content",
      "deleted": true,  // ← This is now included
      "sender_id": 1,
      ...
    }
  ]
}
```

### Frontend Rendering:
- `deleted: false` → Shows actual message content
- `deleted: true` → Shows 🗑️ "You/This message was deleted"

## Files Modified

1. **backend/services/message_service.go**
   - Removed deleted message filtering from database query

2. **frontend/src/components/chat/ChatContainer.jsx**
   - Added explicit `deleted` property preservation in message mapping
   - Added debug logging for verification

3. **test-deleted-persistence.sh**
   - Created test script for manual verification

## Benefits

1. **Consistency**: Real-time and post-refresh behavior now match
2. **User Experience**: Users see consistent message deletion state
3. **Data Integrity**: Deleted messages remain in database for audit/recovery
4. **Debugging**: Added logging helps verify functionality

## Verification

After applying this fix:
1. Real-time deletion still works as before
2. Page refresh now preserves deleted message placeholders
3. Both sender and receiver see consistent deleted message state
4. No additional database queries or performance impact
