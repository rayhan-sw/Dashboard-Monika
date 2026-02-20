package dto

import (
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
)

// ActivityLogDTO is a flat representation of an activity log for the frontend
type ActivityLogDTO struct {
	ID              int64     `json:"id"`
	IDTrans         string    `json:"id_trans"`
	Nama            string    `json:"nama"`
	Satker          string    `json:"satker"`
	Aktifitas       string    `json:"aktifitas"`
	Cluster         string    `json:"cluster"`
	Lokasi          string    `json:"lokasi"`
	Province        string    `json:"province"`
	Scope           string    `json:"scope"`
	DetailAktifitas string    `json:"detail_aktifitas"`
	Status          string    `json:"status"`
	EselonLevel     string    `json:"eselon"`
	Tanggal         time.Time `json:"tanggal"`
	CreatedAt       time.Time `json:"created_at"`
}

// ToDTO converts a normalized ActivityLog entity to a flat DTO
func ToDTO(a entity.ActivityLog) ActivityLogDTO {
	return ActivityLogDTO{
		ID:              a.ID,
		IDTrans:         a.IDTrans.String(),
		Nama:            a.User.Nama,
		Satker:          a.Satker.SatkerName,
		Aktifitas:       a.ActivityType.Name,
		Cluster:         a.Cluster.Name,
		Lokasi:          a.Location.LocationName,
		Province:        a.Location.Province,
		Scope:           a.Scope,
		DetailAktifitas: a.DetailAktifitas,
		Status:          a.Status,
		EselonLevel:     a.Satker.EselonLevel,
		Tanggal:         a.Tanggal,
		CreatedAt:       a.CreatedAt,
	}
}
