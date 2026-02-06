/**
 * RegisterForm Component - Register Form View
 */

'use client';

import { User, Lock, Mail } from 'lucide-react';
import { useRegister } from '../../_hooks';
import {
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '../../_components';

export function RegisterForm() {
  const {
    formData,
    handleChange,
    handleSubmit,
    isLoading,
    error,
    success,
  } = useRegister();

  return (
    <>
      {/* Logo */}
      <AuthLogo />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
        {/* Error Alert */}
        {error && <AuthAlert type="error" message={error} />}

        {/* Success Alert */}
        {success && (
          <AuthAlert 
            type="success" 
            message="Akun berhasil dibuat! Mengalihkan ke halaman login..." 
          />
        )}

        {/* Email Input */}
        <AuthInput
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email (contoh: nama@bpk.go.id)"
          icon={Mail}
          disabled={isLoading || success}
        />

        {/* Username Input */}
        <AuthInput
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username"
          icon={User}
          disabled={isLoading || success}
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
          disabled={isLoading || success}
        />

        {/* Confirm Password Input */}
        <AuthInput
          id="confirm_password"
          name="confirm_password"
          type="password"
          value={formData.confirm_password}
          onChange={handleChange}
          placeholder="Konfirmasi Kata Sandi"
          icon={Lock}
          disabled={isLoading || success}
        />

        {/* Submit Button */}
        <AuthButton isLoading={isLoading} disabled={success}>
          Daftar Akun
        </AuthButton>

        {/* Login Link */}
        <AuthLink
          href="/auth/login"
          text="Masuk"
          prefix="Sudah punya akun?"
        />
      </form>
    </>
  );
}
