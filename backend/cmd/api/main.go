// Package main adalah entry point untuk HTTP API server Dashboard Monitoring BIDICS BPK RI.
//
// Program ini:
//   - Memuat konfigurasi dari file .env (database, JWT, port, dll.)
//   - Menghubungkan ke database PostgreSQL
//   - Mendaftarkan semua route API (auth, dashboard, search, content, report, dll.)
//   - Menjalankan server HTTP di port yang ditentukan (default: 8080)
//
// Cara menjalankan (dari root folder backend):
//
//	go run cmd/api/main.go

package main

import (
	"log"
	"os"

	"github.com/bpk-ri/dashboard-monitoring/internal/server"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/joho/godotenv"
)

func main() {
	// Muat variabel lingkungan dari .env. Coba path relatif dari cmd/api dulu (../../.env),
	// lalu fallback ke working directory. Jika keduanya gagal, pakai env sistem saja.
	if err := godotenv.Load("../../.env"); err != nil {
		if err2 := godotenv.Load(); err2 != nil {
			log.Println("No .env file found, using system environment")
		}
	}

	// Inisialisasi koneksi database PostgreSQL (baca DB_* dari env).
	// Keluar jika koneksi gagal.
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	log.Println("Connected to database:", os.Getenv("DB_NAME"))

	// Port server; default 8080 jika PORT tidak diset di .env.
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Setup router Gin: middleware, route auth/dashboard/search/content/report/notifikasi/org-tree/metadata.
	r := server.SetupRouter()
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
