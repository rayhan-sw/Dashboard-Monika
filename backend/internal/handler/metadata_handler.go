package handler

import (
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
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
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"min_date": result.MinDate,
		"max_date": result.MaxDate,
	})
}

// SatkerOption represents a satker with its eselon
type SatkerOption struct {
	ID          int64   `json:"id"`
	SatkerName  string  `json:"satker_name"`
	EselonLevel string  `json:"eselon_level"`
	ParentID    *int64  `json:"parent_id"`
}

// GetSatkerList returns list of satker units for tree view
func GetSatkerList(c *gin.Context) {
	db := database.GetDB()

	var satkerList []SatkerOption

	// Get all satker units with parent relationship (Eselon only, exclude KAP, Eksternal, Staf Ahli, Wakil Ketua)
	err := db.Raw(`
		SELECT 
			id,
			satker_name,
			eselon_level,
			parent_id
		FROM ref_satker_units
		WHERE satker_name IS NOT NULL 
			AND satker_name != '' 
			AND (eselon_level LIKE 'Eselon%' OR eselon_level LIKE 'E%')
			AND eselon_level NOT IN ('Eksternal', 'Kelompok Jabatan Fungsional')
			AND satker_name NOT LIKE 'KAP%'
			AND satker_name NOT LIKE 'Staf Ahli%'
			AND satker_name NOT IN ('Wakil Ketua')
		ORDER BY 
			CASE 
				WHEN parent_id IS NULL OR parent_id = 0 THEN 0
				ELSE 1
			END,
			eselon_level, 
			satker_name
	`).Scan(&satkerList).Error

	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"satker": satkerList,
	})
}
