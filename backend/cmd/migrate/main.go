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
	// Load .env from backend root (run from backend folder: go run cmd/migrate/main.go)
	envPath := filepath.Join(".env")
	if err := godotenv.Load(envPath); err != nil {
		if err2 := godotenv.Load(filepath.Join("..", ".env")); err2 != nil {
			log.Println("No .env file found, using system environment")
		}
	}

	dsn := database.BuildDSN()
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Connected to database:", os.Getenv("DB_NAME"))

	// Create migrations tracking table
	db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version VARCHAR(255) PRIMARY KEY,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	)`)

	// Find migration files (run from backend folder so migrations = backend/migrations)
	migrationsDir := filepath.Join("migrations")
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Fatal("Failed to read migrations directory:", err)
	}

	// Collect and sort .up.sql files
	var upFiles []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".up.sql") {
			upFiles = append(upFiles, e.Name())
		}
	}
	sort.Strings(upFiles)

	// Apply each migration
	applied := 0
	for _, filename := range upFiles {
		version := strings.TrimSuffix(filename, ".up.sql")

		// Check if already applied
		var count int64
		db.Raw("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version).Scan(&count)
		if count > 0 {
			log.Printf("Skipping %s (already applied)", version)
			continue
		}

		// Read and execute migration
		content, err := os.ReadFile(filepath.Join(migrationsDir, filename))
		if err != nil {
			log.Fatalf("Failed to read %s: %v", filename, err)
		}

		if err := db.Exec(string(content)).Error; err != nil {
			log.Fatalf("Failed to apply %s: %v", filename, err)
		}

		// Record migration
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
