package handler

import (
	"errors"
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/service"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {
	var req entity.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	authService := service.NewAuthService(database.GetDB())
	user, token, err := authService.Login(req.Username, req.Password)

	if err != nil {
		if errors.Is(err, service.ErrInvalidCredentials) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal melakukan login"})
		return
	}

	c.JSON(http.StatusOK, entity.LoginResponse{
		Token:   token,
		User:    *user,
		Message: "Login berhasil",
	})
}

func Register(c *gin.Context) {
	var req entity.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	authService := service.NewAuthService(database.GetDB())
	user, err := authService.Register(req)

	if err != nil {
		switch err {
		case service.ErrInvalidEmail:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case service.ErrPasswordMismatch:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		case service.ErrUsernameExists:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		case service.ErrEmailExists:
			c.JSON(http.StatusConflict, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat akun"})
		}
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Akun berhasil dibuat",
		"user":    user,
	})
}

func ForgotPassword(c *gin.Context) {
	var req entity.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format"})
		return
	}

	authService := service.NewAuthService(database.GetDB())
	err := authService.ResetPassword(req.Username, req.NewPassword, req.ConfirmPassword)

	if err != nil {
		switch err {
		case service.ErrUserNotFound:
			c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		case service.ErrPasswordMismatch:
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		default:
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal mengubah password"})
		}
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Password berhasil diubah",
	})
}

func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"message": "Logout berhasil",
	})
}
