/**
 * Change Password Page
 * Route: /account/change-password
 * Ketentuan kata sandi baru sama seperti registrasi: min 8 karakter, besar/kecil/angka; simbol disarankan.
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { accountService } from '@/services/api';
import { validatePassword, getPasswordStrength } from '@/app/auth/_utils/validation';
import {
  AuthLayout,
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '@/app/auth/_components';

const STRENGTH_LABELS = ['Sangat lemah', 'Lemah', 'Cukup', 'Cukup', 'Kuat', 'Sangat kuat'];
const STRENGTH_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600', 'bg-green-700'];

function getCurrentUser() {
  if (typeof window === 'undefined') return { username: '', email: '' };
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return { username: user.username ?? '', email: user.email ?? '' };
}

export default function ChangePasswordPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{
    oldPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { username, email } = useMemo(() => getCurrentUser(), []);

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.newPassword),
    [formData.newPassword]
  );

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/auth/login');
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errors: typeof fieldErrors = {};

    if (!formData.oldPassword.trim()) {
      errors.oldPassword = 'Kata sandi lama wajib diisi';
    }

    const newPassResult = validatePassword(
      formData.newPassword,
      username,
      email
    );
    if (!newPassResult.valid) {
      errors.newPassword = newPassResult.message;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi tidak cocok';
    } else if (!formData.confirmPassword) {
      errors.confirmPassword = 'Konfirmasi kata sandi wajib diisi';
    }

    if (formData.oldPassword && formData.newPassword && formData.oldPassword === formData.newPassword) {
      errors.newPassword = 'Kata sandi baru tidak boleh sama dengan kata sandi lama';
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsLoading(true);
    try {
      const response = await accountService.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );
      setSuccess(true);
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login?message=' + encodeURIComponent(response.message));
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah kata sandi');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Ubah Kata Sandi">
      <AuthLogo />

      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">Keamanan Akun</p>
          <p>Isi kata sandi lama dan baru (min. 8 karakter: huruf besar, kecil, angka; simbol disarankan). Setelah berhasil Anda akan logout dan harus login lagi.</p>
        </div>

        {error && <AuthAlert type="error" message={error} />}
        {success && (
          <AuthAlert
            type="success"
            message="Kata sandi berhasil diubah! Mengalihkan ke halaman login..."
          />
        )}

        <AuthInput
          id="oldPassword"
          name="oldPassword"
          type={showOldPassword ? 'text' : 'password'}
          value={formData.oldPassword}
          onChange={handleChange}
          placeholder="Kata Sandi Lama"
          icon={Lock}
          disabled={isLoading || success}
          error={fieldErrors.oldPassword}
          rightElement={
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="p-1 rounded hover:bg-gray-100 text-[#8E8E93] hover:text-gray-700 transition"
              aria-label={showOldPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showOldPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          }
        />

        <div>
          <AuthInput
            id="newPassword"
            name="newPassword"
            type={showNewPassword ? 'text' : 'password'}
            value={formData.newPassword}
            onChange={handleChange}
            placeholder="Kata Sandi Baru (min. 8: besar, kecil, angka; simbol disarankan)"
            icon={Lock}
            disabled={isLoading || success}
            error={fieldErrors.newPassword}
            rightElement={
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="p-1 rounded hover:bg-gray-100 text-[#8E8E93] hover:text-gray-700 transition"
                aria-label={showNewPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            }
          />
          {formData.newPassword.length > 0 && (
            <div className="mt-2">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
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
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirmPassword ? 'text' : 'password'}
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Konfirmasi Kata Sandi Baru"
          icon={Lock}
          disabled={isLoading || success}
          error={fieldErrors.confirmPassword}
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
          Ubah Kata Sandi
        </AuthButton>

        <AuthLink href="/settings" text="Kembali ke Pengaturan" />
      </form>
    </AuthLayout>
  );
}
