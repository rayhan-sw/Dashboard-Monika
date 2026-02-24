/**
 * Change Password Page
 * Route: /account/change-password
 * For authenticated users who want to change their password
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { accountService } from '@/services/api';
import {
  AuthLayout,
  AuthLogo,
  AuthInput,
  AuthButton,
  AuthAlert,
  AuthLink,
} from '@/app/auth/_components';

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

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Client-side validation
    if (!formData.oldPassword || !formData.newPassword || !formData.confirmPassword) {
      setError('Semua field harus diisi');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      setIsLoading(false);
      return;
    }

    if (formData.oldPassword === formData.newPassword) {
      setError('Password baru tidak boleh sama dengan password lama');
      setIsLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('Password baru minimal 6 karakter');
      setIsLoading(false);
      return;
    }

    try {
      const response = await accountService.changePassword(
        formData.oldPassword,
        formData.newPassword,
        formData.confirmPassword
      );

      setSuccess(true);
      
      // Clear localStorage and redirect to login after 2 seconds
      setTimeout(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/auth/login?message=' + encodeURIComponent(response.message));
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah password');
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Ubah Kata Sandi">
      {/* Logo */}
      <AuthLogo />

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 max-w-[472px] mx-auto">
        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold mb-1">Keamanan Akun</p>
          <p>Masukkan password lama dan password baru Anda. Setelah berhasil, Anda akan otomatis logout dan harus login kembali.</p>
        </div>

        {/* Error Alert */}
        {error && <AuthAlert type="error" message={error} />}

        {/* Success Alert */}
        {success && (
          <AuthAlert 
            type="success" 
            message="Kata sandi berhasil diubah! Mengalihkan ke halaman login..." 
          />
        )}

        {/* Old Password Input */}
        <AuthInput
          id="oldPassword"
          name="oldPassword"
          type="password"
          value={formData.oldPassword}
          onChange={handleChange}
          placeholder="Kata Sandi Lama"
          icon={Lock}
          disabled={isLoading || success}
        />

        {/* New Password Input */}
        <AuthInput
          id="newPassword"
          name="newPassword"
          type="password"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Kata Sandi Baru (min. 6 karakter)"
          icon={Lock}
          disabled={isLoading || success}
        />

        {/* Confirm Password Input */}
        <AuthInput
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Konfirmasi Kata Sandi Baru"
          icon={Lock}
          disabled={isLoading || success}
        />

        {/* Submit Button */}
        <AuthButton isLoading={isLoading} disabled={success}>
          Ubah Kata Sandi
        </AuthButton>

        {/* Back to Settings Link */}
        <AuthLink
          href="/settings"
          text="Kembali ke Pengaturan"
        />
      </form>
    </AuthLayout>
  );
}
