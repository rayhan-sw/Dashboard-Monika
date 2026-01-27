package domain

import (
	"time"
)

// ActivityLog represents a user activity log entry
type ActivityLog struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Timestamp time.Time `gorm:"not null;index" json:"timestamp"`
	Username  string    `gorm:"size:255;not null;index" json:"username"`
	Action    string    `gorm:"size:500;not null" json:"action"`
	IPAddress string    `gorm:"size:50" json:"ip_address"`
	Status    string    `gorm:"size:50;not null;index" json:"status"`
	Module    string    `gorm:"size:100;index" json:"module"`
	Region    string    `gorm:"size:100;index" json:"region"`
	Unit      string    `gorm:"size:100;index" json:"unit"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// User represents an authenticated user
type User struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Username  string    `gorm:"size:255;uniqueIndex;not null" json:"username"`
	Email     string    `gorm:"size:255;uniqueIndex" json:"email"`
	Password  string    `gorm:"size:255;not null" json:"-"`
	Role      string    `gorm:"size:50;not null;default:'user'" json:"role"`
	Region    string    `gorm:"size:100" json:"region"`
	Unit      string    `gorm:"size:100" json:"unit"`
	IsActive  bool      `gorm:"default:true" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
