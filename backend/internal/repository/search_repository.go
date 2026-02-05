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
	Cluster       string
	Eselon        string
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
	query := r.db.Table("act_log")

	// Query search (nama, satker, email, or activity)
	if params.Query != "" {
		likeQuery := "%" + params.Query + "%"
		query = query.Where(
			"nama ILIKE ? OR satker ILIKE ? OR email ILIKE ? OR aktifitas ILIKE ?",
			likeQuery, likeQuery, likeQuery, likeQuery,
		)
	}

	// Satker filter
	if params.Satker != "" {
		query = query.Where("satker ILIKE ?", "%"+params.Satker+"%")
	}

	// Cluster filter
	if params.Cluster != "" {
		query = query.Where("cluster = ?", params.Cluster)
	}

	// Eselon filter
	if params.Eselon != "" {
		query = query.Where("eselon = ?", params.Eselon)
	}

	// Status filter
	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	// Activity types filter
	if len(params.ActivityTypes) > 0 {
		query = query.Where("aktifitas IN ?", params.ActivityTypes)
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

	// Search users (nama) - normalized using raw SQL to deduplicate case variants
	var users []struct {
		Nama string `gorm:"column:normalized_nama"`
	}
	err := r.db.Raw(`
		SELECT DISTINCT LOWER(nama) as normalized_nama 
		FROM act_log 
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

	// Search satker - limit 5
	var satkers []string
	err = r.db.Table("act_log").
		Select("DISTINCT satker").
		Where("satker ILIKE ?", likeQuery).
		Limit(5).
		Pluck("satker", &satkers).Error

	if err == nil {
		for _, satker := range satkers {
			suggestions = append(suggestions, Suggestion{
				Type:  "satker",
				Value: satker,
				Label: satker,
			})
		}
	}

	// Search lokasi - limit 5
	var locations []string
	err = r.db.Table("act_log").
		Select("DISTINCT lokasi").
		Where("lokasi ILIKE ?", likeQuery).
		Limit(5).
		Pluck("lokasi", &locations).Error

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

	rows, err := r.db.Table("act_log").
		Select("DISTINCT nama, email, eselon").
		Where("nama ILIKE ? OR email ILIKE ?", likeQuery, likeQuery).
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

	err := r.db.Table("act_log").
		Select("DISTINCT satker").
		Where("satker ILIKE ?", likeQuery).
		Limit(20).
		Pluck("satker", &satkers).Error

	if err != nil {
		return nil, err
	}

	return satkers, nil
}
