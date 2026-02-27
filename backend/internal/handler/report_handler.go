// File report_handler.go: handler untuk laporan (template, generate, unduh, riwayat) dan permintaan akses laporan (report_access_requests).
//
// Endpoint: daftar template, generate report (CSV/Excel/PDF), download file, riwayat unduhan, daftar permintaan akses (admin), ajukan akses, update status permintaan (admin).
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

// ReportTemplate dipakai untuk response daftar template laporan (id, judul, deskripsi, format yang didukung).
type ReportTemplate struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Description string   `json:"description"`
	Formats     []string `json:"formats"`
}

// DownloadHistory dipakai untuk response riwayat unduhan (id, nama laporan, format, ukuran, waktu, status).
type DownloadHistory struct {
	ID         int       `json:"id"`
	ReportName string    `json:"report_name"`
	Format     string    `json:"format"`
	Size       string    `json:"size"`
	CreatedAt  time.Time `json:"created_at"`
	Status     string    `json:"status"`
}

// AccessRequest dipakai untuk response permintaan akses (id, username, unit, waktu, status pending/approved/rejected).
type AccessRequest struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	Unit        string    `json:"unit"`
	RequestTime time.Time `json:"request_time"`
	Status      string    `json:"status"`
}

// GetReportTemplates mengembalikan daftar template laporan yang tersedia (hardcoded: org-performance, user-activity, feature-usage).
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

// GenerateReport membuat laporan berdasarkan template_id, format (CSV/Excel/PDF), dan rentang tanggal. Menyimpan file di generated_reports, mencatat di report_downloads, mengembalikan URL unduh.
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

	userID, exists := c.Get("user_id")

	var userIDInt int = 1
	generatedBy := "System"
	username := "anonymous"
	email := "system@bpk.go.id"

	if exists {
		userIDInt = userID.(int)
	} else {
		// Fallback: baca X-User-ID dari header (rute tanpa middleware auth).
		userIDStr := c.GetHeader("X-User-ID")
		if userIDStr != "" {
			if _, err := fmt.Sscanf(userIDStr, "%d", &userIDInt); err == nil && userIDInt > 0 {
				// OK
			} else {
				userIDInt = 1
			}
		}
	}

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

	reportData, err := repository.GenerateReportData(req.TemplateID, req.StartDate, req.EndDate)
	if err != nil {
		response.Internal(c, err)
		return
	}

	outputDir := "generated_reports"
	generator := service.NewReportGenerator(outputDir)

	metadata := service.ReportMetadata{
		GeneratedBy: generatedBy,
		Username:    username,
		Email:       email,
		DateRange:   req.StartDate + " - " + req.EndDate,
	}

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

	fileInfo, err := os.Stat(filename)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get file info"})
		return
	}

	fileSize := formatFileSize(fileInfo.Size())

	var startDate, endDate *string
	if req.StartDate != "" {
		startDate = &req.StartDate
	}
	if req.EndDate != "" {
		endDate = &req.EndDate
	}

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
		c.Error(err) // Catat error tapi jangan gagalkan response
	}

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

// DownloadFile mengirim file laporan yang sudah di-generate (path :filename). Cegah path traversal; set Content-Type dan Content-Disposition.
func DownloadFile(c *gin.Context) {
	filename := c.Param("filename")

	// Cegah directory traversal (.., /, \).
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid filename"})
		return
	}

	filePath := filepath.Join("generated_reports", filename)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "File not found"})
		return
	}

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

// formatFileSize mengonversi ukuran dalam byte ke string terbaca (B, KB, MB, GB, ...).
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

// GetRecentDownloads mengembalikan riwayat unduhan terbaru. Query: limit, start_date, end_date (opsional). Jika tabel report_downloads belum ada, kembalikan array kosong agar UI tidak error.
func GetRecentDownloads(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", strconv.Itoa(config.DefaultLimit))
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = config.DefaultLimit
	}

	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	downloads, err := repository.GetRecentDownloadsWithFilter(limit, startDate, endDate)
	if err != nil {
		if strings.Contains(err.Error(), "report_downloads") && strings.Contains(err.Error(), "does not exist") {
			c.JSON(http.StatusOK, gin.H{"data": []interface{}{}})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch downloads"})
		return
	}

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

// GetAccessRequests mengembalikan semua permintaan akses laporan (dengan data user). Untuk admin. Response termasuk pending_count.
func GetAccessRequests(c *gin.Context) {
	db := database.GetDB()

	var requests []entity.ReportAccessRequest
	if err := db.Preload("User").Order("requested_at DESC").Find(&requests).Error; err != nil {
		response.Internal(c, err)
		return
	}

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
			Unit:        "Biro TI", // Default unit; bisa diperluas dari profil/satker
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

// RequestAccess membuat permintaan akses laporan (body: user_id, reason). Buat record di report_access_requests dan set user.report_access_status = pending.
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

	var user entity.User
	if err := db.First(&user, req.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	if user.ReportAccessStatus == "pending" {
		c.JSON(http.StatusConflict, gin.H{"error": "Permintaan akses sedang diproses"})
		return
	}
	if user.ReportAccessStatus == "approved" {
		c.JSON(http.StatusConflict, gin.H{"error": "Anda sudah memiliki akses laporan"})
		return
	}

	// Check rejection count from previous requests
	var lastRequest entity.ReportAccessRequest
	err := db.Where("user_id = ?", req.UserID).
		Order("requested_at DESC").
		First(&lastRequest).Error

	rejectionCount := 0
	if err == nil {
		// User has previous requests
		rejectionCount = lastRequest.RejectionCount

		// If last request was rejected, increment the count
		if lastRequest.Status == "rejected" {
			rejectionCount++
		}
	}

	// Check if user has reached maximum rejection limit (3 times)
	if rejectionCount >= 3 {
		c.JSON(http.StatusForbidden, gin.H{
			"error":           "Anda telah mencapai batas maksimal penolakan (3 kali). Silakan hubungi administrator untuk informasi lebih lanjut.",
			"rejection_count": rejectionCount,
		})
		return
	}

	// Create new access request with carried over rejection count
	accessRequest := entity.ReportAccessRequest{
		UserID:         req.UserID,
		Reason:         req.Reason,
		Status:         "pending",
		RejectionCount: rejectionCount,
		RequestedAt:    time.Now(),
	}

	if err := db.Create(&accessRequest).Error; err != nil {
		response.Internal(c, err)
		return
	}

	// Sinkronkan status user ke pending agar konsisten dengan permintaan.
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

// UpdateAccessRequest mengubah status permintaan akses (path :id, body: status approved/rejected, admin_notes). Hanya admin. Update report_access_requests dan users.report_access_status; buat notifikasi untuk user.
func UpdateAccessRequest(c *gin.Context) {
	id := c.Param("id")
	requestID, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request ID"})
		return
	}

	var req struct {
		Status     string `json:"status"`
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

	var accessRequest entity.ReportAccessRequest
	if err := db.First(&accessRequest, requestID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Request not found"})
		return
	}

	now := time.Now()
	accessRequest.Status = req.Status
	accessRequest.ProcessedAt = &now
	accessRequest.AdminNotes = req.AdminNotes

	// Update rejection count based on status
	if req.Status == "rejected" {
		// Increment rejection count when rejected
		accessRequest.RejectionCount++
	} else if req.Status == "approved" {
		// Reset rejection count when approved
		accessRequest.RejectionCount = 0
	}

	if err := db.Save(&accessRequest).Error; err != nil {
		response.Internal(c, err)
		return
	}

	// Jika ditolak, set user ke "none" agar bisa ajukan lagi.
	newStatus := req.Status
	if req.Status == "rejected" {
		newStatus = "none"
	}
	if err := db.Model(&entity.User{}).Where("id = ?", accessRequest.UserID).Update("report_access_status", newStatus).Error; err != nil {
		response.Internal(c, err)
		return
	}

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

	db.Create(&notification)

	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"request_id": requestID,
		"status":     req.Status,
		"message":    "Status permintaan berhasil diperbarui",
	})
}
