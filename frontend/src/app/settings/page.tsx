'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { useAppStore } from '@/stores/appStore';
import { profileService } from '@/services/api';

interface UserProfile {
  id: number;
  username: string;
  full_name: string;
  email: string;
  role: string;
  profile_photo?: string;
  report_access_status: string;
  last_login?: string;
  created_at: string;
  report_access_label: string;
  password_last_changed?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      // Redirect to login if not authenticated
      router.push('/auth/login');
      return;
    }

    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await profileService.getProfile();
      setProfile(response);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }

    try {
      setUploading(true);
      
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        
        // Upload to server
        await profileService.updateProfilePhoto(base64String);

        // Refresh profile
        await fetchProfile();
        
        // Update localStorage
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.profile_photo = base64String;
        localStorage.setItem('user', JSON.stringify(user));

        alert('Foto profil berhasil diperbarui');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      alert('Gagal mengunggah foto profil');
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = () => {
    // Logout and redirect to forgot password
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/forgot-password');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/auth/login');
  };

  const handleRequestAccess = async () => {
    try {
      await profileService.requestReportAccess();
      alert('Permintaan akses berhasil dikirim. Tunggu persetujuan admin.');
      fetchProfile();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Gagal mengirim permintaan akses');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-600 font-medium">Gagal memuat profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-6">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarCollapsed ? 'ml-20' : 'ml-80'
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />

        <main className="flex-1 pt-20 px-6 pb-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-h4 font-bold text-gradient-bpk">Pengaturan Akun</h1>
              <p className="text-subtitle font-medium text-gray-1 mt-2">Kelola informasi profil dan preferensi keamanan Anda</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[696px_352px] gap-6">
              {/* Left Column - Profile Card */}
              <div className="lg:col-span-1">
                <div className="bg-white border-[0.5px] border-gray-5 rounded-lg-bpk shadow-card overflow-hidden">
                  {/* Orange Gradient Header Section */}
                  <div className="relative bg-gradient-to-br from-[#FEB800] to-[#E27200] pt-10 pb-6 px-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-6">
                        {/* Profile Photo Container */}
                        <div className="relative">
                          <div className="w-[137px] h-[137px] bg-white rounded-lg-bpk shadow-card flex items-center justify-center">
                            <div className="w-[121px] h-[121px] bg-gray-6 border border-gray-5 rounded-lg-bpk flex items-center justify-center overflow-hidden">
                              {profile.profile_photo ? (
                                <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-[48px] font-extrabold text-gray-2 leading-none">
                                  {profile.full_name?.charAt(0).toUpperCase() || 'A'}
                                </span>
                              )}
                            </div>
                          </div>
                          <input
                            id="photoInput"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </div>

                        {/* Name & Username */}
                        <div className="pt-12">
                          <h2 className="text-body-1 font-semibold text-black leading-tight">{profile.full_name || 'User'}</h2>
                          <p className="text-caption font-medium text-gray-1 mt-2">
                            @<span className="font-bold">{profile.username}</span>
                          </p>
                        </div>
                      </div>

                      {/* Ubah Profil Button - Positioned on right */}
                      <button
                        onClick={() => document.getElementById('photoInput')?.click()}
                        disabled={uploading}
                        className="bg-white border border-bpk-orange-light text-bpk-orange-light px-4 py-2 rounded-[7px] text-body-2 font-semibold shadow-card hover:bg-orange-50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {uploading ? 'Mengunggah...' : 'Ubah Profil'}
                      </button>
                    </div>
                  </div>

                  {/* Info Grid - White Background Section */}
                  <div className="bg-white px-10 py-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                      {/* Nama Lengkap */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-[18px] h-[18px] text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-caption font-semibold text-gray-1 uppercase">Nama Lengkap</span>
                        </div>
                        <div className="bg-gray-6 border border-gray-6 rounded-md px-4 py-2">
                          <p className="text-body-1 font-semibold text-black leading-tight">{profile.full_name || '-'}</p>
                        </div>
                      </div>

                      {/* Username */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-subtitle font-extrabold text-gray-1">@</span>
                          <span className="text-caption font-semibold text-gray-1 uppercase">Username</span>
                        </div>
                        <div className="bg-gray-6 border border-gray-6 rounded-md px-4 py-2">
                          <p className="text-body-1 font-semibold text-black leading-tight">{profile.username}</p>
                        </div>
                      </div>

                      {/* Role & Jabatan */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-[17px] h-[17px] text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="text-caption font-semibold text-gray-1 uppercase">Role & Jabatan</span>
                        </div>
                        <div className="bg-gray-6 border border-gray-6 rounded-md px-4 py-2">
                          <span className="inline-flex items-center gap-1.5 bg-bg-blue rounded-full px-3 py-1 text-caption font-normal text-[#1c398e]">
                            {profile.role === 'admin' ? 'Admin' : 'User'}
                          </span>
                        </div>
                      </div>

                      {/* Status Akses Laporan */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-[17px] h-[17px] text-gray-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                          <span className="text-caption font-semibold text-gray-1 uppercase">Status Akses Laporan</span>
                        </div>
                        <div className="bg-gray-6 border border-gray-6 rounded-md px-4 py-2">
                          {profile.report_access_label === 'Akses Penuh' && (
                            <span className="inline-flex items-center gap-1.5 bg-bg-green rounded-full px-3 py-1 text-caption font-normal text-[#007a55]">
                              <span className="w-1 h-1 rounded-full bg-[#007a55]"></span>
                              Akses Penuh
                            </span>
                          )}
                          {profile.report_access_label === 'Menunggu Persetujuan' && (
                            <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#FEB800] to-[#E27200] text-white rounded-full px-3 py-1 text-caption font-normal">
                              <span className="w-1 h-1 rounded-full bg-white"></span>
                              Menunggu Persetujuan
                            </span>
                          )}
                          {(profile.report_access_label === 'Terbatas' || profile.report_access_label === 'Tertolak' || (profile.report_access_label !== 'Akses Penuh' && profile.report_access_label !== 'Menunggu Persetujuan')) && (
                            <span className="inline-flex items-center gap-1.5 bg-bg-red rounded-full px-3 py-1 text-caption font-normal text-error">
                              <span className="w-1 h-1 rounded-full bg-error"></span>
                              {profile.report_access_label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Keamanan & Manajemen Sesi */}
              <div className="space-y-6">
                {/* Keamanan Card */}
                <div className="bg-white border-[0.5px] border-gray-5 rounded-lg-bpk shadow-card p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-[33px] h-[33px] flex items-center justify-center -rotate-[32deg]">
                      <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <h3 className="text-subtitle font-semibold text-black">Keamanan</h3>
                  </div>

                  {profile.password_last_changed && (
                    <div className="bg-bg-blue border-[0.5px] border-bg-blue rounded-[10px] p-4 mb-4">
                      <p className="text-body-2 font-semibold text-[#1c398e] leading-tight">Kata sandi terakhir diubah</p>
                      <p className="text-caption font-normal text-info-alt mt-1">{profile.password_last_changed}</p>
                    </div>
                  )}

                  <button
                    onClick={handleChangePassword}
                    className="w-full border-[0.5px] border-gray-4 bg-white text-gray-1 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-caption font-semibold flex items-center justify-between h-[32px]"
                  >
                    <span>Ubah kata sandi</span>
                    <svg className="w-3 h-3 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                </div>

                {/* Manajemen Sesi Card */}
                <div className="bg-white border-[0.5px] border-gray-5 rounded-lg-bpk shadow-card p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-[#82181a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <h3 className="text-subtitle font-semibold text-[#82181a]">Manajemen Sesi</h3>
                  </div>

                  <p className="text-caption font-medium text-gray-1 text-justify mb-4 leading-[1.4]">
                    Anda sedang login di perangkat ini. Klik tombol di bawah untuk mengakhiri sesi.
                  </p>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-bg-red rounded-lg px-6 py-3 hover:bg-red-100 transition text-body-2 font-bold text-error flex items-center justify-center gap-2 h-[48px]"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Keluar dari Aplikasi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
