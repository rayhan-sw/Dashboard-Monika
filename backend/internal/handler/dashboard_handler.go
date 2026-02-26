// File dashboard_handler.go: HTTP handler untuk dashboard monitoring aktivitas (activity log).
//
// Endpoint: GetDashboardStats (ringkas), GetActivities (daftar paginated + DTO), GetChartData (hourly/cluster/province),
// GetAccessSuccessRate, GetProvinces, GetLokasi, GetUnits, GetClusters, GetHourlyDataForSatker, GetTopContributors, GetLogoutErrors.
// Query params umum: start_date, end_date, cluster, eselon, root_satker_id (filter pohon satker), page, page_size, limit.
// parseRegionalQueryParams mengurai filter tanggal/cluster/eselon/root_satker_id dan mengembalikan pointer + slice satkerIds untuk repo.
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

// parseRegionalQueryParams mengurai start_date, end_date, cluster, eselon, root_satker_id dari query. Jika root_satker_id valid: ambil ID root + anak via GetSatkerIdsUnderRoot, kembalikan satkerIds dan eselonPtr=nil. Jika tidak: kembalikan eselonPtr jika eselon diisi, satkerIds=nil.
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
	// Prioritas: root_satker_id → filter by pohon satker (root + semua anak); return satkerIds, eselonPtr=nil
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

// GetDashboardStats mengembalikan statistik ringkas: total user unik, login sukses (SUCCESS), total aktivitas, error logout (FAILED), jam tersibuk (0–23).
func GetDashboardStats(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	totalUsers, err := repo.GetUniqueUsersCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	successLogins, err := repo.GetCountByStatus("SUCCESS", startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	totalActivities, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	logoutErrors, err := repo.GetCountByStatus("FAILED", startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

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

// GetActivities mengembalikan daftar aktivitas terbaru dengan paginasi; response berupa DTO datar (nama, satker, lokasi, dll.).
func GetActivities(c *gin.Context) {
	repo := getActivityLogRepo()

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

	activities, err := repo.GetRecentActivities(page, pageSize, startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	total, err := repo.GetTotalCount(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	dtos := make([]dto.ActivityLogDTO, len(activities))
	for i, a := range activities {
		dtos[i] = dto.ToDTO(a)
	}

	c.JSON(http.StatusOK, gin.H{
		"data":        dtos,
		"page":        page,
		"page_size":   pageSize,
		"total":       total,
		"total_pages": (total + int64(pageSize) - 1) / int64(pageSize), // ceil(total/pageSize)
	})
}

// GetChartData mengembalikan data chart; type path: hourly (per jam 0–23), cluster (per scope), province (per provinsi).
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

// GetAccessSuccessRate mengembalikan tingkat sukses akses per tanggal (success vs failed per hari dalam rentang filter).
func GetAccessSuccessRate(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetAccessSuccessRateByDate(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetProvinces mengembalikan statistik aktivitas per provinsi (sama seperti chart type province, dengan filter regional).
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

// GetLokasi mengembalikan statistik lokasi untuk peta (per satker + provinsi).
func GetLokasi(c *gin.Context) {
	repo := getActivityLogRepo()
	startPtr, endPtr, clusterPtr, eselonPtr, satkerIds := parseRegionalQueryParams(c, repo)

	data, err := repo.GetActivityCountBySatkerProvince(startPtr, endPtr, clusterPtr, eselonPtr, satkerIds)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}

// GetUnits mengembalikan statistik aktivitas per unit/satker dengan paginasi (page, page_size).
func GetUnits(c *gin.Context) {
	repo := getActivityLogRepo()

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

// GetClusters mengembalikan daftar cluster unik (untuk dropdown/filter di frontend).
func GetClusters(c *gin.Context) {
	repo := getActivityLogRepo()

	clusters, err := repo.GetUniqueClusters()
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": clusters})
}

// GetHourlyDataForSatker mengembalikan distribusi aktivitas per jam (0–23) untuk satu satker; query param satker wajib.
func GetHourlyDataForSatker(c *gin.Context) {
	repo := getActivityLogRepo()

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

// GetTopContributors mengembalikan top N kontributor (user dengan aktivitas terbanyak); query limit (default dari config, max MaxLimit).
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

// GetLogoutErrors mengembalikan user dengan error logout terbanyak (top N); query limit (default/max dari config).
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
