"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { dashboardService } from "@/services/api";

interface LogoutError {
  rank: number;
  username: string;
  error_count: number;
  latest_error: string;
}

export default function ErrorMonitoringTable() {
  const [errors, setErrors] = useState<LogoutError[]>([]);
  const [loading, setLoading] = useState(true);
  const { dateRange, selectedCluster } = useAppStore();

  useEffect(() => {
    const fetchLogoutErrors = async () => {
      setLoading(true);
      try {
        const startDate = dateRange?.startDate
          ? dateRange.startDate.split("T")[0]
          : undefined;
        const endDate = dateRange?.endDate
          ? dateRange.endDate.split("T")[0]
          : undefined;

        const response = await dashboardService.getLogoutErrors(
          10,
          startDate,
          endDate,
          selectedCluster,
        );

        setErrors(response.data || []);
      } catch (error) {
        console.error("Error fetching logout errors:", error);
        setErrors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLogoutErrors();
  }, [dateRange, selectedCluster]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="card-bpk p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-bpk p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg-bpk bg-red-500 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-1">
                Pemantauan Kesalahan Logout
              </h3>
              <p className="text-sm text-gray-3 mt-1">
                Mengetahui kesalahan logout dan masa aktif sesi
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-4 py-1.5 bg-red-50 border border-red-200 text-status-error rounded-full text-caption font-semibold">
                {errors.length} Flags
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-auto" style={{ maxHeight: "400px" }}>
        <div className="space-y-3">
          {errors.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>Tidak ada kesalahan logout terdeteksi</p>
            </div>
          ) : (
            errors.map((error) => (
              <div
                key={error.rank}
                className="flex items-center justify-between p-4 rounded-xl bg-red-50 border-l-4 border-red-500 hover:bg-red-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Ranking Badge */}
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-red-700">
                      {error.rank}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {error.username}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Kesalahan Logout • Terakhir:{" "}
                      {formatTime(error.latest_error)}
                    </p>
                  </div>
                </div>

                {/* Error Count Badge */}
                <div className="flex-shrink-0 ml-4">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500 text-white">
                    {error.error_count} kesalahan
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
