"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { useAppStore } from "@/stores/appStore";

// Import dashboard components using barrel exports
import {
  DashboardStats,
  ActivityTable,
  BusiestHourCard,
  ErrorMonitoringTable,
} from "./dashboard/_components";

// Lazy load heavy chart components to improve navigation performance
const InteractionChart = dynamic(
  () => import("@/components/charts/InteractionChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[450px] bg-gray-100 animate-pulse rounded-[13px]" />
    ),
  },
);
const HourlyActivityChart = dynamic(
  () => import("@/components/charts/HourlyActivityChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-gray-100 animate-pulse rounded-[13px]" />
    ),
  },
);
const AccessSuccessChart = dynamic(
  () => import("@/components/charts/AccessSuccessChart"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[400px] bg-gray-100 animate-pulse rounded-[13px]" />
    ),
  },
);

export default function Home() {
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />

      <div
        className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? "ml-20" : "ml-80"}`}
        style={{
          transition: "margin-left 300ms ease-out",
          willChange: "margin-left",
        }}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-20 p-8 flex-1">
          <div className="max-w-[1800px] mx-auto space-y-8">
            {/* Page Title - Fixed height to prevent CLS */}
            <div className="h-[72px]">
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
