package repository

import (
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"gorm.io/gorm"
)

type SearchRepository struct {
	db *gorm.DB
}

func NewSearchRepository(db *gorm.DB) *SearchRepository {
	return &SearchRepository{db: db}
}

type SearchParams struct {
	Query         string
	Satker        string
	SatkerIds     []int64
	Cluster       string
	Status        string
	ActivityTypes []string
	StartDate     time.Time
	EndDate       time.Time
	Page          int
	PageSize      int
}

type Suggestion struct {
	Type  string `json:"type"`  // "user", "satker", or "recent"
	Value string `json:"value"`
	Label string `json:"label"`
}

// Search performs a comprehensive search across activity logs
func (r *SearchRepository) Search(params SearchParams) ([]entity.ActivityLog, int64, error) {
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

	// Query search (nama, satker, email, or activity)
	if params.Query != "" {
		likeQuery := "%" + params.Query + "%"
		query = query.Where(
			"u.nama ILIKE ? OR s.satker_name ILIKE ? OR u.email ILIKE ? OR at.name ILIKE ?",
			likeQuery, likeQuery, likeQuery, likeQuery,
		)
	}

	// Satker filter
	if params.Satker != "" {
		query = query.Where("s.satker_name ILIKE ?", "%"+params.Satker+"%")
	}

	// Satker IDs filter (for tree view multi-select)
	if len(params.SatkerIds) > 0 {
		query = query.Where("activity_logs_normalized.satker_id IN ?", params.SatkerIds)
	}

	// Cluster filter
	if params.Cluster != "" {
		query = query.Where("c.name = ?", params.Cluster)
	}

	// Status filter
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	// Activity types filter
	if len(params.ActivityTypes) > 0 {
		query = query.Where("at.name IN ?", params.ActivityTypes)
	}

	// Date range filter
	if !params.StartDate.IsZero() {
		query = query.Where("tanggal >= ?", params.StartDate)
	}
	if !params.EndDate.IsZero() {
		query = query.Where("tanggal <= ?", params.EndDate)
	}

	// Count total results
	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Get paginated results
	var results []entity.ActivityLog
	offset := (params.Page - 1) * params.PageSize
	err := query.Order("tanggal DESC").
		Limit(params.PageSize).
		Offset(offset).
		Find(&results).Error

	if err != nil {
		return nil, 0, err
	}

	return results, total, nil
}

// GetSuggestions provides autocomplete suggestions
func (r *SearchRepository) GetSuggestions(query string) ([]Suggestion, error) {
	suggestions := []Suggestion{}
	likeQuery := "%" + query + "%"

	// Search users (nama) - using user_profiles table
	var users []struct {
		Nama string `gorm:"column:normalized_nama"`
	}
	err := r.db.Raw(`
		SELECT DISTINCT LOWER(nama) as normalized_nama 
		FROM user_profiles
		WHERE nama ILIKE ? 
		ORDER BY normalized_nama 
		LIMIT 5
	`, likeQuery).Scan(&users).Error

	if err == nil {
		for _, u := range users {
			suggestions = append(suggestions, Suggestion{
				Type:  "user",
				Value: u.Nama,
				Label: u.Nama,
			})
		}
	}

	// Search satker - using ref_satker_units table
	var satkers []string
	err = r.db.Table("ref_satker_units").
		Select("DISTINCT satker_name").
		Where("satker_name ILIKE ?", likeQuery).
		Limit(5).
		Pluck("satker_name", &satkers).Error

	if err == nil {
		for _, satker := range satkers {
			suggestions = append(suggestions, Suggestion{
				Type:  "satker",
				Value: satker,
				Label: satker,
			})
		}
	}

	// Search lokasi - using ref_locations table
	var locations []string
	err = r.db.Table("ref_locations").
		Select("DISTINCT location_name").
		Where("location_name ILIKE ?", likeQuery).
		Limit(5).
		Pluck("location_name", &locations).Error

	if err == nil {
		for _, lokasi := range locations {
			if lokasi != "" {
				suggestions = append(suggestions, Suggestion{
					Type:  "lokasi",
					Value: lokasi,
					Label: lokasi,
				})
			}
		}
	}

	return suggestions, nil
}

// SearchUsers finds users by name or email
func (r *SearchRepository) SearchUsers(query string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	likeQuery := "%" + query + "%"

	rows, err := r.db.Table("user_profiles u").
		Select("DISTINCT u.nama, u.email, s.eselon_level").
		Joins("LEFT JOIN ref_satker_units s ON u.satker_id = s.id").
		Where("u.nama ILIKE ? OR u.email ILIKE ?", likeQuery, likeQuery).
		Limit(20).
		Rows()

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var nama, email, eselon string
		if err := rows.Scan(&nama, &email, &eselon); err == nil {
			results = append(results, map[string]interface{}{
				"nama":   nama,
				"email":  email,
				"eselon": eselon,
			})
		}
	}

	return results, nil
}

// SearchSatker finds satker by name
func (r *SearchRepository) SearchSatker(query string) ([]string, error) {
	var satkers []string
	likeQuery := "%" + query + "%"

	err := r.db.Table("ref_satker_units").
		Select("DISTINCT satker_name").
		Where("satker_name ILIKE ?", likeQuery).
		Limit(20).
		Pluck("satker_name", &satkers).Error

	if err != nil {
		return nil, err
	}

	return satkers, nil
}
