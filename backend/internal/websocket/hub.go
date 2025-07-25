package websocket

import (
	"context"
	"go-react-chat/kalpesh-vala/github.com/db/redis"
	"go-react-chat/kalpesh-vala/github.com/models"
	"go-react-chat/kalpesh-vala/github.com/services"
	"log"
)

type Hub struct {
	Clients    map[*Client]bool
	Rooms      map[string]map[*Client]bool
	Broadcast  chan MessagePayload
	Register   chan *Client
	Unregister chan *Client
}

func NewHub() *Hub {
	return &Hub{
		Clients:    make(map[*Client]bool),
		Rooms:      make(map[string]map[*Client]bool),
		Broadcast:  make(chan MessagePayload),
		Register:   make(chan *Client),
		Unregister: make(chan *Client),
	}
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.Register:
			h.Clients[client] = true
			if _, ok := h.Rooms[client.RoomID]; !ok {
				h.Rooms[client.RoomID] = make(map[*Client]bool)
			}
			h.Rooms[client.RoomID][client] = true

			if err := redis.SetUserOnline(client.UserID, client.RoomID); err != nil {
				log.Println("Failed to set user online in Redis: ", err)
			}

		case client := <-h.Unregister:
			if _, ok := h.Clients[client]; ok {
				delete(h.Clients, client)
				close(client.Send)
			}
			if room, ok := h.Rooms[client.RoomID]; ok {
				delete(room, client)
				if len(room) == 0 {
					delete(h.Rooms, client.RoomID)
				}
			}

			if err := redis.SetUserOffline(client.UserID, client.RoomID); err != nil {
				log.Println("Failed to set user offline in Redis: ", err)
			}

		case msg := <-h.Broadcast:
			if clients, ok := h.Rooms[msg.RoomID]; ok {
				for client := range clients {
					select {
					case client.Send <- msg.Message:
					default:
						close(client.Send)
						delete(h.Clients, client)
						delete(h.Rooms[msg.RoomID], client)
					}
				}
			}
		}
	}
}

// StoreMessage stores a message in the database
func (h *Hub) StoreMessage(msg *models.Message) error {
	return services.InsertMessage(context.Background(), msg)
}
