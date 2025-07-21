package websocket

type MessagePayload struct {
	Type           string `json:"type"` // "message", "typing", "reaction", etc.
	MessageID      string `json:"message_id,omitempty"`
	RoomID         string `json:"room_id"`
	SenderID       int    `json:"sender_id"`
	Content        string `json:"content"`
	Timestamp      int64  `json:"timestamp,omitempty"`
	IsGroup        bool   `json:"is_group"`
	AttachmentURL  string `json:"attachment_url,omitempty"`
	AttachmentType string `json:"attachment_type,omitempty"`
	ReplyToID      string `json:"reply_to_id,omitempty"`
	Message        []byte `json:"-"` // Keep for backward compatibility, will be removed
}

type TypingPayload struct {
	Type     string `json:"type"`
	RoomID   string `json:"room_id"`
	UserID   int    `json:"user_id"`
	Username string `json:"username"`
	IsTyping bool   `json:"is_typing"`
}

type ReactionPayload struct {
	Type      string `json:"type"`
	MessageID string `json:"message_id"`
	RoomID    string `json:"room_id"`
	UserID    int    `json:"user_id"`
	Emoji     string `json:"emoji"`
	Action    string `json:"action"` // "add" or "remove"
}
