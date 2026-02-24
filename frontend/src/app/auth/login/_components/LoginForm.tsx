/**
 * LoginForm Component - Login Form View
 */

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { useLogin } from '../../_hooks';
import {
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '../../_components';

export function LoginForm() {
  const searchParams = useSearchParams();
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const {
    formData,
    handleChange,
    handleSubmit,
    isLoading,
    error,
  } = useLogin();

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // Clear message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [searchParams]);

  return (
    <>
      {/* Logo */}
      <AuthLogo />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
        {/* Success Message from URL */}
        {successMessage && <AuthAlert type="success" message={successMessage} />}

        {/* Error Alert */}
        {error && <AuthAlert type="error" message={error} />}

        {/* Username or Email Input */}
        <AuthInput
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username atau Email"
          icon={User}
        />

        {/* Password Input */}
        <AuthInput
          id="password"
          name="password"
          type={showPassword ? 'text' : 'password'}
          value={formData.password}
          onChange={handleChange}
          placeholder="Kata Sandi"
          icon={Lock}
          rightElement={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="p-1 rounded hover:bg-gray-100 text-[#8E8E93] hover:text-gray-700 transition"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        {/* Submit Button */}
        <AuthButton isLoading={isLoading}>
          Masuk
        </AuthButton>

        {/* Forgot Password Link */}
        <AuthLink
          href="/auth/forgot-password"
          text="Lupa kata sandi?"
        />

        {/* Register Link */}
        <AuthLink
          href="/auth/register"
          text="Daftar"
          prefix="Belum punya akun?"
        />
      </form>
    </>
  );
}
