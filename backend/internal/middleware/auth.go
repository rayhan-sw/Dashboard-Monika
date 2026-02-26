// Package middleware berisi middleware HTTP untuk autentikasi dan otorisasi.
//
// File auth.go: AuthMiddleware (validasi JWT dari header Authorization, set user_id dan user_role di context),
// AdminMiddleware (pastikan user punya role admin; harus dipasang setelah AuthMiddleware).
package middleware

import (
	"errors"
	"net/http"
	"strings"

	"github.com/bpk-ri/dashboard-monitoring/internal/auth"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// AuthMiddleware memvalidasi JWT dari header Authorization (format "Bearer <token>") dan menyimpan user_id serta user_role di context.
// Jika token tidak ada, format salah, atau invalid/kedaluwarsa, request di-abort dengan 401. Handler berikutnya bisa membaca c.Get("user_id") dan c.Get("user_role").
func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak ditemukan"})
			c.Abort()
			return
		}

		// Harus "Bearer <token>" (dua bagian dipisah spasi).
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

		userID, role, err := auth.ValidateToken(tokenString)
		if err != nil {
			if errors.Is(err, auth.ErrJWTSecretNotSet) {
				c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Server misconfiguration"})
				c.Abort()
				return
			}
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Token tidak valid atau kedaluwarsa"})
			c.Abort()
			return
		}

		// Simpan di context agar handler bisa pakai c.Get("user_id") dan c.Get("user_role").
		c.Set("user_id", userID)
		c.Set("user_role", role)

		c.Next()
	}
}

// AdminMiddleware memastikan user yang sudah login punya role admin. Harus dipasang setelah AuthMiddleware (butuh user_id di context).
// Jika user_id tidak ada atau user tidak ditemukan: 401. Jika role bukan admin: 403.
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
			c.Abort()
			return
		}

		// Ambil user dari DB untuk cek role (bisa saja role di JWT sudah berubah; sumber kebenaran tetap DB).
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

