// File metadata_handler.go: handler untuk metadata yang dipakai filter/UI (rentang tanggal, daftar satker, root, anak root).
//
// Endpoint: rentang tanggal aktivitas (min/max), daftar satker (untuk tree), root Eselon I (dropdown regional), anak langsung dari satu root (Eselon II).
package handler

import (
	"net/http"
	"strconv"

	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// GetDateRange mengembalikan tanggal minimum dan maksimum dari tabel aktivitas (untuk batas filter tanggal di UI).
func GetDateRange(c *gin.Context) {
	db := database.GetDB()

	var result struct {
		MinDate string
		MaxDate string
	}

	// Ambil MIN/MAX tanggal dari activity_logs_normalized (tanggal saja, tanpa waktu).
	err := db.Model(&entity.ActivityLog{}).
		Select("DATE(MIN(tanggal)) as min_date, DATE(MAX(tanggal)) as max_date").
		Scan(&result).Error

	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"min_date": result.MinDate,
		"max_date": result.MaxDate,
	})
}

// SatkerOption dipakai untuk response daftar satker (id, nama, eselon, parent_id).
type SatkerOption struct {
	ID          int64   `json:"id"`
	SatkerName  string  `json:"satker_name"`
	EselonLevel string  `json:"eselon_level"`
	ParentID    *int64  `json:"parent_id"`
}

// GetSatkerList mengembalikan daftar satker untuk tree view (hanya Eselon, tanpa KAP, Eksternal, Staf Ahli, Wakil Ketua).
func GetSatkerList(c *gin.Context) {
	db := database.GetDB()

	var satkerList []SatkerOption

	// Hanya Eselon; exclude Eksternal, Kelompok Jabatan Fungsional, KAP, Staf Ahli, Wakil Ketua. Urut: root dulu, lalu eselon_level, nama.
	err := db.Raw(`
		SELECT 
			id,
			satker_name,
			eselon_level,
			parent_id
		FROM ref_satker_units
		WHERE satker_name IS NOT NULL 
			AND satker_name != '' 
			AND (eselon_level LIKE 'Eselon%' OR eselon_level LIKE 'E%')
			AND eselon_level NOT IN ('Eksternal', 'Kelompok Jabatan Fungsional')
			AND satker_name NOT LIKE 'KAP%'
			AND satker_name NOT LIKE 'Staf Ahli%'
			AND satker_name NOT IN ('Wakil Ketua')
		ORDER BY 
			CASE 
				WHEN parent_id IS NULL OR parent_id = 0 THEN 0
				ELSE 1
			END,
			eselon_level, 
			satker_name
	`).Scan(&satkerList).Error

	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"satker": satkerList,
	})
}

// GetSatkerRoots mengembalikan hanya unit Eselon I (root) yang punya setidaknya satu anak, untuk dropdown filter regional.
// Root tanpa anak (mis. Wakil Ketua, Staf Ahli) tidak disertakan.
func GetSatkerRoots(c *gin.Context) {
	db := database.GetDB()

	var roots []SatkerOption
	// parent_id NULL/0, eselon Eselon I, dan EXISTS anak. Urut: Inspektorat, Sekretariat Jenderal, Ditjen PKN I–VIII, Investigasi, Badan, BPK Perwakilan, lalu nama.
	err := db.Raw(`
		SELECT r.id, r.satker_name, r.eselon_level, r.parent_id
		FROM ref_satker_units r
		WHERE r.satker_name IS NOT NULL AND r.satker_name != ''
			AND (r.parent_id IS NULL OR r.parent_id = 0)
			AND (r.eselon_level = 'Eselon I' OR r.eselon_level LIKE 'Eselon I%')
			AND EXISTS (SELECT 1 FROM ref_satker_units c WHERE c.parent_id = r.id)
		ORDER BY
			CASE
				WHEN r.satker_name ILIKE 'Inspektorat%' THEN 1
				WHEN r.satker_name ILIKE 'Sekretariat Jenderal%' THEN 2
				WHEN r.satker_name ILIKE 'Ditjen PKN VIII%' THEN 10
				WHEN r.satker_name ILIKE 'Ditjen PKN VII%' THEN 9
				WHEN r.satker_name ILIKE 'Ditjen PKN VI%' THEN 8
				WHEN r.satker_name ILIKE 'Ditjen PKN V%' THEN 7
				WHEN r.satker_name ILIKE 'Ditjen PKN IV%' THEN 6
				WHEN r.satker_name ILIKE 'Ditjen PKN III%' THEN 5
				WHEN r.satker_name ILIKE 'Ditjen PKN II%' THEN 4
				WHEN r.satker_name ILIKE 'Ditjen PKN I%' THEN 3
				WHEN r.satker_name ILIKE 'Ditjen Pemeriksaan Investigasi%' THEN 11
				WHEN r.satker_name ILIKE 'Badan%' THEN 20
				WHEN r.satker_name ILIKE 'BPK Perwakilan%' THEN 30
				ELSE 15
			END,
			r.satker_name
	`).Scan(&roots).Error

	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"roots": roots,
	})
}

// GetSatkerRootChildren mengembalikan anak langsung dari satu root (Eselon I) yang berlevel Eselon II.
// Dipakai misalnya untuk chart engagement saat filter per satu Eselon I (sumbu X = unit Eselon II). Path: GET /api/metadata/satker/roots/:id/children
func GetSatkerRootChildren(c *gin.Context) {
	idStr := c.Param("id")
	if idStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "id is required"})
		return
	}
	rootID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	db := database.GetDB()

	var children []SatkerOption
	// Ambil satker yang parent_id = rootID dan eselon Eselon II saja.
	if err := db.Raw(`
		SELECT id, satker_name, eselon_level, parent_id
		FROM ref_satker_units
		WHERE parent_id = ?
			AND satker_name IS NOT NULL AND satker_name != ''
			AND (eselon_level = 'Eselon II' OR eselon_level LIKE 'Eselon II%')
		ORDER BY satker_name
	`, rootID).Scan(&children).Error; err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"children": children,
	})
}
