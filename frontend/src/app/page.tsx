'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import DashboardStats from '@/components/dashboard/DashboardStats';
import InteractionChart from '@/components/charts/InteractionChart';
import HourlyActivityChart from '@/components/charts/HourlyActivityChart';
import ActivityTable from '@/components/tables/ActivityTable';
import ErrorMonitoringTable from '@/components/tables/ErrorMonitoringTable';
import { Loader2 } from 'lucide-react';

interface DashboardData {
  stats: {
    totalUsers: number;
    successLogins: number;
    totalActivity: number;
    logoutErrors: number;
  };
  activities: any[];
  interactionData: Record<string, number>;
  hourlyData: Array<{ hour: number; count: number }>;
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

        // Fetch all data in parallel
        const [statsRes, activitiesRes, interactionRes, hourlyRes] = await Promise.all([
          fetch(`${baseURL}/api/dashboard/stats`),
          fetch(`${baseURL}/api/dashboard/activities`),
          fetch(`${baseURL}/api/dashboard/charts/interaction`),
          fetch(`${baseURL}/api/dashboard/charts/hourly`),
        ]);

        const stats = await statsRes.json();
        const activities = await activitiesRes.json();
        const interaction = await interactionRes.json();
        const hourly = await hourlyRes.json();

        setData({
          stats,
          activities: activities.data || [],
          interactionData: interaction.data || {},
          hourlyData: hourly.data || [],
        });
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Gagal memuat data dashboard. Pastikan backend sudah berjalan.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-6">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-bpk-orange animate-spin mx-auto mb-4" />
          <p className="text-h5 text-gray-2">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-6">
        <div className="card-bpk p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-status-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⚠️</span>
          </div>
          <h2 className="text-h4 font-bold text-gray-1 mb-2">Error</h2>
          <p className="text-body text-gray-3">{error}</p>
        </div>
      </div>
    );
  }

  const errorActivities = data.activities.filter(
    (activity: any) => activity.status === 'FAILED'
  );

  return (
    <div className="flex min-h-screen bg-gray-6">
      <Sidebar />
      
      <div className="flex-1 ml-80">
        <Header />
        
        <main className="pt-20 p-8">
          <div className="max-w-[1800px] mx-auto space-y-8">
            {/* Page Title */}
            <div>
              <h1 className="text-h3 font-bold text-gray-1 mb-2">
                Dashboard Monitoring BIDICS BPK RI
              </h1>
              <p className="text-body text-gray-3">
                Overview aktivitas pengguna dan monitoring sistem
              </p>
            </div>

            {/* Stats Cards */}
            <DashboardStats stats={data.stats} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InteractionChart data={data.interactionData} />
              <HourlyActivityChart data={data.hourlyData} />
            </div>

            {/* Tables Row */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ActivityTable activities={data.activities.slice(0, 20)} />
              <ErrorMonitoringTable errors={errorActivities.slice(0, 20)} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
