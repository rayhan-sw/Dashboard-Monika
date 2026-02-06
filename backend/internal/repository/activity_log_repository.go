package repository

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"gorm.io/gorm"
)

type ActivityLogRepository interface {
	GetTotalCount(startDate, endDate *string, cluster *string, eselon *string) (int64, error)
	GetCountByStatus(status string, startDate, endDate *string, cluster *string, eselon *string) (int64, error)
	GetRecentActivities(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string) ([]entity.ActivityLog, error)
	GetActivityCountByScope(startDate, endDate *string, cluster *string, eselon *string) (map[string]int64, error)
	GetActivityCountByHour(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetActivityCountByHourForSatker(satker string, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetActivityCountByProvince(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetActivityCountByLokasi(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetActivityCountBySatker(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetBusiestHour(startDate, endDate *string, cluster *string, eselon *string) (int, int64, error)
	GetAccessSuccessRateByDate(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetUniqueUsersCount(startDate, endDate *string, cluster *string, eselon *string) (int64, error)
	GetUniqueClusters() ([]string, error)
	GetTopContributors(limit int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
	GetLogoutErrors(limit int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
}

type activityLogRepository struct {
	db *gorm.DB
}

func NewActivityLogRepository(db *gorm.DB) ActivityLogRepository {
	return &activityLogRepository{db: db}
}

// Helper function to apply date range and cluster filter
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

// Helper function to apply cluster filter
func (r *activityLogRepository) applyClusterFilter(db *gorm.DB, cluster *string) *gorm.DB {
	if cluster != nil && *cluster != "" {
		return db.Where("cluster = ?", *cluster)
	}
	return db
}

// Helper function to apply eselon filter
func (r *activityLogRepository) applyEselonFilter(db *gorm.DB, eselon *string) *gorm.DB {
	if eselon != nil && *eselon != "" {
		return db.Where("eselon = ?", *eselon)
	}
	return db
}

func (r *activityLogRepository) GetTotalCount(startDate, endDate *string, cluster *string, eselon *string) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	err := query.Count(&count).Error
	return count, err
}

func (r *activityLogRepository) GetCountByStatus(status string, startDate, endDate *string, cluster *string, eselon *string) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	
	// Login Berhasil: LOGIN dengan scope = 'success' atau NULL
	if status == "SUCCESS" {
		err := query.Where("aktifitas = ? AND (scope = ? OR scope IS NULL OR scope = '')", "LOGIN", "success").Count(&count).Error
		return count, err
	} else if status == "FAILED" {
		// Kesalahan Logout: LOGOUT dengan scope = 'error' saja
		err := query.Where("aktifitas = ? AND scope = ?", "LOGOUT", "error").Count(&count).Error
		return count, err
	}
	err := query.Where("aktifitas = ?", status).Count(&count).Error
	return count, err
}

func (r *activityLogRepository) GetRecentActivities(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string) ([]entity.ActivityLog, error) {
	var activities []entity.ActivityLog
	
	clusterFilter := ""
	if cluster != nil && *cluster != "" {
		clusterFilter = " AND cluster = '" + *cluster + "'"
	}
	
	eselonFilter := ""
	if eselon != nil && *eselon != "" {
		eselonFilter = " AND eselon = '" + *eselon + "'"
	}
	
	// Ambil 5 log terakhir yang terbaru (paling atas = paling baru)
	// Gunakan raw SQL untuk DISTINCT ON dengan ORDER BY yang benar
	query := r.db.Raw(`
		SELECT * FROM (
			SELECT DISTINCT ON (nama, detail_aktifitas) 
				id, id_trans, nama, satker, eselon, aktifitas, scope, lokasi, detail_aktifitas, cluster, tanggal, token, status, created_at, email
			FROM act_log
			WHERE `+r.buildDateFilter(startDate, endDate)+clusterFilter+eselonFilter+`
			ORDER BY nama, detail_aktifitas, tanggal DESC
		) as distinct_activities
		ORDER BY tanggal DESC
		LIMIT 5
	`)
	
	err := query.Scan(&activities).Error
	return activities, err
}

// Helper untuk build date filter string
func (r *activityLogRepository) buildDateFilter(startDate, endDate *string) string {
	if startDate != nil && endDate != nil {
		return "DATE(tanggal) BETWEEN '" + *startDate + "' AND '" + *endDate + "'"
	} else if startDate != nil {
		return "DATE(tanggal) >= '" + *startDate + "'"
	} else if endDate != nil {
		return "DATE(tanggal) <= '" + *endDate + "'"
	}
	return "1=1" // No filter
}

func (r *activityLogRepository) GetActivityCountByScope(startDate, endDate *string, cluster *string, eselon *string) (map[string]int64, error) {
	type Result struct {
		Category string
		Count    int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	
	// Classify activities into categories based on aktifitas field
	err := query.
		Select(`
			CASE 
				WHEN LOWER(detail_aktifitas) IN ('login', 'logout', 'sign in', 'sign out', 'authentication', 'auth') THEN 'System Auth'
				WHEN LOWER(detail_aktifitas) LIKE '%search%' OR LOWER(detail_aktifitas) LIKE '%query%' OR LOWER(detail_aktifitas) LIKE '%find%' OR LOWER(detail_aktifitas) LIKE '%cari%' THEN 'Discovery'
				WHEN LOWER(detail_aktifitas) LIKE '%download%' OR LOWER(detail_aktifitas) LIKE '%export%' OR LOWER(detail_aktifitas) LIKE '%unduh%' THEN 'Data Extraction'
				WHEN LOWER(detail_aktifitas) LIKE '%view%' OR LOWER(detail_aktifitas) LIKE '%read%' OR LOWER(detail_aktifitas) LIKE '%monitor%' OR LOWER(detail_aktifitas) LIKE '%lihat%' OR LOWER(detail_aktifitas) LIKE '%menu%' THEN 'Monitoring & View'
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

func (r *activityLogRepository) GetActivityCountByHour(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Hour  int
		Count int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
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

func (r *activityLogRepository) GetActivityCountByHourForSatker(satker string, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Hour  int
		Count int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	query = query.Where("satker = ?", satker)
	
	err := query.
		Select("EXTRACT(HOUR FROM tanggal)::int as hour, COUNT(*) as count").
		Group("hour").
		Order("hour ASC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	// Create a map for quick lookup
	hourMap := make(map[int]int64)
	for _, r := range results {
		hourMap[r.Hour] = r.Count
	}

	// Fill in all 24 hours with 0 for missing hours
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

func (r *activityLogRepository) GetActivityCountByProvince(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Province string
		Count    int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	err := query.
		Select("province, COUNT(*) as count").
		Where("province != '' AND province IS NOT NULL").
		Group("province").
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

func (r *activityLogRepository) GetActivityCountByLokasi(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Lokasi string
		Count  int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	err := query.
		Select("lokasi, COUNT(*) as count").
		Where("lokasi != '' AND lokasi IS NOT NULL").
		Group("lokasi").
		Order("count DESC").
		Scan(&results).Error

	if err != nil {
		return nil, err
	}

	var data []map[string]interface{}
	for _, r := range results {
		data = append(data, map[string]interface{}{
			"lokasi": r.Lokasi,
			"count":  r.Count,
		})
	}
	return data, nil
}

func (r *activityLogRepository) GetActivityCountBySatker(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Satker string
		Count  int64
	}

	var results []Result
	offset := (page - 1) * pageSize
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	err := query.
		Select("satker, COUNT(*) as count").
		Where("satker != '' AND satker IS NOT NULL").
		Group("satker").
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

func (r *activityLogRepository) GetBusiestHour(startDate, endDate *string, cluster *string, eselon *string) (int, int64, error) {
	type Result struct {
		Hour  int
		Count int64
	}

	var result Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
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

func (r *activityLogRepository) GetAccessSuccessRateByDate(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Date    string
		Success int64
		Failed  int64
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	err := query.
		Select(`
			DATE(tanggal) as date,
			COUNT(CASE WHEN aktifitas = 'LOGIN' AND (scope = 'success' OR scope IS NULL OR scope = '') THEN 1 END) as success,
			COUNT(CASE WHEN aktifitas = 'LOGOUT' AND scope = 'error' THEN 1 END) as failed
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

func (r *activityLogRepository) GetUniqueUsersCount(startDate, endDate *string, cluster *string, eselon *string) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	// Count distinct by nama (username) bukan token
	err := query.
		Distinct("nama").
		Count(&count).Error
	return count, err
}

// GetUniqueClusters returns list of unique cluster values (excluding null/empty)
// Returns clusters with lowercase formatting for consistency
func (r *activityLogRepository) GetUniqueClusters() ([]string, error) {
	var clusters []string
	err := r.db.Raw(`
		SELECT DISTINCT LOWER(cluster) as cluster
		FROM act_log 
		WHERE cluster IS NOT NULL AND cluster != '' AND cluster != 'NULL'
		ORDER BY cluster ASC
	`).Pluck("cluster", &clusters).Error
	return clusters, err
}

// GetTopContributors returns top N users by activity count with their satker
func (r *activityLogRepository) GetTopContributors(limit int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
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
	query = r.applyEselonFilter(query, eselon)
	
	err := query.
		Select("ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) as rank, nama, satker, COUNT(*) as requests").
		Where("nama != '' AND nama IS NOT NULL AND satker != '' AND satker IS NOT NULL").
		Group("nama, satker").
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

// GetLogoutErrors returns top N users with logout errors, sorted by latest error time
func (r *activityLogRepository) GetLogoutErrors(limit int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Nama         string
		ErrorCount   int64
		LatestError  string
	}

	var results []Result
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	
	// Filter: aktifitas = LOGOUT AND scope = error
	err := query.
		Select("nama, COUNT(*) as error_count, MAX(tanggal) as latest_error").
		Where("aktifitas = ? AND scope = ?", "LOGOUT", "error").
		Where("nama != '' AND nama IS NOT NULL").
		Group("nama").
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

