package handler

import (
	"net/http"
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// GetDashboardStats returns dashboard statistics
func GetDashboardStats(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	// Get total users (unique tokens)
	totalUsers, err := repo.GetUniqueUsersCount(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get successful logins
	successLogins, err := repo.GetCountByStatus("SUCCESS", startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total activities
	totalActivities, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get logout errors
	logoutErrors, err := repo.GetCountByStatus("FAILED", startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get busiest hour
	busiestHour, count, err := repo.GetBusiestHour(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"total_users":      totalUsers,
		"success_logins":   successLogins,
		"total_activities": totalActivities,
		"logout_errors":    logoutErrors,
		"busiest_hour": gin.H{
			"hour":  busiestHour,
			"count": count,
		},
	})
}

// GetActivities returns paginated activity logs
func GetActivities(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = 10
	}
	// Allow larger page sizes for data analysis (max 10000)
	if pageSize > 10000 {
		pageSize = 10000
	}

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	// Get recent activities
	activities, err := repo.GetRecentActivities(page, pageSize, startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total count
	total, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        activities,
		"page":        page,
		"page_size":   pageSize,
		"total":       total,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// GetChartData returns chart data based on type
func GetChartData(c *gin.Context) {
	chartType := c.Param("type")
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	switch chartType {
	case "hourly":
		data, err := repo.GetActivityCountByHour(startPtr, endPtr, clusterPtr, eselonPtr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": data})

	case "cluster":
		data, err := repo.GetActivityCountByScope(startPtr, endPtr, clusterPtr, eselonPtr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": data})

	case "province":
		data, err := repo.GetActivityCountByProvince(startPtr, endPtr, clusterPtr, eselonPtr)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": data})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chart type"})
	}
}

// GetAccessSuccessRate returns access success rate over time
func GetAccessSuccessRate(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Get date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")

	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	// Get success/failed counts by date
	data, err := repo.GetAccessSuccessRateByDate(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetProvinces returns provincial statistics
func GetProvinces(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	data, err := repo.GetActivityCountByProvince(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetLokasi returns location statistics based on lokasi field
func GetLokasi(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	data, err := repo.GetActivityCountByLokasi(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetUnits returns unit/satker statistics
func GetUnits(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	data, err := repo.GetActivityCountBySatker(page, pageSize, startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Get total count
	total, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        data,
		"page":        page,
		"page_size":   pageSize,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// GetClusters returns list of unique clusters
func GetClusters(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	clusters, err := repo.GetUniqueClusters()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": clusters})
}

// GetHourlyDataForSatker returns hourly activity distribution for a specific satker
func GetHourlyDataForSatker(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())
	
	// Get satker from query parameter
	satker := c.Query("satker")
	if satker == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "satker parameter is required"})
		return
	}

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	
	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	data, err := repo.GetActivityCountByHourForSatker(satker, startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetTopContributors returns top contributors (users with most activities)
func GetTopContributors(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse limit from query params (default 10)
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100 // Max 100
	}

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")

	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	data, err := repo.GetTopContributors(limit, startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetLogoutErrors returns users with most logout errors (sorted by latest error)
func GetLogoutErrors(c *gin.Context) {
	repo := repository.NewActivityLogRepository(database.GetDB())

	// Parse limit from query params (default 10)
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100 // Max 100
	}

	// Parse date range, cluster, and eselon from query params
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")

	var startPtr, endPtr, clusterPtr, eselonPtr *string
	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if eselon != "" {
		eselonPtr = &eselon
	}

	data, err := repo.GetLogoutErrors(limit, startPtr, endPtr, clusterPtr, eselonPtr)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

