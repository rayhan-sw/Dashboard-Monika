"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle } from "lucide-react";
import { useAppStore } from "@/stores/appStore";
import { dashboardService } from "@/services/api";

interface ErrorActivity {
  id: string;
  nama: string;
  aktifitas: string;
  scope: string;
  tanggal: string;
  lokasi?: string;
  satker: string;
}

const getSeverityIcon = (scope: string) => {
  if (scope === "error") {
    return <AlertTriangle className="w-4 h-4 text-status-error" />;
  }
  return <AlertCircle className="w-4 h-4 text-status-warning" />;
};

const getSeverityLabel = (scope: string) => {
  if (scope === "error") return "TINGGI";
  return "Warning";
};

const getSeverityColor = (scope: string) => {
  if (scope === "error") return "bg-status-error text-white";
  return "bg-status-warning/10 text-status-warning border-status-warning";
};

export default function ErrorMonitoringTable() {
  const [errors, setErrors] = useState<ErrorActivity[]>([]);
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

        // Fetch activities
        const response = await dashboardService.getActivities(
          1,
          100,
          startDate,
          endDate,
          selectedCluster,
        );
        const data = response.data;

        // Filter for logout errors only (LOGOUT with scope='error')
        // For testing: also show LOGOUT with any scope if no errors found
        const logoutErrors = data
          .filter(
            (activity: any) => activity.aktifitas === "LOGOUT",
            // Temporarily show all LOGOUT to test if component works
            // && activity.scope === 'error'
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime(),
          )
          .slice(0, 5); // Show top 5 most recent

        console.log("All activities:", data.length);
        console.log("LOGOUT activities found:", logoutErrors.length);
        console.log("Sample LOGOUT data:", logoutErrors.slice(0, 2));

        setErrors(logoutErrors);
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

  const maskUsername = (username: string) => {
    if (!username || username.length <= 2) return username;
    return (
      username.charAt(0) +
      "*".repeat(Math.max(0, username.length - 2)) +
      username.charAt(username.length - 1)
    );
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
                key={error.id}
                className="flex items-center justify-between p-4 rounded-xl bg-red-50 border-l-4 border-red-500"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {maskUsername(error.nama)}
                    </p>
                    <span className="text-xs text-gray-500">
                      • {error.satker}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Kesalahan Logout • {formatTime(error.tanggal)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(error.scope)}`}
                  >
                    {getSeverityLabel(error.scope)}
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
