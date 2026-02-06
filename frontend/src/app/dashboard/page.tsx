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

export default function DashboardPage() {
  const router = useRouter();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Not logged in, redirect to login
      router.push('/auth/login');
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

      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarCollapsed ? "ml-20" : "ml-80"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-20 p-8 flex-1">
          <div className="max-w-[1800px] mx-auto space-y-8">
            {/* Page Title */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard Monitoring BIDICS BPK RI
              </h1>
              <p className="text-gray-600">
                Overview aktivitas pengguna dan monitoring sistem
              </p>
            </div>

            {/* Stats Cards - 4 cards in one row */}
            <DashboardStats />

            {/* Row 2: Riwayat Aktivitas, Mode Interaksi, Jam Tersibuk - 3 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <ActivityTable />
              <InteractionChart />
              <BusiestHourCard />
            </div>

            {/* Row 3: Tingkat Keberhasilan & Distribusi Aktivitas - 2 columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AccessSuccessChart />
              <HourlyActivityChart />
            </div>

            {/* Row 4: Pemantauan Kesalahan Logout - Full width */}
            <ErrorMonitoringTable />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
