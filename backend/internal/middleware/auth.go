package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/bpk-ri/dashboard-monitoring/internal/auth"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
)

// getTokenBlacklistRepo returns blacklist repository
func getTokenBlacklistRepo() *repository.TokenBlacklistRepository {
	db := database.GetDB()
	sqlDB, err := db.DB()
	if err != nil {
		panic(err) // Should never happen in production if DB is connected
	}
	sqlxDB := sqlx.NewDb(sqlDB, "postgres")
	return repository.NewTokenBlacklistRepository(sqlxDB)
}

// AuthMiddleware validates JWT from Authorization header, checks blacklist, and sets user context.
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ditemukan"})
			c.Abort()
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Format token tidak valid"})
			c.Abort()
			return
		}

		tokenString := strings.TrimSpace(parts[1])
		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}

		// Validate access token and get JTI
		userID, role, jti, err := auth.ValidateAccessToken(tokenString)
		if err != nil {
			if errors.Is(err, auth.ErrJWTSecretNotSet) {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Server misconfiguration"})
				c.Abort()
				return
			}
			if errors.Is(err, auth.ErrExpiredToken) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Token telah kedaluwarsa, silakan refresh token"})
				c.Abort()
				return
			}
			if errors.Is(err, auth.ErrInvalidTokenType) {
				c.JSON(http.StatusUnauthorized, gin.H{"error": "Tipe token tidak valid, gunakan access token"})
				c.Abort()
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid"})
			c.Abort()
			return
		}

		// Check if token is blacklisted
		blacklistRepo := getTokenBlacklistRepo()
		isBlacklisted, err := blacklistRepo.IsBlacklisted(jti)
		if err != nil {
			// Log error but don't fail request (fail open for availability)
			// In production, you might want to fail closed for security
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memverifikasi token"})
			c.Abort()
			return
		}

		if isBlacklisted {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token telah di-revoke, silakan login kembali"})
			c.Abort()
			return
		}

		// Set user context
		c.Set("user_id", userID)
		c.Set("user_role", role)
		c.Set("token_jti", jti)

		c.Next()
	}
}

// AdminMiddleware ensures user has admin role
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Get user from context (set by AuthMiddleware)
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Check if user is admin
		db := database.GetDB()
		var user entity.User
		if err := db.First(&user, userID).Error; err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "User tidak ditemukan"})
			c.Abort()
			return
		}

		if user.Role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{"error": "Akses ditolak: hanya admin yang diizinkan"})
			c.Abort()
			return
		}

		c.Next()
	}
}
