package services

import (
	"context"
	"go-react-chat/kalpesh-vala/github.com/db/mongodb"
	"go-react-chat/kalpesh-vala/github.com/models"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func InsertMessage(ctx context.Context, msg *models.Message) error {
	msg.ID = primitive.NewObjectID()
	msg.Timestamp = time.Now().Unix()
	collection := mongodb.ChatDB.Collection("messages")
	_, err := collection.InsertOne(ctx, msg)
	return err
}

func GetMessagesByRoomID(ctx context.Context, roomID string) ([]models.Message, error) {
	collection := mongodb.ChatDB.Collection("messages")

	// Filter: get all messages for room_id, including deleted ones
	filter := bson.M{
		"room_id": roomID,
	}

	// Sort by timestamp (oldest first)
	opts := options.Find().SetSort(bson.D{primitive.E{Key: "timestamp", Value: 1}})

	cur, err := collection.Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var messages []models.Message
	for cur.Next(ctx) {
		var msg models.Message
		if err := cur.Decode(&msg); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, cur.Err()
}

// GetAllMessages - Debug function to retrieve all messages
func GetAllMessages(ctx context.Context) ([]models.Message, error) {
	collection := mongodb.ChatDB.Collection("messages")

	// Get all messages, sorted by timestamp
	opts := options.Find().SetSort(bson.D{primitive.E{Key: "timestamp", Value: 1}})

	cur, err := collection.Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cur.Close(ctx)

	var messages []models.Message
	for cur.Next(ctx) {
		var msg models.Message
		if err := cur.Decode(&msg); err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}
	return messages, cur.Err()
}

// DeleteMessage marks a message as deleted
func DeleteMessage(ctx context.Context, messageID primitive.ObjectID) error {
	collection := mongodb.ChatDB.Collection("messages")
	filter := bson.M{"_id": messageID}
	update := bson.M{"$set": bson.M{"deleted": true}}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// GetMessageByID retrieves a single message by its ID
func GetMessageByID(ctx context.Context, messageID primitive.ObjectID) (*models.Message, error) {
	collection := mongodb.ChatDB.Collection("messages")
	var message models.Message
	err := collection.FindOne(ctx, bson.M{"_id": messageID}).Decode(&message)
	if err != nil {
		return nil, err
	}
	return &message, nil
}

// AddReaction adds a reaction (emoji) from a user to a message
func AddReaction(ctx context.Context, messageID primitive.ObjectID, emoji, userID string) error {
	collection := mongodb.ChatDB.Collection("messages")
	filter := bson.M{"_id": messageID}
	update := bson.M{
		"$addToSet": bson.M{
			"reactions." + emoji: userID, // Adds userID to the emoji array, no duplicates
		},
	}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}

// RemoveReaction removes a user's reaction (emoji) from a message
func RemoveReaction(ctx context.Context, messageID primitive.ObjectID, emoji, userID string) error {
	collection := mongodb.ChatDB.Collection("messages")
	filter := bson.M{"_id": messageID}
	update := bson.M{
		"$pull": bson.M{
			"reactions." + emoji: userID, // Removes userID from the emoji array
		},
	}
	_, err := collection.UpdateOne(ctx, filter, update)
	return err
}
