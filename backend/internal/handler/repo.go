package handler

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
)

// getActivityLogRepo returns the activity log repository instance
func getActivityLogRepo() repository.ActivityLogRepository {
	return repository.NewActivityLogRepository(database.GetDB())
}

// getSearchRepo returns the search repository instance
func getSearchRepo() *repository.SearchRepository {
	return repository.NewSearchRepository(database.GetDB())
}
