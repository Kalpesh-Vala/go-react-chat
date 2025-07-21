package models

import (
	"go.mongodb.org/mongo-driver/bson/primitive"
)

type Message struct {
	ID              primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
	RoomID          string              `json:"room_id" bson:"room_id"`
	SenderID        int                 `json:"sender_id" bson:"sender_id"`
	Message         string              `json:"message" bson:"message"`
	Timestamp       int64               `json:"timestamp" bson:"timestamp"`
	IsGroup         bool                `json:"is_group" bson:"is_group"`
	Status          string              `json:"status" bson:"status"`
	AttachmentURL   string              `json:"attachment_url,omitempty" bson:"attachment_url,omitempty"`
	AttachmentType  string              `json:"attachment_type,omitempty" bson:"attachment_type,omitempty"`
	ReplyToID       *primitive.ObjectID `json:"reply_to_id,omitempty" bson:"reply_to_id,omitempty"`
	ForwardedFromID *string             `json:"forwarded_from_id,omitempty" bson:"forwarded_from_id,omitempty"`
	Deleted         bool                `json:"deleted" bson:"deleted"`
	Reactions       map[string][]string `json:"reactions,omitempty" bson:"reactions,omitempty"`
}
