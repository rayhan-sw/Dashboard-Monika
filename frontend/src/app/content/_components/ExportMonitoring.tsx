"use client";

import { useEffect, useState } from "react";
import { FileDown, AlertCircle, Eye } from "lucide-react";
import { contentService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";

// Types
interface ExportData {
  view_data: number;
  download_data: number;
  export_data: number;
}

export default function ExportMonitoring() {
  const { dateRange, selectedCluster } = useAppStore();
  const [stats, setStats] = useState<ExportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, [dateRange, selectedCluster]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await contentService.getExportStats(
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster
      );
      setStats(response.data || null);
      setError(null);
    } catch (err) {
      console.error("Error loading export stats:", err);
      setError(err instanceof Error ? err.message : "Failed to load stats");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-48 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-32" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6">
                <div className="w-12 h-12 bg-slate-200 rounded-lg mx-auto mb-3" />
                <div className="h-8 bg-slate-200 rounded w-16 mx-auto mb-2" />
                <div className="h-4 bg-slate-200 rounded w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
          <FileDown className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Pemantauan Ekspor Data
          </h3>
          <p className="text-sm text-slate-500">Pelacakan file</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* View Data */}
        <div className="bg-slate-50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <Eye className="w-6 h-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-slate-800">
            {stats?.view_data || 0}
          </p>
          <p className="text-sm text-slate-500 mt-1">View Data</p>
        </div>

        {/* Download Data */}
        <div className="bg-orange-50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileDown className="w-6 h-6 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-orange-600">
            {stats?.download_data || 0}
          </p>
          <p className="text-sm text-slate-500 mt-1">Download Data</p>
        </div>

        {/* Export Data */}
        <div className="bg-emerald-50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-3">
            <FileDown className="w-6 h-6 text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {stats?.export_data || 0}
          </p>
          <p className="text-sm text-slate-500 mt-1">Export Data</p>
        </div>
      </div>
    </div>
  );
}
