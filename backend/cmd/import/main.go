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
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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

	log.Println("Database connected to:", os.Getenv("DB_NAME"))

	// Check if CSV file path is provided
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run main.go <path-to-csv-file>")
	}

	csvPath := os.Args[1]
	log.Printf("Reading CSV file: %s\n", csvPath)

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

	log.Printf("Found %d records (including header)\n", len(records))

	// Parse header
	header := records[0]
	log.Println("Header:", header)

	// Expected columns: id_trans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token
	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.TrimSpace(strings.ToLower(col))] = i
	}

	db := database.GetDB()

	// In-memory caches to avoid repeated DB lookups
	clusterCache := make(map[string]int64)
	activityTypeCache := make(map[string]int64)
	locationCache := make(map[string]int64)
	satkerCache := make(map[string]int64)
	userCache := make(map[string]int64) // key: nama|token

	totalInserted := 0
	skipped := 0

	for i := 1; i < len(records); i++ {
		record := records[i]

		// Skip empty rows
		if len(record) == 0 || strings.TrimSpace(record[0]) == "" {
			skipped++
			continue
		}

		getCol := func(name string) string {
			idx, ok := colMap[name]
			if !ok || idx >= len(record) {
				return ""
			}
			return strings.TrimSpace(record[idx])
		}

		// Parse UUID
		idTrans, err := uuid.Parse(getCol("id_trans"))
		if err != nil {
			log.Printf("Row %d: Invalid id_trans UUID: %v\n", i+1, err)
			skipped++
			continue
		}

		// Parse timestamp
		tanggalStr := getCol("tanggal")
		tanggal, err := time.Parse("2006-01-02 15:04:05", tanggalStr)
		if err != nil {
			tanggal, err = time.Parse("02/01/2006 15:04", tanggalStr)
			if err != nil {
				log.Printf("Row %d: Invalid date format: %s\n", i+1, tanggalStr)
				skipped++
				continue
			}
		}

		nama := getCol("nama")
		satkerName := getCol("satker")
		aktifitas := getCol("aktifitas")
		scope := getCol("scope")
		lokasi := getCol("lokasi")
		clusterName := getCol("cluster")
		tokenStr := getCol("token")
		status := getCol("status")
		if status == "" {
			status = "SUCCESS"
		}

		// --- Resolve cluster_id ---
		var clusterID *int64
		if clusterName != "" {
			if id, ok := clusterCache[clusterName]; ok {
				clusterID = &id
			} else {
				id := getOrCreateCluster(db, clusterName)
				clusterCache[clusterName] = id
				clusterID = &id
			}
		}

		// --- Resolve activity_type_id ---
		actTypeID := getOrCreateActivityType(db, aktifitas, activityTypeCache)

		// --- Resolve location_id ---
		var locationID *int64
		if lokasi != "" {
			province := extractProvince(satkerName)
			if id, ok := locationCache[lokasi]; ok {
				locationID = &id
			} else {
				id := getOrCreateLocation(db, lokasi, province)
				locationCache[lokasi] = id
				locationID = &id
			}
		}

		// --- Resolve satker_id ---
		var satkerID *int64
		if satkerName != "" {
			if id, ok := satkerCache[satkerName]; ok {
				satkerID = &id
			} else {
				id := getOrCreateSatker(db, satkerName)
				satkerCache[satkerName] = id
				satkerID = &id
			}
		}

		// --- Resolve user_id ---
		userKey := nama + "|" + tokenStr
		var userID int64
		if id, ok := userCache[userKey]; ok {
			userID = id
		} else {
			userID = getOrCreateUser(db, nama, tokenStr, satkerID)
			userCache[userKey] = userID
		}

		activity := entity.ActivityLog{
			IDTrans:        idTrans,
			UserID:         userID,
			SatkerID:       satkerID,
			ActivityTypeID: actTypeID,
			ClusterID:      clusterID,
			LocationID:     locationID,
			Scope:          scope,
			Status:         status,
			Tanggal:        tanggal,
		}

		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id_trans"}},
			DoNothing: true,
		}).Create(&activity).Error; err != nil {
			log.Printf("Row %d: Failed to insert: %v\n", i+1, err)
			skipped++
			continue
		}
		totalInserted++

		if totalInserted%1000 == 0 {
			log.Printf("Inserted %d records...\n", totalInserted)
		}
	}

	log.Println("\n  Import Summary:")
	log.Printf("  Total records: %d\n", len(records)-1)
	log.Printf("  Successfully imported: %d\n", totalInserted)
	log.Printf("  Skipped: %d\n", skipped)
	log.Println("\n CSV import completed!")
}

func getOrCreateCluster(db *gorm.DB, name string) int64 {
	var c entity.Cluster
	db.Where("name = ?", name).FirstOrCreate(&c, entity.Cluster{Name: name})
	return c.ID
}

func getOrCreateActivityType(db *gorm.DB, name string, cache map[string]int64) int64 {
	if id, ok := cache[name]; ok {
		return id
	}
	var at entity.ActivityType
	db.Where("name = ?", name).FirstOrCreate(&at, entity.ActivityType{Name: name})
	cache[name] = at.ID
	return at.ID
}

func getOrCreateLocation(db *gorm.DB, locationName, province string) int64 {
	var l entity.Location
	db.Where("location_name = ?", locationName).FirstOrCreate(&l, entity.Location{
		LocationName: locationName,
		Province:     province,
	})
	return l.ID
}

func getOrCreateSatker(db *gorm.DB, satkerName string) int64 {
	var s entity.SatkerUnit
	db.Where("satker_name = ?", satkerName).FirstOrCreate(&s, entity.SatkerUnit{SatkerName: satkerName})
	return s.ID
}

func getOrCreateUser(db *gorm.DB, nama, token string, satkerID *int64) int64 {
	var u entity.UserProfile
	query := db.Where("nama = ?", nama)
	if token != "" && token != "NULL" {
		query = query.Where("token = ?", token)
	}
	if query.First(&u).Error != nil {
		u = entity.UserProfile{
			Nama:     nama,
			Token:    token,
			SatkerID: satkerID,
			IsActive: true,
		}
		db.Create(&u)
	}
	return u.ID
}

// extractProvince extracts province name from satker string
func extractProvince(satker string) string {
	satker = strings.ToLower(satker)

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
