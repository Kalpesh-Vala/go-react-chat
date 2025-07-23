package controllers

import (
	"context"
	"encoding/json"
	ws "go-react-chat/kalpesh-vala/github.com/internal/websocket"
	"go-react-chat/kalpesh-vala/github.com/models"
	"go-react-chat/kalpesh-vala/github.com/services"
	"net/http"
	"strconv"

	"go.mongodb.org/mongo-driver/bson/primitive"

	"github.com/gin-gonic/gin"
)

// Global hub instance - you'll need to pass this from main or use dependency injection
var globalHub *ws.Hub

// SetGlobalHub sets the global hub instance
func SetGlobalHub(hub *ws.Hub) {
	globalHub = hub
}

// SendMessage handles sending a new message
func SendMessage(c *gin.Context) {
	var msg models.Message
	if err := c.ShouldBindJSON(&msg); err != nil {
		println("JSON binding error:", err.Error())
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Add debugging to see what was received
	println("Received message via REST API:")
	println("  RoomID:", msg.RoomID)
	println("  SenderID:", msg.SenderID)
	println("  Message:", msg.Message)
	println("  IsGroup:", msg.IsGroup)
	println("  Status:", msg.Status)

	// Validate required fields
	if msg.RoomID == "" {
		println("ERROR: RoomID is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "room_id is required"})
		return
	}
	if msg.SenderID == 0 {
		println("ERROR: SenderID is zero")
		c.JSON(http.StatusBadRequest, gin.H{"error": "sender_id is required and must be greater than 0"})
		return
	}
	// Allow empty message if there's an attachment
	if msg.Message == "" && msg.AttachmentURL == "" {
		println("ERROR: Both message and attachment are empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "either message content or attachment is required"})
		return
	}

	// Set default values
	if msg.Status == "" {
		msg.Status = "sent"
	}
	msg.Deleted = false

	// Store message in database
	if err := services.InsertMessage(context.Background(), &msg); err != nil {
		println("Database insert error:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to store message"})
		return
	}

	println("Message stored successfully with ID:", msg.ID.Hex())

	// Broadcast message to WebSocket clients if hub is available
	if globalHub != nil {
		payload := ws.MessagePayload{
			Type:           "message",
			MessageID:      msg.ID.Hex(),
			RoomID:         msg.RoomID,
			SenderID:       msg.SenderID,
			Content:        msg.Message,
			Timestamp:      msg.Timestamp,
			IsGroup:        msg.IsGroup,
			AttachmentURL:  msg.AttachmentURL,
			AttachmentType: msg.AttachmentType,
		}

		// Convert to JSON for broadcasting
		if payloadBytes, err := json.Marshal(payload); err == nil {
			broadcastPayload := ws.MessagePayload{
				RoomID:  msg.RoomID,
				Message: payloadBytes,
			}
			globalHub.Broadcast <- broadcastPayload
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"status":     "Message stored",
		"message_id": msg.ID.Hex(),
		"timestamp":  msg.Timestamp,
		"room_id":    msg.RoomID,
		"sender_id":  msg.SenderID,
	})
}

// GetChatHistory returns all messages for a room
func GetChatHistory(c *gin.Context) {
	roomID := c.Query("room_id")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing room_id"})
		return
	}

	// Add debugging
	println("Fetching messages for room_id:", roomID)

	messages, err := services.GetMessagesByRoomID(context.Background(), roomID)
	if err != nil {
		println("Error fetching messages:", err.Error())
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	println("Found", len(messages), "messages for room:", roomID)
	c.JSON(http.StatusOK, gin.H{
		"messages":    messages,
		"total_count": len(messages),
		"room_id":     roomID,
	})
}

// AddReactionHandler handles adding a reaction to a message
func AddReactionHandler(c *gin.Context) {
	var req struct {
		MessageID string `json:"message_id"`
		Emoji     string `json:"emoji"`
		UserID    string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	msgID, err := primitive.ObjectIDFromHex(req.MessageID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid message ID"})
		return
	}

	// Get the message first to extract room information for broadcasting
	message, err := services.GetMessageByID(c, msgID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Message not found"})
		return
	}

	if err := services.AddReaction(c, msgID, req.Emoji, req.UserID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to add reaction"})
		return
	}

	// Broadcast reaction update via WebSocket if hub is available
	if globalHub != nil {
		userID, _ := strconv.Atoi(req.UserID) // Convert string to int
		reactionEvent := map[string]interface{}{
			"type":       "reaction",
			"message_id": req.MessageID,
			"room_id":    message.RoomID,
			"user_id":    userID,
			"emoji":      req.Emoji,
			"action":     "add",
		}

		if reactionBytes, err := json.Marshal(reactionEvent); err == nil {
			broadcastPayload := ws.MessagePayload{
				RoomID:  message.RoomID,
				Message: reactionBytes,
			}
			globalHub.Broadcast <- broadcastPayload
		}
	}

	c.JSON(200, gin.H{"status": "Reaction added"})
}

// RemoveReactionHandler handles removing a reaction from a message
func RemoveReactionHandler(c *gin.Context) {
	var req struct {
		MessageID string `json:"message_id"`
		Emoji     string `json:"emoji"`
		UserID    string `json:"user_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	msgID, err := primitive.ObjectIDFromHex(req.MessageID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid message ID"})
		return
	}

	// Get the message first to extract room information for broadcasting
	message, err := services.GetMessageByID(c, msgID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Message not found"})
		return
	}

	if err := services.RemoveReaction(c, msgID, req.Emoji, req.UserID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to remove reaction"})
		return
	}

	// Broadcast reaction removal via WebSocket if hub is available
	if globalHub != nil {
		userID, _ := strconv.Atoi(req.UserID) // Convert string to int
		reactionEvent := map[string]interface{}{
			"type":       "reaction",
			"message_id": req.MessageID,
			"room_id":    message.RoomID,
			"user_id":    userID,
			"emoji":      req.Emoji,
			"action":     "remove",
		}

		if reactionBytes, err := json.Marshal(reactionEvent); err == nil {
			broadcastPayload := ws.MessagePayload{
				RoomID:  message.RoomID,
				Message: reactionBytes,
			}
			globalHub.Broadcast <- broadcastPayload
		}
	}

	c.JSON(200, gin.H{"status": "Reaction removed"})
}

// DeleteMessageHandler handles marking a message as deleted
func DeleteMessageHandler(c *gin.Context) {
	var req struct {
		MessageID string `json:"message_id"`
		RoomID    string `json:"room_id,omitempty"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	msgID, err := primitive.ObjectIDFromHex(req.MessageID)
	if err != nil {
		c.JSON(400, gin.H{"error": "Invalid message ID"})
		return
	}

	// Get the message first to extract room information
	message, err := services.GetMessageByID(c, msgID)
	if err != nil {
		c.JSON(404, gin.H{"error": "Message not found"})
		return
	}

	if err := services.DeleteMessage(c, msgID); err != nil {
		c.JSON(500, gin.H{"error": "Failed to delete message"})
		return
	}

	// Broadcast deletion event via WebSocket if hub is available
	if globalHub != nil {
		deletionEvent := map[string]interface{}{
			"type":       "deletion",
			"message_id": req.MessageID,
			"room_id":    message.RoomID,
			"sender_id":  message.SenderID,
		}

		if deletionBytes, err := json.Marshal(deletionEvent); err == nil {
			broadcastPayload := ws.MessagePayload{
				RoomID:  message.RoomID,
				Message: deletionBytes,
			}
			globalHub.Broadcast <- broadcastPayload
		}
	}

	c.JSON(200, gin.H{
		"status":     "Message deleted",
		"message_id": req.MessageID,
		"room_id":    message.RoomID,
	})
}

// GetAllMessages - Debug function to see all messages in database
func GetAllMessages(c *gin.Context) {
	messages, err := services.GetAllMessages(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch messages"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_messages": len(messages),
		"messages":       messages,
	})
}
