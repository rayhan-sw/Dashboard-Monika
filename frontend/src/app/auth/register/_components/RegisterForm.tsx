/**
 * RegisterForm Component - Register Form View
 * Validasi username & password, strength meter, show/hide password.
 */

'use client';

import { useState } from 'react';
import { User, Lock, Mail, Eye, EyeOff } from 'lucide-react';
import { useRegister } from '../../_hooks';
import {
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '../../_components';

const STRENGTH_LABELS = ['Sangat lemah', 'Lemah', 'Cukup', 'Cukup', 'Kuat', 'Sangat kuat'];
const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600', 'bg-green-700'];

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    formData,
    handleChange,
    handleSubmit,
    isLoading,
    error,
    success,
    fieldErrors,
    passwordStrength,
  } = useRegister();

  return (
    <>
      <AuthLogo />

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
        {error && <AuthAlert type="error" message={error} />}
        {success && (
          <AuthAlert
            type="success"
            message="Akun berhasil dibuat! Mengalihkan ke halaman login..."
          />
        )}

        <AuthInput
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Email (contoh: nama@bpk.go.id)"
          icon={Mail}
          disabled={isLoading || success}
          error={fieldErrors.email}
        />

        <AuthInput
          id="username"
          name="username"
          type="text"
          value={formData.username}
          onChange={handleChange}
          placeholder="Username (3-20 karakter, huruf/angka/_/.)"
          icon={User}
          disabled={isLoading || success}
          error={fieldErrors.username}
        />

        <div>
          <AuthInput
            id="password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={formData.password}
            onChange={handleChange}
            placeholder="Kata Sandi (min. 8: besar, kecil, angka; simbol disarankan)"
            icon={Lock}
            disabled={isLoading || success}
            error={fieldErrors.password}
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
          {formData.password.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      i < passwordStrength
                        ? STRENGTH_COLORS[passwordStrength >= 5 && i === 4 ? 5 : i]
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Kekuatan: {STRENGTH_LABELS[Math.min(passwordStrength, 5)]}
              </p>
            </div>
          )}
        </div>

        <AuthInput
          id="confirm_password"
          name="confirm_password"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirm_password}
          onChange={handleChange}
          placeholder="Konfirmasi Kata Sandi"
          icon={Lock}
          disabled={isLoading || success}
          error={fieldErrors.confirm_password}
          rightElement={
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="p-1 rounded hover:bg-gray-100 text-[#8E8E93] hover:text-gray-700 transition"
              aria-label={showConfirmPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        <AuthButton isLoading={isLoading} disabled={success}>
          Daftar Akun
        </AuthButton>

        <AuthLink href="/auth/login" text="Masuk" prefix="Sudah punya akun?" />
      </form>
    </>
  );
}
