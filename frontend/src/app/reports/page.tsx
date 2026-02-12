"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { useAppStore } from "@/stores/appStore";
import { userService } from "@/services/api";

// Import widget components following Clean Architecture
import {
  ReportTemplateCards,
  DownloadHistoryList,
  AccessRequestList,
  AccessLockedView,
  type DownloadHistoryRef,
} from "./_components";

interface UserData {
  id: number;
  username: string;
  role: string;
  full_name: string;
  report_access_status: string;
}

/**
 * Reports Page
 *
 * This page displays report generation and management:
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
  const router = useRouter();
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const downloadHistoryRef = useRef<DownloadHistoryRef>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);

  // Auth check and load user data
  useEffect(() => {
    const loadUserData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Get user from localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          // Fetch fresh user data from API to get current report_access_status
          if (user.id) {
            try {
              const response = await userService.getProfile(user.id);
              setUserData(response.data as UserData);
            } catch (error) {
              // Fallback to localStorage data if API fails
              setUserData({
                ...user,
                report_access_status: user.report_access_status || 'none'
              });
            }
          } else {
            setUserData({
              ...user,
              report_access_status: user.report_access_status || 'none'
            });
          }
        } catch (e) {
          console.error('Failed to parse user data:', e);
        }
      }
      setLoading(false);
    };

    loadUserData();
  }, [router]);

  // Callback when request is sent to refresh user data
  const handleRequestSent = async () => {
    if (userData?.id) {
      try {
        const response = await userService.getProfile(userData.id);
        setUserData(response.data as UserData);
      } catch (error) {
        // Update local state to pending
        setUserData(prev => prev ? { ...prev, report_access_status: 'pending' } : null);
      }
    }
  };

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

  // Callback when report is generated to refresh download history
  const handleReportGenerated = () => {
    downloadHistoryRef.current?.refresh();
  };

  // Determine if user has access
  const isAdmin = userData?.role === 'admin';
  const hasAccess = isAdmin || userData?.report_access_status === 'approved';
  const accessStatus = userData?.report_access_status || 'none';

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
        <main className="pt-24 p-8 flex-1">
          {/* Widget Grid */}
          <div className="space-y-6">
            {hasAccess ? (
              <>
                {/* Report Templates */}
                <ReportTemplateCards onReportGenerated={handleReportGenerated} />

                {/* Download History */}
                <DownloadHistoryList ref={downloadHistoryRef} limit={5} />

                {/* Access Requests - Admin Only */}
                {isAdmin && <AccessRequestList />}
              </>
            ) : (
              /* Access Locked View for users without access */
              <AccessLockedView 
                userId={userData?.id || 0} 
                accessStatus={accessStatus}
                onRequestSent={handleRequestSent}
              />
            )}
          </div>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
