package repository

import (
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"gorm.io/gorm"
)

type ActivityLogRepository interface {
	GetTotalCount() (int64, error)
	GetCountByStatus(status string) (int64, error)
	GetRecentActivities(limit int) ([]entity.ActivityLog, error)
	GetActivityCountByScope() (map[string]int64, error)
	GetActivityCountByHour() (map[int]int64, error)
	GetActivityCountByProvince() (map[string]int64, error)
	GetActivityCountByUnit() (map[string]int64, error)
	GetBusiestHour() (map[string]interface{}, error)
	GetAccessSuccessRateByScope() ([]map[string]interface{}, error)
	GetUniqueUsersCount() (int64, error)
}

type activityLogRepository struct {
	db *gorm.DB
}

func NewActivityLogRepository(db *gorm.DB) ActivityLogRepository {
	return &activityLogRepository{db: db}
}

func (r *activityLogRepository) GetTotalCount() (int64, error) {
	var count int64
	err := r.db.Model(&entity.ActivityLog{}).Count(&count).Error
	return count, err
}

func (r *activityLogRepository) GetCountByStatus(status string) (int64, error) {
	var count int64
	err := r.db.Model(&entity.ActivityLog{}).Where("status = ?", status).Count(&count).Error
	return count, err
}

func (r *activityLogRepository) GetRecentActivities(limit int) ([]entity.ActivityLog, error) {
	var activities []entity.ActivityLog
	err := r.db.Order("tanggal DESC").Limit(limit).Find(&activities).Error
	return activities, err
}

func (r *activityLogRepository) GetActivityCountByScope() (map[string]int64, error) {
	type Result struct {
		Scope string
		Count int64
	}
	
	var results []Result
	err := r.db.Model(&entity.ActivityLog{}).
		Select("scope, COUNT(*) as count").
		Group("scope").
		Order("count DESC").
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Scope] = r.Count
	}
	return counts, nil
}

func (r *activityLogRepository) GetActivityCountByHour() (map[int]int64, error) {
	type Result struct {
		Hour  int
		Count int64
	}
	
	var results []Result
	err := r.db.Model(&entity.ActivityLog{}).
		Select("EXTRACT(HOUR FROM tanggal) as hour, COUNT(*) as count").
		Where("tanggal >= ?", time.Now().Add(-24*time.Hour)).
		Group("hour").
		Order("hour ASC").
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	counts := make(map[int]int64)
	for _, r := range results {
		counts[r.Hour] = r.Count
	}
	return counts, nil
}

func (r *activityLogRepository) GetActivityCountByProvince() (map[string]int64, error) {
	type Result struct {
		Lokasi string
		Count  int64
	}
	
	var results []Result
	err := r.db.Model(&entity.ActivityLog{}).
		Select("lokasi, COUNT(*) as count").
		Where("lokasi != ''").
		Group("lokasi").
		Order("count DESC").
		Limit(10).
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Lokasi] = r.Count
	}
	return counts, nil
}

func (r *activityLogRepository) GetActivityCountByUnit() (map[string]int64, error) {
	type Result struct {
		Satker string
		Count  int64
	}
	
	var results []Result
	err := r.db.Model(&entity.ActivityLog{}).
		Select("satker, COUNT(*) as count").
		Where("satker != ''").
		Group("satker").
		Order("count DESC").
		Limit(10).
		Scan(&results).Error
	
	if err != nil {
		return nil, err
	}
	
	counts := make(map[string]int64)
	for _, r := range results {
		counts[r.Satker] = r.Count
	}
	return counts, nil
}

func (r *activityLogRepository) GetBusiestHour() (map[string]interface{}, error) {
	type Result struct {
		Hour  int
		Count int64
	}
	
	var results []Result
	err := r.db.Model(&entity.ActivityLog{}).
		Select("EXTRACT(HOUR FROM tanggal) as hour, COUNT(*) as count").
		Group("hour").
		Order("count DESC").
		Limit(1).
		Scan(&results).Error
	
	if err != nil || len(results) == 0 {
		return map[string]interface{}{
			"start": 13,
			"end":   14,
			"count": 0,
		}, nil
	}
	
	peak := results[0]
	return map[string]interface{}{
		"start": peak.Hour,
		"end":   peak.Hour + 1,
		"count": peak.Count,
	}, nil
}

func (r *activityLogRepository) GetAccessSuccessRateByScope() ([]map[string]interface{}, error) {
	// Get all unique scopes first
	var scopes []string
	err := r.db.Model(&entity.ActivityLog{}).
		Distinct("scope").
		Where("scope != ? AND scope IS NOT NULL", "").
		Pluck("scope", &scopes).Error
	
	if err != nil {
		return nil, err
	}
	
	var data []map[string]interface{}
	for _, scope := range scopes {
		var successCount int64
		var failedCount int64
		
		// Count SUCCESS
		r.db.Model(&entity.ActivityLog{}).
			Where("scope = ? AND status = ?", scope, "SUCCESS").
			Count(&successCount)
		
		// Count FAILED
		r.db.Model(&entity.ActivityLog{}).
			Where("scope = ? AND status = ?", scope, "FAILED").
			Count(&failedCount)
		
		if successCount > 0 || failedCount > 0 {
			data = append(data, map[string]interface{}{
				"scope":   scope,
				"success": successCount,
				"failed":  failedCount,
			})
		}
		
		// Limit to 10 scopes
		if len(data) >= 10 {
			break
		}
	}
	
	return data, nil
}

func (r *activityLogRepository) GetUniqueUsersCount() (int64, error) {
	var count int64
	err := r.db.Model(&entity.ActivityLog{}).
		Distinct("nama").
		Count(&count).Error
	return count, err
}
