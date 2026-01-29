package main

import (
	"encoding/csv"
	"log"
	"os"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

func main() {
	// Load environment variables
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found")
	}

	// Initialize database
	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	log.Println("✅ Database connected")

	// Check if CSV file path is provided
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run main.go <path-to-csv-file>")
	}

	csvPath := os.Args[1]
	log.Printf("📁 Reading CSV file: %s\n", csvPath)

	// Open CSV file
	file, err := os.Open(csvPath)
	if err != nil {
		log.Fatal("Failed to open CSV file:", err)
	}
	defer file.Close()

	// Create CSV reader
	reader := csv.NewReader(file)
	reader.Comma = ';' // CSV uses semicolon delimiter
	reader.LazyQuotes = true
	reader.TrimLeadingSpace = true

	// Read all records
	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal("Failed to read CSV:", err)
	}

	if len(records) < 2 {
		log.Fatal("CSV file is empty or has no data")
	}

	log.Printf("📊 Found %d records (including header)\n", len(records))

	// Parse header
	header := records[0]
	log.Println("Header:", header)

	// Expected columns: id_trans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.TrimSpace(strings.ToLower(col))] = i
	}

	// Batch insert
	batchSize := 1000
	var batch []entity.ActivityLog
	totalInserted := 0
	skipped := 0

	db := database.GetDB()

	for i := 1; i < len(records); i++ {
		record := records[i]

		// Skip empty rows
		if len(record) == 0 || strings.TrimSpace(record[0]) == "" {
			skipped++
			continue
		}

		// Parse UUID fields
		idTrans, err := uuid.Parse(strings.TrimSpace(record[colMap["id_trans"]]))
		if err != nil {
			log.Printf("⚠️  Row %d: Invalid id_trans UUID: %v\n", i+1, err)
			skipped++
			continue
		}

		var token uuid.UUID
		tokenStr := strings.TrimSpace(record[colMap["token"]])
		if tokenStr != "" && tokenStr != "NULL" {
			token, err = uuid.Parse(tokenStr)
			if err != nil {
				log.Printf("⚠️  Row %d: Invalid token UUID, using nil\n", i+1)
			}
		}

		// Parse timestamp
		tanggalStr := strings.TrimSpace(record[colMap["tanggal"]])
		tanggal, err := time.Parse("2006-01-02 15:04:05", tanggalStr)
		if err != nil {
			// Try alternative format
			tanggal, err = time.Parse("02/01/2006 15:04", tanggalStr)
			if err != nil {
				log.Printf("⚠️  Row %d: Invalid date format: %s\n", i+1, tanggalStr)
				skipped++
				continue
			}
		}

		// Extract province from satker
		satker := strings.TrimSpace(record[colMap["satker"]])
		province := extractProvince(satker)
		region := getRegion(province)

		// Create activity log
		activity := entity.ActivityLog{
			IDTrans:   idTrans,
			Nama:      strings.TrimSpace(record[colMap["nama"]]),
			Satker:    satker,
			Aktifitas: strings.TrimSpace(record[colMap["aktifitas"]]),
			Scope:     strings.TrimSpace(record[colMap["scope"]]),
			Lokasi:    strings.TrimSpace(record[colMap["lokasi"]]),
			Cluster:   strings.TrimSpace(record[colMap["cluster"]]),
			Tanggal:   tanggal,
			Token:     token,
			Province:  province,
			Region:    region,
		}

		batch = append(batch, activity)

		// Insert batch when size is reached
		if len(batch) >= batchSize {
			if err := db.Create(&batch).Error; err != nil {
				log.Printf("❌ Failed to insert batch: %v\n", err)
			} else {
				totalInserted += len(batch)
				log.Printf("✅ Inserted %d records (Total: %d)\n", len(batch), totalInserted)
			}
			batch = []entity.ActivityLog{}
		}
	}

	// Insert remaining batch
	if len(batch) > 0 {
		if err := db.Create(&batch).Error; err != nil {
			log.Printf("❌ Failed to insert final batch: %v\n", err)
		} else {
			totalInserted += len(batch)
			log.Printf("✅ Inserted %d records (Total: %d)\n", len(batch), totalInserted)
		}
	}

	log.Println("\n📈 Import Summary:")
	log.Printf("  Total records: %d\n", len(records)-1)
	log.Printf("  Successfully imported: %d\n", totalInserted)
	log.Printf("  Skipped: %d\n", skipped)
	log.Println("\n✅ CSV import completed!")
}

// extractProvince extracts province name from satker string
func extractProvince(satker string) string {
	// Example: "Subauditorat Sulawesi Utara I" -> "Sulawesi Utara"
	satker = strings.ToLower(satker)

	// List of provinces
	provinces := []string{
		"aceh", "sumatera utara", "sumatera barat", "riau", "jambi",
		"sumatera selatan", "bengkulu", "lampung", "kepulauan bangka belitung",
		"kepulauan riau", "dki jakarta", "jawa barat", "jawa tengah",
		"di yogyakarta", "yogyakarta", "jawa timur", "banten", "bali",
		"nusa tenggara barat", "nusa tenggara timur", "kalimantan barat",
		"kalimantan tengah", "kalimantan selatan", "kalimantan timur",
		"kalimantan utara", "sulawesi utara", "sulawesi tengah",
		"sulawesi selatan", "sulawesi tenggara", "gorontalo", "sulawesi barat",
		"maluku", "maluku utara", "papua", "papua barat", "papua selatan",
		"papua tengah", "papua pegunungan", "papua barat daya",
	}

	for _, province := range provinces {
		if strings.Contains(satker, province) {
			// Capitalize first letter of each word
			words := strings.Split(province, " ")
			for i, word := range words {
				if len(word) > 0 {
					words[i] = strings.ToUpper(word[:1]) + word[1:]
				}
			}
			return strings.Join(words, " ")
		}
	}

	return "Lainnya"
}

// getRegion returns region based on province
func getRegion(province string) string {
	province = strings.ToLower(province)

	sumatera := []string{"aceh", "sumatera utara", "sumatera barat", "riau", "jambi", "sumatera selatan", "bengkulu", "lampung", "kepulauan bangka belitung", "kepulauan riau"}
	jawa := []string{"dki jakarta", "jawa barat", "jawa tengah", "yogyakarta", "di yogyakarta", "jawa timur", "banten"}
	kalimantan := []string{"kalimantan barat", "kalimantan tengah", "kalimantan selatan", "kalimantan timur", "kalimantan utara"}
	sulawesi := []string{"sulawesi utara", "sulawesi tengah", "sulawesi selatan", "sulawesi tenggara", "gorontalo", "sulawesi barat"}
	nusaTenggara := []string{"bali", "nusa tenggara barat", "nusa tenggara timur"}
	maluku := []string{"maluku", "maluku utara"}
	papua := []string{"papua", "papua barat", "papua selatan", "papua tengah", "papua pegunungan", "papua barat daya"}

	for _, p := range sumatera {
		if strings.Contains(province, p) {
			return "Sumatera"
		}
	}
	for _, p := range jawa {
		if strings.Contains(province, p) {
			return "Jawa"
		}
	}
	for _, p := range kalimantan {
		if strings.Contains(province, p) {
			return "Kalimantan"
		}
	}
	for _, p := range sulawesi {
		if strings.Contains(province, p) {
			return "Sulawesi"
		}
	}
	for _, p := range nusaTenggara {
		if strings.Contains(province, p) {
			return "Nusa Tenggara"
		}
	}
	for _, p := range maluku {
		if strings.Contains(province, p) {
			return "Maluku"
		}
	}
	for _, p := range papua {
		if strings.Contains(province, p) {
			return "Papua"
		}
	}

	return "Lainnya"
}
