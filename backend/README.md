# Go React Chat Backend API

A real-time chat application backend built with Go, Gin, MongoDB, PostgreSQL, Redis, and WebSockets.

## 🚀 Getting Started

### Prerequisites
- Go 1.21+
- PostgreSQL
- MongoDB
- Redis

### Environment Setup
Create a `.env` file in the backend directory:
```env
PORT=8080
POSTGRES_URL=postgres://username:password@localhost/dbname?sslmode=disable
MONGODB_URI=mongodb://localhost:27017/chatdb
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_key
```

### Running the Server
```bash
cd backend
go mod tidy
go run main.go
```

Server will start on `http://localhost:8080`

## 📡 API Endpoints

### 🔐 Authentication

#### Register User
```http
POST /register
Content-Type: application/json

{
    "username": "john_doe",
    "email": "john@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "message": "User registered"
}
```

#### Login User
```http
POST /login
Content-Type: application/json

{
    "email": "john@example.com",
    "password": "securepassword123"
}
```

**Response:**
```json
{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 💬 Messages

#### Send Message
```http
POST /message
Content-Type: application/json

{
    "room_id": "room_123",
    "sender_id": 1,
    "message": "Hello, World!",
    "is_group": false,
    "status": "sent",
    "attachment_url": "https://example.com/image.jpg",
    "attachment_type": "image"
}
```

**Response:**
```json
{
    "status": "Message stored",
    "message_id": "507f1f77bcf86cd799439011",
    "timestamp": 1642771200,
    "room_id": "room_123",
    "sender_id": 1
}
```

#### Get Chat History
```http
GET /messages?room_id=room_123
```

**Response:**
```json
{
    "messages": [
        {
            "id": "507f1f77bcf86cd799439011",
            "room_id": "room_123",
            "sender_id": 1,
            "message": "Hello, World!",
            "timestamp": 1642771200,
            "is_group": false,
            "status": "sent",
            "attachment_url": "",
            "attachment_type": "",
            "reply_to_id": null,
            "forwarded_from_id": null,
            "deleted": false,
            "reactions": {
                "👍": ["user1", "user2"],
                "❤️": ["user3"]
            }
        }
    ],
    "total_count": 1,
    "room_id": "room_123"
}
```

### 👍 Message Reactions

#### Add Reaction
```http
POST /message/reaction/add
Content-Type: application/json

{
    "message_id": "507f1f77bcf86cd799439011",
    "emoji": "👍",
    "user_id": "1"
}
```

**Response:**
```json
{
    "status": "Reaction added"
}
```

#### Remove Reaction
```http
POST /message/reaction/remove
Content-Type: application/json

{
    "message_id": "507f1f77bcf86cd799439011",
    "emoji": "👍",
    "user_id": "1"
}
```

**Response:**
```json
{
    "status": "Reaction removed"
}
```

### 🗑️ Message Management

#### Delete Message
```http
POST /message/delete
Content-Type: application/json

{
    "message_id": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
    "status": "Message deleted"
}
```

### 👥 User Presence

#### Get Online Users
```http
GET /online-users
```

**Response:**
```json
{
    "online_users": ["user1", "user2", "user3"]
}
```

#### Get User Status
```http
GET /user-status
```

**Response:**
```json
{
    "status": "online",
    "last_seen": "2025-01-21T14:30:00Z"
}
```

### 🔧 Debug Endpoints

#### Get All Messages (Debug)
```http
GET /debug/messages
```

**Response:**
```json
{
    "total_messages": 10,
    "messages": [...]
}
```

#### Health Check
```http
GET /ping
```

**Response:**
```json
{
    "messege": "pong"
}
```

## 🔌 WebSocket Connection

### Connection URL
```
ws://localhost:8080/ws?room=ROOM_ID&token=JWT_TOKEN
```

### Parameters
- `room`: The room ID to join
- `token`: JWT token obtained from login

### Example Connection (JavaScript)
```javascript
const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
const roomId = "room_123";
const ws = new WebSocket(`ws://localhost:8080/ws?room=${roomId}&token=${token}`);

ws.onopen = function() {
    console.log('Connected to WebSocket');
};

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Received:', data);
};

ws.onerror = function(error) {
    console.log('WebSocket Error:', error);
};

ws.onclose = function() {
    console.log('WebSocket connection closed');
};
```

## 📨 WebSocket Message Types

### 1. Send Message
```javascript
const messagePayload = {
    type: "message",
    room_id: "room_123",
    sender_id: 1,
    content: "Hello via WebSocket!",
    is_group: false,
    attachment_url: "",
    attachment_type: ""
};

ws.send(JSON.stringify(messagePayload));
```

### 2. Typing Indicator
```javascript
const typingPayload = {
    type: "typing",
    room_id: "room_123",
    user_id: 1,
    username: "john_doe",
    is_typing: true
};

ws.send(JSON.stringify(typingPayload));
```

### 3. Reaction
```javascript
const reactionPayload = {
    type: "reaction",
    message_id: "507f1f77bcf86cd799439011",
    room_id: "room_123",
    user_id: 1,
    emoji: "👍",
    action: "add" // or "remove"
};

ws.send(JSON.stringify(reactionPayload));
```

## 📥 WebSocket Received Messages

### Message Received
```json
{
    "type": "message",
    "message_id": "507f1f77bcf86cd799439011",
    "room_id": "room_123",
    "sender_id": 1,
    "content": "Hello!",
    "timestamp": 1642771200,
    "is_group": false,
    "attachment_url": "",
    "attachment_type": ""
}
```

### Typing Indicator
```json
{
    "type": "typing",
    "room_id": "room_123",
    "user_id": 1,
    "username": "john_doe",
    "is_typing": true
}
```

### Reaction Update
```json
{
    "type": "reaction",
    "message_id": "507f1f77bcf86cd799439011",
    "user_id": 1,
    "emoji": "👍",
    "action": "add"
}
```

### Error Message
```json
{
    "type": "error",
    "error": "Failed to store message"
}
```

## 🏗️ Data Models

### Message Model
```json
{
    "id": "MongoDB ObjectID",
    "room_id": "string",
    "sender_id": "integer",
    "message": "string",
    "timestamp": "unix timestamp",
    "is_group": "boolean",
    "status": "sent|delivered|read",
    "attachment_url": "string (optional)",
    "attachment_type": "string (optional)",
    "reply_to_id": "MongoDB ObjectID (optional)",
    "forwarded_from_id": "string (optional)",
    "deleted": "boolean",
    "reactions": {
        "emoji": ["user1", "user2"]
    }
}
```

### User Model
```json
{
    "id": "integer",
    "username": "string",
    "email": "string",
    "password": "hashed string",
    "created_at": "timestamp"
}
```

## 🔒 Authentication

Most endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Note:** Currently, middleware is implemented but not actively used on all routes. This will be added in future updates.

## 🗄️ Database Architecture

### PostgreSQL (User Data)
- **users** - User accounts and authentication

### MongoDB (Chat Data)
- **messages** - All chat messages and metadata

### Redis (Cache/Presence)
- User online status
- Session management
- Caching frequently accessed data

## 🚨 Error Responses

### Validation Errors
```json
{
    "error": "room_id is required"
}
```

### Authentication Errors
```json
{
    "error": "Invalid token"
}
```

### Server Errors
```json
{
    "error": "Failed to store message"
}
```

## 🔧 Development Notes

### Message Flow
1. **REST API**: Messages sent via POST `/message` are stored in MongoDB and broadcast via WebSocket
2. **WebSocket**: Messages sent via WebSocket are stored in MongoDB and broadcast to connected clients
3. **Unified**: Both methods result in the same outcome (storage + real-time delivery)

### Room Management
- Rooms are created dynamically when first message is sent
- Room IDs are strings and case-sensitive
- Users join rooms automatically via WebSocket connection

### Presence System
- Users are marked online when WebSocket connects
- Users are marked offline when WebSocket disconnects
- Presence is stored in Redis for fast access

## 🔮 Future Features

- [ ] Group chat management (create/join/leave groups)
- [ ] Contact/friend system
- [ ] Message status tracking (delivered/read)
- [ ] File upload support
- [ ] Push notifications
- [ ] Message search
- [ ] User blocking
- [ ] End-to-end encryption

## 📱 Frontend Integration Examples

### React Hook for WebSocket
```javascript
import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (roomId, token) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        ws.current = new WebSocket(`ws://localhost:8080/ws?room=${roomId}&token=${token}`);
        
        ws.current.onopen = () => setIsConnected(true);
        ws.current.onclose = () => setIsConnected(false);
        
        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'message') {
                setMessages(prev => [...prev, data]);
            }
        };

        return () => ws.current.close();
    }, [roomId, token]);

    const sendMessage = (content) => {
        if (ws.current && isConnected) {
            ws.current.send(JSON.stringify({
                type: 'message',
                room_id: roomId,
                sender_id: 1, // Get from auth context
                content: content,
                is_group: false
            }));
        }
    };

    return { messages, isConnected, sendMessage };
};
```

### API Service Class
```javascript
class ChatAPI {
    constructor(baseURL = 'http://localhost:8080') {
        this.baseURL = baseURL;
        this.token = localStorage.getItem('token');
    }

    async login(email, password) {
        const response = await fetch(`${this.baseURL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (data.token) {
            this.token = data.token;
            localStorage.setItem('token', data.token);
        }
        return data;
    }

    async sendMessage(roomId, senderId, message) {
        return fetch(`${this.baseURL}/message`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.token}`
            },
            body: JSON.stringify({
                room_id: roomId,
                sender_id: senderId,
                message: message,
                is_group: false,
                status: 'sent'
            })
        }).then(res => res.json());
    }

    async getChatHistory(roomId) {
        return fetch(`${this.baseURL}/messages?room_id=${roomId}`, {
            headers: { 'Authorization': `Bearer ${this.token}` }
        }).then(res => res.json());
    }
}
```

---

**Last Updated:** July 21, 2025  
**Version:** 1.0.0  
**Author:** Kalpesh Vala
