package handler

import (
	"net/http"
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/dto"
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/gin-gonic/gin"
)

// parseRegionalQueryParams parses start_date, end_date, cluster, eselon, root_satker_id.
// When root_satker_id is set, returns satkerIds (root + descendants) and eselonPtr=nil for filter-by-Eselon-I.
func parseRegionalQueryParams(c *gin.Context, repo repository.ActivityLogRepository) (startPtr, endPtr, clusterPtr, eselonPtr *string, satkerIds []int64) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	rootIDStr := c.Query("root_satker_id")

	if startDate != "" {
		startPtr = &startDate
	}
	if endDate != "" {
		endPtr = &endDate
	}
	if cluster != "" {
		clusterPtr = &cluster
	}
	if rootIDStr != "" {
		rootID, err := strconv.ParseInt(rootIDStr, 10, 64)
		if err == nil {
			ids, err := repo.GetSatkerIdsUnderRoot(rootID)
			if err == nil && len(ids) > 0 {
				return startPtr, endPtr, clusterPtr, nil, ids
			}
		}
	}
	if eselon != "" {
		eselonPtr = &eselon
	}
	return startPtr, endPtr, clusterPtr, eselonPtr, nil
}

// GetDashboardStats returns dashboard statistics
func GetDashboardStats(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	// Get total users (unique tokens)
	totalUsers, err := repo.GetUniqueUsersCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Get successful logins
	successLogins, err := repo.GetCountByStatus("SUCCESS", startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Get total activities
	totalActivities, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Get logout errors
	logoutErrors, err := repo.GetCountByStatus("FAILED", startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Get busiest hour
	busiestHour, count, err := repo.GetBusiestHour(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
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
	repo := getActivityLogRepo()

	// Parse pagination parameters
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(config.DefaultPageSizeActivities)))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 {
		pageSize = config.DefaultPageSizeActivities
	}
	if pageSize > config.MaxPageSizeActivities {
		pageSize = config.MaxPageSizeActivities
	}

	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	// Get recent activities
	activities, err := repo.GetRecentActivities(page, pageSize, startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Get total count
	total, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Map to flat DTOs
	dtos := make([]dto.ActivityLogDTO, len(activities))
	for i, a := range activities {
		dtos[i] = dto.ToDTO(a)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        dtos,
		"page":        page,
		"page_size":   pageSize,
		"total":       total,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize),
	})
}

// GetChartData returns chart data based on type
func GetChartData(c *gin.Context) {
	chartType := c.Param("type")
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	switch chartType {
	case "hourly":
		data, err := repo.GetActivityCountByHour(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
		if err != nil {
			response.Internal(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": data})

	case "cluster":
		data, err := repo.GetActivityCountByScope(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
		if err != nil {
			response.Internal(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": data})

	case "province":
		data, err := repo.GetActivityCountByProvince(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
		if err != nil {
			response.Internal(c, err)
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": data})

	default:
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid chart type"})
	}
}

// GetAccessSuccessRate returns access success rate over time
func GetAccessSuccessRate(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	// Get success/failed counts by date
	data, err := repo.GetAccessSuccessRateByDate(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetProvinces returns provincial statistics
func GetProvinces(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetActivityCountByProvince(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetLokasi returns location statistics based on lokasi field
func GetLokasi(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	// Use satker province-based data for map visualization
	data, err := repo.GetActivityCountBySatkerProvince(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetUnits returns unit/satker statistics
func GetUnits(c *gin.Context) {
	repo := getActivityLogRepo()

	// Parse pagination
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", strconv.Itoa(config.DefaultPageSizeUnits)))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > config.MaxPageSizeUnits {
		pageSize = config.DefaultPageSizeUnits
	}

	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetActivityCountBySatker(page, pageSize, startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	// Get total count
	total, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
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
	repo := getActivityLogRepo()

	clusters, err := repo.GetUniqueClusters()
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": clusters})
}

// GetHourlyDataForSatker returns hourly activity distribution for a specific satker
func GetHourlyDataForSatker(c *gin.Context) {
	repo := getActivityLogRepo()

	// Get satker from query parameter
	satker := c.Query("satker")
	if satker == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "satker parameter is required"})
		return
	}

	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetActivityCountByHourForSatker(satker, startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetTopContributors returns top contributors (users with most activities)
func GetTopContributors(c *gin.Context) {
	repo := getActivityLogRepo()

	limitStr := c.DefaultQuery("limit", strconv.Itoa(config.DefaultLimit))
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = config.DefaultLimit
	}
	if limit > config.MaxLimit {
		limit = config.MaxLimit
	}

	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetTopContributors(limit, startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetLogoutErrors returns users with most logout errors (sorted by latest error)
func GetLogoutErrors(c *gin.Context) {
	repo := getActivityLogRepo()

	limitStr := c.DefaultQuery("limit", strconv.Itoa(config.DefaultLimit))
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = config.DefaultLimit
	}
	if limit > config.MaxLimit {
		limit = config.MaxLimit
	}

	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetLogoutErrors(limit, startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
			response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}
