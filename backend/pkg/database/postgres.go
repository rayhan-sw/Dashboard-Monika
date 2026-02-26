// File postgres.go: koneksi ke PostgreSQL lewat GORM. Menyediakan BuildDSN dari env, InitDB (buka koneksi + pool), GetDB, dan CloseDB.
//
// Variabel global DB menyimpan instance *gorm.DB yang dipakai di seluruh aplikasi (cmd/api, cmd/migrate, dll).
package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB adalah instance koneksi GORM ke PostgreSQL; diisi oleh InitDB dan dipakai lewat GetDB().
var DB *gorm.DB

// BuildDSN membentuk string DSN PostgreSQL dari variabel lingkungan: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT, DB_SSLMODE. Jika DB_SSLMODE kosong dipakai "disable". Dipakai oleh InitDB dan cmd/migrate.
func BuildDSN() string {
	sslmode := os.Getenv("DB_SSLMODE")
	if sslmode == "" {
		sslmode = "disable"
	}
	// Format DSN: host=... user=... password=... dbname=... port=... sslmode=...
	return fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		sslmode,
	)
}

// InitDB membuka koneksi ke PostgreSQL dengan DSN dari BuildDSN, mengatur logger GORM ke Info, NowFunc ke time.Now().Local(), lalu mengatur connection pool (*sql.DB) dan mengisi variabel global DB.
func InitDB() error {
	dsn := BuildDSN()

	var err error
	// Buka koneksi GORM dengan driver postgres; logger Info agar query terlihat di log
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		// NowFunc agar created_at/updated_at memakai waktu lokal, bukan UTC
		NowFunc: func() time.Time {
			return time.Now().Local()
		},
	})

	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Ambil *sql.DB di bawah GORM untuk atur connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		return fmt.Errorf("failed to get database instance: %w", err)
	}

	// Pengaturan pool: maksimal 10 koneksi idle, 100 koneksi terbuka, koneksi diputar maksimal 1 jam
	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("Database connected successfully")
	return nil
}

// GetDB mengembalikan instance *gorm.DB global (untuk dipakai di handler, repository, service, dll).
func GetDB() *gorm.DB {
	return DB
}

// CloseDB menutup koneksi database. Jika DB sudah diisi, ambil *sql.DB lalu panggil Close(); jika DB nil, tidak melakukan apa-apa.
func CloseDB() error {
	if DB != nil {
		sqlDB, err := DB.DB()
		if err != nil {
			return err
		}
		return sqlDB.Close()
	}
	return nil
}
