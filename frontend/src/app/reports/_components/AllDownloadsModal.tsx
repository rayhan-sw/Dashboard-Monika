"use client";

import { useState, useEffect } from "react";
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
import { useAppStore } from "@/stores/appStore";

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
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);

  useEffect(() => {
    if (isOpen) {
      loadDownloads();
    }
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
        return <File className="w-4 h-4 text-red-600" />;
      case "excel":
      case "xlsx":
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
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
        return "bg-slate-100";
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 transition-all duration-300"
      style={{
        marginLeft: sidebarCollapsed ? '5rem' : '20rem',
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col overflow-hidden my-4" style={{ maxHeight: '75vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Semua Riwayat Unduhan
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {downloads.length} unduhan ditemukan
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-slate-600" />
              <span className="text-sm font-medium text-slate-700">Filter Tanggal</span>
            </button>
            {(startDate || endDate) && (
              <button
                onClick={handleResetFilter}
                className="text-sm text-orange-500 hover:text-orange-600 font-medium"
              >
                Reset Filter
              </button>
            )}
          </div>

          {/* Filter Form */}
          {showFilter && (
            <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Tanggal Mulai
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Tanggal Akhir
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleApplyFilter}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium text-sm"
                >
                  Terapkan Filter
                </button>
                <button
                  onClick={() => setShowFilter(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg" />
                    <div>
                      <div className="h-4 bg-slate-200 rounded w-48 mb-2" />
                      <div className="h-3 bg-slate-200 rounded w-32" />
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : downloads.length > 0 ? (
            <div className="space-y-2">
              {downloads.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-slate-50 transition-colors border border-slate-100"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getFormatBgColor(item.format)}`}>
                      {getFormatIcon(item.format)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate">
                        {item.report_name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(item.generated_at)} •{" "}
                        {item.downloaded_by || "Unknown User"}
                        {item.file_size && ` • ${item.file_size}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                      {item.format.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">Tidak ada riwayat unduhan</p>
              <p className="text-sm mt-1">
                {startDate || endDate
                  ? "Tidak ada data pada periode yang dipilih"
                  : "Belum ada laporan yang diunduh"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
