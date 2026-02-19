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

type AuthService struct {
	db *gorm.DB
}

func NewAuthService(db *gorm.DB) *AuthService {
	return &AuthService{db: db}
}

func (s *AuthService) Login(username, password string) (*entity.User, string, error) {
	var user entity.User
	var err error

	if strings.Contains(username, "@") {
		err = s.db.Where("email = ? AND is_active = ?", username, true).First(&user).Error
	} else {
		err = s.db.Where("username = ? AND is_active = ?", username, true).First(&user).Error
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, "", ErrInvalidCredentials
		}
		return nil, "", err
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password)); err != nil {
		return nil, "", ErrInvalidCredentials
	}

	now := time.Now()
	user.LastLogin = &now
	s.db.Save(&user)

	token := s.generateSessionToken(user.ID)
	return &user, token, nil
}

func (s *AuthService) Register(req entity.RegisterRequest) (*entity.User, error) {
	if !strings.HasSuffix(req.Email, "@bpk.go.id") {
		return nil, ErrInvalidEmail
	}

	if req.Password != req.ConfirmPassword {
		return nil, ErrPasswordMismatch
	}

	var existingUser entity.User
	if err := s.db.Where("username = ?", req.Username).First(&existingUser).Error; err == nil {
		return nil, ErrUsernameExists
	}

	if err := s.db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		return nil, ErrEmailExists
	}

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

	if err := s.db.Create(&newUser).Error; err != nil {
		return nil, err
	}

	return &newUser, nil
}

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

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	user.PasswordHash = string(hashedPassword)
	return s.db.Save(&user).Error
}

func (s *AuthService) generateSessionToken(userID int) string {
	return fmt.Sprintf("session_token_%d_%s", userID, time.Now().Format("20060102150405"))
}
