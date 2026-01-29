package main

import (
	"fmt"
	"log"
	"os"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("⚠️  No .env file found, using environment variables")
	}

	// Build connection string
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		getEnv("DB_HOST", "localhost"),
		getEnv("DB_PORT", "5432"),
		getEnv("DB_USER", "postgres"),
		getEnv("DB_PASSWORD", "12345678"),
		getEnv("DB_NAME", "dashboard_bpk"),
		getEnv("DB_SSLMODE", "disable"),
	)

	fmt.Println("🔌 Testing PostgreSQL connection...")
	fmt.Printf("   Host: %s:%s\n", getEnv("DB_HOST", "localhost"), getEnv("DB_PORT", "5432"))
	fmt.Printf("   Database: %s\n", getEnv("DB_NAME", "dashboard_bpk"))
	fmt.Printf("   User: %s\n", getEnv("DB_USER", "postgres"))

	// Connect to database
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	// Test connection
	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("❌ Failed to get database instance: %v", err)
	}

	err = sqlDB.Ping()
	if err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	fmt.Println("✅ Database connection successful!")

	// Get database version
	var version string
	db.Raw("SELECT version()").Scan(&version)
	fmt.Printf("📊 PostgreSQL Version: %s\n", version)

	// Check if activity_logs table exists
	var tableExists bool
	db.Raw("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'activity_logs')").Scan(&tableExists)
	
	if tableExists {
		fmt.Println("✅ Table 'activity_logs' exists")
		
		// Count records
		var count int64
		db.Raw("SELECT COUNT(*) FROM activity_logs").Scan(&count)
		fmt.Printf("📝 Records in activity_logs: %d\n", count)
	} else {
		fmt.Println("⚠️  Table 'activity_logs' does not exist yet")
		fmt.Println("   Run migration: psql -U postgres -d dashboard_bpk -f backend/migrations/002_create_activity_logs.up.sql")
	}

	// Close connection
	sqlDB.Close()
	fmt.Println("\n🎉 Connection test completed successfully!")
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
