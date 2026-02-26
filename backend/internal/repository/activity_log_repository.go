// Package repository berisi akses data ke database (query, agregasi).
//
// File activity_log_repository.go: repository untuk tabel activity_logs_normalized dan tabel referensi (ref_clusters, ref_satker_units, ref_activity_types, ref_locations, user_profiles).
// Menyediakan: filter regional (tanggal, cluster, eselon, satkerIds), hitung total, hitung per status, aktivitas terbaru, chart per scope/jam/provinsi/lokasi/satker, jam tersibuk, tingkat sukses akses, user unik, cluster unik, top kontributor, error logout.
package repository

import (
	"strings"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"gorm.io/gorm"
)

// ActivityLogRepository interface untuk semua query aktivitas (dashboard, chart, filter regional).
type ActivityLogRepository interface {
	GetSatkerIdsUnderRoot(rootId int64) ([]int64, error)
	GetTotalCount(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int64, error)
	GetCountByStatus(status string, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int64, error)
	GetRecentActivities(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]entity.ActivityLog, error)
	GetActivityCountByScope(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (map[string]int64, error)
	GetActivityCountByHour(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetActivityCountByHourForSatker(satker string, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetActivityCountByProvince(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetActivityCountByLokasi(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetActivityCountBySatkerProvince(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetActivityCountBySatker(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetBusiestHour(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int, int64, error)
	GetAccessSuccessRateByDate(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetUniqueUsersCount(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int64, error)
	GetUniqueClusters() ([]string, error)
	GetTopContributors(limit int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
	GetLogoutErrors(limit int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error)
}

// activityLogRepository implementasi ActivityLogRepository; menyimpan koneksi DB.
type activityLogRepository struct {
	db *gorm.DB
}

// NewActivityLogRepository membuat instance repository aktivitas.
func NewActivityLogRepository(db *gorm.DB) ActivityLogRepository {
	return &activityLogRepository{db: db}
}

// applyDateFilter menambah kondisi WHERE untuk kolom tanggal: BETWEEN, >= start, atau <= end. Jika keduanya nil, query tidak diubah.
func (r *activityLogRepository) applyDateFilter(db *gorm.DB, startDate, endDate *string) *gorm.DB {
	if startDate != nil && endDate != nil {
		return db.Where("DATE(tanggal) BETWEEN ? AND ?", *startDate, *endDate)
	} else if startDate != nil {
		return db.Where("DATE(tanggal) >= ?", *startDate)
	} else if endDate != nil {
		return db.Where("DATE(tanggal) <= ?", *endDate)
	}
	return db
}

// applyClusterFilter menambah JOIN ref_clusters dan WHERE c.name = cluster jika cluster tidak kosong.
func (r *activityLogRepository) applyClusterFilter(db *gorm.DB, cluster *string) *gorm.DB {
	if cluster != nil && *cluster != "" {
		return db.Joins("LEFT JOIN ref_clusters c ON c.id = activity_logs_normalized.cluster_id").
			Where("c.name = ?", *cluster)
	}
	return db
}

// applyEselonFilter menambah JOIN ref_satker_units dan WHERE s.eselon_level = eselon jika eselon tidak kosong.
func (r *activityLogRepository) applyEselonFilter(db *gorm.DB, eselon *string) *gorm.DB {
	if eselon != nil && *eselon != "" {
		return db.Joins("LEFT JOIN ref_satker_units s ON s.id = activity_logs_normalized.satker_id").
			Where("s.eselon_level = ?", *eselon)
	}
	return db
}

// applyEselonOrSatkerIdsFilter: jika satkerIds berisi, filter satker_id IN (satkerIds); jika tidak, pakai filter eselon.
func (r *activityLogRepository) applyEselonOrSatkerIdsFilter(db *gorm.DB, eselon *string, satkerIds []int64) *gorm.DB {
	if len(satkerIds) > 0 {
		return db.Where("activity_logs_normalized.satker_id IN ?", satkerIds)
	}
	return r.applyEselonFilter(db, eselon)
}

// GetSatkerIdsUnderRoot mengembalikan rootId dan semua ID satker turunan (recursive: parent_id → id). Dipakai untuk filter per unit Eselon I.
func (r *activityLogRepository) GetSatkerIdsUnderRoot(rootId int64) ([]int64, error) {
	var ids []int64
	// CTE rekursif: mulai dari root, lalu UNION ALL anak yang parent_id = id di tree.
	err := r.db.Raw(`
		WITH RECURSIVE tree AS (
			SELECT id FROM ref_satker_units WHERE id = ?
			UNION ALL
			SELECT s.id FROM ref_satker_units s INNER JOIN tree t ON s.parent_id = t.id
		)
		SELECT id FROM tree
	`, rootId).Scan(&ids).Error
	return ids, err
}

// GetTotalCount menghitung total baris aktivitas setelah filter tanggal, cluster, eselon/satkerIds.
func (r *activityLogRepository) GetTotalCount(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)
	err := query.Count(&count).Error
	return count, err
}

// GetCountByStatus menghitung jumlah aktivitas per status: SUCCESS = LOGIN dengan scope success/NULL, FAILED = LOGOUT dengan scope error; selain itu filter by at.name = status.
func (r *activityLogRepository) GetCountByStatus(status string, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN ref_activity_types at ON at.id = activity_logs_normalized.activity_type_id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	if status == "SUCCESS" {
		err := query.Where("at.name = ? AND (scope ILIKE ? OR scope IS NULL OR scope = '')", "LOGIN", "%success%").Count(&count).Error
		return count, err
	} else if status == "FAILED" {
		err := query.Where("at.name = ? AND scope ILIKE ?", "LOGOUT", "%error%").Count(&count).Error
		return count, err
	}
	err := query.Where("at.name = ?", status).Count(&count).Error
	return count, err
}

// GetRecentActivities mengembalikan aktivitas terbaru dengan paginasi; relasi User, Satker, ActivityType, Cluster, Location di-preload untuk DTO.
func (r *activityLogRepository) GetRecentActivities(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]entity.ActivityLog, error) {
	var activities []entity.ActivityLog

	query := r.db.Model(&entity.ActivityLog{}).
		Preload("User").
		Preload("Satker").
		Preload("ActivityType").
		Preload("Cluster").
		Preload("Location").
		Joins("LEFT JOIN user_profiles u ON u.id = activity_logs_normalized.user_id").
		Joins("LEFT JOIN ref_satker_units s ON s.id = activity_logs_normalized.satker_id").
		Joins("LEFT JOIN ref_activity_types at ON at.id = activity_logs_normalized.activity_type_id").
		Joins("LEFT JOIN ref_clusters c ON c.id = activity_logs_normalized.cluster_id").
		Joins("LEFT JOIN ref_locations l ON l.id = activity_logs_normalized.location_id")

	query = r.applyDateFilter(query, startDate, endDate)

	if cluster != nil && *cluster != "" {
		query = query.Where("c.name = ?", *cluster)
	}

	if len(satkerIds) > 0 {
		query = query.Where("activity_logs_normalized.satker_id IN ?", satkerIds)
	} else if eselon != nil && *eselon != "" {
		query = query.Where("s.eselon_level = ?", *eselon)
	}

	offset := (page - 1) * pageSize
	err := query.Order("activity_logs_normalized.tanggal DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&activities).Error

	return activities, err
}

// buildDateFilter mengembalikan string kondisi WHERE untuk tanggal (dipakai di raw query). Tanpa filter mengembalikan "1=1".
func (r *activityLogRepository) buildDateFilter(startDate, endDate *string) string {
	if startDate != nil && endDate != nil {
		return "DATE(tanggal) BETWEEN '" + *startDate + "' AND '" + *endDate + "'"
	} else if startDate != nil {
		return "DATE(tanggal) >= '" + *startDate + "'"
	} else if endDate != nil {
		return "DATE(tanggal) <= '" + *endDate + "'"
	}
	return "1=1"
}

// GetActivityCountByScope mengelompokkan aktivitas menurut kategori (at.category) lalu memetakan ke label: data_access→Monitoring & View, authentication→System Auth, search→Discovery, download→Data Extraction, lain→Other.
func (r *activityLogRepository) GetActivityCountByScope(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (map[string]int64, error) {
	type Result struct {
		Category string
		Count    int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN ref_activity_types at ON activity_logs_normalized.activity_type_id = at.id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	err := query.
		Select(`
			CASE COALESCE(NULLIF(at.category, ''), 'other')
				WHEN 'data_access'     THEN 'Monitoring & View'
				WHEN 'authentication'  THEN 'System Auth'
				WHEN 'search'          THEN 'Discovery'
				WHEN 'download'        THEN 'Data Extraction'
				ELSE 'Other'
			END as category,
			COUNT(*) as count
		`).
		Group("category").
		Order("count DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Category] = r.Count
	}
	return counts, nil
}

// GetActivityCountByHour mengembalikan jumlah aktivitas per jam (0–23); hasil slice map hour/count, urut jam naik.
func (r *activityLogRepository) GetActivityCountByHour(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Hour  int
		Count int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)
	err := query.
		Select("EXTRACT(HOUR FROM tanggal)::int as hour, COUNT(*) as count").
		Group("hour").
		Order("hour ASC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		data = append(data, map[string]interface{}{
			"hour":  r.Hour,
			"count": r.Count,
		})
	}
	return data, nil
}

// GetActivityCountByHourForSatker sama seperti GetActivityCountByHour tetapi difilter oleh nama satker; mengembalikan 24 jam (jam tanpa data diisi 0).
func (r *activityLogRepository) GetActivityCountByHourForSatker(satker string, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Hour  int
		Count int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	query = query.Joins("LEFT JOIN ref_satker_units s ON s.id = activity_logs_normalized.satker_id").
		Where("s.satker_name = ?", satker)

	err := query.
		Select("EXTRACT(HOUR FROM tanggal)::int as hour, COUNT(*) as count").
		Group("hour").
		Order("hour ASC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	hourMap := make(map[int]int64)
	for _, r := range results {
		hourMap[r.Hour] = r.Count
	}

	// Pastikan response selalu 24 entri (jam 0–23); jam tanpa data = 0.
	var data []map[string]interface{}
	for i := 0; i < 24; i++ {
		count := int64(0)
		if val, exists := hourMap[i]; exists {
			count = val
		}
		data = append(data, map[string]interface{}{
			"hour":  i,
			"count": count,
		})
	}
	return data, nil
}

// GetActivityCountByProvince mengelompokkan aktivitas per provinsi (ref_locations.province); mengabaikan provinsi kosong/NULL; urut count menurun.
func (r *activityLogRepository) GetActivityCountByProvince(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Province string
		Count    int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	err := query.
		Joins("LEFT JOIN ref_locations l ON l.id = activity_logs_normalized.location_id").
		Select("l.province, COUNT(*) as count").
		Where("l.province != '' AND l.province IS NOT NULL").
		Group("l.province").
		Order("count DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		data = append(data, map[string]interface{}{
			"province": r.Province,
			"count":    r.Count,
		})
	}
	return data, nil
}

// GetActivityCountByLokasi mengelompokkan aktivitas per location_name; batas hasil TopLokasiLimit; urut count menurun.
func (r *activityLogRepository) GetActivityCountByLokasi(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Lokasi string
		Count  int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	err := query.
		Joins("LEFT JOIN ref_locations l ON l.id = activity_logs_normalized.location_id").
		Select("l.location_name as lokasi, COUNT(*) as count").
		Where("l.location_name != '' AND l.location_name IS NOT NULL").
		Group("l.location_name").
		Order("count DESC").
		Limit(config.TopLokasiLimit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		data = append(data, map[string]interface{}{
			"location": r.Lokasi,
			"count":    r.Count,
		})
	}
	return data, nil
}

// GetActivityCountBySatkerProvince mengagregasi aktivitas per provinsi (dari ref_locations); normalisasi nama provinsi (DKI→DKI JAKARTA, DAERAH ISTIMEWA YOGYAKARTA→DI YOGYAKARTA); exclude provinsi generik (UNKNOWN, KALIMANTAN, dll.). Raw SQL dengan subquery.
func (r *activityLogRepository) GetActivityCountBySatkerProvince(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Province string
		Count    int64
	}

	var conditions []string
	var args []interface{}

	if startDate != nil && endDate != nil {
		conditions = append(conditions, "DATE(al.tanggal) BETWEEN ? AND ?")
		args = append(args, *startDate, *endDate)
	} else if startDate != nil {
		conditions = append(conditions, "DATE(al.tanggal) >= ?")
		args = append(args, *startDate)
	} else if endDate != nil {
		conditions = append(conditions, "DATE(al.tanggal) <= ?")
		args = append(args, *endDate)
	}

	if cluster != nil && *cluster != "" {
		conditions = append(conditions, "c.name = ?")
		args = append(args, *cluster)
	}

	if len(satkerIds) > 0 {
		conditions = append(conditions, "al.satker_id IN ?")
		args = append(args, satkerIds)
	} else if eselon != nil && *eselon != "" {
		conditions = append(conditions, "s.eselon_level = ?")
		args = append(args, *eselon)
	}

	whereClause := ""
	if len(conditions) > 0 {
		whereClause = "WHERE " + strings.Join(conditions, " AND ") + " AND "
	} else {
		whereClause = "WHERE "
	}
	whereClause += "l.province != '' AND l.province IS NOT NULL AND UPPER(l.province) NOT IN ('UNKNOWN', 'KALIMANTAN', 'SULAWESI', 'PAPUA', 'JAWA', 'KEPULAUAN')"

	sqlQuery := `
		SELECT normalized_province as province, SUM(cnt) as count
		FROM (
			SELECT 
				CASE
					WHEN UPPER(l.province) = 'DKI' THEN 'DKI JAKARTA'
					WHEN UPPER(l.province) = 'DAERAH ISTIMEWA YOGYAKARTA' THEN 'DI YOGYAKARTA'
					ELSE UPPER(l.province)
				END as normalized_province,
				COUNT(*) as cnt
			FROM activity_logs_normalized al
			LEFT JOIN ref_locations l ON l.id = al.location_id
			LEFT JOIN ref_clusters c ON c.id = al.cluster_id
			LEFT JOIN ref_satker_units s ON s.id = al.satker_id
			` + whereClause + `
			GROUP BY normalized_province
		) subquery
		GROUP BY normalized_province
		ORDER BY count DESC
	`

	var results []Result
	err := r.db.Raw(sqlQuery, args...).Scan(&results).Error
	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		data = append(data, map[string]interface{}{
			"lokasi": r.Province,
			"count":  r.Count,
		})
	}
	return data, nil
}

// GetActivityCountBySatker mengembalikan jumlah aktivitas per satker (satker_name) dengan paginasi; field rank = offset + urutan dalam halaman.
func (r *activityLogRepository) GetActivityCountBySatker(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Satker string
		Count  int64
	}

	var results []Result
	offset := (page - 1) * pageSize
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)
	err := query.
		Joins("LEFT JOIN ref_satker_units s ON s.id = activity_logs_normalized.satker_id").
		Select("s.satker_name as satker, COUNT(*) as count").
		Where("s.satker_name != '' AND s.satker_name IS NOT NULL").
		Group("s.satker_name").
		Order("count DESC").
		Offset(offset).
		Limit(pageSize).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for i, r := range results {
		data = append(data, map[string]interface{}{
			"rank":   offset + i + 1,
			"satker": r.Satker,
			"count":  r.Count,
		})
	}
	return data, nil
}

// GetBusiestHour mengembalikan jam (0–23) dengan jumlah aktivitas terbanyak dan jumlahnya; LIMIT 1 setelah ORDER count DESC.
func (r *activityLogRepository) GetBusiestHour(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int, int64, error) {
	type Result struct {
		Hour  int
		Count int64
	}

	var result Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)
	err := query.
		Select("EXTRACT(HOUR FROM tanggal)::int as hour, COUNT(*) as count").
		Group("hour").
		Order("count DESC").
		Limit(1).
		Scan(&result).Error

	if err != nil {
		return 0, 0, err
	}

	return result.Hour, result.Count, nil
}

// GetAccessSuccessRateByDate mengembalikan per tanggal: jumlah login sukses (LOGIN + scope success/NULL), jumlah logout error (LOGOUT + scope error), dan success_rate (persen). Urut tanggal naik.
func (r *activityLogRepository) GetAccessSuccessRateByDate(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Date    string
		Success int64
		Failed  int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN ref_activity_types at ON activity_logs_normalized.activity_type_id = at.id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)
	err := query.
		Select(`
			DATE(tanggal) as date,
			COUNT(CASE WHEN at.name = 'LOGIN' AND (scope ILIKE '%success%' OR scope IS NULL OR scope = '') THEN 1 END) as success,
			COUNT(CASE WHEN at.name = 'LOGOUT' AND scope ILIKE '%error%' THEN 1 END) as failed
		`).
		Group("DATE(tanggal)").
		Order("date ASC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		total := r.Success + r.Failed
		successRate := float64(0)
		if total > 0 {
			successRate = float64(r.Success) / float64(total) * 100
		}
		data = append(data, map[string]interface{}{
			"date":         r.Date,
			"success":      r.Success,
			"failed":       r.Failed,
			"success_rate": successRate,
		})
	}
	return data, nil
}

// GetUniqueUsersCount menghitung jumlah user_id unik (DISTINCT user_id) setelah filter tanggal, cluster, eselon/satkerIds.
func (r *activityLogRepository) GetUniqueUsersCount(startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)
	err := query.
		Distinct("user_id").
		Count(&count).Error
	return count, err
}

// GetUniqueClusters mengembalikan daftar nama cluster unik dari ref_clusters (nama tidak null dan tidak kosong), urut nama naik.
func (r *activityLogRepository) GetUniqueClusters() ([]string, error) {
	var clusters []string
	err := r.db.Table("ref_clusters").
		Select("DISTINCT name").
		Where("name IS NOT NULL AND name != ''").
		Order("name ASC").
		Pluck("name", &clusters).Error
	return clusters, err
}

// GetTopContributors mengembalikan top N user (nama + satker) dengan jumlah aktivitas terbanyak; rank dari ROW_NUMBER(), group by nama dan satker_name.
func (r *activityLogRepository) GetTopContributors(limit int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Rank     int
		Nama     string
		Satker   string
		Requests int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	err := query.
		Joins("LEFT JOIN user_profiles u ON u.id = activity_logs_normalized.user_id").
		Joins("LEFT JOIN ref_satker_units s ON s.id = activity_logs_normalized.satker_id").
		Select("ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank, u.nama, s.satker_name as satker, COUNT(*) as requests").
		Where("u.nama != '' AND u.nama IS NOT NULL").
		Group("u.nama, s.satker_name").
		Order("requests DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		data = append(data, map[string]interface{}{
			"rank":     r.Rank,
			"username": r.Nama,
			"unit":     r.Satker,
			"requests": r.Requests,
		})
	}
	return data, nil
}

// GetLogoutErrors mengembalikan top N user dengan error logout terbanyak (at.name = LOGOUT, scope ILIKE '%error%'); urut berdasarkan waktu error terbaru (latest_error DESC).
func (r *activityLogRepository) GetLogoutErrors(limit int, startDate, endDate *string, cluster *string, eselon *string, satkerIds []int64) ([]map[string]interface{}, error) {
	type Result struct {
		Nama        string
		ErrorCount  int64
		LatestError string
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN user_profiles u ON u.id = activity_logs_normalized.user_id").
		Joins("LEFT JOIN ref_activity_types at ON at.id = activity_logs_normalized.activity_type_id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonOrSatkerIdsFilter(query, eselon, satkerIds)

	err := query.
		Select("u.nama, COUNT(*) as error_count, MAX(tanggal) as latest_error").
		Where("at.name = ? AND scope ILIKE ?", "LOGOUT", "%error%").
		Where("u.nama != '' AND u.nama IS NOT NULL").
		Group("u.nama").
		Order("latest_error DESC").
		Limit(limit).
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for i, r := range results {
		data = append(data, map[string]interface{}{
			"rank":         i + 1,
			"username":     r.Nama,
			"error_count":  r.ErrorCount,
			"latest_error": r.LatestError,
		})
	}
	return data, nil
}
