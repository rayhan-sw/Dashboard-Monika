package main

import (
	"log"
	"os"

	"github.com/bpk-ri/dashboard-monitoring/internal/server"
	"github.com/bpk-ri/dashboard-monitoring/pkg/database"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load("../../.env"); err != nil {
		if err2 := godotenv.Load(); err2 != nil {
			log.Println("No .env file found, using system environment")
		}
	}

	if err := database.InitDB(); err != nil {
		log.Fatal("Failed to connect to database:", err)
	}
	defer database.CloseDB()

	log.Println("Connected to database:", os.Getenv("DB_NAME"))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := server.SetupRouter()
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
