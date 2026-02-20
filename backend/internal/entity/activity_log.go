package entity

import (
	"time"

	"github.com/google/uuid"
)

// ActivityLog represents the normalized activity log table
type ActivityLog struct {
	ID              int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	IDTrans         uuid.UUID `gorm:"column:id_trans;type:uuid" json:"id_trans"`
	UserID          int64     `gorm:"column:user_id" json:"user_id"`
	SatkerID        *int64    `gorm:"column:satker_id" json:"satker_id"`
	ActivityTypeID  int64     `gorm:"column:activity_type_id" json:"activity_type_id"`
	ClusterID       *int64    `gorm:"column:cluster_id" json:"cluster_id"`
	LocationID      *int64    `gorm:"column:location_id" json:"location_id"`
	Scope           string    `gorm:"column:scope;type:text" json:"scope"`
	DetailAktifitas string    `gorm:"column:detail_aktifitas;type:text" json:"detail_aktifitas"`
	Status          string    `gorm:"column:status;type:varchar(50)" json:"status"`
	Tanggal         time.Time `gorm:"column:tanggal;type:timestamptz" json:"tanggal"`
	CreatedAt       time.Time `gorm:"column:created_at;type:timestamptz;autoCreateTime" json:"created_at"`

	// Relationships
	User         UserProfile  `gorm:"foreignKey:UserID;references:ID" json:"user"`
	Satker       SatkerUnit   `gorm:"foreignKey:SatkerID;references:ID" json:"satker"`
	ActivityType ActivityType `gorm:"foreignKey:ActivityTypeID;references:ID" json:"activity_type"`
	Cluster      Cluster      `gorm:"foreignKey:ClusterID;references:ID" json:"cluster"`
	Location     Location     `gorm:"foreignKey:LocationID;references:ID" json:"location"`
}

// TableName specifies the table name for GORM
func (ActivityLog) TableName() string {
	return "activity_logs_normalized"
}

// UserProfile represents user_profiles table
type UserProfile struct {
	ID            int64      `gorm:"primaryKey;column:id;autoIncrement" json:"id"`
	Nama          string     `gorm:"column:nama" json:"nama"`
	Email         string     `gorm:"column:email" json:"email"`
	Token         string     `gorm:"column:token" json:"token"`
	SatkerID      *int64     `gorm:"column:satker_id" json:"satker_id"`
	IsActive      bool       `gorm:"column:is_active" json:"is_active"`
	FirstActivity *time.Time `gorm:"column:first_activity" json:"first_activity"`
	LastActivity  *time.Time `gorm:"column:last_activity" json:"last_activity"`
	CreatedAt     time.Time  `gorm:"column:created_at;type:timestamptz;autoCreateTime" json:"created_at"`
	UpdatedAt     time.Time  `gorm:"column:updated_at;type:timestamptz;autoUpdateTime" json:"updated_at"`
}

func (UserProfile) TableName() string {
	return "user_profiles"
}

// SatkerUnit represents ref_satker_units table
type SatkerUnit struct {
	ID          int64  `gorm:"primaryKey;column:id;autoIncrement" json:"id"`
	SatkerName  string `gorm:"column:satker_name" json:"satker_name"`
	EselonLevel string `gorm:"column:eselon_level" json:"eselon_level"`
	ParentID    *int64 `gorm:"column:parent_id" json:"parent_id"`
}

func (SatkerUnit) TableName() string {
	return "ref_satker_units"
}

// ActivityType represents ref_activity_types table
type ActivityType struct {
	ID          int64  `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"column:name" json:"name"`
	Category    string `gorm:"column:category" json:"category"`
	Description string `gorm:"column:description" json:"description"`
}

func (ActivityType) TableName() string {
	return "ref_activity_types"
}

// Cluster represents ref_clusters table
type Cluster struct {
	ID          int64  `gorm:"primaryKey" json:"id"`
	Name        string `gorm:"column:name" json:"name"`
	Description string `gorm:"column:description" json:"description"`
}

func (Cluster) TableName() string {
	return "ref_clusters"
}

// Location represents ref_locations table
type Location struct {
	ID           int64  `gorm:"primaryKey" json:"id"`
	LocationName string `gorm:"column:location_name" json:"location_name"`
	Province     string `gorm:"column:province" json:"province"`
}

func (Location) TableName() string {
	return "ref_locations"
}
