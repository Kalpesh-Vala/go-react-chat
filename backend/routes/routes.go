package routes

import (
	"database/sql"
	"go-react-chat/kalpesh-vala/github.com/controllers"
	ws "go-react-chat/kalpesh-vala/github.com/internal/websocket"

	"github.com/gin-gonic/gin"
)

func SetUpRoutes(r *gin.Engine, db *sql.DB) {

	hub := ws.NewHub()
	go hub.Run()

	// Set the global hub for message controller
	controllers.SetGlobalHub(hub)

	//Auth routes
	r.POST("/register", controllers.Register(db))
	r.POST("/login", controllers.Login(db))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"messege": "pong"})
	})

	// Debug endpoint to see all messages
	r.GET("/debug/messages", controllers.GetAllMessages)

	//Redis
	r.GET("/online-users", controllers.GetOnlineUsers)
	// User status (online/last seen)
	r.GET("/user-status", controllers.GetUserStatus)

	// Message routes
	r.POST("/message", controllers.SendMessage)
	r.GET("/messages", controllers.GetChatHistory)
	r.POST("/message/reaction/add", controllers.AddReactionHandler)
	r.POST("/message/reaction/remove", controllers.RemoveReactionHandler)
	r.POST("/message/delete", controllers.DeleteMessageHandler)

	r.GET("/ws", ws.ServeWs(hub))

}
