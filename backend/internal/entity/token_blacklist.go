package entity

import "time"

// TokenBlacklist represents a blacklisted (invalidated) token
// Used for immediate token revocation (logout, password change, security reasons)
type TokenBlacklist struct {
	ID            int       `json:"id" db:"id"`
	JTI           string    `json:"jti" db:"jti"`                       // JWT ID to blacklist
	UserID        int       `json:"user_id" db:"user_id"`               // Token owner
	TokenType     string    `json:"token_type" db:"token_type"`         // 'access' or 'refresh'
	Reason        string    `json:"reason" db:"reason"`                 // Why blacklisted
	BlacklistedAt time.Time `json:"blacklisted_at" db:"blacklisted_at"` // When blacklisted
	ExpiresAt     time.Time `json:"expires_at" db:"expires_at"`         // Original token expiry
}

// Blacklist reasons constants
const (
	BlacklistReasonLogout         = "logout"          // User logged out
	BlacklistReasonLogoutAll      = "logout_all"      // User logged out from all devices
	BlacklistReasonPasswordChange = "password_change" // Password was changed
	BlacklistReasonSecurity       = "security"        // Security concern (admin action)
	BlacklistReasonExpired        = "expired"         // Token expired (cleanup)
)

// IsCleanable checks if this blacklist entry can be cleaned up
// (token has already expired, so no need to keep in blacklist)
func (tb *TokenBlacklist) IsCleanable() bool {
	return time.Now().After(tb.ExpiresAt)
}
