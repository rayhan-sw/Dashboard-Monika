/**
 * Halaman Dashboard (Route: /dashboard)
 *
 * Layout: Sidebar kiri, Header atas, konten utama berisi judul dan widget-widget dashboard.
 * Setiap widget fetch data sendiri (filter dateRange & selectedCluster dari useAppStore).
 *
 * Urutan widget: (1) Judul halaman, (2) DashboardStats (4 kartu statistik), (3) Baris 3 kolom:
 * ActivityTable, InteractionChart, BusiestHourCard, (4) Baris 2 kolom: AccessSuccessChart,
 * HourlyActivityChart, (5) ErrorMonitoringTable full width.
 *
 * Auth: jika tidak ada token di localStorage, redirect ke /auth/login; saat cek tampilkan loading.
 */

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardStats from "./_components/DashboardStats";
import InteractionChart from "@/components/charts/InteractionChart";
import HourlyActivityChart from "@/components/charts/HourlyActivityChart";
import AccessSuccessChart from "@/components/charts/AccessSuccessChart";
import ActivityTable from "./_components/ActivityTable";
import BusiestHourCard from "./_components/BusiestHourCard";
import ErrorMonitoringTable from "./_components/ErrorMonitoringTable";
import Footer from "@/components/layout/Footer";
import { useAppStore } from "@/stores/appStore";

/**
 * Halaman dashboard: cek token → tampilkan layout Sidebar + Header + main (judul + widget).
 */
export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/auth/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-80">
        <Header />
        <main className="pt-20 p-8 flex-1">
          <div className="max-w-[1800px] mx-auto space-y-8">
            {/* Judul halaman */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Monitoring BIDICS BPK RI
              </h1>
              <p className="text-gray-600">
                Overview aktivitas pengguna dan monitoring sistem
              </p>
            </div>

            {/* Baris 1: 4 kartu statistik (total user, login sukses, aktivitas, error logout) */}
            <DashboardStats />

            {/* Baris 2: Riwayat Aktivitas, Mode Interaksi, Jam Tersibuk — 3 kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActivityTable />
              <InteractionChart />
              <BusiestHourCard />
            </div>

            {/* Baris 3: Tingkat Keberhasilan Akses & Distribusi Aktivitas per Jam — 2 kolom */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AccessSuccessChart />
              <HourlyActivityChart />
            </div>

            {/* Baris 4: Pemantauan Kesalahan Logout — full width */}
            <ErrorMonitoringTable />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
