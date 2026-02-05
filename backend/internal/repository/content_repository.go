package repository

import (
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
)

// DashboardRanking represents ranking data for dashboard usage
type DashboardRanking struct {
	Rank       int     `json:"rank"`
	Name       string  `json:"name"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// SearchModule represents search module usage data
type SearchModule struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// ExportStats represents export/download statistics
type ExportStats struct {
	ViewData     int `json:"view_data"`
	DownloadData int `json:"download_data"`
	ExportData   int `json:"export_data"`
}

// OperationalIntent represents operational intent data
type OperationalIntent struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// GlobalEconomicsData represents chart data for global economics
type GlobalEconomicsData struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

// GetDashboardRankings returns ranking of dashboard/cluster usage
func GetDashboardRankings(startDate, endDate string) ([]DashboardRanking, error) {
	db := database.GetDB()

	query := `
		SELECT 
			CASE 
				WHEN cluster IS NULL OR cluster = '' THEN 'Tidak Terkategori'
				ELSE cluster
			END as name,
			COUNT(*) as count
		FROM act_log
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 0

	if startDate != "" {
		argCount++
		query += " AND tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	query += `
		GROUP BY 
			CASE 
				WHEN cluster IS NULL OR cluster = '' THEN 'Tidak Terkategori'
				ELSE cluster
			END
		ORDER BY count DESC
	`

	rows, err := db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rankings []DashboardRanking
	var total int
	rank := 1

	// First pass: get all data
	type tempRanking struct {
		Name  string
		Count int
	}
	var tempData []tempRanking

	for rows.Next() {
		var name string
		var count int
		if err := rows.Scan(&name, &count); err != nil {
			return nil, err
		}
		tempData = append(tempData, tempRanking{Name: name, Count: count})
		total += count
	}

	// Second pass: calculate percentages
	for _, t := range tempData {
		percentage := 0.0
		if total > 0 {
			percentage = float64(t.Count) / float64(total) * 100
		}
		rankings = append(rankings, DashboardRanking{
			Rank:       rank,
			Name:       t.Name,
			Count:      t.Count,
			Percentage: percentage,
		})
		rank++
	}

	return rankings, nil
}

// GetSearchModuleUsage returns search module usage statistics
func GetSearchModuleUsage(startDate, endDate, cluster string) ([]SearchModule, error) {
	db := database.GetDB()

	query := `
		SELECT 
			module_name,
			count
		FROM (
			SELECT 
				CASE 
					WHEN scope ILIKE '%search%' OR scope ILIKE '%pencarian%' THEN 
						COALESCE(NULLIF(scope, ''), 'Lainnya')
					ELSE COALESCE(NULLIF(detail_aktifitas, ''), 'Lainnya')
				END as module_name,
				COUNT(*) as count
			FROM act_log
			WHERE (
				aktifitas ILIKE '%search%' 
				OR aktifitas ILIKE '%pencarian%'
				OR scope ILIKE '%search%'
				OR detail_aktifitas ILIKE '%pencarian%'
			)
	`

	args := []interface{}{}
	argCount := 0

	if cluster != "" {
		argCount++
		query += " AND cluster = $" + strconv.Itoa(argCount)
		args = append(args, cluster)
	}

	if startDate != "" {
		argCount++
		query += " AND tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	query += `
			GROUP BY module_name
		) sub
		ORDER BY count DESC
		LIMIT 5
	`

	rows, err := db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var modules []SearchModule
	for rows.Next() {
		var m SearchModule
		if err := rows.Scan(&m.Name, &m.Count); err != nil {
			return nil, err
		}
		modules = append(modules, m)
	}

	return modules, nil
}

// GetExportStats returns export/download statistics
func GetExportStats(startDate, endDate, cluster string) (*ExportStats, error) {
	db := database.GetDB()

	args := []interface{}{}
	argCount := 0

	dateFilter := ""
	if cluster != "" {
		argCount++
		dateFilter += " AND cluster = $" + strconv.Itoa(argCount)
		args = append(args, cluster)
	}
	if startDate != "" {
		argCount++
		dateFilter += " AND tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		dateFilter += " AND tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	// View Data count (activities with 'view' but not 'download' or 'export')
	var viewCount int
	viewQuery := `
		SELECT COUNT(*) FROM act_log
		WHERE aktifitas ILIKE '%view%' 
		AND aktifitas NOT ILIKE '%download%' 
		AND aktifitas NOT ILIKE '%export%'
	` + dateFilter
	db.Raw(viewQuery, args...).Scan(&viewCount)

	// Download Data count (activities with 'download' only)
	var downloadCount int
	downloadQuery := `
		SELECT COUNT(*) FROM act_log
		WHERE aktifitas ILIKE '%download%'
	` + dateFilter
	db.Raw(downloadQuery, args...).Scan(&downloadCount)

	// Export Data count (activities with 'export' only)
	var exportCount int
	exportQuery := `
		SELECT COUNT(*) FROM act_log
		WHERE aktifitas ILIKE '%export%'
	` + dateFilter
	db.Raw(exportQuery, args...).Scan(&exportCount)

	return &ExportStats{
		ViewData:     viewCount,
		DownloadData: downloadCount,
		ExportData:   exportCount,
	}, nil
}

// GetOperationalIntents returns operational intent statistics
func GetOperationalIntents(startDate, endDate, cluster, limitStr string) ([]OperationalIntent, error) {
	db := database.GetDB()

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 10
	}

	query := `
		SELECT intent_name, count FROM (
			SELECT 
				COALESCE(NULLIF(scope, ''), detail_aktifitas, aktifitas) as intent_name,
				COUNT(*) as count
			FROM act_log
			WHERE aktifitas IS NOT NULL
			AND aktifitas NOT IN ('LOGIN', 'LOGOUT')
	`

	args := []interface{}{}
	argCount := 0

	if cluster != "" {
		argCount++
		query += " AND cluster = $" + strconv.Itoa(argCount)
		args = append(args, cluster)
	}

	if startDate != "" {
		argCount++
		query += " AND tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	argCount++
	query += `
			GROUP BY intent_name
		) sub
		WHERE intent_name IS NOT NULL AND intent_name != ''
		ORDER BY count DESC
		LIMIT $` + strconv.Itoa(argCount)
	args = append(args, limit)

	rows, err := db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var intents []OperationalIntent
	for rows.Next() {
		var i OperationalIntent
		if err := rows.Scan(&i.Name, &i.Count); err != nil {
			return nil, err
		}
		intents = append(intents, i)
	}

	return intents, nil
}

// GetGlobalEconomicsChart returns chart data for global economics module
func GetGlobalEconomicsChart(startDate, endDate string) ([]GlobalEconomicsData, error) {
	db := database.GetDB()

	query := `
		SELECT category, count FROM (
			SELECT 
				CASE 
					WHEN scope ILIKE '%ntpn%' THEN 'NTPN'
					WHEN scope ILIKE '%komdlng%' OR scope ILIKE '%eri%' THEN 'KOMDLNG'
					WHEN scope ILIKE '%ink%' OR scope ILIKE '%garuda%' THEN 'INK'
					WHEN scope ILIKE '%trust%' OR scope ILIKE '%bkn%' THEN 'Trust'
					ELSE 'Other'
				END as category,
				COUNT(*) as count
			FROM act_log
			WHERE cluster = 'pencarian'
			OR scope ILIKE '%search%'
	`

	args := []interface{}{}
	argCount := 0

	if startDate != "" {
		argCount++
		query += " AND tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	query += `
			GROUP BY category
		) sub
		ORDER BY count DESC
	`

	rows, err := db.Raw(query, args...).Rows()
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var data []GlobalEconomicsData
	for rows.Next() {
		var d GlobalEconomicsData
		if err := rows.Scan(&d.Category, &d.Count); err != nil {
			return nil, err
		}
		data = append(data, d)
	}

	return data, nil
}
