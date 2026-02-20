package auth

import (
	"errors"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims holds JWT claims (user_id, role) plus standard exp.
type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

const defaultExpiry = 24 * time.Hour

// GenerateToken creates a JWT for the given user. Uses JWT_SECRET and JWT_EXPIRY from env.
func GenerateToken(userID int, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "change_me_in_production" // fallback for local dev; .env.example has JWT_SECRET
	}

	expiry := defaultExpiry
	if s := os.Getenv("JWT_EXPIRY"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			expiry = d
		}
	}

	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateToken parses and validates the JWT, returns userID and role or error.
func ValidateToken(tokenString string) (userID int, role string, err error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "change_me_in_production"
	}

	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return 0, "", err
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return 0, "", errors.New("invalid token")
	}

	return claims.UserID, claims.Role, nil
}
