"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/services/api";
import { formatDateTime } from "@/lib/utils";
import { useAppStore } from "@/stores/appStore";
import type { ActivityLog } from "@/types/api";
import { Radio, Maximize2, X } from "lucide-react";

export default function ActivityTable() {
  const { dateRange, selectedCluster } = useAppStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadActivities();
  }, [dateRange, selectedCluster]);

  const loadActivities = async () => {
    setLoading(true);
    try {
      // Hanya ambil 5 log terakhir yang terbaru
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
            onClick={() => setIsExpanded(true)}
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
        <div className="fixed inset-0 bg-black/50 z-[150] flex items-center justify-center p-6">
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
              <button
                onClick={() => setIsExpanded(false)}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <table className="w-full">
                <thead className="sticky top-0 bg-white">
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
                  {activities?.map((activity) => (
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
        </div>
      )}
    </div>
  );
}
