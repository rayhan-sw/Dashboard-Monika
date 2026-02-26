package auth

import (
	"errors"
	"os"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// Error definitions
var (
	ErrJWTSecretNotSet  = errors.New("JWT_SECRET is not set; set it in environment for security")
	ErrInvalidToken     = errors.New("invalid token")
	ErrExpiredToken     = errors.New("token has expired")
	ErrInvalidTokenType = errors.New("invalid token type")
)

// Token types
const (
	TokenTypeAccess  = "access"
	TokenTypeRefresh = "refresh"
)

// Token expiry durations
const (
	AccessTokenExpiry  = 15 * time.Minute   // Short-lived access token
	RefreshTokenExpiry = 7 * 24 * time.Hour // Long-lived refresh token
)

// Claims holds JWT claims with jti for blacklist support
type Claims struct {
	UserID    int    `json:"user_id"`
	Role      string `json:"role"`
	TokenType string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// TokenPair holds both access and refresh tokens
type TokenPair struct {
	AccessToken  string    `json:"access_token"`
	RefreshToken string    `json:"refresh_token"`
	AccessJTI    string    `json:"-"`          // Not exposed to frontend
	RefreshJTI   string    `json:"-"`          // Not exposed to frontend
	ExpiresIn    int       `json:"expires_in"` // Access token expiry in seconds
	ExpiresAt    time.Time `json:"-"`          // Refresh token expiry time
}

// GenerateAccessToken creates a short-lived access token (15 minutes)
// with JTI for blacklist support
func GenerateAccessToken(userID int, role string) (token string, jti string, err error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", "", ErrJWTSecretNotSet
	}

	jti = uuid.New().String()
	now := time.Now()
	expiresAt := now.Add(AccessTokenExpiry)

	claims := Claims{
		UserID:    userID,
		Role:      role,
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err = tokenObj.SignedString([]byte(secret))
	return token, jti, err
}

// GenerateRefreshToken creates a long-lived refresh token (7 days)
// with JTI for session tracking and revocation
func GenerateRefreshToken(userID int, role string) (token string, jti string, expiresAt time.Time, err error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", "", time.Time{}, ErrJWTSecretNotSet
	}

	jti = uuid.New().String()
	now := time.Now()
	expiresAt = now.Add(RefreshTokenExpiry)

	claims := Claims{
		UserID:    userID,
		Role:      role,
		TokenType: TokenTypeRefresh,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        jti,
			ExpiresAt: jwt.NewNumericDate(expiresAt),
			IssuedAt:  jwt.NewNumericDate(now),
		},
	}

	tokenObj := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	token, err = tokenObj.SignedString([]byte(secret))
	return token, jti, expiresAt, err
}

// GenerateTokenPair creates both access and refresh tokens
func GenerateTokenPair(userID int, role string) (*TokenPair, error) {
	accessToken, accessJTI, err := GenerateAccessToken(userID, role)
	if err != nil {
		return nil, err
	}

	refreshToken, refreshJTI, expiresAt, err := GenerateRefreshToken(userID, role)
	if err != nil {
		return nil, err
	}

	return &TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		AccessJTI:    accessJTI,
		RefreshJTI:   refreshJTI,
		ExpiresIn:    int(AccessTokenExpiry.Seconds()),
		ExpiresAt:    expiresAt,
	}, nil
}

// ValidateToken parses and validates the JWT, returns claims or error
func ValidateToken(tokenString string) (*Claims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, ErrJWTSecretNotSet
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		// Check if it's an expiration error
		if errors.Is(err, jwt.ErrTokenExpired) {
			return nil, ErrExpiredToken
		}
		return nil, err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}

// ValidateAccessToken validates specifically an access token
func ValidateAccessToken(tokenString string) (userID int, role string, jti string, err error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, "", "", err
	}

	if claims.TokenType != TokenTypeAccess {
		return 0, "", "", ErrInvalidTokenType
	}

	return claims.UserID, claims.Role, claims.ID, nil
}

// ValidateRefreshToken validates specifically a refresh token
func ValidateRefreshToken(tokenString string) (userID int, role string, jti string, err error) {
	claims, err := ValidateToken(tokenString)
	if err != nil {
		return 0, "", "", err
	}

	if claims.TokenType != TokenTypeRefresh {
		return 0, "", "", ErrInvalidTokenType
	}

	return claims.UserID, claims.Role, claims.ID, nil
}

// ExtractJTI extracts JTI from token without full validation (used for blacklist before expiry check)
func ExtractJTI(tokenString string) (string, error) {
	token, _, err := new(jwt.Parser).ParseUnverified(tokenString, &Claims{})
	if err != nil {
		return "", err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok {
		return "", ErrInvalidToken
	}

	return claims.ID, nil
}

// GenerateToken (DEPRECATED: for backward compatibility, use GenerateAccessToken instead)
// This is kept for existing code that hasn't been migrated yet
func GenerateToken(userID int, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", ErrJWTSecretNotSet
	}

	expiry := config.GetJWTExpiry()

	claims := Claims{
		UserID:    userID,
		Role:      role,
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			ID:        uuid.New().String(), // Add JTI even for legacy
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}
