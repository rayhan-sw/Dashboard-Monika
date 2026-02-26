// File org_tree_handler.go: handler untuk pohon organisasi (satker) dan pencarian unit.
//
// Endpoint: pohon organisasi penuh (opsional filter eselon, hitung aktivitas per satker), daftar level eselon, pencarian unit by nama (q) + eselon.
package handler

import (
	"net/http"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/entity"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// OrgTreeNode merepresentasikan satu node di pohon organisasi (id, nama, eselon, parent, children, opsional activity_count).
type OrgTreeNode struct {
	ID            int64         `json:"id"`
	Name          string        `json:"name"`
	EselonLevel   string        `json:"eselon_level"`
	ParentID      *int64        `json:"parent_id,omitempty"`
	Children      []OrgTreeNode `json:"children,omitempty"`
	ActivityCount int64         `json:"activity_count,omitempty"`
}

// GetOrganizationalTree mengembalikan pohon organisasi penuh dari ref_satker_units. Query: eselon_level (opsional), include_activity_count (true/false), start_date, end_date (untuk hitung aktivitas).
func GetOrganizationalTree(c *gin.Context) {
	db := database.GetDB()

	eselonLevel := c.Query("eselon_level")
	includeActivityCount := c.Query("include_activity_count") == "true"
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	var satkerUnits []entity.SatkerUnit
	query := db.Model(&entity.SatkerUnit{}).Where("satker_name != '' AND satker_name IS NOT NULL")

	if eselonLevel != "" {
		query = query.Where("eselon_level = ?", eselonLevel)
	}

	if err := query.Find(&satkerUnits).Error; err != nil {
		response.Internal(c, err)
		return
	}

	// Map ID -> node agar bisa pasang parent–child tanpa scan berulang.
	nodeMap := make(map[int64]*OrgTreeNode)
	for _, unit := range satkerUnits {
		node := &OrgTreeNode{
			ID:          unit.ID,
			Name:        unit.SatkerName,
			EselonLevel: unit.EselonLevel,
			ParentID:    unit.ParentID,
			Children:    []OrgTreeNode{},
		}

		// Opsional: hitung jumlah aktivitas untuk satker ini dalam rentang tanggal.
		if includeActivityCount {
			var count int64
			countQuery := db.Model(&entity.ActivityLog{}).Where("satker_id = ?", unit.ID)
			if startDate != "" && endDate != "" {
				countQuery = countQuery.Where("DATE(tanggal) BETWEEN ? AND ?", startDate, endDate)
			}
			countQuery.Count(&count)
			node.ActivityCount = count
		}

		nodeMap[unit.ID] = node
	}

	// Bangun pohon: node tanpa parent atau parent_id=0 jadi root; yang lain tempel ke parent. Jika parent tidak ada, anggap root.
	var rootNodes []OrgTreeNode
	for _, node := range nodeMap {
		if node.ParentID == nil || *node.ParentID == 0 {
			rootNodes = append(rootNodes, *node)
		} else {
			if parent, exists := nodeMap[*node.ParentID]; exists {
				parent.Children = append(parent.Children, *node)
			} else {
				rootNodes = append(rootNodes, *node)
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"tree":  rootNodes,
		"total": len(satkerUnits),
	})
}

// GetEselonLevels mengembalikan daftar level eselon yang ada beserta jumlah satker per level (untuk filter/dropdown).
func GetEselonLevels(c *gin.Context) {
	db := database.GetDB()

	var eselonLevels []struct {
		EselonLevel string `json:"eselon_level"`
		Count       int64  `json:"count"`
	}

	err := db.Model(&entity.SatkerUnit{}).
		Select("eselon_level, COUNT(*) as count").
		Where("eselon_level != '' AND eselon_level IS NOT NULL").
		Group("eselon_level").
		Order("eselon_level ASC").
		Scan(&eselonLevels).Error

	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"levels": eselonLevels,
	})
}

// SearchOrganizationalUnits mencari unit satker berdasarkan nama (q). Query: q (wajib), eselon_level (opsional). Limit dari config.
func SearchOrganizationalUnits(c *gin.Context) {
	db := database.GetDB()
	query := c.Query("q")
	eselonLevel := c.Query("eselon_level")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"units": []interface{}{},
		})
		return
	}

	var units []entity.SatkerUnit
	dbQuery := db.Model(&entity.SatkerUnit{}).
		Where("satker_name ILIKE ?", "%"+query+"%")

	if eselonLevel != "" {
		dbQuery = dbQuery.Where("eselon_level = ?", eselonLevel)
	}

	// Batas hasil sesuai config (OrgTreeSearchLimit).
	if err := dbQuery.Limit(config.OrgTreeSearchLimit).Find(&units).Error; err != nil {
		response.Internal(c, err)
		return
	}

	results := make([]map[string]interface{}, len(units))
	for i, unit := range units {
		results[i] = map[string]interface{}{
			"id":           unit.ID,
			"name":         unit.SatkerName,
			"eselon_level": unit.EselonLevel,
			"parent_id":    unit.ParentID,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"units": results,
	})
}
