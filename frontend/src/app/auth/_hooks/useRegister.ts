'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '../_services/authService';
import { RegisterFormData, AuthFormState } from '../_types';

interface UseRegisterReturn extends AuthFormState {
  formData: RegisterFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

// Validation rules
const VALIDATION = {
  MIN_USERNAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 6,
} as const;

export function useRegister(): UseRegisterReturn {
  const router = useRouter();
  
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    username: '',
    password: '',
    confirm_password: '',
  });
  
  const [state, setState] = useState<AuthFormState>({
    isLoading: false,
    error: '',
    success: false,
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const validate = useCallback((): string | null => {
    // Validate email
    if (!formData.email || formData.email.trim() === '') {
      return 'Email wajib diisi';
    }
    
    if (!formData.email.endsWith('@bpk.go.id')) {
      return 'Email harus menggunakan domain @bpk.go.id';
    }
    
    // Validate username
    if (formData.username.length < VALIDATION.MIN_USERNAME_LENGTH) {
      return `Username minimal ${VALIDATION.MIN_USERNAME_LENGTH} karakter`;
    }
    
    // Validate password
    if (formData.password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
      return `Password minimal ${VALIDATION.MIN_PASSWORD_LENGTH} karakter`;
    }
    
    if (formData.password !== formData.confirm_password) {
      return 'Password dan konfirmasi password tidak cocok';
    }
    
    return null;
  }, [formData]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validationError = validate();
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      await registerUser(formData);

      setState(prev => ({ ...prev, success: true }));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Gagal membuat akun',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [formData, validate, router]);

  return {
    formData,
    handleChange,
    handleSubmit,
    ...state,
  };
}
