package handler

import (
	"github.com/bpk-ri/dashboard-monitoring/internal/repository"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/jmoiron/sqlx"
)

// getActivityLogRepo returns the activity log repository instance
func getActivityLogRepo() repository.ActivityLogRepository {
	return repository.NewActivityLogRepository(database.GetDB())
}

// getSearchRepo returns the search repository instance
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
