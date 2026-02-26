"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";

// Import widget components following Clean Architecture
import {
  DashboardRankings,
  SearchModuleUsage,
  ExportMonitoring,
  OperationalIntents,
} from "./_components";

/**
 * Content Analysis Page
 *
 * This page displays content analytics including:
 * - Dashboard usage rankings (Feature 1) - Filtered by dateRange only
 * - Search module + Export monitoring + Operational intents (Feature 2) - Filtered by dateRange AND cluster
 *
 * Feature Structure:
 * 1. DashboardRankings - Shows all clusters ranked by usage (dateRange filter only)
 * 2. SearchModuleUsage - Shows search activity (dateRange + cluster filter from global state)
 * 3. ExportMonitoring - Shows view/download/export stats (dateRange + cluster filter from global state)
 * 4. OperationalIntents - Shows feature access keywords (dateRange + cluster filter from global state)
 *
 * All filters are managed globally in Header component (by Rayhan)
 *
 * Architecture: Clean Architecture / MVC Pattern
 * - View: This page.tsx (Controller/Layout)
 * - Components: _components/* (View widgets with self-contained logic)
 * - Model: types/api.ts (Data types)
 * - Services: services/api.ts (Data access layer)
 * - State: stores/appStore.ts (Global state with dateRange and selectedCluster)
 */
export default function ContentAnalysisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
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
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen ml-80">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="pt-20 p-8 flex-1 overflow-x-hidden">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-2">
              Analisis Penggunaan Aplikasi & Konten
            </h1>
            <p className="text-gray-600">
              Analisis lengkap aktivitas pengguna, penggunaan fitur, dan
              interaksi konten
            </p>
          </div>

          {/* Widget Grid */}
          <div className="space-y-6">
            {/* FEATURE 1: Dashboard Rankings (dateRange filter only) */}
            <DashboardRankings />

            {/* FEATURE 2: Cluster-based Analysis (dateRange + cluster filter) */}

            {/* Search Module Usage (Vertical Bar Chart) */}
            <SearchModuleUsage />

            {/* Export Monitoring (View / Download / Export) */}
            <ExportMonitoring />

            {/* Operational Intents (Feature Access Keywords) */}
            <OperationalIntents limit={10} />
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
