'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { registerUser } from '../_services/authService';
import { RegisterFormData, AuthFormState } from '../_types';
import { validateUsername, validatePassword, getPasswordStrength } from '../_utils/validation';

export interface RegisterFieldErrors {
  email?: string;
  username?: string;
  password?: string;
  confirm_password?: string;
}

interface UseRegisterReturn extends AuthFormState {
  formData: RegisterFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  fieldErrors: RegisterFieldErrors;
  passwordStrength: number; // 0-4
}

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

  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFieldErrors(prev => ({ ...prev, [name]: undefined }));
    setState(prev => (prev.error ? { ...prev, error: '' } : prev));
  }, []);

  const validate = useCallback((): boolean => {
    const errors: RegisterFieldErrors = {};

    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email wajib diisi';
    } else if (!formData.email.endsWith('@bpk.go.id')) {
      errors.email = 'Email harus menggunakan domain @bpk.go.id';
    }

    const usernameResult = validateUsername(formData.username);
    if (!usernameResult.valid) errors.username = usernameResult.message;

    const passwordResult = validatePassword(
      formData.password,
      formData.username,
      formData.email
    );
    if (!passwordResult.valid) errors.password = passwordResult.message;

    if (formData.password !== formData.confirm_password) {
      errors.confirm_password = 'Konfirmasi kata sandi tidak cocok';
    } else if (formData.confirm_password.length === 0) {
      errors.confirm_password = 'Konfirmasi kata sandi wajib diisi';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validate()) return;

      setState(prev => ({ ...prev, isLoading: true, error: '' }));

      try {
        await registerUser(formData);
        setState(prev => ({ ...prev, success: true }));
        setTimeout(() => router.push('/auth/login'), 2000);
      } catch (err) {
        setState(prev => ({
          ...prev,
          error: err instanceof Error ? err.message : 'Gagal membuat akun',
        }));
      } finally {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    },
    [formData, validate, router]
  );

  return {
    formData,
    handleChange,
    handleSubmit,
    fieldErrors,
    passwordStrength,
    ...state,
  };
}
