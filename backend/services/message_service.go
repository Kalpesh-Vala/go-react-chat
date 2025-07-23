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

	// First remove the user from the emoji array
	update := bson.M{
		"$pull": bson.M{
			"reactions." + emoji: userID, // Removes userID from the emoji array
		},
	}
	_, err := collection.UpdateOne(ctx, filter, update)
	if err != nil {
		return err
	}

	// Then remove the emoji field if the array is empty
	// This prevents showing reactions with 0 count
	cleanupUpdate := bson.M{
		"$unset": bson.M{
			"reactions." + emoji: "",
		},
	}
	cleanupFilter := bson.M{
		"_id":                messageID,
		"reactions." + emoji: bson.M{"$size": 0}, // Only if array is empty
	}

	// This update will only execute if the emoji array is empty
	collection.UpdateOne(ctx, cleanupFilter, cleanupUpdate)

	return nil
}

// SetUserReaction sets a user's reaction to a message (one reaction per user per message)
// Returns the previous emoji (if any) and the new emoji for proper WebSocket broadcasting
func SetUserReaction(ctx context.Context, messageID primitive.ObjectID, newEmoji, userID string) (string, error) {
	collection := mongodb.ChatDB.Collection("messages")

	// First, get the current message to find any existing reaction from this user
	var message models.Message
	err := collection.FindOne(ctx, bson.M{"_id": messageID}).Decode(&message)
	if err != nil {
		return "", err
	}

	var previousEmoji string

	// Find and remove any existing reaction from this user
	if message.Reactions != nil {
		for emoji, users := range message.Reactions {
			for _, uid := range users {
				if uid == userID {
					previousEmoji = emoji
					// Remove user from this emoji's array
					_, err := collection.UpdateOne(ctx,
						bson.M{"_id": messageID},
						bson.M{"$pull": bson.M{"reactions." + emoji: userID}},
					)
					if err != nil {
						return "", err
					}

					// Clean up empty emoji arrays to prevent showing 0 counts
					cleanupFilter := bson.M{
						"_id":                messageID,
						"reactions." + emoji: bson.M{"$size": 0},
					}
					cleanupUpdate := bson.M{
						"$unset": bson.M{"reactions." + emoji: ""},
					}
					collection.UpdateOne(ctx, cleanupFilter, cleanupUpdate)
					break
				}
			}
			if previousEmoji != "" {
				break
			}
		}
	}

	// Add the new reaction
	_, err = collection.UpdateOne(ctx,
		bson.M{"_id": messageID},
		bson.M{"$addToSet": bson.M{"reactions." + newEmoji: userID}},
	)
	if err != nil {
		return "", err
	}

	return previousEmoji, nil
}
