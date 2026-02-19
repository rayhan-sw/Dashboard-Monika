package main

import (
	"log"
	"os"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/handler"
	"github.com/bpk-ri/dashboard-monitoring/internal/middleware"
	"github.com/bpk-ri/dashboard-monitoring/internal/service"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment")
	}

	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	log.Println("Connected to database:", os.Getenv("DB_NAME"))

	startCleanupService()
	router := setupRouter()
	startServer(router)
}

func startCleanupService() {
	cleanupService := service.NewCleanupService(
		"generated_reports",
		24*time.Hour,
		1*time.Hour,
	)
	cleanupService.Start()
	log.Println("Cleanup service started for generated_reports")
}

func setupRouter() *gin.Engine {
	r := gin.Default()
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	r.Use(corsMiddleware())

	r.GET("/health", healthCheck)

	setupAuthRoutes(r)
	setupAPIRoutes(r)

	return r
}

func corsMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	}
}

func healthCheck(c *gin.Context) {
	c.JSON(200, gin.H{
		"status":  "ok",
		"service": "Dashboard BPK API",
		"version": "1.0.0",
	})
}

func setupAuthRoutes(r *gin.Engine) {
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", handler.Login)
		auth.POST("/register", handler.Register)
		auth.POST("/forgot-password", handler.ForgotPassword)
		auth.POST("/logout", handler.Logout)
	}
}

func setupAPIRoutes(r *gin.Engine) {
	api := r.Group("/api")
	{
		setupDashboardRoutes(api)
		setupRegionalRoutes(api)
		setupContentRoutes(api)
		setupReportRoutes(api)
		setupNotificationRoutes(api)
		setupUserRoutes(api)
		setupProfileRoutes(api)
		setupSearchRoutes(api)
		setupMetadataRoutes(api)
	}
}

func setupDashboardRoutes(api *gin.RouterGroup) {
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
}

func setupRegionalRoutes(api *gin.RouterGroup) {
	regional := api.Group("/regional")
	{
		regional.GET("/provinces", handler.GetProvinces)
		regional.GET("/locations", handler.GetLokasi)
		regional.GET("/units", handler.GetUnits)
		regional.GET("/units/hourly", handler.GetHourlyDataForSatker)
		regional.GET("/top-contributors", handler.GetTopContributors)
	}
}

func setupContentRoutes(api *gin.RouterGroup) {
	content := api.Group("/content")
	{
		content.GET("/dashboard-rankings", handler.GetDashboardRankings)
		content.GET("/search-modules", handler.GetSearchModuleUsage)
		content.GET("/export-stats", handler.GetExportStats)
		content.GET("/operational-intents", handler.GetOperationalIntents)
		content.GET("/global-economics", handler.GetGlobalEconomicsChart)
	}
}

func setupReportRoutes(api *gin.RouterGroup) {
	reports := api.Group("/reports")
	{
		reports.GET("/templates", handler.GetReportTemplates)
		reports.POST("/generate", handler.GenerateReport)
		reports.GET("/downloads", handler.GetRecentDownloads)
		reports.GET("/download/:filename", handler.DownloadFile)
		reports.GET("/access-requests", handler.GetAccessRequests)
		reports.POST("/request-access", handler.RequestAccess)
		reports.PUT("/access-requests/:id", handler.UpdateAccessRequest)
	}
}

func setupNotificationRoutes(api *gin.RouterGroup) {
	notifications := api.Group("/notifications")
	{
		notifications.GET("", handler.GetNotifications)
		notifications.PUT("/:id/read", handler.MarkNotificationRead)
		notifications.POST("/read-all", handler.MarkAllNotificationsRead)
	}
}

func setupUserRoutes(api *gin.RouterGroup) {
	users := api.Group("/users")
	{
		users.GET("/profile", handler.GetUserProfile)
	}
}

func setupProfileRoutes(api *gin.RouterGroup) {
	profile := api.Group("/profile")
	profile.Use(middleware.AuthMiddleware())
	{
		profile.GET("", handler.GetProfile)
		profile.PUT("/photo", handler.UpdateProfilePhoto)
		profile.POST("/request-access", handler.RequestReportAccess)
		profile.GET("/access-requests", handler.GetPendingAccessRequests)
		profile.PUT("/access-requests/:id", handler.ApproveReportAccess)
	}
}

func setupSearchRoutes(api *gin.RouterGroup) {
	api.GET("/search", handler.GlobalSearch)
	api.GET("/search/suggestions", handler.GetSearchSuggestions)
	api.GET("/search/users", handler.SearchUsers)
	api.GET("/search/satker", handler.SearchSatker)
}

func setupMetadataRoutes(api *gin.RouterGroup) {
	api.GET("/metadata/satker", handler.GetSatkerList)
}

func startServer(r *gin.Engine) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
