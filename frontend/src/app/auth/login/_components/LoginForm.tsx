/**
 * LoginForm Component - Login Form View
 */

'use client';

import { User, Lock } from 'lucide-react';
import { useLogin } from '../../_hooks';
import {
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '../../_components';

export function LoginForm() {
  const {
    formData,
    handleChange,
    handleSubmit,
    isLoading,
    error,
  } = useLogin();

  return (
    <>
      {/* Logo */}
      <AuthLogo />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
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
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Kata Sandi"
          icon={Lock}
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
