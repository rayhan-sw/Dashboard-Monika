// File report_repository.go: query dan pembuatan data untuk laporan (generate data per template, catat unduhan, riwayat unduhan).
//
// GenerateReportData mengisi data sesuai template (org-performance, user-activity, feature-usage). CreateReportDownload mencatat satu unduhan. GetRecentDownloads / GetRecentDownloadsWithFilter / GetDownloadsByUser mengambil riwayat unduhan.
package repository

import (
	"strconv"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
)

// ReportData struktur data laporan yang di-generate: judul, waktu generate, periode (start - end), ringkasan (map), dan detail (slice map).
type ReportData struct {
	Title       string                   `json:"title"`
	GeneratedAt time.Time                `json:"generated_at"`
	Period      string                   `json:"period"`
	Summary     map[string]interface{}   `json:"summary"`
	Details     []map[string]interface{} `json:"details"`
}

// GenerateReportData membangun data laporan berdasarkan templateID dan rentang startDate–endDate. Template: org-performance (total aktivitas/user, top 10 satker), user-activity (login total/sukses/gagal, top 10 user), feature-usage (view/download/search, top 10 fitur).
func GenerateReportData(templateID, startDate, endDate string) (*ReportData, error) {
	db := database.GetDB()

	var report ReportData
	report.GeneratedAt = time.Now()
	report.Period = startDate + " - " + endDate

	switch templateID {
	case "org-performance":
		report.Title = "Laporan Kinerja Organisasi"

		var totalActivities, totalUsers int

		// Hitung total aktivitas: query dengan parameter posisi $1, $2 untuk filter tanggal.
		query := "SELECT COUNT(*) FROM activity_logs_normalized a"
		args := []interface{}{}
		argCount := 0

		if startDate != "" {
			argCount++
			query += " WHERE a.tanggal >= $" + strconv.Itoa(argCount)
			args = append(args, startDate)
		}
		if endDate != "" {
			if argCount == 0 {
				query += " WHERE"
			} else {
				query += " AND"
			}
			argCount++
			query += " a.tanggal <= $" + strconv.Itoa(argCount)
			args = append(args, endDate)
		}

		db.Raw(query, args...).Scan(&totalActivities)

		// Hitung user unik (COUNT DISTINCT u.nama) dalam rentang tanggal; string tanggal digabung ke query.
		userQuery := "SELECT COUNT(DISTINCT u.nama) FROM activity_logs_normalized a JOIN user_profiles u ON a.user_id = u.id"
		if startDate != "" || endDate != "" {
			userQuery += " WHERE 1=1"
			if startDate != "" {
				userQuery += " AND a.tanggal >= '" + startDate + "'"
			}
			if endDate != "" {
				userQuery += " AND a.tanggal <= '" + endDate + "'"
			}
		}
		db.Raw(userQuery).Scan(&totalUsers)

		report.Summary = map[string]interface{}{
			"total_activities": totalActivities,
			"total_users":      totalUsers,
		}

		// Top 10 satker by jumlah aktivitas; filter tanggal digabung ke SQL.
		satkerQuery := `
			SELECT s.satker_name, COUNT(*) as count 
			FROM activity_logs_normalized a
			JOIN ref_satker_units s ON a.satker_id = s.id
			WHERE s.satker_name IS NOT NULL AND s.satker_name != ''
		`
		if startDate != "" {
			satkerQuery += " AND a.tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			satkerQuery += " AND a.tanggal <= '" + endDate + "'"
		}
		satkerQuery += " GROUP BY s.satker_name ORDER BY count DESC LIMIT 10"

		rows, err := db.Raw(satkerQuery).Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var satker string
			var count int
			rows.Scan(&satker, &count)
			report.Details = append(report.Details, map[string]interface{}{
				"satker": satker,
				"count":  count,
			})
		}

	case "user-activity":
		report.Title = "Laporan Aktivitas Pengguna"

		var totalLogins, successLogins, failedLogins int

		// Basis query: jumlah aktivitas LOGIN; lalu tambah kondisi tanggal.
		loginQuery := `
			SELECT COUNT(*) 
			FROM activity_logs_normalized a
			JOIN ref_activity_types at ON a.activity_type_id = at.id
			WHERE at.name = 'LOGIN'
		`
		if startDate != "" {
			loginQuery += " AND a.tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			loginQuery += " AND a.tanggal <= '" + endDate + "'"
		}
		db.Raw(loginQuery).Scan(&totalLogins)

		successQuery := loginQuery + " AND a.status = 'SUCCESS'"
		db.Raw(successQuery).Scan(&successLogins)

		failedQuery := loginQuery + " AND a.status = 'FAILED'"
		db.Raw(failedQuery).Scan(&failedLogins)

		report.Summary = map[string]interface{}{
			"total_logins":   totalLogins,
			"success_logins": successLogins,
			"failed_logins":  failedLogins,
		}

		// Top 10 user aktif (nama + count aktivitas).
		userQuery := `
			SELECT u.nama, COUNT(*) as count 
			FROM activity_logs_normalized a
			JOIN user_profiles u ON a.user_id = u.id
			WHERE u.nama IS NOT NULL AND u.nama != ''
		`
		if startDate != "" {
			userQuery += " AND a.tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			userQuery += " AND a.tanggal <= '" + endDate + "'"
		}
		userQuery += " GROUP BY u.nama ORDER BY count DESC LIMIT 10"

		rows, err := db.Raw(userQuery).Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var nama string
			var count int
			rows.Scan(&nama, &count)
			report.Details = append(report.Details, map[string]interface{}{
				"username": nama,
				"count":    count,
			})
		}

	case "feature-usage":
		report.Title = "Laporan Pemanfaatan Fitur"

		var totalViews, totalDownloads, totalSearches int

		// Basis query COUNT + join activity_types; dateCondition dipakai di tiga query (view, download, search).
		baseQuery := `
			SELECT COUNT(*) 
			FROM activity_logs_normalized a
			JOIN ref_activity_types at ON a.activity_type_id = at.id
		`
		dateCondition := ""
		if startDate != "" {
			dateCondition += " AND a.tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			dateCondition += " AND a.tanggal <= '" + endDate + "'"
		}

		viewQuery := baseQuery + " WHERE at.name = 'View'" + dateCondition
		db.Raw(viewQuery).Scan(&totalViews)

		downloadQuery := baseQuery + " WHERE at.name ILIKE '%download%'" + dateCondition
		db.Raw(downloadQuery).Scan(&totalDownloads)

		searchQuery := baseQuery + " WHERE (at.name ILIKE '%search%' OR at.name ILIKE '%pencarian%')" + dateCondition
		db.Raw(searchQuery).Scan(&totalSearches)

		report.Summary = map[string]interface{}{
			"total_views":     totalViews,
			"total_downloads": totalDownloads,
			"total_searches":  totalSearches,
		}

		// Rincian per jenis fitur (at.name), top 10.
		featureQuery := `
			SELECT at.name, COUNT(*) as count 
			FROM activity_logs_normalized a
			JOIN ref_activity_types at ON a.activity_type_id = at.id
			WHERE at.name IS NOT NULL
		`
		if startDate != "" {
			featureQuery += " AND a.tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			featureQuery += " AND a.tanggal <= '" + endDate + "'"
		}
		featureQuery += " GROUP BY at.name ORDER BY count DESC LIMIT 10"

		rows, err := db.Raw(featureQuery).Rows()
		if err != nil {
			return nil, err
		}
		defer rows.Close()

		for rows.Next() {
			var feature string
			var count int
			rows.Scan(&feature, &count)
			report.Details = append(report.Details, map[string]interface{}{
				"feature": feature,
				"count":   count,
			})
		}
	}

	return &report, nil
}

// CreateReportDownload menyimpan satu record unduhan laporan ke tabel report_downloads (entity.ReportDownload).
func CreateReportDownload(download *entity.ReportDownload) error {
	db := database.GetDB()
	return db.Create(download).Error
}

// GetRecentDownloads mengembalikan N unduhan terbaru (urut generated_at DESC) dengan relasi User di-preload.
func GetRecentDownloads(limit int) ([]entity.ReportDownload, error) {
	db := database.GetDB()
	var downloads []entity.ReportDownload

	err := db.Preload("User").
		Order("generated_at DESC").
		Limit(limit).
		Find(&downloads).Error

	return downloads, err
}

// GetRecentDownloadsWithFilter sama seperti GetRecentDownloads dengan filter tanggal opsional: BETWEEN, >= startDate, atau <= endDate.
func GetRecentDownloadsWithFilter(limit int, startDate, endDate string) ([]entity.ReportDownload, error) {
	db := database.GetDB()
	var downloads []entity.ReportDownload

	query := db.Preload("User")

	if startDate != "" && endDate != "" {
		query = query.Where("DATE(generated_at) BETWEEN ? AND ?", startDate, endDate)
	} else if startDate != "" {
		query = query.Where("DATE(generated_at) >= ?", startDate)
	} else if endDate != "" {
		query = query.Where("DATE(generated_at) <= ?", endDate)
	}

	err := query.
		Order("generated_at DESC").
		Limit(limit).
		Find(&downloads).Error

	return downloads, err
}

// GetDownloadsByUser mengembalikan unduhan untuk satu user (user_id); urut generated_at DESC, batas limit.
func GetDownloadsByUser(userID int, limit int) ([]entity.ReportDownload, error) {
	db := database.GetDB()
	var downloads []entity.ReportDownload

	err := db.Where("user_id = ?", userID).
		Order("generated_at DESC").
		Limit(limit).
		Find(&downloads).Error

	return downloads, err
}
