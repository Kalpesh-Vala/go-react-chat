package websocket

import (
	"encoding/json"
	"time"

	"go-react-chat/kalpesh-vala/github.com/models"

	"github.com/gorilla/websocket"
)

type Client struct {
	RoomID   string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub
	UserID   string
	Username string
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister <- c
		c.Conn.Close()
	}()
	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}
		var payload MessagePayload
		if err := json.Unmarshal(message, &payload); err != nil {
			continue
		}

		// Handle different message types
		switch payload.Type {
		case "ping":
			// Respond to ping with pong
			pongResponse := map[string]interface{}{
				"type": "pong",
			}
			if pongBytes, err := json.Marshal(pongResponse); err == nil {
				c.Send <- pongBytes
			}
			continue

		case "typing":
			// Broadcast typing indicator without storing
			if broadcastBytes, err := json.Marshal(payload); err == nil {
				broadcastPayload := MessagePayload{
					RoomID:  payload.RoomID,
					Message: broadcastBytes,
				}
				c.Hub.Broadcast <- broadcastPayload
			}
			continue

		case "reaction":
			// Handle reaction updates - broadcast without storing here
			if broadcastBytes, err := json.Marshal(payload); err == nil {
				broadcastPayload := MessagePayload{
					RoomID:  payload.RoomID,
					Message: broadcastBytes,
				}
				c.Hub.Broadcast <- broadcastPayload
			}
			continue

		case "deletion":
			// Handle message deletion - broadcast the deletion event
			if broadcastBytes, err := json.Marshal(payload); err == nil {
				broadcastPayload := MessagePayload{
					RoomID:  payload.RoomID,
					Message: broadcastBytes,
				}
				c.Hub.Broadcast <- broadcastPayload
			}
			continue

		case "message":
			// Handle actual chat messages
			// Check if message has an ID already (might be a forwarded message from REST API)
			if payload.MessageID != "" {
				// This message already has an ID, so it's already been saved to the database
				// Just broadcast it without saving again
				println("Received message with existing ID:", payload.MessageID, "- skipping database save")

				// Just broadcast the existing message
				if broadcastBytes, err := json.Marshal(payload); err == nil {
					broadcastPayload := MessagePayload{
						RoomID:  payload.RoomID,
						Message: broadcastBytes,
					}
					c.Hub.Broadcast <- broadcastPayload
				}
				continue
			}

			// This is a new message without an ID, so store it in database
			msg := models.Message{
				RoomID:         payload.RoomID,
				SenderID:       payload.SenderID,
				Message:        payload.Content,
				Timestamp:      time.Now().Unix(),
				IsGroup:        payload.IsGroup,
				Status:         "sent",
				AttachmentURL:  payload.AttachmentURL,
				AttachmentType: payload.AttachmentType,
				Deleted:        false,
			}

			// Skip empty messages
			if msg.Message == "" && msg.AttachmentURL == "" {
				errorResponse := map[string]interface{}{
					"type":  "error",
					"error": "Empty message",
				}
				if errorBytes, err := json.Marshal(errorResponse); err == nil {
					c.Send <- errorBytes
				}
				continue
			}

			// Store message in MongoDB
			if err := c.Hub.StoreMessage(&msg); err != nil {
				// Send error back to client
				errorResponse := map[string]interface{}{
					"type":  "error",
					"error": "Failed to store message",
				}
				if errorBytes, err := json.Marshal(errorResponse); err == nil {
					c.Send <- errorBytes
				}
				continue
			}

			// Update payload with stored message ID and broadcast
			payload.MessageID = msg.ID.Hex()
			payload.Timestamp = msg.Timestamp

			// Convert payload to JSON for broadcasting
			if broadcastBytes, err := json.Marshal(payload); err == nil {
				broadcastPayload := MessagePayload{
					RoomID:  payload.RoomID,
					Message: broadcastBytes,
				}
				c.Hub.Broadcast <- broadcastPayload
			}

		default:
			// Unknown message type, log and ignore
			println("Unknown message type received:", payload.Type)
			continue
		}
	}
}

func (c *Client) WritePump() {
	defer c.Conn.Close()
	for msg := range c.Send {
		if err := c.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
			break
		}
	}
}
