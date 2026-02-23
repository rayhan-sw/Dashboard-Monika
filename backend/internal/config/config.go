package config

import (
	"os"
	"strconv"
	"strings"
	"time"
)

// Pagination & limits (activities)
const (
	DefaultPageSizeActivities = 10
	MaxPageSizeActivities     = 10000
)

// Pagination (units / regional list)
const (
	DefaultPageSizeUnits = 20
	MaxPageSizeUnits     = 100
)

// Limit for "top N" and list endpoints (contributors, logout errors, recent downloads)
const (
	DefaultLimit = 10
	MaxLimit     = 100
)

// Search: suggestions (satker/lokasi autocomplete) and search results
const (
	SuggestionLimit   = 5
	SearchResultLimit = 20
)

// Org tree search
const (
	OrgTreeSearchLimit = 20
)

// Top lokasi (location count) in activity log repo
const (
	TopLokasiLimit = 10
)

// JWT default expiry (can be overridden by JWT_EXPIRY env)
const DefaultJWTExpiry = 24 * time.Hour

// GetJWTExpiry returns JWT expiry from JWT_EXPIRY env or DefaultJWTExpiry.
func GetJWTExpiry() time.Duration {
	if s := os.Getenv("JWT_EXPIRY"); s != "" {
		if d, err := time.ParseDuration(s); err == nil {
			return d
		}
	}
	return DefaultJWTExpiry
}

// AllowedOrigins returns CORS allowed origins from ALLOWED_ORIGINS (comma-separated).
// If empty, returns "*" for development convenience.
func AllowedOrigins() string {
	s := strings.TrimSpace(os.Getenv("ALLOWED_ORIGINS"))
	if s == "" {
		return "*"
	}
	return s
}

// CORSOrigin returns the value to set for Access-Control-Allow-Origin for the given request origin.
// If AllowedOrigins() is "*", returns "*". Otherwise treats AllowedOrigins() as comma-separated list
// and returns requestOrigin if it is in the list, or "" if not allowed.
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

// IntEnv returns value from env key, or fallback if unset/invalid.
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
