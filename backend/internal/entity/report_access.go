package entity

import "time"

// ReportAccessRequest represents a user's request for report access
type ReportAccessRequest struct {
	ID          int        `gorm:"primaryKey" json:"id"`
	UserID      int        `gorm:"not null" json:"user_id"`
	User        *User      `gorm:"foreignKey:UserID" json:"user,omitempty"`
	Reason      string     `json:"reason,omitempty"`
	Status      string     `gorm:"default:pending" json:"status"` // pending, approved, rejected
	RequestedAt time.Time  `gorm:"default:CURRENT_TIMESTAMP" json:"requested_at"`
	ProcessedAt *time.Time `json:"processed_at,omitempty"`
	ProcessedBy *int       `json:"processed_by,omitempty"`
	AdminNotes  string     `json:"admin_notes,omitempty"`
}

// TableName specifies the table name for GORM
func (ReportAccessRequest) TableName() string {
	return "report_access_requests"
}

// Notification represents a user notification
type Notification struct {
	ID            int       `gorm:"primaryKey" json:"id"`
	UserID        int       `gorm:"not null" json:"user_id"`
	Title         string    `gorm:"not null" json:"title"`
	Message       string    `gorm:"not null" json:"message"`
	Type          string    `gorm:"default:info" json:"type"` // info, success, warning, error
	IsRead        bool      `gorm:"default:false" json:"is_read"`
	RelatedEntity string    `json:"related_entity,omitempty"` // report_access, system, etc.
	RelatedID     *int      `json:"related_id,omitempty"`
	CreatedAt     time.Time `gorm:"default:CURRENT_TIMESTAMP" json:"created_at"`
}

// TableName specifies the table name for GORM
func (Notification) TableName() string {
	return "notifications"
}
