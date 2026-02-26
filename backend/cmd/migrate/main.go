// Package main adalah CLI untuk menjalankan migrasi skema database (SQL).
//
// Program ini:
//   - Memuat konfigurasi dari backend/.env
//   - Membuat tabel schema_migrations jika belum ada (untuk mencatat migrasi yang sudah dijalankan)
//   - Mencari semua file *.up.sql di folder backend/migrations, mengurutkan berdasarkan nama file
//   - Untuk setiap file: jika versi belum tercatat di schema_migrations, jalankan isi SQL-nya lalu catat versi
//   - Migrasi yang sudah pernah dijalankan akan di-skip
//
// Cara menjalankan (dari root folder backend):
//
//	go run cmd/migrate/main.go
//
// Prasyarat: backend/.env berisi koneksi DB (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
// Folder backend/migrations harus berisi file migrasi dengan nama berakhiran .up.sql (misalnya 001_initial.up.sql).
package main

import (
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Muat .env: coba dari working directory (.env), lalu dari parent (../.env). Jika gagal, pakai env sistem.
	envPath := filepath.Join(".env")
	if err := godotenv.Load(envPath); err != nil {
		if err2 := godotenv.Load(filepath.Join("..", ".env")); err2 != nil {
			log.Println("No .env file found, using system environment")
		}
	}

	// Koneksi ke PostgreSQL memakai DSN yang dibangun dari variabel DB_*.
	dsn := database.BuildDSN()
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Connected to database:", os.Getenv("DB_NAME"))

	// Tabel untuk mencatat migrasi yang sudah dijalankan (version = nama file tanpa .up.sql).
	db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)

	// Baca isi folder migrations (jalan dari folder backend, jadi path = backend/migrations).
	migrationsDir := filepath.Join("migrations")
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatal("Failed to read migrations directory:", err)
	}

	// Kumpulkan nama file yang berakhiran .up.sql lalu urutkan agar urutan migrasi konsisten.
	var upFiles []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".up.sql") {
			upFiles = append(upFiles, e.Name())
		}
	}
	sort.Strings(upFiles)

	// Jalankan tiap migrasi yang belum tercatat di schema_migrations.
	applied := 0
	for _, filename := range upFiles {
		version := strings.TrimSuffix(filename, ".up.sql")

		// Cek apakah versi ini sudah pernah dijalankan.
		var count int64
		db.Raw("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version).Scan(&count)
		if count > 0 {
			log.Printf("Skipping %s (already applied)", version)
			continue
		}

		// Baca isi file SQL lalu eksekusi.
		content, err := os.ReadFile(filepath.Join(migrationsDir, filename))
		if err != nil {
			log.Fatalf("Failed to read %s: %v", filename, err)
		}

		if err := db.Exec(string(content)).Error; err != nil {
			log.Fatalf("Failed to apply %s: %v", filename, err)
		}

		// Catat versi agar tidak dijalankan lagi di run berikutnya.
		db.Exec("INSERT INTO schema_migrations (version) VALUES (?)", version)
		log.Printf("Applied: %s", version)
		applied++
	}

	if applied == 0 {
		log.Println("All migrations already applied. Database is up to date.")
	} else {
		log.Printf("Successfully applied %d migration(s).", applied)
	}
}
