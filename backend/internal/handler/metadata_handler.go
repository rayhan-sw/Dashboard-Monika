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
