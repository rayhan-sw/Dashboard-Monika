// File repo.go: helper untuk mendapatkan instance repository yang dipakai handler.
//
// Handler dashboard, chart, dll. memakai getActivityLogRepo(); handler search memakai getSearchRepo().
// Keduanya memakai koneksi DB dari database.GetDB().
package handler

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/jmoiron/sqlx"
)

// getActivityLogRepo mengembalikan repository aktivitas (query activity_logs_normalized, satker, filter regional).
func getActivityLogRepo() repository.ActivityLogRepository {
	return repository.NewActivityLogRepository(database.GetDB())
}

// getSearchRepo mengembalikan repository pencarian (autocomplete, hasil search).
func getSearchRepo() *repository.SearchRepository {
	return repository.NewSearchRepository(database.GetDB())
}

// getRefreshTokenRepo returns the refresh token repository instance
func getRefreshTokenRepo() *repository.RefreshTokenRepository {
	db := database.GetDB()
	sqlDB, err := db.DB()
	if err != nil {
		panic(err) // Should never happen in production if DB is connected
	}
	sqlxDB := sqlx.NewDb(sqlDB, "postgres")
	return repository.NewRefreshTokenRepository(sqlxDB)
}

// getTokenBlacklistRepo returns the token blacklist repository instance
func getTokenBlacklistRepo() *repository.TokenBlacklistRepository {
	db := database.GetDB()
	sqlDB, err := db.DB()
	if err != nil {
		panic(err) // Should never happen in production if DB is connected
	}
	sqlxDB := sqlx.NewDb(sqlDB, "postgres")
	return repository.NewTokenBlacklistRepository(sqlxDB)
}
