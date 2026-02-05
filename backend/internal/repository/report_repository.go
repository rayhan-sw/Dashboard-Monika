package repository

import (
	"strconv"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
)

// ReportData represents generated report data
type ReportData struct {
	Title       string                   `json:"title"`
	GeneratedAt time.Time                `json:"generated_at"`
	Period      string                   `json:"period"`
	Summary     map[string]interface{}   `json:"summary"`
	Details     []map[string]interface{} `json:"details"`
}

// GenerateReportData generates report data based on template
func GenerateReportData(templateID, startDate, endDate string) (*ReportData, error) {
	db := database.GetDB()

	var report ReportData
	report.GeneratedAt = time.Now()
	report.Period = startDate + " - " + endDate

	switch templateID {
	case "org-performance":
		report.Title = "Laporan Kinerja Organisasi"

		// Get summary stats
		var totalActivities, totalUsers int

		query := "SELECT COUNT(*) FROM act_log"
		args := []interface{}{}
		argCount := 0

		if startDate != "" {
			argCount++
			query += " WHERE tanggal >= $" + strconv.Itoa(argCount)
			args = append(args, startDate)
		}
		if endDate != "" {
			if argCount == 0 {
				query += " WHERE"
			} else {
				query += " AND"
			}
			argCount++
			query += " tanggal <= $" + strconv.Itoa(argCount)
			args = append(args, endDate)
		}

		db.Raw(query, args...).Scan(&totalActivities)

		// Count unique users
		userQuery := "SELECT COUNT(DISTINCT nama) FROM act_log"
		if startDate != "" || endDate != "" {
			userQuery += " WHERE 1=1"
			if startDate != "" {
				userQuery += " AND tanggal >= '" + startDate + "'"
			}
			if endDate != "" {
				userQuery += " AND tanggal <= '" + endDate + "'"
			}
		}
		db.Raw(userQuery).Scan(&totalUsers)

		report.Summary = map[string]interface{}{
			"total_activities": totalActivities,
			"total_users":      totalUsers,
		}

		// Get top satker
		satkerQuery := `
			SELECT satker, COUNT(*) as count 
			FROM act_log 
			WHERE satker IS NOT NULL AND satker != ''
		`
		if startDate != "" {
			satkerQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			satkerQuery += " AND tanggal <= '" + endDate + "'"
		}
		satkerQuery += " GROUP BY satker ORDER BY count DESC LIMIT 10"

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

		// Get login stats
		var totalLogins, successLogins, failedLogins int

		loginQuery := "SELECT COUNT(*) FROM act_log WHERE aktifitas = 'LOGIN'"
		if startDate != "" {
			loginQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			loginQuery += " AND tanggal <= '" + endDate + "'"
		}
		db.Raw(loginQuery).Scan(&totalLogins)

		successQuery := loginQuery + " AND status = 'SUCCESS'"
		db.Raw(successQuery).Scan(&successLogins)

		failedQuery := loginQuery + " AND status = 'FAILED'"
		db.Raw(failedQuery).Scan(&failedLogins)

		report.Summary = map[string]interface{}{
			"total_logins":   totalLogins,
			"success_logins": successLogins,
			"failed_logins":  failedLogins,
		}

		// Get top active users
		userQuery := `
			SELECT nama, COUNT(*) as count 
			FROM act_log 
			WHERE nama IS NOT NULL AND nama != ''
		`
		if startDate != "" {
			userQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			userQuery += " AND tanggal <= '" + endDate + "'"
		}
		userQuery += " GROUP BY nama ORDER BY count DESC LIMIT 10"

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

		// Get feature usage stats
		var totalViews, totalDownloads, totalSearches int

		viewQuery := "SELECT COUNT(*) FROM act_log WHERE aktifitas = 'View'"
		if startDate != "" {
			viewQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			viewQuery += " AND tanggal <= '" + endDate + "'"
		}
		db.Raw(viewQuery).Scan(&totalViews)

		downloadQuery := "SELECT COUNT(*) FROM act_log WHERE aktifitas ILIKE '%download%'"
		if startDate != "" {
			downloadQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			downloadQuery += " AND tanggal <= '" + endDate + "'"
		}
		db.Raw(downloadQuery).Scan(&totalDownloads)

		searchQuery := "SELECT COUNT(*) FROM act_log WHERE (aktifitas ILIKE '%search%' OR aktifitas ILIKE '%pencarian%')"
		if startDate != "" {
			searchQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			searchQuery += " AND tanggal <= '" + endDate + "'"
		}
		db.Raw(searchQuery).Scan(&totalSearches)

		report.Summary = map[string]interface{}{
			"total_views":     totalViews,
			"total_downloads": totalDownloads,
			"total_searches":  totalSearches,
		}

		// Get feature breakdown
		featureQuery := `
			SELECT aktifitas, COUNT(*) as count 
			FROM act_log 
			WHERE aktifitas IS NOT NULL
		`
		if startDate != "" {
			featureQuery += " AND tanggal >= '" + startDate + "'"
		}
		if endDate != "" {
			featureQuery += " AND tanggal <= '" + endDate + "'"
		}
		featureQuery += " GROUP BY aktifitas ORDER BY count DESC LIMIT 10"

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
