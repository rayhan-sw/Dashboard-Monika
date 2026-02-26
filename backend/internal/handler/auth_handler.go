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

const (
	// Max concurrent sessions per user (prevents session flooding)
	MaxSessionsPerUser = 5

	// Cookie settings
	RefreshTokenCookie = "refresh_token"
	CookieMaxAge       = 7 * 24 * 60 * 60 // 7 days in seconds
)

// Login handles user authentication with refresh token strategy
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

	// Generate token pair (access + refresh)
	tokenPair, err := auth.GenerateTokenPair(user.ID, user.Role)
	if err != nil {
		if errors.Is(err, auth.ErrJWTSecretNotSet) {
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "Server misconfiguration"})
			return
		}
		response.Internal(c, err)
		return
	}

	// Store refresh token in database
	refreshTokenRepo := getRefreshTokenRepo()
	deviceInfo := c.GetHeader("User-Agent")
	if deviceInfo == "" {
		deviceInfo = "Unknown Device"
	}

	refreshTokenEntity := &entity.RefreshToken{
		JTI:        tokenPair.RefreshJTI,
		UserID:     user.ID,
		DeviceInfo: deviceInfo,
		IPAddress:  c.ClientIP(),
		ExpiresAt:  tokenPair.ExpiresAt,
		CreatedAt:  time.Now(),
		LastUsedAt: time.Now(),
	}

	if err := refreshTokenRepo.Create(refreshTokenEntity); err != nil {
		response.Internal(c, err)
		return
	}

	// Limit concurrent sessions per user
	refreshTokenRepo.DeleteOldestIfExceedsLimit(user.ID, MaxSessionsPerUser)

	// Update last login
	now := time.Now()
	user.LastLogin = &now
	db.Save(&user)

	// Set refresh token as httpOnly cookie
	c.SetCookie(
		RefreshTokenCookie,     // name
		tokenPair.RefreshToken, // value
		CookieMaxAge,           // max age in seconds
		"/",                    // path
		"",                     // domain (empty = current domain)
		false,                  // secure (set true in production with HTTPS)
		true,                   // httpOnly (not accessible via JavaScript)
	)

	// Return access token and user info (NOT refresh token)
	c.JSON(http.StatusOK, gin.H{
		"access_token": tokenPair.AccessToken,
		"expires_in":   tokenPair.ExpiresIn,
		"user":         user,
		"message":      "Login berhasil",
	})
}

// RefreshToken handles token refresh - exchanges refresh token for new access token
func RefreshToken(c *gin.Context) {
	// Get refresh token from httpOnly cookie
	refreshToken, err := c.Cookie(RefreshTokenCookie)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token tidak ditemukan"})
		return
	}

	// Validate refresh token
	userID, role, jti, err := auth.ValidateRefreshToken(refreshToken)
	if err != nil {
		if errors.Is(err, auth.ErrExpiredToken) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token telah expired, silakan login kembali"})
			return
		}
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token tidak valid"})
		return
	}

	// Check if refresh token is blacklisted
	blacklistRepo := getTokenBlacklistRepo()
	isBlacklisted, err := blacklistRepo.IsBlacklisted(jti)
	if err != nil {
		response.Internal(c, err)
		return
	}
	if isBlacklisted {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token telah di-revoke, silakan login kembali"})
		return
	}

	// Check if refresh token exists in database
	refreshTokenRepo := getRefreshTokenRepo()
	storedToken, err := refreshTokenRepo.FindByJTI(jti)
	if err != nil {
		response.Internal(c, err)
		return
	}
	if storedToken == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token tidak valid"})
		return
	}

	// Check if token is expired (double check)
	if storedToken.IsExpired() {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Refresh token telah expired"})
		return
	}

	// Generate new access token (NOT new refresh token for security)
	accessToken, _, err := auth.GenerateAccessToken(userID, role)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Update last used timestamp
	refreshTokenRepo.UpdateLastUsed(jti)

	c.JSON(http.StatusOK, gin.H{
		"access_token": accessToken,
		"expires_in":   int(auth.AccessTokenExpiry.Seconds()),
		"message":      "Token berhasil di-refresh",
	})
}

// Logout handles user logout - blacklists current refresh token
func Logout(c *gin.Context) {
	// Get refresh token from cookie
	refreshToken, err := c.Cookie(RefreshTokenCookie)
	if err != nil {
		// No refresh token, but logout is still successful (client-side cleanup)
		c.SetCookie(RefreshTokenCookie, "", -1, "/", "", false, true)
		c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
		return
	}

	// Extract JTI from refresh token
	jti, err := auth.ExtractJTI(refreshToken)
	if err == nil && jti != "" {
		// Get token details for blacklist
		claims, err := auth.ValidateToken(refreshToken)
		if err == nil {
			// Add to blacklist
			blacklistRepo := getTokenBlacklistRepo()
			blacklist := &entity.TokenBlacklist{
				JTI:           jti,
				UserID:        claims.UserID,
				TokenType:     entity.BlacklistReasonLogout,
				Reason:        entity.BlacklistReasonLogout,
				BlacklistedAt: time.Now(),
				ExpiresAt:     claims.ExpiresAt.Time,
			}
			blacklistRepo.Add(blacklist)

			// Delete from refresh_tokens table
			refreshTokenRepo := getRefreshTokenRepo()
			refreshTokenRepo.Delete(jti)
		}
	}

	// Clear cookie
	c.SetCookie(RefreshTokenCookie, "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{"message": "Logout berhasil"})
}

// LogoutAll handles logout from all devices - blacklists all user's refresh tokens
func LogoutAll(c *gin.Context) {
	// Get user ID from context (set by auth middleware)
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Blacklist all user's refresh tokens
	blacklistRepo := getTokenBlacklistRepo()
	count, err := blacklistRepo.BlacklistAllUserTokens(userID.(int), entity.BlacklistReasonLogoutAll)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Delete all refresh tokens from database
	refreshTokenRepo := getRefreshTokenRepo()
	refreshTokenRepo.DeleteAllByUserID(userID.(int))

	// Clear current device's cookie
	c.SetCookie(RefreshTokenCookie, "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message":            "Logout dari semua perangkat berhasil",
		"devices_logged_out": count,
	})
}

// GetActiveSessions returns all active sessions for current user
func GetActiveSessions(c *gin.Context) {
	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	refreshTokenRepo := getRefreshTokenRepo()
	sessions, err := refreshTokenRepo.GetActiveSessions(userID.(int))
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"sessions": sessions,
		"total":    len(sessions),
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

// ForgotPassword handles password reset (should blacklist all tokens)
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

	// Blacklist all user's tokens (security: password reset should invalidate all sessions)
	blacklistRepo := getTokenBlacklistRepo()
	blacklistRepo.BlacklistAllUserTokens(user.ID, entity.BlacklistReasonPasswordChange)

	// Delete all refresh tokens
	refreshTokenRepo := getRefreshTokenRepo()
	refreshTokenRepo.DeleteAllByUserID(user.ID)

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diperbarui. Silakan login kembali dari semua perangkat.",
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

	// Blacklist all user's tokens (security: password change should invalidate all sessions)
	blacklistRepo := getTokenBlacklistRepo()
	blacklistRepo.BlacklistAllUserTokens(user.ID, entity.BlacklistReasonPasswordChange)

	// Delete all refresh tokens
	refreshTokenRepo := getRefreshTokenRepo()
	refreshTokenRepo.DeleteAllByUserID(user.ID)

	// Clear current cookie
	c.SetCookie(RefreshTokenCookie, "", -1, "/", "", false, true)

	c.JSON(http.StatusOK, gin.H{
		"message": "Kata sandi berhasil diubah. Silakan login kembali dari semua perangkat.",
	})
}
