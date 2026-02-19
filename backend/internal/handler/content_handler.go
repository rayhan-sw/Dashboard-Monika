package handler

import (
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/gin-gonic/gin"
)

// GetDashboardRankings - Peringkat Penggunaan Dashboard (kluster analitik)
func GetDashboardRankings(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	rankings, err := repository.GetDashboardRankings(startDate, endDate)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": rankings})
}

// GetSearchModuleUsage - Penggunaan Modul Pencarian
func GetSearchModuleUsage(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")

	modules, err := repository.GetSearchModuleUsage(startDate, endDate, cluster)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": modules})
}

// GetExportStats - Pemantauan Ekspor Data
func GetExportStats(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	cluster := c.Query("cluster")

	stats, err := repository.GetExportStats(startDate, endDate, cluster)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": stats})
}

// GetOperationalIntents - Analisis Intensi Operasional
func GetOperationalIntents(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")
	limit := c.DefaultQuery("limit", "10")
	cluster := c.Query("cluster")

	intents, err := repository.GetOperationalIntents(startDate, endDate, cluster, limit)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": intents})
}

// GetGlobalEconomicsChart - Chart untuk Global Economics (NTPN, KOMDLNG, dll)
func GetGlobalEconomicsChart(c *gin.Context) {
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	data, err := repository.GetGlobalEconomicsChart(startDate, endDate)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{"data": data})
}
