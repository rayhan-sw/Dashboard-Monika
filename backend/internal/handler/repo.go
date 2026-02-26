// File repo.go: helper untuk mendapatkan instance repository yang dipakai handler.
//
// Handler dashboard, chart, dll. memakai getActivityLogRepo(); handler search memakai getSearchRepo().
// Keduanya memakai koneksi DB dari database.GetDB().
package handler

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
)

// getActivityLogRepo mengembalikan repository aktivitas (query activity_logs_normalized, satker, filter regional).
func getActivityLogRepo() repository.ActivityLogRepository {
	return repository.NewActivityLogRepository(database.GetDB())
}

// getSearchRepo mengembalikan repository pencarian (autocomplete, hasil search).
func getSearchRepo() *repository.SearchRepository {
	return repository.NewSearchRepository(database.GetDB())
}
