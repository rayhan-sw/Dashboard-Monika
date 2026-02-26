// File content_handler.go: HTTP handler untuk data analitik/konten dashboard (bukan aktivitas mentah).
//
// Endpoint: peringkat dashboard (GetDashboardRankings), penggunaan modul pencarian (GetSearchModuleUsage),
// statistik ekspor (GetExportStats), intensi operasional (GetOperationalIntents), chart Global Economics (GetGlobalEconomicsChart).
// Query params umum: start_date, end_date, cluster (opsional), limit (default 10 untuk intensi).
package handler

import (
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/gin-gonic/gin"
)

// GetDashboardRankings mengembalikan peringkat penggunaan dashboard (per kluster analitik) dalam rentang start_date–end_date.
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

// GetSearchModuleUsage mengembalikan statistik penggunaan modul pencarian; filter oleh start_date, end_date, cluster (opsional).
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

// GetExportStats mengembalikan statistik pemantauan ekspor/unduhan data dalam rentang tanggal; cluster opsional.
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

// GetOperationalIntents mengembalikan top N intensi operasional; query: start_date, end_date, cluster (opsional), limit (default "10").
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

// GetGlobalEconomicsChart mengembalikan data chart Global Economics (NTPN, KOMDLNG, dll.) untuk rentang start_date–end_date.
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
