package response

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// Internal logs err on the server and sends 500 with a generic message.
func Internal(c *gin.Context, err error) {
	log.Printf("[ERROR] %v", err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "Terjadi kesalahan"})
}

// Error sends a JSON error response with the given status code and message.
func Error(c *gin.Context, code int, message string) {
	c.JSON(code, gin.H{"error": message})
}
