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

		// Count unique users
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

		// Get top satker
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

		// Get login stats
		var totalLogins, successLogins, failedLogins int

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

		// Get top active users
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

		// Get feature usage stats
		var totalViews, totalDownloads, totalSearches int

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

		// Get feature breakdown
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
