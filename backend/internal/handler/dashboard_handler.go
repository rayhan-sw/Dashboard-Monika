package handler

import (
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// GetDashboardStats returns dashboard statistics from real database
func GetDashboardStats(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())
	
	// Get total activities
	totalActivity, err := repo.GetTotalCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Get success logins (status = "SUCCESS")
	successLogins, err := repo.GetCountByStatus("SUCCESS")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Get unique users count
	totalUsers, err := repo.GetUniqueUsersCount()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	// Get logout errors
	logoutErrors, err := repo.GetCountByStatus("FAILED")
	if err != nil {
		logoutErrors = 0
	}
	
	// Get busiest hour
	busiestHour, err := repo.GetBusiestHour()
	if err != nil {
		busiestHour = map[string]interface{}{
			"start": 13,
			"end":   14,
			"count": 0,
		}
	}
	
	stats := gin.H{
		"totalUsers":    totalUsers,
		"successLogins": successLogins,
		"totalActivity": totalActivity,
		"logoutErrors":  logoutErrors,
		"busiestHour":   busiestHour,
	}
	c.JSON(http.StatusOK, stats)
}

// GetActivities returns recent activities from database
func GetActivities(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())
	
	// Get recent 50 activities
	activities, err := repo.GetRecentActivities(50)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{
		"data":  activities,
		"total": len(activities),
	})
}

// GetChartData returns chart data based on type from real database
func GetChartData(c *gin.Context) {
	chartType := c.Param("type")
	repo := repository.NewActivityLogRepository(database.GetDB())

	var data interface{}
	switch chartType {
	case "interaction":
		scopeCounts, err := repo.GetActivityCountByScope()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		data = scopeCounts
		
	case "hourly":
		hourCounts, err := repo.GetActivityCountByHour()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		
		var hourlyData []gin.H
		for hour := 0; hour < 24; hour++ {
			count := hourCounts[hour]
			hourlyData = append(hourlyData, gin.H{
				"hour":  hour,
				"count": count,
			})
		}
		data = hourlyData
		
	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chart type"})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetProvinces returns provinces data from database
func GetProvinces(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())
	
	provinceCounts, err := repo.GetActivityCountByProvince()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	var provinces []gin.H
	i := 1
	for province, count := range provinceCounts {
		provinces = append(provinces, gin.H{
			"id":            i,
			"name":          province,
			"activityCount": count,
		})
		i++
	}
	c.JSON(http.StatusOK, gin.H{"data": provinces})
}

// GetUnits returns organizational units data from database
func GetUnits(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())
	
	unitCounts, err := repo.GetActivityCountByUnit()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	var units []gin.H
	i := 1
	for unit, count := range unitCounts {
		units = append(units, gin.H{
			"id":            i,
			"name":          unit,
			"activityCount": count,
		})
		i++
	}
	c.JSON(http.StatusOK, gin.H{"data": units})
}

// GetAccessSuccessRate returns access success rate by scope
func GetAccessSuccessRate(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())
	
	data, err := repo.GetAccessSuccessRateByScope()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	
	c.JSON(http.StatusOK, gin.H{"data": data})
}
