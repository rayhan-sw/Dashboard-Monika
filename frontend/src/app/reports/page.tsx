"use client";

import { useState, useRef } from "react";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { useAppStore } from "@/stores/appStore";

// Import widget components following Clean Architecture
import {
  ReportHeaderBanner,
  ReportTemplateCards,
  DownloadHistoryList,
  AccessRequestList,
  type DownloadHistoryRef,
} from "./_components";

/**
 * Reports Page
 * 
 * This page displays report generation and management:
 * - BPK header banner
 * - Report template cards for generating reports
 * - Download history list
 * - Access request management (Admin only)
 * 
 * Architecture: Clean Architecture / MVC Pattern
 * - View: This page.tsx (Controller/Layout)
 * - Components: _components/* (View widgets with self-contained logic)
 * - Model: types/api.ts (Data types)
 * - Services: services/api.ts (Data access layer)
 */
export default function ReportsPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const downloadHistoryRef = useRef<DownloadHistoryRef>(null);

  // Get user from store (default to admin role for demo)
  const user = useAppStore((state) => state.user);
  const userRole = user?.role || "admin";

  // Callback when report is generated to refresh download history
  const handleReportGenerated = () => {
    downloadHistoryRef.current?.refresh();
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar Navigation */}
      <Sidebar onCollapsedChange={setSidebarCollapsed} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarCollapsed ? "ml-20" : "ml-80"
        }`}
      >
        {/* Header */}
        <Header sidebarCollapsed={sidebarCollapsed} />

        {/* Page Content */}
        <main className="pt-20 p-8 flex-1">
          {/* BPK Header Banner */}
          <ReportHeaderBanner />

          {/* Widget Grid */}
          <div className="space-y-6">
            {/* Report Templates */}
            <ReportTemplateCards onReportGenerated={handleReportGenerated} />

            {/* Download History */}
            <DownloadHistoryList ref={downloadHistoryRef} limit={5} />

            {/* Access Requests - Admin Only */}
            {userRole === "admin" && <AccessRequestList />}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}