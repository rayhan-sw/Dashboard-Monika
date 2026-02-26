// File profile_handler.go: handler untuk profil user dan permintaan akses laporan.
//
// Endpoint: get profil (user login), update foto profil, ajukan akses laporan, daftar permintaan pending (admin), setujui/tolak akses (admin), get user by ID (testing/admin).
package handler

import (
	"net/http"
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// GetProfile mengembalikan profil user yang sedang login (user_id dari context) beserta label status akses laporan.
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

	// Label teks untuk tampilan: admin/Akses Penuh, approved/Menunggu, pending/rejected/none.
	accessLabel := getReportAccessLabel(user.Role, user.ReportAccessStatus)

	response := entity.UserProfileResponse{
		User:              user,
		ReportAccessLabel: accessLabel,
	}

	c.JSON(http.StatusOK, response)
}

// UpdateProfilePhoto mengubah foto profil user (body: profile_photo). user_id dari context.
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

// RequestReportAccess mengajukan permintaan akses laporan untuk user yang login. Admin tidak perlu; status pending/approved ditolak.
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

	if user.Role == "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Admin users already have full access"})
		return
	}

	if user.ReportAccessStatus == "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have a pending request"})
		return
	}

	if user.ReportAccessStatus == "approved" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "You already have report access"})
		return
	}

	// Set status user ke pending agar admin bisa menyetujui/tolak.
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

// GetPendingAccessRequests mengembalikan daftar user dengan report_access_status = pending. Hanya admin.
func GetPendingAccessRequests(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	db := database.GetDB()

	var user entity.User
	if err := db.First(&user, userID).Error; err != nil || user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
		return
	}

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

// ApproveReportAccess menyetujui atau menolak permintaan akses user (path :id, query action=approve|reject). Hanya admin.
func ApproveReportAccess(c *gin.Context) {
	requestUserID := c.Param("id")
	action := c.Query("action") // "approve" atau "reject"

	if action != "approve" && action != "reject" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid action. Use 'approve' or 'reject'"})
		return
	}

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

	newStatus := "rejected"
	if action == "approve" {
		newStatus = "approved"
	}

	// Hanya update jika user memang status pending (hindari ubah yang sudah approved/rejected).
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

// getReportAccessLabel mengembalikan label teks untuk role + report_access_status (untuk tampilan UI).
func getReportAccessLabel(role, status string) string {
	if role == "admin" {
		return "Akses Penuh"
	}

	switch status {
	case "approved":
		return "Akses Penuh"
	case "pending":
		return "Menunggu Persetujuan"
	case "rejected", "none", "":
		return "Terbatas/Tertolak"
	default:
		return "Terbatas/Tertolak"
	}
}

// GetUserByID mengembalikan user berdasarkan ID (path :id). Untuk keperluan testing/admin.
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
