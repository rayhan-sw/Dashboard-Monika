package handler

import (
	"net/http"
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetProfile retrieves the current user's profile with computed fields
func GetProfile(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	db := database.GetDB()
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user profile"})
		return
	}

	// Compute report access label
	accessLabel := getReportAccessLabel(user.Role, user.ReportAccessStatus)

	response := entity.UserProfileResponse{
		User:              user,
		ReportAccessLabel: accessLabel,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProfilePhoto updates the user's profile photo
func UpdateProfilePhoto(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req entity.UpdateProfilePhotoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	db := database.GetDB()

	// Update profile photo
	result := db.Model(&entity.User{}).
		Where("id = ?", userID).
		Update("profile_photo", req.ProfilePhoto)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile photo"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Retrieve updated user
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve updated profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile photo updated successfully",
		"user":    user,
	})
}

// RequestReportAccess allows users to request report access
func RequestReportAccess(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	db := database.GetDB()
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user is admin (admin always has access)
	if user.Role == "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin users already have full access"})
		return
	}

	// Check current status
	if user.ReportAccessStatus == "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a pending request"})
		return
	}

	if user.ReportAccessStatus == "approved" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have report access"})
		return
	}

	// Update status to pending
	result := db.Model(&entity.User{}).
		Where("id = ?", userID).
		Update("report_access_status", "pending")

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit request"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Report access request submitted successfully",
		"status":  "pending",
	})
}

// GetPendingAccessRequests retrieves all pending access requests (admin only)
func GetPendingAccessRequests(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	db := database.GetDB()

	// Check if user is admin
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Get all users with pending requests
	var users []entity.User
	if err := db.Where("report_access_status = ?", "pending").Find(&users).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve access requests"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"requests": users,
		"count":    len(users),
	})
}

// ApproveReportAccess approves or rejects a user's report access request (admin only)
func ApproveReportAccess(c *gin.Context) {
	requestUserID := c.Param("id")
	action := c.Query("action") // "approve" or "reject"

	// Validate action
	if action != "approve" && action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action. Use 'approve' or 'reject'"})
		return
	}

	// Check if requester is admin
	adminID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	db := database.GetDB()
	var admin entity.User
	if err := db.First(&admin, adminID).Error; err != nil || admin.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

	// Update user's access status
	newStatus := "rejected"
	if action == "approve" {
		newStatus = "approved"
	}

	result := db.Model(&entity.User{}).
		Where("id = ? AND report_access_status = ?", requestUserID, "pending").
		Update("report_access_status", newStatus)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update access status"})
		return
	}

	if result.RowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "No pending request found for this user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Access request " + action + "d successfully",
		"status":  newStatus,
	})
}

func getReportAccessLabel(role, status string) string {
	if role == "admin" {
		return "Akses Penuh"
	}

	switch status {
	case "approved":
		return "Akses Penuh"
	case "pending":
		return "Menunggu Persetujuan"
	case "rejected":
		return "Terbatas/Tertolak"
	case "none":
		return "Terbatas/Tertolak"
	default:
		return "Terbatas/Tertolak"
	}
}

// GetUserByID retrieves a user by ID (for testing/admin purposes)
func GetUserByID(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.Atoi(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	db := database.GetDB()
	var user entity.User
	if err := db.First(&user, userID).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		return
	}

	c.JSON(http.StatusOK, user)
}
