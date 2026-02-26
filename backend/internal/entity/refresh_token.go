package entity

import "time"

// RefreshToken represents an active refresh token in the system
// Used for JWT token rotation strategy
type RefreshToken struct {
	ID         int       `json:"id" db:"id"`
	JTI        string    `json:"jti" db:"jti"`                   // JWT ID (UUID)
	UserID     int       `json:"user_id" db:"user_id"`           // Owner of the token
	DeviceInfo string    `json:"device_info" db:"device_info"`   // User agent string
	IPAddress  string    `json:"ip_address" db:"ip_address"`     // IP where token was issued
	ExpiresAt  time.Time `json:"expires_at" db:"expires_at"`     // When token expires
	CreatedAt  time.Time `json:"created_at" db:"created_at"`     // When token was created
	LastUsedAt time.Time `json:"last_used_at" db:"last_used_at"` // Last refresh time
}

// IsExpired checks if the refresh token has expired
func (rt *RefreshToken) IsExpired() bool {
	return time.Now().After(rt.ExpiresAt)
}

// SessionInfo returns user-friendly session information
type SessionInfo struct {
	ID         int       `json:"id"`
	DeviceInfo string    `json:"device_info"`
	IPAddress  string    `json:"ip_address"`
	CreatedAt  time.Time `json:"created_at"`
	LastUsedAt time.Time `json:"last_used_at"`
	IsActive   bool      `json:"is_active"`
}
