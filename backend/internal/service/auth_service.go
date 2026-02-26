// File auth_service.go: logika bisnis autentikasi (login, register, reset password) dan pembuatan token sesi.
//
// Login: cari user by username atau email, verifikasi bcrypt, update last_login, kembalikan token. Register: validasi email @bpk.go.id, konfirmasi password, cek duplikat, hash, create user. ResetPassword: validasi konfirmasi, cari user, hash baru, save.
package service

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("username/email atau password salah")
	ErrUserNotFound       = errors.New("username tidak ditemukan")
	ErrUsernameExists     = errors.New("username sudah digunakan")
	ErrEmailExists        = errors.New("email sudah digunakan")
	ErrInvalidEmail       = errors.New("email harus menggunakan domain @bpk.go.id")
	ErrPasswordMismatch   = errors.New("password dan konfirmasi password tidak cocok")
)

// AuthService menyimpan koneksi DB untuk operasi auth (login, register, reset password).
type AuthService struct {
	db *gorm.DB
}

// NewAuthService membuat instance AuthService.
func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

// Login mencari user by username atau email (jika input mengandung '@'), verifikasi password dengan bcrypt, update last_login, lalu mengembalikan user dan token sesi. Jika user tidak ada atau password salah → ErrInvalidCredentials.
func (s *AuthService) Login(username, password string) (*entity.User, string, error) {
	var user entity.User
	var err error

	// Jika input mengandung '@' cari by email, else cari by username; hanya user is_active
	if strings.Contains(username, "@") {
		err = s.db.Where("email = ? AND is_active = ?", username, true).First(&user).Error
	} else {
		err = s.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error
	}

	if err != nil {
		// Agar tidak bocor info: user tidak ada dan password salah sama-sama kembalikan ErrInvalidCredentials
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}

	// Verifikasi password plain dengan hash di DB
	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	// Update waktu login terakhir lalu simpan ke DB
	now := time.Now()
	user.LastLogin = &now
	s.db.Save(&user)

	token := s.generateSessionToken(user.ID)
	return &user, token, nil
}

// Register memvalidasi email @bpk.go.id dan konfirmasi password, cek duplikat username/email, hash password, lalu membuat user baru (role user, is_active true).
func (s *AuthService) Register(req entity.RegisterRequest) (*entity.User, error) {
	// Hanya email domain @bpk.go.id yang boleh daftar
	if !strings.HasSuffix(req.Email, "@bpk.go.id") {
		return nil, ErrInvalidEmail
	}

	if req.Password != req.ConfirmPassword {
		return nil, ErrPasswordMismatch
	}

	// Cek username belum dipakai (err == nil artinya ketemu = duplikat)
	var existingUser entity.User
	if err := s.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return nil, ErrUsernameExists
	}

	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, ErrEmailExists
	}

	// Hash password sebelum simpan (bcrypt.DefaultCost)
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}

	newUser := entity.User{
		Username:     req.Username,
		PasswordHash: string(hashedPassword),
		Role:         "user",
		FullName:     req.FullName,
		Email:        req.Email,
		IsActive:     true,
	}

	// Insert user baru ke DB
	if err := s.db.Create(&newUser).Error; err != nil {
		return nil, err
	}

	return &newUser, nil
}

// ResetPassword memvalidasi newPassword = confirmPassword, mencari user by username, hash password baru, lalu menyimpan ke DB. Jika user tidak ada → ErrUserNotFound.
func (s *AuthService) ResetPassword(username, newPassword, confirmPassword string) error {
	if newPassword != confirmPassword {
		return ErrPasswordMismatch
	}

	var user entity.User
	if err := s.db.Where("username = ?", username).First(&user).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrUserNotFound
		}
		return err
	}

	// Hash password baru lalu update kolom PasswordHash
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return s.db.Save(&user).Error
}

// generateSessionToken menghasilkan string token sesi berformat session_token_{userID}_{timestamp YYYYMMDDHHmmss}.
func (s *AuthService) generateSessionToken(userID int) string {
	return fmt.Sprintf("session_token_%d_%s", userID, time.Now().Format("20060102150405"))
}
