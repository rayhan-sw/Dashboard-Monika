// Package response berisi helper untuk mengirim response HTTP seragam dari handler.
//
// File response.go: Internal (log error + 500 + pesan umum), Error (response error dengan status code dan pesan kustom).
package response

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Internal mencatat error ke log server lalu mengirim response 500 dengan pesan umum "Terjadi kesalahan".
// Dipakai saat terjadi error tak terduga (DB, internal) agar detail tidak bocor ke client; detail tetap tercatat di log.
func Internal(c *gin.Context, err error) {
	log.Printf("[ERROR] %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan"})
}

// Error mengirim response JSON dengan status code dan pesan error yang diberikan. Body: {"error": message}.
// Dipakai untuk response error yang memang ingin ditampilkan ke client (misalnya 400, 401, 404) dengan pesan spesifik.
func Error(c *gin.Context, code int, message string) {
	c.JSON(code, gin.H{"error": message})
}
