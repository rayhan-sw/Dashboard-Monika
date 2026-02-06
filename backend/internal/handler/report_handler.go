package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// ReportTemplate represents available report templates
type ReportTemplate struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Formats     []string `json:"formats"`
}

// DownloadHistory represents report download history
type DownloadHistory struct {
	ID         int       `json:"id"`
	ReportName string    `json:"report_name"`
	Format     string    `json:"format"`
	Size       string    `json:"size"`
	CreatedAt  time.Time `json:"created_at"`
	Status     string    `json:"status"`
}

// AccessRequest represents report access request
type AccessRequest struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	Unit        string    `json:"unit"`
	RequestTime time.Time `json:"request_time"`
	Status      string    `json:"status"` // pending, approved, rejected
}

// GetReportTemplates returns available report templates
func GetReportTemplates(c *gin.Context) {
	templates := []ReportTemplate{
		{
			ID:          "org-performance",
			Title:       "Laporan Kinerja Organisasi",
			Description: "Analisis aktivitas berdasarkan Unit Kerja (Satker) dan sebaran geografis",
			Formats:     []string{"CSV", "Excel", "PDF"},
		},
		{
			ID:          "user-activity",
			Title:       "Laporan Aktivitas Pengguna",
			Description: "Tren login harian, waktu akses puncak, dan daftar pengguna teraktif",
			Formats:     []string{"CSV", "Excel", "PDF"},
		},
		{
			ID:          "feature-usage",
			Title:       "Laporan Pemanfaatan Fitur",
			Description: "Statistik penggunaan menu, kata kunci pencarian, dan unduhan file",
			Formats:     []string{"CSV", "Excel", "PDF"},
		},
	}

	c.JSON(http.StatusOK, gin.H{"data": templates})
}

// GenerateReport generates a report based on template and format
func GenerateReport(c *gin.Context) {
	var req struct {
		TemplateID string `json:"template_id"`
		Format     string `json:"format"`
		StartDate  string `json:"start_date"`
		EndDate    string `json:"end_date"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// Generate report data based on template
	reportData, err := repository.GenerateReportData(req.TemplateID, req.StartDate, req.EndDate)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"template_id":  req.TemplateID,
		"format":       req.Format,
		"data":         reportData,
		"generated_at": time.Now(),
	})
}

// GetRecentDownloads returns recent download history (Admin only)
func GetRecentDownloads(c *gin.Context) {
	// In a real app, this would come from database
	// For now, return mock data
	downloads := []DownloadHistory{
		{
			ID:         1,
			ReportName: "Kinerja Organisasi & Wilayah - Jan 2026",
			Format:     "PDF",
			Size:       "245KB",
			CreatedAt:  time.Date(2026, 1, 9, 9, 30, 0, 0, time.UTC),
			Status:     "completed",
		},
		{
			ID:         2,
			ReportName: "Tren Aktivitas Pengguna - Q4 2025",
			Format:     "Excel",
			Size:       "245KB",
			CreatedAt:  time.Date(2025, 12, 12, 9, 30, 0, 0, time.UTC),
			Status:     "completed",
		},
		{
			ID:         3,
			ReportName: "Laporan Pemanfaatan Fitur - Q4 2025",
			Format:     "PDF",
			Size:       "245KB",
			CreatedAt:  time.Date(2026, 1, 9, 9, 30, 0, 0, time.UTC),
			Status:     "completed",
		},
	}

	c.JSON(http.StatusOK, gin.H{"data": downloads})
}

// GetAccessRequests returns pending access requests (Admin only)
func GetAccessRequests(c *gin.Context) {
	db := database.GetDB()

	// Get all access requests with user data
	var requests []entity.ReportAccessRequest
	if err := db.Preload("User").Order("requested_at DESC").Find(&requests).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch access requests"})
		return
	}

	// Transform to response format
	type AccessRequestResponse struct {
		ID          int       `json:"id"`
		UserID      int       `json:"user_id"`
		UserName    string    `json:"user_name"`
		Unit        string    `json:"unit"`
		RequestedAt time.Time `json:"requested_at"`
		Status      string    `json:"status"`
		Reason      string    `json:"reason,omitempty"`
	}

	responseData := make([]AccessRequestResponse, 0, len(requests))
	pendingCount := 0

	for _, r := range requests {
		userName := "Unknown User"
		if r.User != nil {
			if r.User.FullName != "" {
				userName = r.User.FullName
			} else {
				userName = r.User.Username
			}
		}

		responseData = append(responseData, AccessRequestResponse{
			ID:          r.ID,
			UserID:      r.UserID,
			UserName:    userName,
			Unit:        "Biro TI", // Default unit, can be extended later
			RequestedAt: r.RequestedAt,
			Status:      r.Status,
			Reason:      r.Reason,
		})

		if r.Status == "pending" {
			pendingCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":          responseData,
		"pending_count": pendingCount,
	})
}

// RequestAccess allows user to request report access
func RequestAccess(c *gin.Context) {
	var req struct {
		UserID int    `json:"user_id"`
		Reason string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.UserID == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	db := database.GetDB()

	// Check if user exists
	var user entity.User
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// Check if user already has pending or approved request
	if user.ReportAccessStatus == "pending" {
		c.JSON(http.StatusConflict, gin.H{"error": "Permintaan akses sedang diproses"})
		return
	}
	if user.ReportAccessStatus == "approved" {
		c.JSON(http.StatusConflict, gin.H{"error": "Anda sudah memiliki akses laporan"})
		return
	}

	// Create new access request
	accessRequest := entity.ReportAccessRequest{
		UserID:      req.UserID,
		Reason:      req.Reason,
		Status:      "pending",
		RequestedAt: time.Now(),
	}

	if err := db.Create(&accessRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal membuat permintaan akses"})
		return
	}

	// Update user's report access status
	if err := db.Model(&user).Update("report_access_status", "pending").Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Gagal memperbarui status"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"message":    "Permintaan akses berhasil dikirim",
		"request_id": accessRequest.ID,
	})
}

// UpdateAccessRequest updates access request status (Admin only)
func UpdateAccessRequest(c *gin.Context) {
	id := c.Param("id")
	requestID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req struct {
		Status     string `json:"status"` // approved or rejected
		AdminNotes string `json:"admin_notes,omitempty"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	if req.Status != "approved" && req.Status != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Status must be 'approved' or 'rejected'"})
		return
	}

	db := database.GetDB()

	// Find the access request
	var accessRequest entity.ReportAccessRequest
	if err := db.First(&accessRequest, requestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	// Update the access request
	now := time.Now()
	accessRequest.Status = req.Status
	accessRequest.ProcessedAt = &now
	accessRequest.AdminNotes = req.AdminNotes

	if err := db.Save(&accessRequest).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update request"})
		return
	}

	// Update user's report access status
	newStatus := req.Status
	if req.Status == "rejected" {
		newStatus = "none" // Reset to none so they can request again
	}
	if err := db.Model(&entity.User{}).Where("id = ?", accessRequest.UserID).Update("report_access_status", newStatus).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user status"})
		return
	}

	// Create notification for the user
	notifTitle := "Akses Laporan"
	notifMessage := "Permintaan akses laporan Anda telah disetujui"
	notifType := "success"
	if req.Status == "rejected" {
		notifMessage = "Permintaan akses laporan Anda ditolak"
		notifType = "error"
	}

	notification := entity.Notification{
		UserID:        accessRequest.UserID,
		Title:         notifTitle,
		Message:       notifMessage,
		Type:          notifType,
		IsRead:        false,
		RelatedEntity: "report_access",
		RelatedID:     &requestID,
		CreatedAt:     time.Now(),
	}

	db.Create(&notification) // Ignore error, notification is not critical

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"request_id": requestID,
		"status":     req.Status,
		"message":    "Status permintaan berhasil diperbarui",
	})
}
