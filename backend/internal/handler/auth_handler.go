package handler

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/auth"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Login handles user authentication
func Login(c *gin.Context) {
	var req entity.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	db := database.GetDB()

	// Find user by username or email
	var user entity.User
	var err error

	// Check if input contains '@' to determine if it's email or username
	// Username dan email harus persis sama dengan yang didaftarkan (case-sensitive)
	if strings.Contains(req.Username, "@") {
		err = db.Where("email = ? AND is_active = ?", req.Username, true).First(&user).Error
	} else {
		err = db.Where("username = ? AND is_active = ?", req.Username, true).First(&user).Error
	}

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username/Email atau password salah"})
		return
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username/Email atau password salah"})
		return
	}

	// Update last login
	now := time.Now()
	user.LastLogin = &now
	db.Save(&user)

	token, err := auth.GenerateToken(user.ID, user.Role)
	if err != nil {
		if errors.Is(err, auth.ErrJWTSecretNotSet) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Server misconfiguration"})
			return
		}
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, entity.LoginResponse{
		Token:   token,
		User:    user,
		Message: "Login berhasil",
	})
}

// Register handles user registration
func Register(c *gin.Context) {
	var req entity.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate email domain
	if !strings.HasSuffix(req.Email, "@bpk.go.id") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email harus menggunakan domain @bpk.go.id"})
		return
	}

	// Validate password confirmation
	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password dan konfirmasi password tidak cocok"})
		return
	}

	db := database.GetDB()

	// Check if username already exists
	var existingUser entity.User
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
		return
	}

	// Check if email already exists
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email sudah digunakan"})
		return
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Create new user
	newUser := entity.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Role:         "user", // Default role
		FullName:     req.FullName,
		Email:        req.Email,
		IsActive:     true,
	}

	if err := db.Create(&newUser).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Akun berhasil dibuat",
		"user":    newUser,
	})
}

// ForgotPassword handles password reset
func ForgotPassword(c *gin.Context) {
	var req entity.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Validate password confirmation
	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password dan konfirmasi password tidak cocok"})
		return
	}

	db := database.GetDB()

	// Find user
	var user entity.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Username tidak ditemukan"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	if err := db.Save(&user).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diperbarui. Silakan login.",
	})
}

// Logout handles user logout (client should discard the token)
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout berhasil",
	})
}

// ChangePassword handles password change for authenticated users
func ChangePassword(c *gin.Context) {
	var req entity.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Validate password confirmation
	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password baru dan konfirmasi password tidak cocok"})
		return
	}

	// Validate new password is different from old password
	if req.OldPassword == req.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password baru tidak boleh sama dengan password lama"})
		return
	}

	db := database.GetDB()

	// Find user
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	// Verify old password
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password lama tidak sesuai"})
		return
	}

	// Hash new password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Update password
	user.PasswordHash = string(hashedPassword)
	if err := db.Save(&user).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kata sandi berhasil diubah. Silakan login kembali.",
	})
}
