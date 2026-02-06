"use client";

import { useEffect, useState } from "react";
import StatCard from "@/components/ui/StatCard";
import { Users, LogIn, Activity, AlertCircle } from "lucide-react";
import { dashboardService } from "@/services/api";
import { formatNumber } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import type { DashboardStats as DashboardStatsType } from "@/types/api";

export default function DashboardStats() {
  const dateRange = useAppStore((state) => state.dateRange);
  const selectedCluster = useAppStore((state) => state.selectedCluster);
  const [stats, setStats] = useState<DashboardStatsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [dateRange, selectedCluster]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await dashboardService.getStats(
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );
      setStats(data);
      setError(null);
    } catch (err) {
      console.error("DashboardStats - Error:", err);
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-[120px] bg-gray-100 animate-pulse rounded-[13px]"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-[13px] p-4 text-red-600">
        <AlertCircle className="inline mr-2 h-5 w-5" />
        {error}
      </div>
    );
  }

  if (!stats) return null;

  // Check if all stats are zero - might indicate no data for selected filters
  const hasNoData = stats.total_activities === 0 && stats.total_users === 0;

  return (
    <div className="min-h-[120px]">
      {hasNoData && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-[13px] p-4 text-yellow-700 flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-caption">
            Tidak ada data untuk filter yang dipilih. Coba pilih periode tanggal
            yang lebih luas atau cluster lain.
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Pengguna"
          value={formatNumber(stats.total_users)}
          icon={<Users className="h-6 w-6" />}
          trend={{ value: 0, isPositive: true }}
          color="blue"
        />
        <StatCard
          title="Login Berhasil"
          value={formatNumber(stats.success_logins)}
          icon={<LogIn className="h-6 w-6" />}
          trend={{ value: 0, isPositive: true }}
          color="green"
        />
        <StatCard
          title="Total Aktivitas"
          value={formatNumber(stats.total_activities)}
          icon={<Activity className="h-6 w-6" />}
          trend={{ value: 0, isPositive: true }}
          color="amber"
        />
        <StatCard
          title="Kesalahan Logout"
          value={formatNumber(stats.logout_errors)}
          icon={<AlertCircle className="h-6 w-6" />}
          trend={{ value: 0, isPositive: false }}
          color="red"
        />
      </div>
    </div>
  );
}
