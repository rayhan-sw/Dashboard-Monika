package repository

import (
	"database/sql"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/jmoiron/sqlx"
)

// RefreshTokenRepository handles database operations for refresh tokens
type RefreshTokenRepository struct {
	db *sqlx.DB
}

// NewRefreshTokenRepository creates a new repository instance
func NewRefreshTokenRepository(db *sqlx.DB) *RefreshTokenRepository {
	return &RefreshTokenRepository{db: db}
}

// Create stores a new refresh token in the database
func (r *RefreshTokenRepository) Create(token *entity.RefreshToken) error {
	query := `
		INSERT INTO refresh_tokens (jti, user_id, device_info, ip_address, expires_at, created_at, last_used_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id
	`
	return r.db.QueryRow(
		query,
		token.JTI,
		token.UserID,
		token.DeviceInfo,
		token.IPAddress,
		token.ExpiresAt,
		token.CreatedAt,
		token.LastUsedAt,
	).Scan(&token.ID)
}

// FindByJTI retrieves a refresh token by its JTI
func (r *RefreshTokenRepository) FindByJTI(jti string) (*entity.RefreshToken, error) {
	var token entity.RefreshToken
	query := `SELECT * FROM refresh_tokens WHERE jti = $1`
	err := r.db.Get(&token, query, jti)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &token, err
}

// FindByUserID retrieves all refresh tokens for a user (active sessions)
func (r *RefreshTokenRepository) FindByUserID(userID int) ([]entity.RefreshToken, error) {
	var tokens []entity.RefreshToken
	query := `
		SELECT * FROM refresh_tokens 
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY created_at DESC
	`
	err := r.db.Select(&tokens, query, userID)
	return tokens, err
}

// UpdateLastUsed updates the last_used_at timestamp when token is used for refresh
func (r *RefreshTokenRepository) UpdateLastUsed(jti string) error {
	query := `UPDATE refresh_tokens SET last_used_at = $1 WHERE jti = $2`
	_, err := r.db.Exec(query, time.Now(), jti)
	return err
}

// Delete removes a refresh token (logout)
func (r *RefreshTokenRepository) Delete(jti string) error {
	query := `DELETE FROM refresh_tokens WHERE jti = $1`
	_, err := r.db.Exec(query, jti)
	return err
}

// DeleteAllByUserID removes all refresh tokens for a user (logout all devices)
func (r *RefreshTokenRepository) DeleteAllByUserID(userID int) error {
	query := `DELETE FROM refresh_tokens WHERE user_id = $1`
	result, err := r.db.Exec(query, userID)
	if err != nil {
		return err
	}

	// Return error if no rows affected (no active sessions)
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return sql.ErrNoRows
	}

	return nil
}

// DeleteExpired removes expired refresh tokens (cleanup)
func (r *RefreshTokenRepository) DeleteExpired() (int64, error) {
	query := `DELETE FROM refresh_tokens WHERE expires_at < NOW()`
	result, err := r.db.Exec(query)
	if err != nil {
		return 0, err
	}
	return result.RowsAffected()
}

// GetActiveSessions returns user-friendly session information for a user
func (r *RefreshTokenRepository) GetActiveSessions(userID int) ([]entity.SessionInfo, error) {
	var sessions []entity.SessionInfo
	query := `
		SELECT 
			id,
			device_info,
			ip_address,
			created_at,
			last_used_at,
			true as is_active
		FROM refresh_tokens 
		WHERE user_id = $1 AND expires_at > NOW()
		ORDER BY last_used_at DESC
	`
	err := r.db.Select(&sessions, query, userID)
	return sessions, err
}

// CountActiveTokens returns the number of active refresh tokens for a user
func (r *RefreshTokenRepository) CountActiveTokens(userID int) (int, error) {
	var count int
	query := `SELECT COUNT(*) FROM refresh_tokens WHERE user_id = $1 AND expires_at > NOW()`
	err := r.db.Get(&count, query, userID)
	return count, err
}

// DeleteOldestIfExceedsLimit removes oldest refresh tokens if user has too many active sessions
// This prevents one user from creating unlimited sessions
func (r *RefreshTokenRepository) DeleteOldestIfExceedsLimit(userID int, maxSessions int) error {
	query := `
		DELETE FROM refresh_tokens
		WHERE id IN (
			SELECT id FROM refresh_tokens
			WHERE user_id = $1 AND expires_at > NOW()
			ORDER BY created_at ASC
			LIMIT (
				SELECT GREATEST(0, COUNT(*) - $2)
				FROM refresh_tokens
				WHERE user_id = $1 AND expires_at > NOW()
			)
		)
	`
	_, err := r.db.Exec(query, userID, maxSessions)
	return err
}
