package entity

import "time"

// User represents a user account in the system
type User struct {
	ID                 int        `gorm:"primaryKey" json:"id"`
	Username           string     `gorm:"unique;not null" json:"username"`
	PasswordHash       string     `gorm:"not null" json:"-"` // Never expose password in JSON
	Role               string     `gorm:"not null;default:user" json:"role"`
	FullName           string     `json:"full_name,omitempty"`
	Email              string     `json:"email,omitempty"`
	ProfilePhoto       string     `json:"profile_photo,omitempty"`
	IsActive           bool       `gorm:"default:true" json:"is_active"`
	ReportAccessStatus string     `gorm:"default:none" json:"report_access_status"` // none, pending, approved, rejected
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
	LastLogin          *time.Time `json:"last_login,omitempty"`
}

// TableName specifies the table name for GORM
func (User) TableName() string {
	return "users"
}

// LoginRequest represents login credentials
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest represents registration data
type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=100"`
	Password        string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
	FullName        string `json:"full_name"`
	Email           string `json:"email" binding:"required,email"`
}

// ForgotPasswordRequest represents forgot password data (for users who forgot their password)
type ForgotPasswordRequest struct {
	Username        string `json:"username" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// ChangePasswordRequest represents change password data (for logged-in users)
type ChangePasswordRequest struct {
	OldPassword     string `json:"old_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// LoginResponse represents login response
type LoginResponse struct {
	Token   string `json:"token"`
	User    User   `json:"user"`
	Message string `json:"message"`
}

// UpdateProfilePhotoRequest represents update profile photo request
type UpdateProfilePhotoRequest struct {
	ProfilePhoto string `json:"profile_photo" binding:"required"`
}

// UserProfileResponse represents user profile with computed fields
type UserProfileResponse struct {
	User
	ReportAccessLabel string `json:"report_access_label"`
	RejectionCount    int    `json:"rejection_count"`
}
