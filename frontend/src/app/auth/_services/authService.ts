/**
 * Auth Service - API Layer (Model in MVC)
 * Handles all authentication-related API calls
 * Updated for Refresh Token Strategy with httpOnly cookies
 */

import { API_BASE_URL, setAccessToken, clearAccessToken } from "@/services/api";
import {
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  AuthResponse,
  ApiError,
} from '../_types';

const AUTH_BASE_URL = `${API_BASE_URL}/api/auth`;

/**
 * Generic API call handler with error handling
 * Updated to support credentials (cookies)
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit
): Promise<T> {
  const response = await fetch(`${AUTH_BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Important: include cookies for refresh token
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
 * Returns access_token (NOT refresh_token, that goes to httpOnly cookie)
 */
export async function loginUser(credentials: LoginRequest): Promise<AuthResponse> {
  // Clean up any old token from localStorage (from old implementation)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }

  const response = await apiCall<any>('/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

  // Store access token in memory (via api.ts)
  if (response.access_token) {
    setAccessToken(response.access_token);
  }

  // Store user info in localStorage (not sensitive data)
  if (response.user) {
    tokenService.setUser(response.user);
  }

  return response;
}

/**
 * Logout Service
 * POST /api/auth/logout
 * Blacklists current refresh token and clears httpOnly cookie
 */
export async function logoutUser(): Promise<void> {
  try {
    await apiCall<{ message: string }>('/logout', {
      method: 'POST',
    });
  } catch (error) {
    // Even if logout fails, clear local state
    console.error('Logout error:', error);
  } finally {
    // Clear access token from memory
    clearAccessToken();
    
    // Clear user from localStorage
    tokenService.removeToken();
  }
}

/**
 * Logout All Devices
 * POST /api/auth/logout-all
 * Requires authentication (access token)
 */
export async function logoutAllDevices(): Promise<{ message: string; devices_logged_out: number }> {
  // Get current access token for authorization
  const token = tokenService.getToken();
  
  const response = await apiCall<{ message: string; devices_logged_out: number }>('/logout-all', {
    method: 'POST',
    headers: token ? {
      'Authorization': `Bearer ${token}`
    } : {},
  });

  // Clear local state
  clearAccessToken();
  tokenService.removeToken();

  return response;
}

/**
 * Refresh Token Service
 * POST /api/auth/refresh
 * Uses httpOnly cookie automatically, returns new access token
 */
export async function refreshAccessToken(): Promise<{ access_token: string; expires_in: number }> {
  const response = await apiCall<{ access_token: string; expires_in: number }>('/refresh', {
    method: 'POST',
  });

  // Store new access token in memory
  if (response.access_token) {
    setAccessToken(response.access_token);
  }

  return response;
}

/**
 * Get Active Sessions
 * GET /api/auth/sessions
 * Returns list of active sessions for current user
 */
export async function getActiveSessions(): Promise<any> {
  const token = tokenService.getToken();
  
  const response = await fetch(`${AUTH_BASE_URL}/sessions`, {
    credentials: 'include',
    headers: token ? {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    } : {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to get sessions');
  }

  return response.json();
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
 * Updated: Access token now in memory (not localStorage)
 * User info still in localStorage (not sensitive)
 */
export const tokenService = {
  /**
   * Get token - now gets from memory via api.ts
   * Kept for backward compatibility
   */
  getToken: (): string | null => {
    // Import getAccessToken from api.ts
    // For now, return null as token is in memory
    // Components should call APIs directly, not get token
    return null;
  },

  /**
   * Set token - deprecated, use loginUser instead
   */
  setToken: (token: string): void => {
    setAccessToken(token);
  },

  /**
   * Remove token - now clears memory token
   */
  removeToken: (): void => {
    clearAccessToken();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('token'); // Remove old token if exists
    }
  },

  /**
   * Get user info from localStorage
   */
  getUser: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('user');
    }
    return null;
  },

  /**
   * Set user info in localStorage
   */
  setUser: (user: object): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },

  /**
   * Check if user is authenticated
   * User is authenticated if user info exists in localStorage
   * Token will be auto-refreshed by api.ts interceptor
   */
  isAuthenticated: (): boolean => {
    return !!tokenService.getUser();
  },
};
