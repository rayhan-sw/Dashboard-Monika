package handler

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/bpk-ri/dashboard-monitoring/internal/service"
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

	// Get user ID from context or header
	userID, exists := c.Get("user_id")

	// Default values for anonymous/testing access
	var userIDInt int = 1 // Default to system user
	generatedBy := "System"
	username := "anonymous"
	email := "system@bpk.go.id"

	// If user is authenticated via context, get their info
	if exists {
		userIDInt = userID.(int)
	} else {
		// Try to get user ID from header (for non-auth middleware routes)
		userIDStr := c.GetHeader("X-User-ID")
		if userIDStr != "" {
			if _, err := fmt.Sscanf(userIDStr, "%d", &userIDInt); err == nil && userIDInt > 0 {
				// Successfully parsed user ID from header
			} else {
				userIDInt = 1 // Reset to default if parse failed
			}
		}
	}

	// Get user info from database if not default system user
	if userIDInt > 0 {
		db := database.GetDB()
		var user entity.User
		if err := db.First(&user, userIDInt).Error; err == nil {
			generatedBy = user.FullName
			if generatedBy == "" {
				generatedBy = user.Username
			}
			username = user.Username
			email = user.Email
		}
	}

	// Generate report data based on template
	reportData, err := repository.GenerateReportData(req.TemplateID, req.StartDate, req.EndDate)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Initialize report generator
	outputDir := "generated_reports"
	generator := service.NewReportGenerator(outputDir)

	// Prepare metadata
	metadata := service.ReportMetadata{
		GeneratedBy: generatedBy,
		Username:    username,
		Email:       email,
		DateRange:   req.StartDate + " - " + req.EndDate,
	}

	// Generate file based on format
	var filename string
	formatUpper := strings.ToUpper(req.Format)

	switch formatUpper {
	case "CSV":
		filename, err = generator.GenerateCSV(req.TemplateID, reportData, metadata)
	case "EXCEL", "XLSX":
		filename, err = generator.GenerateExcel(req.TemplateID, reportData, metadata)
	case "PDF":
		filename, err = generator.GeneratePDF(req.TemplateID, reportData, metadata)
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid format. Supported formats: CSV, Excel, PDF"})
		return
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": fmt.Sprintf("Failed to generate report: %v", err)})
		return
	}

	// Get file info
	fileInfo, err := os.Stat(filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file info"})
		return
	}

	// Calculate file size in human-readable format
	fileSize := formatFileSize(fileInfo.Size())

	// Prepare date pointers (nil if empty string)
	var startDate, endDate *string
	if req.StartDate != "" {
		startDate = &req.StartDate
	}
	if req.EndDate != "" {
		endDate = &req.EndDate
	}

	// Track the download in database
	download := &entity.ReportDownload{
		UserID:     userIDInt,
		ReportName: reportData.Title,
		TemplateID: req.TemplateID,
		Format:     formatUpper,
		FileSize:   fileSize,
		StartDate:  startDate,
		EndDate:    endDate,
	}

	if err := repository.CreateReportDownload(download); err != nil {
		// Log error but don't fail the request
		c.Error(err)
	}

	// Return download URL
	baseFilename := filepath.Base(filename)
	downloadURL := fmt.Sprintf("/api/reports/download/%s", baseFilename)

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"template_id":  req.TemplateID,
		"format":       formatUpper,
		"filename":     baseFilename,
		"download_url": downloadURL,
		"file_size":    fileSize,
		"generated_at": time.Now(),
	})
}

// DownloadFile serves generated report files
func DownloadFile(c *gin.Context) {
	filename := c.Param("filename")

	// Security: prevent directory traversal
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	// Construct file path
	filePath := filepath.Join("generated_reports", filename)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

	// Determine content type based on file extension
	ext := strings.ToLower(filepath.Ext(filename))
	var contentType string
	switch ext {
	case ".csv":
		contentType = "text/csv"
	case ".xlsx":
		contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".pdf":
		contentType = "application/pdf"
	default:
		contentType = "application/octet-stream"
	}

	c.Header("Content-Type", contentType)
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	c.File(filePath)
}

func formatFileSize(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(bytes)/float64(div), "KMGTPE"[exp])
}

// GetRecentDownloads returns recent download history from database
func GetRecentDownloads(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", strconv.Itoa(config.DefaultLimit))
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = config.DefaultLimit
	}

	// Get optional date filters
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// Get downloads from database with optional date filters
	downloads, err := repository.GetRecentDownloadsWithFilter(limit, startDate, endDate)
	if err != nil {
		// If table report_downloads does not exist (migration 007 not applied), return empty list so UI does not break
		if strings.Contains(err.Error(), "report_downloads") && strings.Contains(err.Error(), "does not exist") {
			c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch downloads"})
		return
	}

	// Transform to response format
	type DownloadResponse struct {
		ID           int    `json:"id"`
		ReportName   string `json:"report_name"`
		Format       string `json:"format"`
		DownloadedBy string `json:"downloaded_by"`
		GeneratedAt  string `json:"generated_at"`
		FileSize     string `json:"file_size,omitempty"`
	}

	var response []DownloadResponse
	for _, d := range downloads {
		downloadedBy := "Unknown"
		if d.User != nil {
			downloadedBy = d.User.FullName
			if downloadedBy == "" {
				downloadedBy = d.User.Username
			}
		}

		response = append(response, DownloadResponse{
			ID:           d.ID,
			ReportName:   d.ReportName,
			Format:       d.Format,
			DownloadedBy: downloadedBy,
			GeneratedAt:  d.GeneratedAt.Format(time.RFC3339),
			FileSize:     d.FileSize,
		})
	}

	c.JSON(http.StatusOK, gin.H{"data": response})
}

// GetAccessRequests returns pending access requests (Admin only)
func GetAccessRequests(c *gin.Context) {
	db := database.GetDB()

	// Get all access requests with user data
	var requests []entity.ReportAccessRequest
	if err := db.Preload("User").Order("requested_at DESC").Find(&requests).Error; err != nil {
		response.Internal(c, err)
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
		response.Internal(c, err)
		return
	}

	// Update user's report access status
	if err := db.Model(&user).Update("report_access_status", "pending").Error; err != nil {
		response.Internal(c, err)
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
		response.Internal(c, err)
		return
	}

	// Update user's report access status
	newStatus := req.Status
	if req.Status == "rejected" {
		newStatus = "none" // Reset to none so they can request again
	}
	if err := db.Model(&entity.User{}).Where("id = ?", accessRequest.UserID).Update("report_access_status", newStatus).Error; err != nil {
		response.Internal(c, err)
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
