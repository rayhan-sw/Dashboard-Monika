"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import type { ActivityLog } from "@/types/api";
import { Radio, Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";

export default function ActivityTable() {
  const dateRange = useAppStore((state) => state.dateRange);
  const selectedCluster = useAppStore((state) => state.selectedCluster);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [expandedActivities, setExpandedActivities] = useState<ActivityLog[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingExpanded, setLoadingExpanded] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [tableZoom, setTableZoom] = useState(100);

  useEffect(() => {
    loadActivities();
  }, [dateRange, selectedCluster]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getActivities(
        1,
        5,
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );
      setActivities(response.data);
    } catch (error) {
      console.error("Failed to load activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExpandedActivities = async () => {
    setLoadingExpanded(true);
    try {
      const response = await dashboardService.getActivities(
        1,
        15,
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );
      setExpandedActivities(response.data);
    } catch (error) {
      console.error("Failed to load expanded activities:", error);
    } finally {
      setLoadingExpanded(false);
    }
  };

  const getActivityBadge = (activity: string) => {
    const colors: Record<string, string> = {
      LOGIN: "bg-green-100 text-green-700",
      LOGOUT: "bg-blue-100 text-blue-700",
      VIEW: "bg-gray-100 text-gray-700",
      EDIT: "bg-amber-100 text-amber-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return colors[activity] || "bg-gray-100 text-gray-700";
  };

  if (loading) {
    return (
      <div className="h-[450px] bg-gray-100 animate-pulse rounded-[13px]" />
    );
  }

  return (
    <div className="bg-white rounded-lg-bpk p-6 shadow-md border border-gray-5 h-[450px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg-bpk bg-red-500 flex items-center justify-center flex-shrink-0">
            <Radio className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-1">Riwayat Aktivitas</h3>
            <p className="text-sm text-gray-3 mt-1">
              Aktivitas Pengguna Terbaru
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsExpanded(true);
              setExpandedActivities(null);
              loadExpandedActivities();
            }}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
            title="Lihat detail"
          >
            <Maximize2 className="h-4 w-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Pengguna
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Satker
              </th>
              <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Aktivitas
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {activities?.map((activity) => (
              <tr
                key={activity.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="py-2 px-3 text-xs text-gray-900">
                  {activity.nama}
                </td>
                <td className="py-2 px-3 text-xs text-gray-600">
                  {activity.satker || "-"}
                </td>
                <td className="py-2 px-3">
                  <span
                    className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded ${getActivityBadge(activity.aktifitas)}`}
                  >
                    {activity.aktifitas}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur z-[250] flex items-center justify-center p-6">
          <div className="bg-white rounded-[13px] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg-bpk bg-red-500 flex items-center justify-center">
                  <Radio className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-h4 font-bold text-gray-1">
                    Riwayat Aktivitas
                  </h3>
                  <span className="text-caption text-gray-3">
                    Aktivitas Pengguna Terbaru
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 mr-1">Zoom:</span>
                <button
                  type="button"
                  onClick={() => setTableZoom((z) => Math.max(80, z - 10))}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  title="Perkecil"
                >
                  <ZoomOut className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-xs font-medium text-gray-700 min-w-[2.5rem]">{tableZoom}%</span>
                <button
                  type="button"
                  onClick={() => setTableZoom((z) => Math.min(140, z + 10))}
                  className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                  title="Perbesar"
                >
                  <ZoomIn className="h-4 w-4 text-gray-600" />
                </button>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors ml-2"
                  title="Tutup"
                >
                  <X className="h-5 w-5 text-gray-600" />
                </button>
              </div>
            </div>
            <div className="flex-1 min-h-0 flex flex-col p-6">
              {loadingExpanded ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-red-500" />
                  <span className="ml-3 text-sm text-gray-500">Memuat riwayat aktivitas...</span>
                </div>
              ) : (
              <div className="overflow-auto flex-1 min-h-0 -m-6 px-6">
              <div style={{ fontSize: `${tableZoom}%` }}>
              <table className="w-full min-w-[600px]">
                <thead className="sticky top-0 z-10 bg-white shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Pengguna
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Satker
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Aktivitas
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Cluster
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                      Waktu
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(expandedActivities ?? activities)?.map((activity) => (
                    <tr
                      key={activity.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {activity.nama}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {activity.satker || "-"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActivityBadge(activity.aktifitas)}`}
                        >
                          {activity.aktifitas}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {activity.cluster}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {formatDateTime(activity.tanggal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
              </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
