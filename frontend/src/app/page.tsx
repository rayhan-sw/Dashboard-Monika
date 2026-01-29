"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import DashboardStats from "@/components/dashboard/DashboardStats";
import InteractionChart from "@/components/charts/InteractionChart";
import HourlyActivityChart from "@/components/charts/HourlyActivityChart";
import AccessSuccessChart from "@/components/charts/AccessSuccessChart";
import ActivityTable from "@/components/tables/ActivityTable";
import BusiestHourCard from "@/components/dashboard/BusiestHourCard";
import ErrorMonitoringTable from "@/components/tables/ErrorMonitoringTable";

export default function Home() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCollapsedChange={setSidebarCollapsed} />

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-80"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-20 p-8">
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
      </div>
    </div>
  );
}
