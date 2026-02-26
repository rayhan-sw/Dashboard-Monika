// File content_repository.go: query untuk data analitik/konten dashboard (peringkat kluster, penggunaan modul pencarian, statistik ekspor, intensi operasional, chart Global Economics).
//
// Semua fungsi memakai raw SQL dengan parameter posisi ($1, $2, ...) untuk filter tanggal dan cluster. Data sumber: activity_logs_normalized dan tabel referensi (ref_clusters, ref_activity_types).
package repository

import (
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
)

// DashboardRanking satu baris peringkat penggunaan dashboard: urutan (rank), nama cluster, jumlah aktivitas, persentase terhadap total.
type DashboardRanking struct {
	Rank       int     `json:"rank"`
	Name       string  `json:"name"`
	Count      int     `json:"count"`
	Percentage float64 `json:"percentage"`
}

// SearchModule satu baris statistik modul pencarian: nama modul (scope/detail), jumlah.
type SearchModule struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// ExportStats ringkasan ekspor/unduh: total view_data, total download_data, dan detail per aktivitas (view_details, download_details).
type ExportStats struct {
	ViewData        int                   `json:"view_data"`
	DownloadData    int                   `json:"download_data"`
	ViewDetails     []DetailActivityCount `json:"view_details,omitempty"`
	DownloadDetails []DetailActivityCount `json:"download_details,omitempty"`
}

// DetailActivityCount satu baris detail aktivitas: nama detail (detail_aktifitas/scope/at.name) dan count.
type DetailActivityCount struct {
	Detail string `json:"detail"`
	Count  int    `json:"count"`
}

// OperationalIntent satu baris intensi operasional: nama (scope/detail_aktifitas/at.name) dan count.
type OperationalIntent struct {
	Name  string `json:"name"`
	Count int    `json:"count"`
}

// GlobalEconomicsData satu baris chart Global Economics: kategori (NTPN, KOMDLNG, INK, Trust, Other) dan count.
type GlobalEconomicsData struct {
	Category string `json:"category"`
	Count    int    `json:"count"`
}

// GetDashboardRankings mengembalikan peringkat penggunaan dashboard per cluster (nama cluster = COALESCE(c.name, 'Tidak Terkategori')). Filter opsional: startDate, endDate. Persentase dihitung dari total semua count.
func GetDashboardRankings(startDate, endDate string) ([]DashboardRanking, error) {
	db := database.GetDB()

	query := `
		SELECT 
			COALESCE(c.name, 'Tidak Terkategori') as name,
			COUNT(a.id) as count
		FROM activity_logs_normalized a
		LEFT JOIN ref_clusters c ON a.cluster_id = c.id
		WHERE 1=1
	`

	args := []interface{}{}
	argCount := 0

	if startDate != "" {
		argCount++
		query += " AND a.tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND a.tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	query += `
		GROUP BY c.name
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

	type tempRanking struct {
		Name  string
		Count int
	}
	var tempData []tempRanking

	// Putaran pertama: baca semua baris dan jumlahkan total untuk hitung persen nanti.
	for rows.Next() {
		var name string
		var count int
		if err := rows.Scan(&name, &count); err != nil {
			return nil, err
		}
		tempData = append(tempData, tempRanking{Name: name, Count: count})
		total += count
	}

	// Putaran kedua: hitung persentase per baris (count/total*100) dan isi rank 1, 2, 3, ...
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

// GetSearchModuleUsage mengembalikan statistik penggunaan modul pencarian: hanya aktivitas yang namanya/scope/detail mengandung search atau pencarian; nama modul = scope jika ada kata search/pencarian, else detail_aktifitas. Filter: cluster, startDate, endDate. Hasil dibatasi 5 baris, urut count DESC.
func GetSearchModuleUsage(startDate, endDate, cluster string) ([]SearchModule, error) {
	db := database.GetDB()

	query := `
		SELECT 
			module_name,
			count
		FROM (
			SELECT 
				CASE 
					WHEN a.scope ILIKE '%search%' OR a.scope ILIKE '%pencarian%' THEN 
						COALESCE(NULLIF(a.scope, ''), 'Lainnya')
					ELSE COALESCE(NULLIF(a.detail_aktifitas, ''), 'Lainnya')
				END as module_name,
				COUNT(*) as count
			FROM activity_logs_normalized a
			LEFT JOIN ref_activity_types at ON a.activity_type_id = at.id
			LEFT JOIN ref_clusters c ON a.cluster_id = c.id
			WHERE (
				at.name ILIKE '%search%' 
				OR at.name ILIKE '%pencarian%'
				OR a.scope ILIKE '%search%'
				OR a.detail_aktifitas ILIKE '%pencarian%'
			)
	`

	args := []interface{}{}
	argCount := 0

	if cluster != "" {
		argCount++
		query += " AND c.name = $" + strconv.Itoa(argCount)
		args = append(args, cluster)
	}

	if startDate != "" {
		argCount++
		query += " AND a.tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND a.tanggal <= $" + strconv.Itoa(argCount)
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

// GetExportStats mengembalikan statistik view vs download: view_data = aktivitas at.name ILIKE '%view%' dan BUKAN download/export; download_data = at.name ILIKE '%download%'. Detail per aktivitas (detail = detail_aktifitas atau scope atau at.name) dibatasi 10 baris masing-masing. Filter: cluster, startDate, endDate dipakai untuk semua subquery.
func GetExportStats(startDate, endDate, cluster string) (*ExportStats, error) {
	db := database.GetDB()

	args := []interface{}{}
	argCount := 0

	// Bangun klausa filter yang sama untuk semua query (cluster + tanggal).
	dateFilter := ""
	if cluster != "" {
		argCount++
		dateFilter += " AND c.name = $" + strconv.Itoa(argCount)
		args = append(args, cluster)
	}
	if startDate != "" {
		argCount++
		dateFilter += " AND a.tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		dateFilter += " AND a.tanggal <= $" + strconv.Itoa(argCount)
		args = append(args, endDate)
	}

	var viewCount int
	viewQuery := `
		SELECT COUNT(*) 
		FROM activity_logs_normalized a
		JOIN ref_activity_types at ON a.activity_type_id = at.id
		LEFT JOIN ref_clusters c ON a.cluster_id = c.id
		WHERE at.name ILIKE '%view%' 
		AND at.name NOT ILIKE '%download%' 
		AND at.name NOT ILIKE '%export%'
	` + dateFilter
	db.Raw(viewQuery, args...).Scan(&viewCount)

	var downloadCount int
	downloadQuery := `
		SELECT COUNT(*) 
		FROM activity_logs_normalized a
		JOIN ref_activity_types at ON a.activity_type_id = at.id
		LEFT JOIN ref_clusters c ON a.cluster_id = c.id
		WHERE at.name ILIKE '%download%'
	` + dateFilter
	db.Raw(downloadQuery, args...).Scan(&downloadCount)

	var viewDetails []DetailActivityCount
	viewDetailQuery := `
		SELECT 
			COALESCE(NULLIF(a.detail_aktifitas, ''), a.scope, at.name) as detail,
			COUNT(*) as count
		FROM activity_logs_normalized a
		JOIN ref_activity_types at ON a.activity_type_id = at.id
		LEFT JOIN ref_clusters c ON a.cluster_id = c.id
		WHERE at.name ILIKE '%view%' 
		AND at.name NOT ILIKE '%download%' 
		AND at.name NOT ILIKE '%export%'
	` + dateFilter + `
		GROUP BY detail
		ORDER BY count DESC
		LIMIT 10
	`
	db.Raw(viewDetailQuery, args...).Scan(&viewDetails)

	var downloadDetails []DetailActivityCount
	downloadDetailQuery := `
		SELECT 
			COALESCE(NULLIF(a.detail_aktifitas, ''), a.scope, at.name) as detail,
			COUNT(*) as count
		FROM activity_logs_normalized a
		JOIN ref_activity_types at ON a.activity_type_id = at.id
		LEFT JOIN ref_clusters c ON a.cluster_id = c.id
		WHERE at.name ILIKE '%download%'
	` + dateFilter + `
		GROUP BY detail
		ORDER BY count DESC
		LIMIT 10
	`
	db.Raw(downloadDetailQuery, args...).Scan(&downloadDetails)

	return &ExportStats{
		ViewData:        viewCount,
		DownloadData:    downloadCount,
		ViewDetails:     viewDetails,
		DownloadDetails: downloadDetails,
	}, nil
}

// GetOperationalIntents mengembalikan statistik intensi operasional: aktivitas yang bukan LOGIN/LOGOUT; intent_name = scope atau detail_aktifitas atau at.name. Filter: cluster, startDate, endDate. Limit dari limitStr (parse gagal pakai config.DefaultLimit). Exclude intent_name null/kosong.
func GetOperationalIntents(startDate, endDate, cluster, limitStr string) ([]OperationalIntent, error) {
	db := database.GetDB()

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = config.DefaultLimit
	}

	query := `
		SELECT intent_name, count FROM (
			SELECT 
				COALESCE(NULLIF(a.scope, ''), a.detail_aktifitas, at.name) as intent_name,
				COUNT(*) as count
			FROM activity_logs_normalized a
			JOIN ref_activity_types at ON a.activity_type_id = at.id
			LEFT JOIN ref_clusters c ON a.cluster_id = c.id
			WHERE at.name IS NOT NULL
			AND at.name NOT IN ('LOGIN', 'LOGOUT')
	`

	args := []interface{}{}
	argCount := 0

	if cluster != "" {
		argCount++
		query += " AND c.name = $" + strconv.Itoa(argCount)
		args = append(args, cluster)
	}

	if startDate != "" {
		argCount++
		query += " AND a.tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND a.tanggal <= $" + strconv.Itoa(argCount)
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

// GetGlobalEconomicsChart mengembalikan data chart Global Economics: kategori dari scope (ntpn→NTPN, komdlng/eri→KOMDLNG, ink/garuda→INK, trust/bkn→Trust, lain→Other). Hanya aktivitas dengan c.name='pencarian' atau scope ILIKE '%search%'. Filter: startDate, endDate.
func GetGlobalEconomicsChart(startDate, endDate string) ([]GlobalEconomicsData, error) {
	db := database.GetDB()

	query := `
		SELECT category, count FROM (
			SELECT 
				CASE 
					WHEN a.scope ILIKE '%ntpn%' THEN 'NTPN'
					WHEN a.scope ILIKE '%komdlng%' OR a.scope ILIKE '%eri%' THEN 'KOMDLNG'
					WHEN a.scope ILIKE '%ink%' OR a.scope ILIKE '%garuda%' THEN 'INK'
					WHEN a.scope ILIKE '%trust%' OR a.scope ILIKE '%bkn%' THEN 'Trust'
					ELSE 'Other'
				END as category,
				COUNT(*) as count
			FROM activity_logs_normalized a
			LEFT JOIN ref_clusters c ON a.cluster_id = c.id
			WHERE c.name = 'pencarian'
			OR a.scope ILIKE '%search%'
	`

	args := []interface{}{}
	argCount := 0

	if startDate != "" {
		argCount++
		query += " AND a.tanggal >= $" + strconv.Itoa(argCount)
		args = append(args, startDate)
	}
	if endDate != "" {
		argCount++
		query += " AND a.tanggal <= $" + strconv.Itoa(argCount)
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
