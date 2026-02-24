/**
 * ForgotPasswordForm Component - Forgot Password Form View
 */

'use client';

import { User, Lock } from 'lucide-react';
import { useForgotPassword } from '../../_hooks';
import {
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '../../_components';

export function ForgotPasswordForm() {
  const {
    formData,
    handleChange,
    handleSubmit,
    isLoading,
    error,
    success,
  } = useForgotPassword();

  return (
    <>
      {/* Logo */}
      <AuthLogo />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">Reset Password</p>
          <p>Masukkan username Anda dan password baru untuk mereset password yang terlupa.</p>
        </div>

        {/* Error Alert */}
        {error && <AuthAlert type="error" message={error} />}

        {/* Success Alert */}
        {success && (
          <AuthAlert 
            type="success" 
            message="Password berhasil diperbarui! Silakan login dengan password baru Anda..." 
          />
        )}

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

        {/* New Password Input */}
        <AuthInput
          id="new_password"
          name="new_password"
          type="password"
          value={formData.new_password}
          onChange={handleChange}
          placeholder="Kata Sandi Baru"
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
          Reset Kata Sandi
        </AuthButton>

        {/* Back to Login Link */}
        <AuthLink
          href="/auth/login"
          text="Kembali ke Login"
        />
      </form>
    </>
  );
}
