"use client";

import { useEffect, useState } from "react";
import { Users, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { reportService } from "@/services/api";

// Types
interface AccessRequest {
  id: number;
  user_name: string;
  report_type: string;
  requested_at: string;
  status: string;
  unit?: string;
}

export default function AccessRequestList() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await reportService.getAccessRequests();
      setRequests(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading access requests:", err);
      setError(err instanceof Error ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: "approved" | "rejected") => {
    try {
      await reportService.updateAccessRequest(id, status);
      loadRequests(); // Refresh the list
    } catch (err) {
      console.error("Error updating access request:", err);
      alert("Gagal memperbarui permintaan akses.");
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendingCount = requests.filter((r) => r.status === "pending").length;

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="animate-pulse">
          <div className="flex justify-between mb-4">
            <div className="h-5 bg-slate-200 rounded w-48" />
            <div className="h-4 bg-slate-200 rounded w-20" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-40 mb-4" />
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-3 border-b border-slate-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full" />
                <div>
                  <div className="h-4 bg-slate-200 rounded w-32 mb-1" />
                  <div className="h-3 bg-slate-200 rounded w-48" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
                <div className="w-8 h-8 bg-slate-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-800">Permintaan Akses Laporan</h3>
        {pendingCount > 0 && (
          <span className="text-sm text-orange-500">{pendingCount} Menunggu</span>
        )}
      </div>
      <p className="text-sm text-slate-500 mb-4">Persetujuan akses untuk pengguna</p>

      {/* Request List */}
      <div className="space-y-3">
        {requests.length > 0 ? (
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                  {request.user_name
                    ? request.user_name.charAt(0).toUpperCase()
                    : "?"}
                </div>
                <div>
                  <p className="font-medium text-slate-800">
                    {request.user_name || "Unknown User"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {request.unit || "BPK Perwakilan"} •{" "}
                    {formatDate(request.requested_at)}
                  </p>
                </div>
              </div>
              {request.status === "pending" ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateStatus(request.id, "approved")}
                    className="p-2 hover:bg-emerald-100 rounded-full transition-colors"
                    title="Setujui"
                  >
                    <CheckCircle className="w-6 h-6 text-emerald-500" />
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(request.id, "rejected")}
                    className="p-2 hover:bg-red-100 rounded-full transition-colors"
                    title="Tolak"
                  >
                    <XCircle className="w-6 h-6 text-red-500" />
                  </button>
                </div>
              ) : (
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    request.status === "approved"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {request.status === "approved" ? "Disetujui" : "Ditolak"}
                </span>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-500">
            <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Tidak ada permintaan akses</p>
          </div>
        )}
      </div>
    </div>
  );
}
