'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { resetPassword } from '../_services/authService';
import { ForgotPasswordFormData, AuthFormState } from '../_types';
import { validatePassword } from '../_utils/validation';

interface UseForgotPasswordReturn extends AuthFormState {
  formData: ForgotPasswordFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const router = useRouter();

  const [formData, setFormData] = useState<ForgotPasswordFormData>({
    username: '',
    new_password: '',
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
    if (!formData.username.trim()) return 'Username wajib diisi';

    const passResult = validatePassword(
      formData.new_password,
      formData.username,
      ''
    );
    if (!passResult.valid) return passResult.message ?? null;

    if (formData.new_password !== formData.confirm_password) {
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
      await resetPassword(formData);

      setState(prev => ({ ...prev, success: true }));
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Gagal mengubah password',
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
