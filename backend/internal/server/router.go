package server

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/handler"
	"github.com/gin-gonic/gin"
)

// SetupRouter creates and configures the Gin engine with all routes and middleware.
func SetupRouter() *gin.Engine {
	r := gin.Default()

	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// CORS
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "Dashboard BPK API",
			"version": "1.0.0",
		})
	})

	// Auth (public)
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", handler.Login)
		auth.POST("/register", handler.Register)
		auth.POST("/forgot-password", handler.ForgotPassword)
		auth.POST("/logout", handler.Logout)
	}

	// API
	api := r.Group("/api")
	{
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("/stats", handler.GetDashboardStats)
			dashboard.GET("/activities", handler.GetActivities)
			dashboard.GET("/charts/:type", handler.GetChartData)
			dashboard.GET("/access-success", handler.GetAccessSuccessRate)
			dashboard.GET("/date-range", handler.GetDateRange)
			dashboard.GET("/clusters", handler.GetClusters)
			dashboard.GET("/logout-errors", handler.GetLogoutErrors)
		}

		regional := api.Group("/regional")
		{
			regional.GET("/provinces", handler.GetProvinces)
			regional.GET("/locations", handler.GetLokasi)
			regional.GET("/units", handler.GetUnits)
			regional.GET("/units/hourly", handler.GetHourlyDataForSatker)
			regional.GET("/top-contributors", handler.GetTopContributors)
		}

		content := api.Group("/content")
		{
			content.GET("/dashboard-rankings", handler.GetDashboardRankings)
			content.GET("/search-modules", handler.GetSearchModuleUsage)
			content.GET("/export-stats", handler.GetExportStats)
			content.GET("/operational-intents", handler.GetOperationalIntents)
			content.GET("/global-economics", handler.GetGlobalEconomicsChart)
		}

		reports := api.Group("/reports")
		{
			reports.GET("/templates", handler.GetReportTemplates)
			reports.POST("/generate", handler.GenerateReport)
			reports.GET("/downloads", handler.GetRecentDownloads)
			reports.GET("/access-requests", handler.GetAccessRequests)
			reports.POST("/request-access", handler.RequestAccess)
			reports.PUT("/access-requests/:id", handler.UpdateAccessRequest)
		}

		notifications := api.Group("/notifications")
		{
			notifications.GET("", handler.GetNotifications)
			notifications.PUT("/:id/read", handler.MarkNotificationRead)
			notifications.POST("/read-all", handler.MarkAllNotificationsRead)
		}

		users := api.Group("/users")
		{
			users.GET("/profile", handler.GetUserProfile)
		}

		api.GET("/search", handler.GlobalSearch)
		api.GET("/search/suggestions", handler.GetSearchSuggestions)
		api.GET("/search/users", handler.SearchUsers)
		api.GET("/search/satker", handler.SearchSatker)
		api.GET("/metadata/satker", handler.GetSatkerList)
		api.GET("/org-tree", handler.GetOrganizationalTree)
		api.GET("/org-tree/levels", handler.GetEselonLevels)
		api.GET("/org-tree/search", handler.SearchOrganizationalUnits)
	}

	return r
}
