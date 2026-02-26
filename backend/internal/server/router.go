// Package server berisi inisialisasi HTTP server (Gin engine) dan pendaftaran route + middleware.
//
// File router.go: SetupRouter membuat engine Gin, pasang CORS, health check, dan semua route API (auth, account, dashboard, regional, content, reports, notifications, users, profile, search, metadata, org-tree).
package server

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/handler"
	"github.com/bpk-ri/dashboard-monitoring/internal/middleware"
	"github.com/gin-gonic/gin"
)

// SetupRouter membuat dan mengonfigurasi engine Gin dengan semua route dan middleware (CORS, auth). Dipanggil dari cmd/api/main.go.
func SetupRouter() *gin.Engine {
	r := gin.Default()

	// Jangan redirect /path ke /path/ atau normalisasi path; biarkan path persis seperti request.
	r.RedirectTrailingSlash = false
	r.RedirectFixedPath = false

	// Middleware CORS: baca Origin request, set Access-Control-Allow-Origin dari config.CORSOrigin (ALLOWED_ORIGINS env; kosong = "*").
	r.Use(func(c *gin.Context) {
		if origin := config.CORSOrigin(c.Request.Header.Get("Origin")); origin != "" {
			c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
		}
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-ID")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Endpoint health check: GET /health → 200 + status/service/version.
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":  "ok",
			"service": "Dashboard BPK API",
			"version": "1.0.0",
		})
	})

	// Grup auth (publik): login, register, lupa password, logout.
	auth := r.Group("/api/auth")
	{
		auth.POST("/login", handler.Login)
		auth.POST("/register", handler.Register)
		auth.POST("/forgot-password", handler.ForgotPassword)
		auth.POST("/logout", handler.Logout)
	}

	// Semua route di bawah prefix /api (kecuali auth sudah di atas).
	api := r.Group("/api")
	{
		// Akun: ganti password (butuh JWT).
		account := api.Group("/account")
		account.Use(middleware.AuthMiddleware())
		{
			account.POST("/change-password", handler.ChangePassword)
		}

		// Dashboard: statistik, aktivitas, chart, sukses akses, date-range, clusters, logout errors.
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

		// Regional: provinsi, lokasi, unit, jam per satker, top kontributor.
		regional := api.Group("/regional")
		{
			regional.GET("/provinces", handler.GetProvinces)
			regional.GET("/locations", handler.GetLokasi)
			regional.GET("/units", handler.GetUnits)
			regional.GET("/units/hourly", handler.GetHourlyDataForSatker)
			regional.GET("/top-contributors", handler.GetTopContributors)
		}

		// Konten/analitik: peringkat dashboard, modul pencarian, ekspor, intensi operasional, chart global economics.
		content := api.Group("/content")
		{
			content.GET("/dashboard-rankings", handler.GetDashboardRankings)
			content.GET("/search-modules", handler.GetSearchModuleUsage)
			content.GET("/export-stats", handler.GetExportStats)
			content.GET("/operational-intents", handler.GetOperationalIntents)
			content.GET("/global-economics", handler.GetGlobalEconomicsChart)
		}

		// Laporan: template, generate, download file, riwayat unduhan, permintaan akses, request/update akses.
		reports := api.Group("/reports")
		{
			reports.GET("/templates", handler.GetReportTemplates)
			reports.POST("/generate", handler.GenerateReport)
			reports.GET("/download/:filename", handler.DownloadFile)
			reports.GET("/downloads", handler.GetRecentDownloads)
			reports.GET("/access-requests", handler.GetAccessRequests)
			reports.POST("/request-access", handler.RequestAccess)
			reports.PUT("/access-requests/:id", handler.UpdateAccessRequest)
		}

		// Notifikasi: daftar, tandai baca, tandai semua baca (semua butuh JWT).
		notifications := api.Group("/notifications")
		notifications.Use(middleware.AuthMiddleware())
		{
			notifications.GET("", handler.GetNotifications)
			notifications.PUT("/:id/read", handler.MarkNotificationRead)
			notifications.POST("/read-all", handler.MarkAllNotificationsRead)
		}

		// Users: profil user (query user_id).
		users := api.Group("/users")
		{
			users.GET("/profile", handler.GetUserProfile)
		}

		// Profil user login: get profil, update foto, ajukan akses laporan (semua butuh JWT).
		profile := api.Group("/profile")
		profile.Use(middleware.AuthMiddleware())
		{
			profile.GET("", handler.GetProfile)
			profile.PUT("/photo", handler.UpdateProfilePhoto)
			profile.POST("/request-access", handler.RequestReportAccess)
		}

		// Pencarian global, saran, cari user, cari satker.
		api.GET("/search", handler.GlobalSearch)
		api.GET("/search/suggestions", handler.GetSearchSuggestions)
		api.GET("/search/users", handler.SearchUsers)
		api.GET("/search/satker", handler.SearchSatker)

		// Metadata: daftar satker, root Eselon I, anak root.
		api.GET("/metadata/satker", handler.GetSatkerList)
		api.GET("/metadata/satker/roots/:id/children", handler.GetSatkerRootChildren)
		api.GET("/metadata/satker/roots", handler.GetSatkerRoots)

		// Pohon organisasi: tree, level eselon, pencarian unit.
		api.GET("/org-tree", handler.GetOrganizationalTree)
		api.GET("/org-tree/levels", handler.GetEselonLevels)
		api.GET("/org-tree/search", handler.SearchOrganizationalUnits)
	}

	return r
}
