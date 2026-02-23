"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  FileText,
  FileSpreadsheet,
  File,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Filter,
} from "lucide-react";
import { reportService } from "@/services/api";

interface DownloadHistory {
  id: number;
  report_name: string;
  format: string;
  generated_at: string;
  downloaded_by: string;
  file_size?: string;
}

interface AllDownloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AllDownloadsModal({ isOpen, onClose }: AllDownloadsModalProps) {
  const [downloads, setDownloads] = useState<DownloadHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadDownloads();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const loadDownloads = async (start?: string, end?: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportService.getRecentDownloads(100, start, end);
      setDownloads(response.data || []);
    } catch (err) {
      console.error("Error loading downloads:", err);
      setError(err instanceof Error ? err.message : "Gagal memuat riwayat unduhan");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = () => {
    if (startDate && endDate) {
      if (new Date(startDate) > new Date(endDate)) {
        setError("Tanggal mulai tidak boleh lebih besar dari tanggal akhir");
        return;
      }
    }
    loadDownloads(startDate, endDate);
    setShowFilter(false);
  };

  const handleResetFilter = () => {
    setStartDate("");
    setEndDate("");
    loadDownloads();
    setShowFilter(false);
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

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return <File className="w-5 h-5 text-red-600" />;
      case "excel":
      case "xlsx":
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-600" />;
    }
  };

  const getFormatBgColor = (format: string) => {
    switch (format.toLowerCase()) {
      case "pdf":
        return "bg-red-100";
      case "excel":
      case "xlsx":
        return "bg-emerald-100";
      default:
        return "bg-gray-100";
    }
  };

  if (!isOpen) return null;

  // Ensure we're in browser environment
  if (typeof window === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur z-[250] flex items-center justify-center p-6">
      <div className="bg-white rounded-[13px] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg-bpk bg-bpk-orange flex items-center justify-center">
              <Download className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-h4 font-bold text-gray-1">
                Semua Riwayat Unduhan
              </h3>
              <span className="text-caption text-gray-3">
                {downloads.length} unduhan ditemukan
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filter Tanggal</span>
            </button>
            {(startDate || endDate) && (
              <button
                onClick={handleResetFilter}
                className="text-sm text-bpk-orange hover:text-orange-600 font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Filter Form */}
          {showFilter && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bpk-orange"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-bpk-orange"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleApplyFilter}
                  className="px-4 py-2 bg-bpk-orange text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                >
                  Terapkan Filter
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center gap-4 py-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                  <div className="w-16 h-6 bg-gray-200 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          ) : downloads.length > 0 ? (
            <div className="space-y-2">
              {downloads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${getFormatBgColor(item.format)}`}>
                    {getFormatIcon(item.format)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm truncate">
                      {item.report_name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(item.generated_at)} •{" "}
                      {item.downloaded_by || "Unknown User"}
                      {item.file_size && ` • ${item.file_size}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-semibold rounded">
                      {item.format.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="font-semibold text-gray-700 text-lg">Tidak ada riwayat unduhan</p>
              <p className="text-sm mt-2">
                {startDate || endDate
                  ? "Tidak ada data pada periode yang dipilih"
                  : "Belum ada laporan yang diunduh"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
