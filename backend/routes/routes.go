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

	//Auth routes
	r.POST("/register", controllers.Register(db))
	r.POST("/login", controllers.Login(db))

	r.GET("/ping", func(c *gin.Context) {
		c.JSON(200, gin.H{"messege": "pong"})
	})

	r.GET("/ws", ws.ServeWs(hub))

}
