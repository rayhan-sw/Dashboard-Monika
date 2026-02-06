/**
 * Auth Types - Data Transfer Objects (DTOs)
 * Definisi tipe data untuk authentication
 */

// ============================================
// Request Types
// ============================================

export interface LoginRequest {
  username: string; // Can be email or username
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  confirm_password: string;
  full_name?: string;
  email: string; // Required, must be @bpk.go.id
}

export interface ForgotPasswordRequest {
  username: string;
  new_password: string;
  confirm_password: string;
}

// ============================================
// Response Types
// ============================================

export interface User {
  id: number;
  username: string;
  full_name?: string;
  email?: string;
  role: string;
  eselon?: string;
  report_access_status?: string;
  created_at?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

// ============================================
// Form State Types
// ============================================

export interface AuthFormState {
  isLoading: boolean;
  error: string;
  success: boolean;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
}

export interface ForgotPasswordFormData {
  username: string;
  new_password: string;
  confirm_password: string;
}
