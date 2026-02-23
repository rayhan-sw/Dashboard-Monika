package auth

import (
	"errors"
	"os"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

// ErrJWTSecretNotSet is returned when JWT_SECRET is not set (required in production).
var ErrJWTSecretNotSet = errors.New("JWT_SECRET is not set; set it in environment for security")

// Claims holds JWT claims (user_id, role) plus standard exp.
type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken creates a JWT for the given user. Uses JWT_SECRET and JWT_EXPIRY from env.
// Returns ErrJWTSecretNotSet if JWT_SECRET is empty (no fallback for production safety).
func GenerateToken(userID int, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", ErrJWTSecretNotSet
	}

	expiry := config.GetJWTExpiry()

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
// Returns ErrJWTSecretNotSet if JWT_SECRET is empty.
func ValidateToken(tokenString string) (userID int, role string, err error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return 0, "", ErrJWTSecretNotSet
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
