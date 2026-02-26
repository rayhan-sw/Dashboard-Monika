// File jwt.go: utilitas JWT untuk autentikasi — pembuatan token (GenerateToken) dan validasi token (ValidateToken).
//
// Konfigurasi via environment:
//   - JWT_SECRET: rahasia untuk menandatangani token (wajib; jika kosong kembalikan ErrJWTSecretNotSet).
//   - JWT_EXPIRY: lama berlaku token, di-parse di internal/config (misalnya "24h").
//
// Claims berisi user_id, role, dan RegisteredClaims (exp, iat). Dipakai oleh handler login dan middleware auth.
package auth

import (
	"errors"
	"os"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/golang-jwt/jwt/v5"
)

// ErrJWTSecretNotSet dikembalikan ketika JWT_SECRET tidak diset di environment (untuk keamanan tidak ada default).
var ErrJWTSecretNotSet = errors.New("JWT_SECRET is not set; set it in environment for security")

// Claims menyimpan klaim kustom JWT (user_id, role) dan klaim standar (ExpiresAt, IssuedAt dari RegisteredClaims).
type Claims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// GenerateToken membuat JWT untuk user yang diberikan. Memakai JWT_SECRET dan JWT_EXPIRY (dari config). Mengembalikan ErrJWTSecretNotSet jika JWT_SECRET kosong.
func GenerateToken(userID int, role string) (string, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return "", ErrJWTSecretNotSet
	}

	// Durasi berlaku token (misalnya 24h); diambil dari config yang baca JWT_EXPIRY.
	expiry := config.GetJWTExpiry()

	// Klaim: user_id, role, waktu terbit (iat), waktu kadaluarsa (exp).
	claims := Claims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(expiry)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	// Buat token HS256 lalu tanda-tangani dengan secret; kembalikan string JWT.
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateToken mem-parse dan memvalidasi string JWT; mengembalikan userID dan role. Jika JWT_SECRET kosong mengembalikan ErrJWTSecretNotSet; error lain: algoritma bukan HMAC, token kedaluwarsa/rusak, atau klaim tidak valid.
func ValidateToken(tokenString string) (userID int, role string, err error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return 0, "", ErrJWTSecretNotSet
	}

	// Parse token: key function dipanggil untuk dapat secret; di sini kita cek metode signing harus HMAC lalu kembalikan []byte(secret) untuk verifikasi signature.
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})
	if err != nil {
		return 0, "", err
	}

	// Klaim harus bertipe *Claims dan token harus valid (signature + exp sudah dicek oleh library).
	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return 0, "", errors.New("invalid token")
	}

	return claims.UserID, claims.Role, nil
}
