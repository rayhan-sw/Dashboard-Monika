// Package config menyediakan konstanta dan helper baca konfigurasi dari environment.
//
// Berisi:
//   - Batas paginasi dan limit untuk aktivitas, unit, search, org tree, top lokasi, dll.
//   - Default dan parsing JWT_EXPIRY (durasi berlaku token).
//   - CORS: AllowedOrigins (ALLOWED_ORIGINS) dan CORSOrigin(origin) untuk header Access-Control-Allow-Origin.
//   - IntEnv(key, fallback) untuk baca variabel env bertipe integer.
//
// Digunakan oleh internal/server (CORS), internal/auth (JWT expiry), dan handler/repo yang memakai limit/pagination.
package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Paginasi dan batas ukuran halaman untuk endpoint aktivitas (activity log).
const (
	DefaultPageSizeActivities = 10  // Ukuran halaman default jika client tidak mengirim page_size.
	MaxPageSizeActivities     = 10000 // Batas maksimal page_size agar query tidak terlalu berat.
)

// Paginasi untuk endpoint daftar unit / regional.
const (
	DefaultPageSizeUnits = 20  // Ukuran halaman default.
	MaxPageSizeUnits     = 100 // Batas maksimal page_size.
)

// Limit untuk endpoint "top N" dan daftar (kontributor, error logout, unduhan terbaru, dll.).
const (
	DefaultLimit = 10  // Default jumlah item yang dikembalikan.
	MaxLimit     = 100 // Batas maksimal limit.
)

// Pencarian: autocomplete (saran satker/lokasi) dan hasil search.
const (
	SuggestionLimit   = 5  // Jumlah saran autocomplete.
	SearchResultLimit = 20 // Jumlah hasil pencarian.
)

// Batas hasil pencarian di pohon organisasi (org tree).
const (
	OrgTreeSearchLimit = 20
)

// Jumlah lokasi teratas (berdasarkan jumlah aktivitas) di activity log.
const (
	TopLokasiLimit = 10
)

// Default lama berlaku token JWT; bisa diganti lewat env JWT_EXPIRY (format duration, misalnya "24h", "30m").
const DefaultJWTExpiry = 24 * time.Hour

// GetJWTExpiry mengembalikan durasi berlaku JWT dari env JWT_EXPIRY; jika kosong atau invalid, pakai DefaultJWTExpiry.
func GetJWTExpiry() time.Duration {
	if s := os.Getenv("JWT_EXPIRY"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			return d
		}
	}
	return DefaultJWTExpiry
}

// AllowedOrigins mengembalikan daftar origin yang diizinkan CORS dari env ALLOWED_ORIGINS (dipisah koma).
// Jika kosong, mengembalikan "*" untuk kemudahan development.
func AllowedOrigins() string {
	s := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if s == "" {
		return "*"
	}
	return s
}

// CORSOrigin mengembalikan nilai untuk header Access-Control-Allow-Origin sesuai origin permintaan.
// Jika AllowedOrigins() adalah "*", mengembalikan "*". Jika berupa daftar (dipisah koma), mengembalikan requestOrigin
// hanya jika ada di daftar; jika tidak, mengembalikan "" (origin tidak diizinkan).
func CORSOrigin(requestOrigin string) string {
	raw := AllowedOrigins()
	if raw == "*" {
		return "*"
	}
	for _, o := range strings.Split(raw, ",") {
		if strings.TrimSpace(o) == requestOrigin {
			return requestOrigin
		}
	}
	return ""
}

// IntEnv membaca nilai integer dari variabel env key; jika tidak diset atau bukan angka valid, mengembalikan fallback.
func IntEnv(key string, fallback int) int {
	s := os.Getenv(key)
	if s == "" {
		return fallback
	}
	v, err := strconv.Atoi(s)
	if err != nil {
		return fallback
	}
	return v
}
