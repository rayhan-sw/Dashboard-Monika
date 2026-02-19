"use client";

import { useEffect, useState, useImperativeHandle, forwardRef } from "react";
import {
  FileText,
  FileSpreadsheet,
  File,
  Download,
  CheckCircle,
  Clock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { reportService } from "@/services/api";
import AllDownloadsModal from "./AllDownloadsModal";

// Types
interface DownloadHistory {
  id: number;
  report_name: string;
  format: string;
  generated_at: string;
  downloaded_by: string;
  file_size?: string;
}

// Expose refresh method to parent
export interface DownloadHistoryRef {
  refresh: () => void;
}

interface DownloadHistoryListProps {
  limit?: number;
}

const DownloadHistoryList = forwardRef<DownloadHistoryRef, DownloadHistoryListProps>(
  ({ limit = 5 }, ref) => {
    const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAllModal, setShowAllModal] = useState(false);

    useEffect(() => {
      loadDownloads();
    }, [limit]);

    // Expose refresh method to parent
    useImperativeHandle(ref, () => ({
      refresh: loadDownloads,
    }));

    const loadDownloads = async () => {
      setLoading(true);
      try {
        const response = await reportService.getRecentDownloads(limit);
        setDownloads(response.data || []);
        setError(null);
      } catch (err) {
        console.error("Error loading downloads:", err);
        setError(err instanceof Error ? err.message : "Failed to load downloads");
      } finally {
        setLoading(false);
      }
    };

    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    // Loading state
    if (loading) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <div className="animate-pulse">
            <div className="flex justify-between mb-4">
              <div className="h-5 bg-slate-200 rounded w-40" />
              <div className="h-4 bg-slate-200 rounded w-24" />
            </div>
            <div className="h-4 bg-slate-200 rounded w-64 mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                  <div>
                    <div className="h-4 bg-slate-200 rounded w-48 mb-1" />
                    <div className="h-3 bg-slate-200 rounded w-32" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-slate-200 rounded-full" />
                  <div className="w-8 h-8 bg-slate-200 rounded-lg" />
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
      <>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-800">Riwayat Unduhan Laporan</h3>
            <button
              onClick={() => setShowAllModal(true)}
              className="text-sm text-orange-500 hover:text-orange-600 cursor-pointer font-medium flex items-center gap-1 transition-colors"
            >
              Lihat semua <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">
            Arsip laporan yang telah Anda buat sebelumnya
          </p>

          {/* Download List */}
          <div className="space-y-3">
            {downloads.length > 0 ? (
              downloads.slice(0, limit).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        item.format.toLowerCase() === "pdf"
                          ? "bg-red-100"
                          : item.format.toLowerCase() === "excel"
                            ? "bg-emerald-100"
                            : "bg-slate-100"
                      }`}
                    >
                      {item.format.toLowerCase() === "pdf" ? (
                        <File className="w-4 h-4 text-red-600" />
                      ) : item.format.toLowerCase() === "excel" ? (
                        <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">
                        {item.report_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(item.generated_at)} •{" "}
                        {item.downloaded_by || "Unknown User"}
                        {item.file_size && ` • ${item.file_size}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                      <Download className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p>Belum ada riwayat unduhan</p>
              </div>
            )}
          </div>
        </div>

        {/* All Downloads Modal */}
        <AllDownloadsModal
          isOpen={showAllModal}
          onClose={() => setShowAllModal(false)}
        />
      </>
    );
  }
);

DownloadHistoryList.displayName = "DownloadHistoryList";

export default DownloadHistoryList;
