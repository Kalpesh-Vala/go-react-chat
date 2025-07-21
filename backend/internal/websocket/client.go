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

		// Store message in database first
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

		// Store message in MongoDB
		if err := c.Hub.StoreMessage(&msg); err != nil {
			// Send error back to client
			errorResponse := map[string]interface{}{
				"type":  "error",
				"error": "Failed to store message",
			}
			if errorBytes, _ := json.Marshal(errorResponse); err == nil {
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
