package websocket

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
)

var jwtKey = []byte("mysecretkey")

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func ServeWs(hub *Hub) gin.HandlerFunc {
	return func(c *gin.Context) {
		roomId := c.Query("room")
		tokenStr := c.Query("token")

		if roomId == "" || tokenStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Missing room or token"})
			return
		}

		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(tokenStr, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user_id in token"})
			return
		}
		userID := strconv.Itoa(int(userIDFloat))
		username, ok2 := claims["username"].(string)

		if userID == "" || !ok2 {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token payload"})
			return
		}

		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			return
		}

		client := &Client{
			RoomID:   roomId,
			Conn:     conn,
			Send:     make(chan []byte, 256),
			Hub:      hub,
			UserID:   userID,
			Username: username,
		}

		client.Hub.Register <- client

		go client.WritePump()
		go client.ReadPump()
	}
}
