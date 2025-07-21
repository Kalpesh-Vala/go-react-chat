package redis

import (
	"context"
	"fmt"
	"time"
)

var ctx = context.Background()

// SetUserOnline marks a user as online in a room, with expiry.
func SetUserOnline(userID, roomID string) error {
	userKey := fmt.Sprintf("user:%s", userID)
	roomKey := fmt.Sprintf("room:%s:users", roomID)

	// Set user as online with expiry
	if err := Rdb.Set(ctx, userKey, roomID, 30*time.Minute).Err(); err != nil {
		return err
	}

	// Add user to the room's set
	if err := Rdb.SAdd(ctx, roomKey, userID).Err(); err != nil {
		return err
	}

	// Optionally, set expiry for the room set as well
	Rdb.Expire(ctx, roomKey, 30*time.Minute)

	return nil
}

// SetUserOffline removes a user from online presence and sets last seen
func SetUserOffline(userID, roomID string) error {
	userKey := fmt.Sprintf("user:%s", userID)
	roomKey := fmt.Sprintf("room:%s:users", roomID)

	if err := Rdb.Del(ctx, userKey).Err(); err != nil {
		return err
	}

	if err := Rdb.SRem(ctx, roomKey, userID).Err(); err != nil {
		return err
	}

	// Set last seen timestamp
	lastSeenKey := fmt.Sprintf("user:%s:last_seen", userID)
	Rdb.Set(ctx, lastSeenKey, time.Now().Unix(), 0) // 0 means no expiry

	return nil
}

// GetOnlineUsersInRoom returns all online users in a room
func GetOnlineUsersInRoom(roomID string) ([]string, error) {
	roomKey := fmt.Sprintf("room:%s:users", roomID)
	return Rdb.SMembers(ctx, roomKey).Result()
}

// IsUserOnline checks if a user is online (any room)
func IsUserOnline(userID string) (bool, error) {
	userKey := fmt.Sprintf("user:%s", userID)
	exists, err := Rdb.Exists(ctx, userKey).Result()
	if err != nil {
		return false, err
	}
	return exists == 1, nil
}

// GetUserLastSeen returns the last seen timestamp for a user
func GetUserLastSeen(userID string) (int64, error) {
	lastSeenKey := fmt.Sprintf("user:%s:last_seen", userID)
	ts, err := Rdb.Get(ctx, lastSeenKey).Int64()
	if err != nil {
		return 0, err
	}
	return ts, nil
}
