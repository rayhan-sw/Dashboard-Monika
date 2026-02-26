// File auth_handler.go: HTTP handler untuk endpoint autentikasi Dashboard Monitoring BIDICS BPK RI.
//
// Endpoint: Login (username/email + password → JWT), Register (email @bpk.go.id, konfirmasi password),
// ForgotPassword (reset by username), Logout (pesan sukses; token dihapus di client), ChangePassword (user login, old + new + confirm).
// Request/response memakai entity.LoginRequest, RegisterRequest, ForgotPasswordRequest, ChangePasswordRequest dan response JSON.
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

// Login memproses login: bind body ke LoginRequest, cari user by username atau email, verifikasi bcrypt, update last_login, generate JWT, kembalikan LoginResponse.
func Login(c *gin.Context) {
	var req entity.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	db := database.GetDB()
	var user entity.User
	var err error
	// Jika username mengandung '@' cari by email, else by username; hanya user is_active
	if strings.Contains(req.Username, "@") {
		err = db.Where("email = ? AND is_active = ?", req.Username, true).First(&user).Error
	} else {
		err = db.Where("username = ? AND is_active = ?", req.Username, true).First(&user).Error
	}
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username/Email atau password salah"})
		return
	}
	// Verifikasi password plain dengan hash di DB; pesan error sama agar tidak bocor info
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Username/Email atau password salah"})
		return
	}

	now := time.Now()
	user.LastLogin = &now
	db.Save(&user) // Update waktu login terakhir

	token, err := auth.GenerateToken(user.ID, user.Role)
	if err != nil {
		// JWT_SECRET tidak diset di env → 503 Server misconfiguration
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

// Register memproses registrasi: bind body, validasi email @bpk.go.id dan konfirmasi password, cek duplikat username/email, hash password, INSERT user baru (role user, is_active true).
func Register(c *gin.Context) {
	var req entity.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	if !strings.HasSuffix(req.Email, "@bpk.go.id") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email harus menggunakan domain @bpk.go.id"})
		return
	}

	if req.Password != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password dan konfirmasi password tidak cocok"})
		return
	}

	db := database.GetDB()
	var existingUser entity.User
	// err == nil artinya ketemu = username sudah dipakai
	if err := db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Username sudah digunakan"})
		return
	}

	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Email sudah digunakan"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, err)
		return
	}

	newUser := entity.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Role:         "user",
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

// ForgotPassword memproses reset password: bind body, validasi new = confirm, cari user by username, hash password baru, simpan ke DB. Tidak butuh JWT (idealnya dikombinasi verifikasi email/OTP).
func ForgotPassword(c *gin.Context) {
	var req entity.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password dan konfirmasi password tidak cocok"})
		return
	}

	db := database.GetDB()
	var user entity.User
	if err := db.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Username tidak ditemukan"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, err)
		return
	}
	user.PasswordHash = string(hashedPassword)
	if err := db.Save(&user).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diperbarui. Silakan login.",
	})
}

// Logout mengembalikan JSON pesan sukses logout. Token tidak di-invalidate di server; client harus hapus token sendiri.
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout berhasil",
	})
}

// ChangePassword mengubah password user yang login: bind body, ambil user_id dari context (middleware auth), validasi new=confirm dan new!=old, verifikasi old password, hash baru, save.
func ChangePassword(c *gin.Context) {
	var req entity.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	userID, exists := c.Get("user_id") // Diset oleh AuthMiddleware setelah validasi JWT
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	if req.NewPassword != req.ConfirmPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password baru dan konfirmasi password tidak cocok"})
		return
	}
	if req.OldPassword == req.NewPassword {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password baru tidak boleh sama dengan password lama"})
		return
	}

	db := database.GetDB()
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User tidak ditemukan"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.OldPassword)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Password lama tidak sesuai"})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		response.Internal(c, err)
		return
	}
	user.PasswordHash = string(hashedPassword)
	if err := db.Save(&user).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Kata sandi berhasil diubah. Silakan login kembali.",
	})
}
