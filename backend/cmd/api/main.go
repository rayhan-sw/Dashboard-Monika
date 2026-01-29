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

	log.Println("✓ Connected to database:", os.Getenv("DB_NAME"))

	// Initialize Gin router
	r := gin.Default()

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
		}

		// Regional routes
		regional := api.Group("/regional")
		{
			regional.GET("/provinces", handler.GetProvinces)
			regional.GET("/locations", handler.GetLokasi)
			regional.GET("/units", handler.GetUnits)
			regional.GET("/units/hourly", handler.GetHourlyDataForSatker)
		}
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
