package main

import (
	"bufio"
	"fmt"
	"log"
	"os"
	"strings"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func main() {
	fmt.Println("========================================")
	fmt.Println("   Import act_log data to database")
	fmt.Println("========================================")
	fmt.Println()

	// Database connection parameters
	dbHost := "localhost"
	dbPort := "5432"
	dbUser := "postgres"
	dbPassword := "350327"
	dbName := "actlog"

	// Connect to database
	fmt.Println("[1/3] Connecting to database...")
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName, dbPort)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	fmt.Printf("      ✓ Connected to '%s'\n", dbName)

	// Create act_log table
	fmt.Println()
	fmt.Println("[2/3] Creating act_log table...")

	createTableSQL := `
	DROP TABLE IF EXISTS act_log CASCADE;
	
	CREATE TABLE act_log (
		id BIGSERIAL PRIMARY KEY,
		id_trans UUID,
		nama VARCHAR(255),
		satker VARCHAR(500),
		aktifitas VARCHAR(255),
		scope TEXT,
		lokasi VARCHAR(255),
		detail_aktifitas TEXT,
		cluster VARCHAR(100),
		tanggal TIMESTAMP,
		token VARCHAR(255),
		status VARCHAR(50),
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE INDEX idx_act_log_cluster ON act_log(cluster);
	CREATE INDEX idx_act_log_tanggal ON act_log(tanggal);
	CREATE INDEX idx_act_log_aktifitas ON act_log(aktifitas);
	CREATE INDEX idx_act_log_nama ON act_log(nama);
	CREATE INDEX idx_act_log_satker ON act_log(satker);
	CREATE INDEX idx_act_log_status ON act_log(status);
	`

	if err := db.Exec(createTableSQL).Error; err != nil {
		log.Fatal("Failed to create table:", err)
	}
	fmt.Println("      ✓ Table 'act_log' created")

	// Import data from seed file
	fmt.Println()
	fmt.Println("[3/3] Importing data from seeds/actlog_data.sql...")

	file, err := os.Open("seeds/actlog_data.sql")
	if err != nil {
		log.Fatal("Failed to open seed file:", err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	scanner.Buffer(make([]byte, 0), 10*1024*1024)

	var sqlBuilder strings.Builder
	insertCount := 0

	for scanner.Scan() {
		line := scanner.Text()
		sqlBuilder.WriteString(line)
		sqlBuilder.WriteString("\n")

		if strings.HasSuffix(strings.TrimSpace(line), ";") {
			sql := sqlBuilder.String()

			if strings.HasPrefix(strings.TrimSpace(sql), "INSERT") {
				if err := db.Exec(sql).Error; err == nil {
					insertCount++
					if insertCount%1000 == 0 {
						fmt.Printf("      Processed %d INSERT statements...\n", insertCount)
					}
				}
			}
			sqlBuilder.Reset()
		}
	}

	var totalCount int64
	db.Raw("SELECT COUNT(*) FROM act_log").Scan(&totalCount)

	fmt.Println()
	fmt.Println("========================================")
	fmt.Println("   ✅ Import Complete!")
	fmt.Println("========================================")
	fmt.Printf("   Total Records: %d\n", totalCount)
	fmt.Println()
}
