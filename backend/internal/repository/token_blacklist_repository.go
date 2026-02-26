package repository

import (
	"database/sql"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/jmoiron/sqlx"
)

// TokenBlacklistRepository handles database operations for token blacklist
type TokenBlacklistRepository struct {
	db *sqlx.DB
}

// NewTokenBlacklistRepository creates a new repository instance
func NewTokenBlacklistRepository(db *sqlx.DB) *TokenBlacklistRepository {
	return &TokenBlacklistRepository{db: db}
}

// Add adds a token to the blacklist
func (r *TokenBlacklistRepository) Add(blacklist *entity.TokenBlacklist) error {
	query := `
		INSERT INTO token_blacklist (jti, user_id, token_type, reason, blacklisted_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (jti) DO NOTHING
		RETURNING id
	`
	err := r.db.QueryRow(
		query,
		blacklist.JTI,
		blacklist.UserID,
		blacklist.TokenType,
		blacklist.Reason,
		blacklist.BlacklistedAt,
		blacklist.ExpiresAt,
	).Scan(&blacklist.ID)

	// If conflict (already blacklisted), treat as success
	if err == sql.ErrNoRows {
		return nil
	}

	return err
}

// IsBlacklisted checks if a token JTI is in the blacklist
func (r *TokenBlacklistRepository) IsBlacklisted(jti string) (bool, error) {
	var count int
	query := `SELECT COUNT(*) FROM token_blacklist WHERE jti = $1`
	err := r.db.Get(&count, query, jti)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

// FindByJTI retrieves a blacklist entry by JTI
func (r *TokenBlacklistRepository) FindByJTI(jti string) (*entity.TokenBlacklist, error) {
	var blacklist entity.TokenBlacklist
	query := `SELECT * FROM token_blacklist WHERE jti = $1`
	err := r.db.Get(&blacklist, query, jti)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &blacklist, err
}

// AddBatch adds multiple tokens to blacklist (used for logout all devices)
func (r *TokenBlacklistRepository) AddBatch(blacklists []entity.TokenBlacklist) error {
	if len(blacklists) == 0 {
		return nil
	}

	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	query := `
		INSERT INTO token_blacklist (jti, user_id, token_type, reason, blacklisted_at, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (jti) DO NOTHING
	`

	for _, bl := range blacklists {
		_, err := tx.Exec(query, bl.JTI, bl.UserID, bl.TokenType, bl.Reason, bl.BlacklistedAt, bl.ExpiresAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

// BlacklistAllUserTokens blacklists all active refresh tokens for a user
// Used for logout_all and password_change scenarios
func (r *TokenBlacklistRepository) BlacklistAllUserTokens(userID int, reason string) (int, error) {
	query := `
		INSERT INTO token_blacklist (jti, user_id, token_type, reason, blacklisted_at, expires_at)
		SELECT jti, user_id, 'refresh' as token_type, $2 as reason, NOW() as blacklisted_at, expires_at
		FROM refresh_tokens
		WHERE user_id = $1 AND expires_at > NOW()
		ON CONFLICT (jti) DO NOTHING
	`
	result, err := r.db.Exec(query, userID, reason)
	if err != nil {
		return 0, err
	}

	rows, _ := result.RowsAffected()
	return int(rows), nil
}

// DeleteExpired removes blacklist entries for tokens that have already expired
// No need to keep them in blacklist since they're expired anyway
func (r *TokenBlacklistRepository) DeleteExpired() (int64, error) {
	query := `DELETE FROM token_blacklist WHERE expires_at < NOW()`
	result, err := r.db.Exec(query)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// GetUserBlacklistedTokens returns all blacklisted tokens for a user (for debugging/audit)
func (r *TokenBlacklistRepository) GetUserBlacklistedTokens(userID int) ([]entity.TokenBlacklist, error) {
	var blacklists []entity.TokenBlacklist
	query := `
		SELECT * FROM token_blacklist 
		WHERE user_id = $1 
		ORDER BY blacklisted_at DESC
		LIMIT 100
	`
	err := r.db.Select(&blacklists, query, userID)
	return blacklists, err
}

// CountBlacklisted returns the total number of blacklisted tokens
func (r *TokenBlacklistRepository) CountBlacklisted() (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM token_blacklist WHERE expires_at > NOW()`
	err := r.db.Get(&count, query)
	return count, err
}

// GetBlacklistStats returns statistics about blacklist (for monitoring)
type BlacklistStats struct {
	TotalActive  int            `json:"total_active"`
	TotalExpired int            `json:"total_expired"`
	ByReason     map[string]int `json:"by_reason"`
	OldestEntry  time.Time      `json:"oldest_entry"`
	NewestEntry  time.Time      `json:"newest_entry"`
}

func (r *TokenBlacklistRepository) GetStats() (*BlacklistStats, error) {
	stats := &BlacklistStats{
		ByReason: make(map[string]int),
	}

	// Total active
	query := `SELECT COUNT(*) FROM token_blacklist WHERE expires_at > NOW()`
	r.db.Get(&stats.TotalActive, query)

	// Total expired
	query = `SELECT COUNT(*) FROM token_blacklist WHERE expires_at <= NOW()`
	r.db.Get(&stats.TotalExpired, query)

	// By reason
	rows, err := r.db.Query(`
		SELECT reason, COUNT(*) as count 
		FROM token_blacklist 
		WHERE expires_at > NOW()
		GROUP BY reason
	`)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var reason string
			var count int
			rows.Scan(&reason, &count)
			stats.ByReason[reason] = count
		}
	}

	// Oldest and newest
	r.db.Get(&stats.OldestEntry, `SELECT MIN(blacklisted_at) FROM token_blacklist`)
	r.db.Get(&stats.NewestEntry, `SELECT MAX(blacklisted_at) FROM token_blacklist`)

	return stats, nil
}
