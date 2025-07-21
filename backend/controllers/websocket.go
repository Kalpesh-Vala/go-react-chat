package controllers

import (
	"net/http"

	"go-react-chat/kalpesh-vala/github.com/db/redis"

	"github.com/gin-gonic/gin"
)

func GetOnlineUsers(c *gin.Context) {
	roomID := c.Query("room")
	if roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing room parameters"})
		return
	}

	users, err := redis.GetOnlineUsersInRoom(roomID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get online users"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"users": users})

}

// GetUserStatus returns if a user is online and their last seen timestamp
func GetUserStatus(c *gin.Context) {
	userID := c.Query("user")
	if userID == "" {
		c.JSON(400, gin.H{"error": "Missing user parameter"})
		return
	}

	online, err := redis.IsUserOnline(userID)
	if err != nil {
		c.JSON(500, gin.H{"error": "Failed to check user status"})
		return
	}

	lastSeen, _ := redis.GetUserLastSeen(userID) // ignore error if not found

	c.JSON(200, gin.H{
		"online":   online,
		"lastSeen": lastSeen, // Unix timestamp
	})
}
