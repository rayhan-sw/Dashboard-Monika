// File search_handler.go: handler untuk pencarian aktivitas dan autocomplete.
//
// Endpoint: pencarian global (dengan filter tanggal, satker, cluster, status, jenis aktivitas, paginasi), saran autocomplete, cari user by nama/email, cari satker by nama.
package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/config"
	"github.com/bpk-ri/dashboard-monitoring/internal/dto"
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/internal/response"
	"github.com/gin-gonic/gin"
)

// GlobalSearch menangani pencarian utama aktivitas. Query: q, dateRange (today|7days|30days|90days|custom), startDate/endDate (untuk custom), satker, satkerIds (comma), cluster, status, activityTypes (comma), page, pageSize.
func GlobalSearch(c *gin.Context) {
	repo := getSearchRepo()

	query := c.Query("q")
	dateRange := c.Query("dateRange")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	satker := c.Query("satker")
	satkerIdsStr := c.Query("satkerIds")
	cluster := c.Query("cluster")
	status := c.Query("status")
	activityTypes := c.Query("activityTypes")

	// Paginasi: default page 1, pageSize dari config; clamp ke batas maksimal.
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", strconv.Itoa(config.SearchResultLimit))

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 || pageSize > config.MaxPageSizeUnits {
		pageSize = config.SearchResultLimit
	}

	// Hitung rentang tanggal: today = hari ini 00:00–23:59, 7days/30days/90days = N hari terakhir, custom = parse startDate/endDate (format 2006-01-02).
	var startDateTime, endDateTime time.Time
	now := time.Now()

	if dateRange != "" {
		switch dateRange {
		case "today":
			startDateTime = time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
			endDateTime = time.Date(now.Year(), now.Month(), now.Day(), 23, 59, 59, 999999999, now.Location())
		case "7days":
			startDateTime = now.AddDate(0, 0, -7)
			endDateTime = now
		case "30days":
			startDateTime = now.AddDate(0, 0, -30)
			endDateTime = now
		case "90days":
			startDateTime = now.AddDate(0, 0, -90)
			endDateTime = now
		case "custom":
			if startDate != "" {
				startDateTime, _ = time.Parse("2006-01-02", startDate)
			}
			if endDate != "" {
				endDateTime, _ = time.Parse("2006-01-02", endDate)
				endDateTime = time.Date(endDateTime.Year(), endDateTime.Month(), endDateTime.Day(), 23, 59, 59, 999999999, endDateTime.Location())
			}
		}
	}

	// activityTypes: string dipisah koma (misalnya "Login,Logout") → slice.
	var activityTypesList []string
	if activityTypes != "" {
		activityTypesList = strings.Split(activityTypes, ",")
	}

	// satkerIds: string dipisah koma (misalnya "1,2,3") → slice int64; nilai invalid di-skip.
	var satkerIds []int64
	if satkerIdsStr != "" {
		idStrs := strings.Split(satkerIdsStr, ",")
		for _, idStr := range idStrs {
			id, err := strconv.ParseInt(strings.TrimSpace(idStr), 10, 64)
			if err == nil {
				satkerIds = append(satkerIds, id)
			}
		}
	}

	params := repository.SearchParams{
		Query:         query,
		Satker:        satker,
		SatkerIds:     satkerIds,
		Cluster:       cluster,
		Status:        status,
		ActivityTypes: activityTypesList,
		StartDate:     startDateTime,
		EndDate:       endDateTime,
		Page:          page,
		PageSize:      pageSize,
	}

	results, total, err := repo.Search(params)
	if err != nil {
		response.Internal(c, err)
		return
	}

	// Konversi entity ke DTO datar agar response siap dipakai frontend.
	dtos := make([]dto.ActivityLogDTO, len(results))
	for i, a := range results {
		dtos[i] = dto.ToDTO(a)
	}

	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	c.JSON(http.StatusOK, gin.H{
		"data":        dtos,
		"page":        page,
		"page_size":   pageSize,
		"total_count": total,
		"total_pages": totalPages,
	})
}

// GetSearchSuggestions mengembalikan saran autocomplete untuk input pencarian (query q). Dipakai untuk dropdown/typeahead.
func GetSearchSuggestions(c *gin.Context) {
	repo := getSearchRepo()
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"suggestions": []interface{}{},
		})
		return
	}

	suggestions, err := repo.GetSuggestions(query)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggestions,
	})
}

// SearchUsers mencari user berdasarkan nama atau email. Query: q. Untuk filter/autocomplete user.
func SearchUsers(c *gin.Context) {
	repo := getSearchRepo()
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"users": []interface{}{},
		})
		return
	}

	users, err := repo.SearchUsers(query)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

// SearchSatker mencari satker berdasarkan nama. Query: q. Untuk filter/autocomplete satker.
func SearchSatker(c *gin.Context) {
	repo := getSearchRepo()
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"satker": []interface{}{},
		})
		return
	}

	satker, err := repo.SearchSatker(query)
	if err != nil {
		response.Internal(c, err)
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"satker": satker,
	})
}
