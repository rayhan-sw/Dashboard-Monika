// File dto.go: Data Transfer Object untuk response API ke frontend.
//
// Aktivitas di DB disimpan ter-normalisasi (relasi ke User, Satker, ActivityType, Cluster, Location).
// DTO menyajikan bentuk datar (flat) agar frontend menerima satu objek berisi nama, satker, lokasi, dll.
// tanpa join atau resolve ID. Dipakai oleh handler yang mengembalikan daftar aktivitas (search, dashboard, dll.).
package dto

import (
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
)

// ActivityLogDTO adalah bentuk datar dari satu activity log untuk response JSON ke frontend.
// Semua relasi sudah di-flatten: user -> Nama, satker -> Satker/EselonLevel, activity type -> Aktifitas, cluster -> Cluster, location -> Lokasi/Province.
type ActivityLogDTO struct {
	ID               int64     `json:"id"`
	IDTrans          string    `json:"id_trans"`
	Nama             string    `json:"nama"`
	Satker           string    `json:"satker"`
	Aktifitas        string    `json:"aktifitas"`
	Cluster          string    `json:"cluster"`
	Lokasi           string    `json:"lokasi"`
	Province         string    `json:"province"`
	Scope            string    `json:"scope"`
	DetailAktifitas  string    `json:"detail_aktifitas"`
	Status           string    `json:"status"`
	EselonLevel      string    `json:"eselon"`
	Tanggal          time.Time `json:"tanggal"`
	CreatedAt        time.Time `json:"created_at"`
}

// ToDTO mengonversi entity ActivityLog (ter-normalisasi) menjadi ActivityLogDTO datar.
// Entity harus sudah di-preload (User, Satker, ActivityType, Cluster, Location) agar akses a.User, a.Satker, dll. tidak panic.
func ToDTO(a entity.ActivityLog) ActivityLogDTO {
	return ActivityLogDTO{
		ID:              a.ID,
		IDTrans:         a.IDTrans.String(),           // UUID -> string untuk JSON
		Nama:            a.User.Nama,                  // dari relasi User (preload)
		Satker:          a.Satker.SatkerName,         // dari relasi SatkerUnit
		Aktifitas:       a.ActivityType.Name,          // dari relasi ActivityType
		Cluster:         a.Cluster.Name,              // dari relasi Cluster (preload wajib agar tidak panic)
		Lokasi:          a.Location.LocationName,     // dari relasi Location
		Province:        a.Location.Province,          // dari relasi Location
		Scope:           a.Scope,
		DetailAktifitas: a.DetailAktifitas,
		Status:          a.Status,
		EselonLevel:     a.Satker.EselonLevel,         // dari relasi SatkerUnit
		Tanggal:         a.Tanggal,
		CreatedAt:       a.CreatedAt,
	}
}
