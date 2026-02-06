/**
 * Auth Service - API Layer (Model in MVC)
 * Handles all authentication-related API calls
 */

import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  AuthResponse,
  ApiError,
} from '../_types';

const API_BASE_URL = 'http://localhost:8080/api/auth';

/**
 * Generic API call handler with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as ApiError).error || 'Terjadi kesalahan');
  }

  return data as T;
}

/**
 * Login Service
 * POST /api/auth/login
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  return apiCall<AuthResponse>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
}

/**
 * Register Service
 * POST /api/auth/register
 */
export async function registerUser(userData: RegisterRequest): Promise<AuthResponse> {
  return apiCall<AuthResponse>('/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
}

/**
 * Forgot Password Service
 * POST /api/auth/forgot-password
 */
export async function resetPassword(data: ForgotPasswordRequest): Promise<{ message: string }> {
  return apiCall<{ message: string }>('/forgot-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Token Management
 */
export const tokenService = {
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  setToken: (token: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  removeToken: (): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  getUser: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user');
    }
    return null;
  },

  setUser: (user: object): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  isAuthenticated: (): boolean => {
    return !!tokenService.getToken();
  },
};
