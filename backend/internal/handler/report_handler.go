package handler

import (
	"net/http"
	"strconv"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
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
	// In a real app, this would come from database
	requests := []AccessRequest{
		{
			ID:          1,
			Username:    "Budi Santoso",
			Unit:        "BPK Perwakilan Jawa Barat",
			RequestTime: time.Date(2026, 1, 31, 10, 30, 0, 0, time.UTC),
			Status:      "pending",
		},
		{
			ID:          2,
			Username:    "Susi Susanti",
			Unit:        "Auditorat Utama Keuangan Negara I",
			RequestTime: time.Date(2026, 1, 31, 9, 30, 0, 0, time.UTC),
			Status:      "pending",
		},
		{
			ID:          3,
			Username:    "Rizky Fajar",
			Unit:        "Biro TI",
			RequestTime: time.Date(2026, 1, 30, 12, 30, 0, 0, time.UTC),
			Status:      "pending",
		},
	}

	// Count pending requests
	pendingCount := 0
	for _, r := range requests {
		if r.Status == "pending" {
			pendingCount++
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"data":          requests,
		"pending_count": pendingCount,
	})
}

// RequestAccess allows user to request report access
func RequestAccess(c *gin.Context) {
	var req struct {
		ReportID string `json:"report_id"`
		Reason   string `json:"reason"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	// In a real app, this would save to database
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "Permintaan akses berhasil dikirim",
	})
}

// UpdateAccessRequest updates access request status (Admin only)
func UpdateAccessRequest(c *gin.Context) {
	id := c.Param("id")

	var req struct {
		Status string `json:"status"` // approved or rejected
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	requestID, _ := strconv.Atoi(id)

	// In a real app, this would update database
	c.JSON(http.StatusOK, gin.H{
		"success":    true,
		"request_id": requestID,
		"status":     req.Status,
		"message":    "Status permintaan berhasil diperbarui",
	})
}
