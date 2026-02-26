package entity

import "time"

// User merepresentasikan akun pengguna di sistem (login, role, akses laporan, profil).
// PasswordHash tidak di-expose di JSON (tag json:"-"). ReportAccessStatus: none, pending, approved, rejected.
type User struct {
	ID                 int        `gorm:"primaryKey" json:"id"`
	Username           string     `gorm:"unique;not null" json:"username"`
	PasswordHash       string     `gorm:"not null" json:"-"` // Jangan pernah expose di JSON
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

// TableName mengembalikan nama tabel GORM untuk User.
func (User) TableName() string {
	return "users"
}

// LoginRequest payload untuk endpoint login (username dan password).
type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// RegisterRequest payload untuk endpoint registrasi (username, password, email, dll.).
type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=100"`
	Password        string `json:"password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
	FullName        string `json:"full_name"`
	Email           string `json:"email" binding:"required,email"`
}

// ForgotPasswordRequest payload untuk reset password (user lupa password; biasanya dengan verifikasi).
type ForgotPasswordRequest struct {
	Username        string `json:"username" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// ChangePasswordRequest payload untuk ganti password (user sudah login; butuh old password).
type ChangePasswordRequest struct {
	OldPassword     string `json:"old_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=6"`
	ConfirmPassword string `json:"confirm_password" binding:"required"`
}

// LoginResponse response endpoint login (token JWT, data user, pesan).
type LoginResponse struct {
	Token   string `json:"token"`
	User    User   `json:"user"`
	Message string `json:"message"`
}

// UpdateProfilePhotoRequest payload untuk update foto profil (URL atau path).
type UpdateProfilePhotoRequest struct {
	ProfilePhoto string `json:"profile_photo" binding:"required"`
}

// UserProfileResponse response profil user dengan field terhitung (misalnya label status akses laporan).
type UserProfileResponse struct {
	User
	ReportAccessLabel string `json:"report_access_label"`
}
