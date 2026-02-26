// File cleanup_service.go: layanan pembersihan file laporan yang sudah lama (berjalan di background, periodik).
//
// CleanupService: folder yang di-scan (Dir), umur maksimal file (MaxAge), interval jalannya (Interval). Start menjalankan goroutine yang langsung runCleanup sekali lalu setiap Interval; Stop mengirim sinyal ke stopChan agar goroutine berhenti. runCleanup menghapus file yang ModTime lebih lama dari MaxAge.
package service

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"time"
)

// CleanupService mengelola pembersihan file di satu direktori: Dir = path folder, MaxAge = file lebih tua dari ini dihapus, Interval = jarak antar run, stopChan untuk sinyal stop, isRunning status.
type CleanupService struct {
	Dir       string
	MaxAge    time.Duration
	Interval  time.Duration
	stopChan  chan bool
	isRunning bool
}

// NewCleanupService membuat instance CleanupService dengan channel stop.
func NewCleanupService(dir string, maxAge, interval time.Duration) *CleanupService {
	return &CleanupService{
		Dir:      dir,
		MaxAge:   maxAge,
		Interval: interval,
		stopChan: make(chan bool),
	}
}

// Start menjalankan cleanup di goroutine: jalankan runCleanup sekali, lalu setiap Interval; berhenti saat menerima sinyal di stopChan.
func (cs *CleanupService) Start() {
	// Cegah double start
	if cs.isRunning {
		log.Println("Cleanup service is already running")
		return
	}

	cs.isRunning = true
	log.Printf("Starting cleanup service: dir=%s, maxAge=%v, interval=%v", cs.Dir, cs.MaxAge, cs.Interval)

	go func() {
		cs.runCleanup() // Jalankan sekali di awal

		ticker := time.NewTicker(cs.Interval)
		defer ticker.Stop()

		for {
			select {
			case <-ticker.C:
				cs.runCleanup() // Setiap interval jalankan lagi
			case <-cs.stopChan:
				log.Println("Cleanup service stopped")
				return
			}
		}
	}()
}

// Stop mengirim true ke stopChan dan set isRunning = false agar goroutine cleanup berhenti.
func (cs *CleanupService) Stop() {
	if !cs.isRunning {
		return
	}

	log.Println("Stopping cleanup service...")
	cs.stopChan <- true
	cs.isRunning = false
}

// runCleanup meng-walk direktori Dir; untuk setiap file (bukan folder) yang umurnya (now - ModTime) > MaxAge, hapus file dan hitung deletedCount serta totalSize. Log hasil atau "no old files".
func (cs *CleanupService) runCleanup() {
	log.Printf("Running cleanup for directory: %s", cs.Dir)

	// Abaikan jika folder tidak ada
	if _, err := os.Stat(cs.Dir); os.IsNotExist(err) {
		log.Printf("Directory does not exist: %s", cs.Dir)
		return
	}

	now := time.Now()
	deletedCount := 0
	totalSize := int64(0)

	err := filepath.Walk(cs.Dir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			log.Printf("Error accessing path %s: %v", path, err)
			return nil // Lanjut walk
		}

		if info.IsDir() {
			return nil // Hanya proses file, skip folder
		}

		// Umur file = selang sejak terakhir diubah
		age := now.Sub(info.ModTime())
		if age > cs.MaxAge {
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

// formatBytes mengonversi byte ke string terbaca (B, KB, MB, GB, TB) berdasarkan pembagian 1024.
func formatBytes(bytes int64) string {
	const unit = 1024
	if bytes < unit {
		return fmt.Sprintf("%d B", bytes)
	}
	// Hitung pangkat 1024 (exp) dan divisor agar result = bytes/1024^exp
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
