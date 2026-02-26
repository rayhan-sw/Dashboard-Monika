// File main.go: CLI untuk mengimpor data aktivitas dari file CSV ke database PostgreSQL.
//
// Alur singkat:
//   - Muat .env, koneksi DB, baca path CSV dari os.Args[1].
//   - Baca CSV (delimiter ;), baris pertama = header, buat peta nama kolom -> index.
//   - Untuk tiap baris data: parse id_trans (UUID), tanggal (dua format), ambil nama/satker/aktifitas/scope/lokasi/cluster/token/status.
//   - Resolve ID referensi (cluster, activity_type, location, satker, user) via getOrCreate + cache in-memory.
//   - Insert ActivityLog dengan ON CONFLICT (id_trans) DO NOTHING agar duplikat tidak menimpa.
//
// Format CSV: header di baris pertama (case-insensitive), pemisah kolom = ; (titik-koma).
// Kolom yang dipakai: id_trans, nama, satker, aktifitas, scope, lokasi, cluster, tanggal, token, status.
// Prasyarat: backend/.env berisi koneksi DB (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).
//
// Cara menjalankan (dari root folder backend):
//
//	go run cmd/import/main.go <path-to-csv-file>
//
// Contoh: go run cmd/import/main.go data/aktivitas.csv
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

// main memuat .env dan koneksi DB, membaca CSV dari path argumen, lalu memproses tiap baris: resolve referensi (cluster, activity_type, location, satker, user) dan insert ActivityLog dengan ON CONFLICT DO NOTHING.
func main() {
	// Muat variabel lingkungan dari backend/.env (path ../../.env relatif dari cmd/import).
	if err := godotenv.Load("../../.env"); err != nil {
		log.Println("No .env file found")
	}

	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	log.Println("Database connected to:", os.Getenv("DB_NAME"))

	// Path file CSV wajib sebagai argumen pertama.
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run main.go <path-to-csv-file>")
	}

	csvPath := os.Args[1]
	log.Printf("Reading CSV file: %s\n", csvPath)

	file, err := os.Open(csvPath)
	if err != nil {
		log.Fatal("Failed to open CSV file:", err)
	}
	defer file.Close()

	// Konfigurasi reader: pemisah kolom titik-koma (;), izinkan quote tidak ketat, trim spasi di awal nilai.
	reader := csv.NewReader(file)
	reader.Comma = ';'
	reader.LazyQuotes = true
	reader.TrimLeadingSpace = true

	records, err := reader.ReadAll()
	if err != nil {
		log.Fatal("Failed to read CSV:", err)
	}

	if len(records) < 2 {
		log.Fatal("CSV file is empty or has no data")
	}

	log.Printf("Found %d records (including header)\n", len(records))

	// Baris pertama = header; colMap: nama kolom (lowercase, trim) -> index kolom.
	header := records[0]
	log.Println("Header:", header)

	colMap := make(map[string]int)
	for i, col := range header {
		colMap[strings.TrimSpace(strings.ToLower(col))] = i
	}

	db := database.GetDB()

	// Cache agar entitas referensi yang sama tidak dicari ulang ke DB (nama/ lokasi/ kunci -> ID).
	clusterCache := make(map[string]int64)
	activityTypeCache := make(map[string]int64)
	locationCache := make(map[string]int64)
	satkerCache := make(map[string]int64)
	userCache := make(map[string]int64) // kunci: "nama|token"

	totalInserted := 0
	skipped := 0

	for i := 1; i < len(records); i++ {
		record := records[i]

		// Abaikan baris yang kosong atau kolom pertama kosong.
		if len(record) == 0 || strings.TrimSpace(record[0]) == "" {
			skipped++
			continue
		}

		// getCol: ambil nilai kolom by nama header (aman jika kolom tidak ada atau index melebihi panjang record).
		getCol := func(name string) string {
			idx, ok := colMap[name]
			if !ok || idx >= len(record) {
				return ""
			}
			return strings.TrimSpace(record[idx])
		}

		// id_trans harus UUID valid; jika tidak valid, skip baris ini.
		idTrans, err := uuid.Parse(getCol("id_trans"))
		if err != nil {
			log.Printf("Row %d: Invalid id_trans UUID: %v\n", i+1, err)
			skipped++
			continue
		}

		// Parse tanggal: coba format "2006-01-02 15:04:05", fallback "02/01/2006 15:04"; jika gagal, skip baris.
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

		// Dapatkan cluster_id: dari cache atau getOrCreate lalu isi cache (boleh nil jika clusterName kosong).
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

		// Dapatkan activity_type_id (wajib); cache di activityTypeCache.
		actTypeID := getOrCreateActivityType(db, aktifitas, activityTypeCache)

		// Dapatkan location_id: provinsi ditebak dari satker (extractProvince); cache by lokasi.
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

		// Dapatkan satker_id dari cache atau getOrCreateSatker.
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

		// Dapatkan user_id: kunci unik = nama|token; jika belum ada buat UserProfile baru lalu cache.
		userKey := nama + "|" + tokenStr
		var userID int64
		if id, ok := userCache[userKey]; ok {
			userID = id
		} else {
			userID = getOrCreateUser(db, nama, tokenStr, satkerID)
			userCache[userKey] = userID
		}

		// Susun struct ActivityLog untuk satu baris CSV.
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

		// INSERT dengan ON CONFLICT (id_trans) DO NOTHING: jika id_trans sudah ada di DB, baris ini di-skip (tidak error).
		if err := db.Clauses(clause.OnConflict{
			Columns:   []clause.Column{{Name: "id_trans"}},
			DoNothing: true,
		}).Create(&activity).Error; err != nil {
			log.Printf("Row %d: Failed to insert: %v\n", i+1, err)
			skipped++
			continue
		}
		totalInserted++

		// Log progres setiap 1000 baris berhasil.
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

// getOrCreateCluster mencari baris di tabel clusters dengan name = name; jika tidak ada, INSERT baris baru dengan Name: name, lalu mengembalikan ID.
func getOrCreateCluster(db *gorm.DB, name string) int64 {
	var c entity.Cluster
	db.Where("name = ?", name).FirstOrCreate(&c, entity.Cluster{Name: name})
	return c.ID
}

// getOrCreateActivityType mengembalikan ID activity_types by nama; cache dipakai agar tidak query DB berulang. Jika belum di cache, FirstOrCreate lalu simpan ID ke cache.
func getOrCreateActivityType(db *gorm.DB, name string, cache map[string]int64) int64 {
	if id, ok := cache[name]; ok {
		return id
	}
	var at entity.ActivityType
	db.Where("name = ?", name).FirstOrCreate(&at, entity.ActivityType{Name: name})
	cache[name] = at.ID
	return at.ID
}

// getOrCreateLocation mencari Location by location_name; jika tidak ada, buat baru dengan LocationName dan Province, lalu kembalikan ID.
func getOrCreateLocation(db *gorm.DB, locationName, province string) int64 {
	var l entity.Location
	db.Where("location_name = ?", locationName).FirstOrCreate(&l, entity.Location{
		LocationName: locationName,
		Province:     province,
	})
	return l.ID
}

// getOrCreateSatker mencari SatkerUnit by satker_name; jika tidak ada, FirstOrCreate dengan SatkerName lalu kembalikan ID.
func getOrCreateSatker(db *gorm.DB, satkerName string) int64 {
	var s entity.SatkerUnit
	db.Where("satker_name = ?", satkerName).FirstOrCreate(&s, entity.SatkerUnit{SatkerName: satkerName})
	return s.ID
}

// getOrCreateUser mencari UserProfile dengan nama (dan token jika token tidak kosong/"NULL"); jika tidak ketemu, buat profil baru (Nama, Token, SatkerID, IsActive true) lalu kembalikan ID.
func getOrCreateUser(db *gorm.DB, nama, token string, satkerID *int64) int64 {
	var u entity.UserProfile
	query := db.Where("nama = ?", nama)
	if token != "" && token != "NULL" {
		query = query.Where("token = ?", token)
	}
	// First gagal = belum ada -> buat baru
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

// extractProvince menebak provinsi dari string satker: cocokkan dengan daftar nama provinsi Indonesia (lowercase); jika cocok, kembalikan nama provinsi dengan kapitalisasi kata; jika tidak ketemu kembalikan "Lainnya".
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
			// Kapitalisasi tiap kata (huruf pertama besar) lalu gabung.
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
