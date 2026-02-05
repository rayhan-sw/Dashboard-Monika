"use client";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { useAppStore } from "@/stores/appStore";

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
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen ${sidebarCollapsed ? "ml-20" : "ml-80"}`}
        style={{
          transition: "margin-left 300ms ease-out",
          willChange: "margin-left",
        }}
      >
        {/* Header */}
        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Page Content */}
        <main className="pt-20 p-8 flex-1 overflow-x-hidden">
          {/* Page Title */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-orange-500">
              Analisis Penggunaan Aplikasi & Konten
            </h1>
            <p className="text-slate-500 mt-1">
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
