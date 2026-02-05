package handler

import (
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// GetDateRange returns min and max date from database
func GetDateRange(c *gin.Context) {
	db := database.GetDB()

	var result struct {
		MinDate string
		MaxDate string
	}

	err := db.Model(&entity.ActivityLog{}).
		Select("DATE(MIN(tanggal)) as min_date, DATE(MAX(tanggal)) as max_date").
		Scan(&result).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"min_date": result.MinDate,
		"max_date": result.MaxDate,
	})
}

// SatkerOption represents a satker with its eselon
type SatkerOption struct {
	Kode   string `json:"kode"`
	Nama   string `json:"nama"`
	Eselon string `json:"eselon"`
}

// GetSatkerList returns list of unique satker with their eselon
func GetSatkerList(c *gin.Context) {
	db := database.GetDB()

	var satkerList []SatkerOption

	// Get unique satker with their eselon from database
	err := db.Raw(`
		SELECT DISTINCT 
			kode_satker as kode,
			satker as nama,
			eselon
		FROM act_log 
		WHERE satker IS NOT NULL AND satker != '' 
		ORDER BY eselon, satker
	`).Scan(&satkerList).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data": satkerList,
	})
}
