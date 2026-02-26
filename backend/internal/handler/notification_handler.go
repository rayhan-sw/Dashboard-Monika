// File notification_handler.go: handler untuk notifikasi user dan profil user.
//
// Endpoint: daftar notifikasi per user (dengan jumlah belum dibaca), tandai satu notifikasi dibaca, tandai semua dibaca, ambil profil user.
package handler

import (
	"net/http"
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// GetNotifications mengembalikan daftar notifikasi untuk user_id (query). Urut terbaru dulu; plus jumlah belum dibaca.
func GetNotifications(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	db := database.GetDB()

	var notifications []entity.Notification
	if err := db.Where("user_id = ?", userID).Order("created_at DESC").Find(&notifications).Error; err != nil {
		response.Internal(c, err)
		return
	}

	// Hitung notifikasi yang belum dibaca (is_read = false).
	var unreadCount int64
	db.Model(&entity.Notification{}).Where("user_id = ? AND is_read = ?", userID, false).Count(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"data":         notifications,
		"unread_count": unreadCount,
	})
}

// MarkNotificationRead menandai satu notifikasi (path :id) sebagai sudah dibaca (is_read = true).
func MarkNotificationRead(c *gin.Context) {
	id := c.Param("id")
	notifID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid notification ID"})
		return
	}

	db := database.GetDB()

	if err := db.Model(&entity.Notification{}).Where("id = ?", notifID).Update("is_read", true).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Notification marked as read",
	})
}

// MarkAllNotificationsRead menandai semua notifikasi milik user (body: user_id) sebagai sudah dibaca.
func MarkAllNotificationsRead(c *gin.Context) {
	var req struct {
		UserID int `json:"user_id"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	db := database.GetDB()

	if err := db.Model(&entity.Notification{}).Where("user_id = ?", req.UserID).Update("is_read", true).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "All notifications marked as read",
	})
}

// GetUserProfile mengembalikan profil user (termasuk status akses laporan) berdasarkan user_id (query).
func GetUserProfile(c *gin.Context) {
	userIDStr := c.Query("user_id")
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id is required"})
		return
	}

	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id"})
		return
	}

	db := database.GetDB()

	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": user,
	})
}
