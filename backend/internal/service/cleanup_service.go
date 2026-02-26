package service

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

// CleanupService handles automatic cleanup of generated report files
type CleanupService struct {
	Dir       string
	MaxAge    time.Duration
	Interval  time.Duration
	stopChan  chan bool
	isRunning bool
}

// NewCleanupService creates a new cleanup service
func NewCleanupService(dir string, maxAge, interval time.Duration) *CleanupService {
	return &CleanupService{
		Dir:      dir,
		MaxAge:   maxAge,
		Interval: interval,
		stopChan: make(chan bool),
	}
}

// Start begins the cleanup service in background
func (cs *CleanupService) Start() {
	if cs.isRunning {
		log.Println("Cleanup service is already running")
		return
	}

	cs.isRunning = true
	log.Printf("Starting cleanup service: dir=%s, maxAge=%v, interval=%v", cs.Dir, cs.MaxAge, cs.Interval)

	go func() {
		// Run cleanup immediately on start
		cs.runCleanup()

		// Then run periodically
		ticker := time.NewTicker(cs.Interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				cs.runCleanup()
			case <-cs.stopChan:
				log.Println("Cleanup service stopped")
				return
			}
		}
	}()
}

// Stop stops the cleanup service
func (cs *CleanupService) Stop() {
	if !cs.isRunning {
		return
	}

	log.Println("Stopping cleanup service...")
	cs.stopChan <- true
	cs.isRunning = false
}

// runCleanup performs the actual cleanup operation
func (cs *CleanupService) runCleanup() {
	log.Printf("Running cleanup for directory: %s", cs.Dir)

	// Check if directory exists
	if _, err := os.Stat(cs.Dir); os.IsNotExist(err) {
		log.Printf("Directory does not exist: %s", cs.Dir)
		return
	}

	// Get current time
	now := time.Now()
	deletedCount := 0
	totalSize := int64(0)

	// Walk through directory
	err := filepath.Walk(cs.Dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error accessing path %s: %v", path, err)
			return nil // Continue walking
		}

		// Skip directories
		if info.IsDir() {
			return nil
		}

		// Check file age
		age := now.Sub(info.ModTime())
		if age > cs.MaxAge {
			// Delete the file
			log.Printf("Deleting old file: %s (age: %v, size: %d bytes)", path, age, info.Size())

			if err := os.Remove(path); err != nil {
				log.Printf("Failed to delete file %s: %v", path, err)
			} else {
				deletedCount++
				totalSize += info.Size()
			}
		}

		return nil
	})

	if err != nil {
		log.Printf("Error during cleanup: %v", err)
	}

	if deletedCount > 0 {
		log.Printf("Cleanup completed: deleted %d file(s), freed %s", deletedCount, formatBytes(totalSize))
	} else {
		log.Println("Cleanup completed: no old files to delete")
	}
}

// formatBytes formats bytes to human-readable format
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	div, exp := int64(unit), 0
	for n := bytes / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}

	result := float64(bytes) / float64(div)
	switch exp {
	case 0:
		return fmt.Sprintf("%.2f KB", result)
	case 1:
		return fmt.Sprintf("%.2f KB", result)
	case 2:
		return fmt.Sprintf("%.2f MB", result)
	case 3:
		return fmt.Sprintf("%.2f GB", result)
	default:
		return fmt.Sprintf("%.2f TB", result)
	}
}

// TokenCleanupService handles automatic cleanup of expired tokens and blacklist entries
type TokenCleanupService struct {
	Interval  time.Duration
	stopChan  chan bool
	isRunning bool
}

// NewTokenCleanupService creates a new token cleanup service
func NewTokenCleanupService(interval time.Duration) *TokenCleanupService {
	return &TokenCleanupService{
		Interval: interval,
		stopChan: make(chan bool),
	}
}

// Start begins the token cleanup service in background
func (tcs *TokenCleanupService) Start() {
	if tcs.isRunning {
		log.Println("Token cleanup service is already running")
		return
	}

	tcs.isRunning = true
	log.Printf("Starting token cleanup service: interval=%v", tcs.Interval)

	go func() {
		// Run cleanup immediately on start
		tcs.runTokenCleanup()

		// Then run periodically
		ticker := time.NewTicker(tcs.Interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				tcs.runTokenCleanup()
			case <-tcs.stopChan:
				log.Println("Token cleanup service stopped")
				return
			}
		}
	}()
}

// Stop stops the token cleanup service
func (tcs *TokenCleanupService) Stop() {
	if !tcs.isRunning {
		return
	}

	log.Println("Stopping token cleanup service...")
	tcs.stopChan <- true
	tcs.isRunning = false
}

// runTokenCleanup performs the actual token cleanup operation
func (tcs *TokenCleanupService) runTokenCleanup() {
	log.Println("Running token cleanup...")

	// Import here to avoid circular dependency
	// In production, you might want to inject repositories via constructor
	// For now, we'll use a simple implementation
	// Note: This requires database connection, which should be handled properly

	// This is a placeholder that should be called from main.go with proper repository injection
	// See documentation for proper implementation

	log.Println("Token cleanup completed (implementation requires repository injection)")
}

// CleanupExpiredTokens is a standalone function that can be called with repositories
// This should be called from main.go or a scheduled job
func CleanupExpiredTokens() {
	// This function should be implemented in main.go with proper repository access
	// See the documentation for implementation example
	log.Println("Cleaning up expired tokens and blacklist entries...")
}
