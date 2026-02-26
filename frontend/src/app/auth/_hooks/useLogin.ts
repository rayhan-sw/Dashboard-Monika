'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, tokenService } from '../_services/authService';
import { LoginFormData, AuthFormState } from '../_types';

interface UseLoginReturn extends AuthFormState {
  formData: LoginFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useLogin(): UseLoginReturn {
  const router = useRouter();
  
  const [formData, setFormData] = useState<LoginFormData>({
    username: '',
    password: '',
  });
  
  const [state, setState] = useState<AuthFormState>({
    isLoading: false,
    error: '',
    success: false,
  });

  // Removed auto-redirect useEffect to prevent infinite loop
  // Only redirect after successful login

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const response = await loginUser({
        username: formData.username,
        password: formData.password,
      });

      // loginUser now handles setting access token in memory and user in localStorage
      // No need to manually store token (it's in memory now)
      // User is already stored by loginUser function

      setState(prev => ({ ...prev, success: true }));
      router.push('/dashboard');
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Terjadi kesalahan',
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [formData, router]);

  return {
    formData,
    handleChange,
    handleSubmit,
    ...state,
  };
}
