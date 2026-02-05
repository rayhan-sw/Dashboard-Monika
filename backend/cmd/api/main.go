package main

import (
	"log"
	"os"

	"github.com/bpk-ri/dashboard-monitoring/internal/handler"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	// Initialize database connection
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	log.Println("Connected to database:", os.Getenv("DB_NAME"))

	// Initialize Gin router with custom settings
	r := gin.Default()
	
	// Disable trailing slash redirect to prevent 301 issues
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// CORS middleware
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

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "Dashboard BPK API",
			"version": "1.0.0",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Dashboard routes
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

		// Regional routes
		regional := api.Group("/regional")
		{
			regional.GET("/provinces", handler.GetProvinces)
			regional.GET("/locations", handler.GetLokasi)
			regional.GET("/units", handler.GetUnits)
			regional.GET("/units/hourly", handler.GetHourlyDataForSatker)
			regional.GET("/top-contributors", handler.GetTopContributors)
		}

		// Content Analytics routes (Analisis Konten)
		content := api.Group("/content")
		{
			content.GET("/dashboard-rankings", handler.GetDashboardRankings)
			content.GET("/search-modules", handler.GetSearchModuleUsage)
			content.GET("/export-stats", handler.GetExportStats)
			content.GET("/operational-intents", handler.GetOperationalIntents)
			content.GET("/global-economics", handler.GetGlobalEconomicsChart)
		}

		// Reports routes (Laporan)
		reports := api.Group("/reports")
		{
			reports.GET("/templates", handler.GetReportTemplates)
			reports.POST("/generate", handler.GenerateReport)
			reports.GET("/downloads", handler.GetRecentDownloads)
			reports.GET("/access-requests", handler.GetAccessRequests)
			reports.POST("/request-access", handler.RequestAccess)
			reports.PUT("/access-requests/:id", handler.UpdateAccessRequest)
		}

		// Search routes - register directly without trailing slash issues
		api.GET("/search", handler.GlobalSearch)
		api.GET("/search/suggestions", handler.GetSearchSuggestions)
		api.GET("/search/users", handler.SearchUsers)
		api.GET("/search/satker", handler.SearchSatker)

		// Metadata routes
		api.GET("/metadata/satker", handler.GetSatkerList)
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
