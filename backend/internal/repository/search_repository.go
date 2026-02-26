// File search_repository.go: repository untuk pencarian aktivitas dan autocomplete.
//
// Search: pencarian aktivitas dengan filter (query teks, satker, satkerIds, cluster, status, activityTypes, tanggal), paginasi, preload relasi. GetSuggestions: saran dari user_profiles, ref_satker_units, ref_locations. SearchUsers / SearchSatker: cari user by nama/email, cari satker by nama.
package repository

import (
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"gorm.io/gorm"
)

// SearchRepository menyimpan koneksi DB untuk operasi pencarian.
type SearchRepository struct {
	db *gorm.DB
}

// NewSearchRepository membuat instance SearchRepository.
func NewSearchRepository(db *gorm.DB) *SearchRepository {
	return &SearchRepository{db: db}
}

// SearchParams parameter untuk Search: teks query, filter satker/cluster/status/jenis aktivitas/tanggal, paginasi.
type SearchParams struct {
	Query         string    // Teks pencarian (nama, satker, email, nama aktivitas)
	Satker        string    // Filter nama satker (ILIKE)
	SatkerIds     []int64   // Filter satker_id IN (...)
	Cluster       string    // Filter nama cluster (exact)
	Status        string    // Filter status aktivitas
	ActivityTypes []string  // Filter at.name IN (...)
	StartDate     time.Time // Filter tanggal >=
	EndDate       time.Time // Filter tanggal <=
	Page          int       // Halaman (1-based)
	PageSize      int       // Jumlah per halaman
}

// Suggestion satu item saran autocomplete: type (user, satker, lokasi), value, label.
type Suggestion struct {
	Type  string `json:"type"`
	Value string `json:"value"`
	Label string `json:"label"`
}

// Search menjalankan pencarian aktivitas dengan filter dan paginasi. Mengembalikan slice ActivityLog (dengan preload User, Satker, ActivityType, Cluster, Location), total count, dan error.
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

	// Filter teks: cari di nama user, nama satker, email, atau nama jenis aktivitas (ILIKE %query%).
	if params.Query != "" {
		likeQuery := "%" + params.Query + "%"
		query = query.Where(
			"u.nama ILIKE ? OR s.satker_name ILIKE ? OR u.email ILIKE ? OR at.name ILIKE ?",
			likeQuery, likeQuery, likeQuery, likeQuery,
		)
	}

	if params.Satker != "" {
		query = query.Where("s.satker_name ILIKE ?", "%"+params.Satker+"%")
	}

	if len(params.SatkerIds) > 0 {
		query = query.Where("activity_logs_normalized.satker_id IN ?", params.SatkerIds)
	}

	if params.Cluster != "" {
		query = query.Where("c.name = ?", params.Cluster)
	}

	if params.Status != "" {
		query = query.Where("status = ?", params.Status)
	}

	if len(params.ActivityTypes) > 0 {
		query = query.Where("at.name IN ?", params.ActivityTypes)
	}

	if !params.StartDate.IsZero() {
		query = query.Where("tanggal >= ?", params.StartDate)
	}
	if !params.EndDate.IsZero() {
		query = query.Where("tanggal <= ?", params.EndDate)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

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

// GetSuggestions mengembalikan saran autocomplete: dari user_profiles (nama, limit 5), ref_satker_units (satker_name, SuggestionLimit), ref_locations (location_name, SuggestionLimit). Setiap sumber ditambahkan ke slice dengan type user/satker/lokasi; lokasi kosong di-skip.
func (r *SearchRepository) GetSuggestions(query string) ([]Suggestion, error) {
	suggestions := []Suggestion{}
	likeQuery := "%" + query + "%"

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

	var satkers []string
	err = r.db.Table("ref_satker_units").
		Select("DISTINCT satker_name").
		Where("satker_name ILIKE ?", likeQuery).
		Limit(config.SuggestionLimit).
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

	var locations []string
	err = r.db.Table("ref_locations").
		Select("DISTINCT location_name").
		Where("location_name ILIKE ?", likeQuery).
		Limit(config.SuggestionLimit).
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

// SearchUsers mencari user di user_profiles by nama atau email (ILIKE); join ref_satker_units untuk eselon_level. Mengembalikan slice map (nama, email, eselon), batas SearchResultLimit.
func (r *SearchRepository) SearchUsers(query string) ([]map[string]interface{}, error) {
	var results []map[string]interface{}
	likeQuery := "%" + query + "%"

	rows, err := r.db.Table("user_profiles u").
		Select("DISTINCT u.nama, u.email, s.eselon_level").
		Joins("LEFT JOIN ref_satker_units s ON u.satker_id = s.id").
		Where("u.nama ILIKE ? OR u.email ILIKE ?", likeQuery, likeQuery).
		Limit(config.SearchResultLimit).
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

// SearchSatker mencari satker di ref_satker_units by nama (satker_name ILIKE). Mengembalikan slice string nama satker unik, batas SearchResultLimit.
func (r *SearchRepository) SearchSatker(query string) ([]string, error) {
	var satkers []string
	likeQuery := "%" + query + "%"

	err := r.db.Table("ref_satker_units").
		Select("DISTINCT satker_name").
		Where("satker_name ILIKE ?", likeQuery).
		Limit(config.SearchResultLimit).
		Pluck("satker_name", &satkers).Error

	if err != nil {
		return nil, err
	}

	return satkers, nil
}
