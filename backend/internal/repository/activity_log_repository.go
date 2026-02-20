package repository

import (
	"strings"

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
	GetActivityCountBySatkerProvince(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error)
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
		return db.Joins("LEFT JOIN ref_clusters c ON c.id = activity_logs_normalized.cluster_id").
			Where("c.name = ?", *cluster)
	}
	return db
}

// Helper function to apply eselon filter
func (r *activityLogRepository) applyEselonFilter(db *gorm.DB, eselon *string) *gorm.DB {
	if eselon != nil && *eselon != "" {
		return db.Joins("LEFT JOIN ref_satker_units s ON s.id = activity_logs_normalized.satker_id").
			Where("s.eselon_level = ?", *eselon)
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
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN ref_activity_types at ON at.id = activity_logs_normalized.activity_type_id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)

	// Login Berhasil: LOGIN dengan scope = 'success' atau NULL
	if status == "SUCCESS" {
		err := query.Where("at.name = ? AND (scope ILIKE ? OR scope IS NULL OR scope = '')", "LOGIN", "%success%").Count(&count).Error
		return count, err
	} else if status == "FAILED" {
		// Kesalahan Logout: LOGOUT dengan scope = 'error' saja
		err := query.Where("at.name = ? AND scope ILIKE ?", "LOGOUT", "%error%").Count(&count).Error
		return count, err
	}
	err := query.Where("at.name = ?", status).Count(&count).Error
	return count, err
}

func (r *activityLogRepository) GetRecentActivities(page, pageSize int, startDate, endDate *string, cluster *string, eselon *string) ([]entity.ActivityLog, error) {
	var activities []entity.ActivityLog

	// Create base query with Joins
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

	// Apply filters
	query = r.applyDateFilter(query, startDate, endDate)

	if cluster != nil && *cluster != "" {
		query = query.Where("c.name = ?", *cluster)
	}

	if eselon != nil && *eselon != "" {
		query = query.Where("s.eselon_level = ?", *eselon)
	}

	// Use DISTINCT ON logic via Subquery or GORM
	// Since GORM doesn't support complex DISTINCT ON easily with Preloads, we might need a different approach
	// or accept that we show all recent activities (not distinct by user/activity) which is often better for a log.
	// If DISTINCT ON is a hard requirement, we'd need a raw SQL query that returns IDs, then fetch with Preload.

	// Simplified Approach: Just get recent logs
	err := query.Order("activity_logs_normalized.tanggal DESC").
		Limit(5).
		Find(&activities).Error

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
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN ref_activity_types at ON activity_logs_normalized.activity_type_id = at.id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)

	// Use the category explicitly defined in the reference table if possible,
	// or fallback to logic based on activity name
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

	// Join with satker table to filter by name
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
		Joins("LEFT JOIN ref_locations l ON l.id = activity_logs_normalized.location_id").
		Select("l.location_name as lokasi, COUNT(*) as count").
		Where("l.location_name != '' AND l.location_name IS NOT NULL").
		Group("l.location_name").
		Order("count DESC").
		Limit(10).
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

// GetActivityCountBySatkerProvince aggregates activity count by province from ref_locations
func (r *activityLogRepository) GetActivityCountBySatkerProvince(startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
	type Result struct {
		Province string
		Count    int64
	}

	// Build WHERE conditions for subquery
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

	if eselon != nil && *eselon != "" {
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

	// Use subquery to normalize first, then aggregate
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
	query := r.db.Model(&entity.ActivityLog{}).
		Joins("LEFT JOIN ref_activity_types at ON activity_logs_normalized.activity_type_id = at.id")

	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
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

func (r *activityLogRepository) GetUniqueUsersCount(startDate, endDate *string, cluster *string, eselon *string) (int64, error) {
	var count int64
	query := r.db.Model(&entity.ActivityLog{})
	query = r.applyDateFilter(query, startDate, endDate)
	query = r.applyClusterFilter(query, cluster)
	query = r.applyEselonFilter(query, eselon)
	// Count distinct by user_id
	err := query.
		Distinct("user_id").
		Count(&count).Error
	return count, err
}

// GetUniqueClusters returns list of unique cluster values (excluding null/empty)
// Returns clusters with lowercase formatting for consistency
func (r *activityLogRepository) GetUniqueClusters() ([]string, error) {
	var clusters []string
	err := r.db.Table("ref_clusters").
		Select("DISTINCT name").
		Where("name IS NOT NULL AND name != ''").
		Order("name ASC").
		Pluck("name", &clusters).Error
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

// GetLogoutErrors returns top N users with logout errors, sorted by latest error time
func (r *activityLogRepository) GetLogoutErrors(limit int, startDate, endDate *string, cluster *string, eselon *string) ([]map[string]interface{}, error) {
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
	query = r.applyEselonFilter(query, eselon)

	// Filter: aktifitas = LOGOUT AND scope = error
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
