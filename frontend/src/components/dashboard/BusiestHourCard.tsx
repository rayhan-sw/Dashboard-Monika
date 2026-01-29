"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { dashboardService } from "@/services/api";
import { formatNumber } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import type { DashboardStats } from "@/types/api";

export default function BusiestHourCard() {
  const { dateRange, selectedCluster } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[450px] bg-gray-100 animate-pulse rounded-[13px]" />
    );
  }

  if (!stats) return null;

  const { busiest_hour } = stats;
  const percentage = (
    (busiest_hour.count / stats.total_activities) *
    100
  ).toFixed(1);

  return (
    <div className="bg-gradient-to-br from-[#FEB800] to-[#E27200] text-white p-6 rounded-lg-bpk shadow-md h-[450px] flex flex-col">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg-bpk bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
          <Clock className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Jam Tersibuk</h3>
          <p className="text-sm text-white/80 mt-1">
            Periode Aktivitas Tertinggi
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <p className="text-caption opacity-90 mb-2">Waktu Paling Ramai</p>
        <h2 className="text-4xl font-bold mb-4">
          {String(busiest_hour.hour).padStart(2, "0")}:00 -{" "}
          {String(busiest_hour.hour + 1).padStart(2, "0")}:00
        </h2>
        <p className="text-body mb-1">
          {formatNumber(busiest_hour.count)} aktivitas
        </p>
        <p className="text-caption opacity-80">pada jam ini</p>
      </div>

      <div className="pt-4 border-t border-white/20">
        <p className="text-caption opacity-80 mb-1">Persentase dari Total</p>
        <p className="text-2xl font-bold">{percentage}%</p>
      </div>
    </div>
  );
}
