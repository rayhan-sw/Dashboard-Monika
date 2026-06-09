// Command import memasukkan data aktivitas dari CSV/TSV ke PostgreSQL.
//
// Format yang didukung:
//   - CSV dengan header nama: id_trans, nama, satker, aktifitas, scope,
//     lokasi, cluster, tanggal, token, status.
//   - CSV/TSV normalized dengan header kolom tabel activity_logs_normalized.
//   - TSV normalized tanpa header dengan 12 kolom sesuai urutan tabel.
//
// Jalankan dari folder backend:
//
//	go run cmd/import/main.go <path-file>
package main

import (
	"log"
	"os"

	"github.com/bpk-ri/dashboard-monitoring/internal/service"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		if err2 := godotenv.Load(); err2 != nil {
			log.Println("No .env file found, using system environment")
		}
	}

	if len(os.Args) < 2 {
		log.Fatal("Usage: go run cmd/import/main.go <path-file>")
	}

	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	file, err := os.Open(os.Args[1])
	if err != nil {
		log.Fatal("Failed to open import file:", err)
	}
	defer file.Close()

	result, err := service.NewActivityImporter(database.GetDB()).Import(file)
	if err != nil {
		log.Fatal("Import failed:", err)
	}

	log.Printf("Format: %s", result.Format)
	log.Printf("Total rows: %d", result.TotalRows)
	log.Printf("Inserted: %d", result.Inserted)
	log.Printf("Duplicates: %d", result.Duplicates)
	log.Printf("Skipped: %d", result.Skipped)
	for _, rowError := range result.Errors {
		log.Printf("Row %d: %s", rowError.Row, rowError.Message)
	}
}
