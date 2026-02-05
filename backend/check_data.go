package main

import (
	"fmt"
	"log"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=postgres password=350327 dbname=actlog port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal(err)
	}

	// Check date range
	var dateRange struct {
		Min string
		Max string
	}
	db.Raw("SELECT MIN(tanggal)::text as min, MAX(tanggal)::text as max FROM act_log").Scan(&dateRange)
	fmt.Printf("Date Range: %s to %s\n", dateRange.Min, dateRange.Max)

	// Check aktifitas values
	var activities []struct {
		Aktifitas string
		Count     int
	}
	db.Raw("SELECT aktifitas, COUNT(*) as count FROM act_log GROUP BY aktifitas ORDER BY count DESC LIMIT 10").Scan(&activities)
	fmt.Println("\nTop Aktivitas:")
	for _, a := range activities {
		fmt.Printf("  %s: %d\n", a.Aktifitas, a.Count)
	}

	// Check cluster values
	var clusters []struct {
		Cluster string
		Count   int
	}
	db.Raw("SELECT cluster, COUNT(*) as count FROM act_log WHERE cluster IS NOT NULL AND cluster != '' GROUP BY cluster ORDER BY count DESC LIMIT 10").Scan(&clusters)
	fmt.Println("\nTop Clusters:")
	for _, c := range clusters {
		fmt.Printf("  %s: %d\n", c.Cluster, c.Count)
	}

	// Check scope values
	var scopes []struct {
		Scope string
		Count int
	}
	db.Raw("SELECT scope, COUNT(*) as count FROM act_log WHERE scope IS NOT NULL AND scope != '' GROUP BY scope ORDER BY count DESC LIMIT 10").Scan(&scopes)
	fmt.Println("\nTop Scopes:")
	for _, s := range scopes {
		fmt.Printf("  %s: %d\n", s.Scope, s.Count)
	}

	// Check detail_aktifitas values
	var details []struct {
		DetailAktifitas string
		Count           int
	}
	db.Raw("SELECT detail_aktifitas, COUNT(*) as count FROM act_log WHERE detail_aktifitas IS NOT NULL AND detail_aktifitas != '' GROUP BY detail_aktifitas ORDER BY count DESC LIMIT 10").Scan(&details)
	fmt.Println("\nTop Detail Aktifitas:")
	for _, d := range details {
		fmt.Printf("  %s: %d\n", d.DetailAktifitas, d.Count)
	}
}
