package entity

import "time"

// ActivityLog represents the act_log table structure
type ActivityLog struct {
	ID             int64      `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	IDTrans        string     `gorm:"column:id_trans;type:text" json:"id_trans"`
	Nama           string     `gorm:"column:nama;type:text" json:"nama"`
	Satker         string     `gorm:"column:satker;type:text" json:"satker"`
	Aktifitas      string     `gorm:"column:aktifitas;type:text" json:"aktifitas"`
	Scope          string     `gorm:"column:scope;type:text" json:"scope"`
	Lokasi         string     `gorm:"column:lokasi;type:text" json:"lokasi"`
	DetailAktifitas string    `gorm:"column:detail_aktifitas;type:text" json:"detail_aktifitas"`
	Cluster        string     `gorm:"column:cluster;type:text" json:"cluster"`
	Tanggal        time.Time  `gorm:"column:tanggal;type:timestamp" json:"tanggal"`
	Token          string     `gorm:"column:token;type:text" json:"token"`
	Status         string     `gorm:"column:status;type:text" json:"status"`
	CreatedAt      time.Time  `gorm:"column:created_at;type:timestamp;autoCreateTime" json:"created_at"`
}

// TableName specifies the table name for GORM
func (ActivityLog) TableName() string {
	return "act_log"
}
