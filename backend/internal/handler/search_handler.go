package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/gin-gonic/gin"
)

// GlobalSearch handles the main search endpoint
func GlobalSearch(c *gin.Context) {
	repo := repository.NewSearchRepository(database.GetDB())

	// Parse query parameters
	query := c.Query("q")
	dateRange := c.Query("dateRange")
	startDate := c.Query("startDate")
	endDate := c.Query("endDate")
	satker := c.Query("satker")
	cluster := c.Query("cluster")
	eselon := c.Query("eselon")
	status := c.Query("status")
	activityTypes := c.Query("activityTypes")

	// Pagination
	pageStr := c.DefaultQuery("page", "1")
	pageSizeStr := c.DefaultQuery("pageSize", "20")

	page, err := strconv.Atoi(pageStr)
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(pageSizeStr)
	if err != nil || pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	// Calculate date range
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

	// Parse activity types
	var activityTypesList []string
	if activityTypes != "" {
		activityTypesList = strings.Split(activityTypes, ",")
	}

	// Build search params
	params := repository.SearchParams{
		Query:         query,
		Satker:        satker,
		Cluster:       cluster,
		Eselon:        eselon,
		Status:        status,
		ActivityTypes: activityTypesList,
		StartDate:     startDateTime,
		EndDate:       endDateTime,
		Page:          page,
		PageSize:      pageSize,
	}

	// Execute search
	results, total, err := repo.Search(params)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to execute search",
		})
		return
	}

	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	c.JSON(http.StatusOK, gin.H{
		"data":        results,
		"page":        page,
		"page_size":   pageSize,
		"total_count": total,
		"total_pages": totalPages,
	})
}

// GetSearchSuggestions provides autocomplete suggestions
func GetSearchSuggestions(c *gin.Context) {
	repo := repository.NewSearchRepository(database.GetDB())
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"suggestions": []interface{}{},
		})
		return
	}

	suggestions, err := repo.GetSuggestions(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get suggestions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"suggestions": suggestions,
	})
}

// SearchUsers finds users by name or email
func SearchUsers(c *gin.Context) {
	repo := repository.NewSearchRepository(database.GetDB())
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"users": []interface{}{},
		})
		return
	}

	users, err := repo.SearchUsers(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to search users",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"users": users,
	})
}

// SearchSatker finds satker by name
func SearchSatker(c *gin.Context) {
	repo := repository.NewSearchRepository(database.GetDB())
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusOK, gin.H{
			"satker": []interface{}{},
		})
		return
	}

	satker, err := repo.SearchSatker(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to search satker",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"satker": satker,
	})
}
