package entity

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// ActivityLog represents act_log table in database
type ActivityLog struct {
	ID             int64          `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	IDTrans        uuid.UUID      `gorm:"column:id_trans;type:uuid" json:"id_trans"`
	Nama           string         `gorm:"column:nama;type:varchar(255)" json:"nama"`
	Satker         string         `gorm:"column:satker;type:varchar(255)" json:"satker"`
	Eselon         string         `gorm:"column:eselon;type:varchar(100)" json:"eselon"`
	Aktifitas      string         `gorm:"column:aktifitas;type:varchar(255)" json:"aktifitas"`
	Scope          string         `gorm:"column:scope;type:varchar(255)" json:"scope"`
	Lokasi         string         `gorm:"column:lokasi;type:varchar(255)" json:"lokasi"`
	DetailAktifitas string        `gorm:"column:detail_aktifitas;type:text" json:"detail_aktifitas"`
	Cluster        string         `gorm:"column:cluster;type:varchar(50)" json:"cluster"`
	Tanggal        time.Time      `gorm:"column:tanggal;type:timestamptz" json:"tanggal"`
	Token          sql.NullString `gorm:"column:token" json:"token"`
	Status         string         `gorm:"column:status;type:varchar(50)" json:"status"`
	CreatedAt      time.Time      `gorm:"column:created_at;type:timestamptz;autoCreateTime" json:"created_at"`
	Email          string         `gorm:"column:email;type:varchar(255)" json:"email"`
}

// TableName specifies the table name for GORM
func (ActivityLog) TableName() string {
	return "act_log"
}
