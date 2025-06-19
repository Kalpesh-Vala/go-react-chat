package websocket

import (
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
		payload := MessagePayload{
			RoomID:  c.RoomID,
			Message: message,
		}
		c.Hub.Broadcast <- payload
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
