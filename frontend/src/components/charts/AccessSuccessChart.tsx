/**
 * AccessSuccessChart.tsx
 *
 * Chart batang "Analisis Tingkat Keberhasilan Akses": perbandingan akses berhasil (hijau)
 * vs gagal (merah) per tanggal. Data dari getAccessSuccess; filter dateRange dan
 * selectedCluster dari store. Tombol expand membuka modal fullscreen dengan chart sama.
 */

"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { dashboardService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { AccessSuccessData } from "@/types/api";
import { CheckCircle, Maximize2, X } from "lucide-react";
import { format } from "date-fns";

export default function AccessSuccessChart() {
  const dateRange = useAppStore((state) => state.dateRange);
  const selectedCluster = useAppStore((state) => state.selectedCluster);
  const [data, setData] = useState<AccessSuccessData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedCluster]);
  /** Muat ulang data saat rentang tanggal atau cluster berubah. */

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getAccessSuccess(
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );

      if (response.data && Array.isArray(response.data)) {
        setData(response.data);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to load access success data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  /** Ambil data keberhasilan/gagal akses dari API; format: { date, success, failed }. */

  if (loading) {
    return (
      <div className="h-[400px] bg-gray-100 animate-pulse rounded-[13px]" />
    );
  }

  return (
    <div className="bg-white rounded-lg-bpk p-6 shadow-md border border-gray-5 h-[400px]">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg-bpk bg-bpk-orange flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-1">
              Analisis Tingkat Keberhasilan Akses
            </h3>
            <p className="text-sm text-gray-3 mt-1">
              Perbandingan akses berhasil vs gagal
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
          title="Lihat detail"
        >
          <Maximize2 className="h-4 w-4 text-gray-600" />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="date"
            tick={{ fill: "#6B7280", fontSize: 12 }}
            tickFormatter={(date) => format(new Date(date), "dd MMM")}
          />
          <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
            }}
            labelFormatter={(date) => format(new Date(date), "dd MMMM yyyy")}
            formatter={(value: number, name: string) => {
              const label = name === "success" ? "Berhasil" : "Gagal";
              return [value.toLocaleString("id-ID"), label];
            }}
          />
          <Legend
            formatter={(value) => (value === "success" ? "Berhasil" : "Gagal")}
            wrapperStyle={{ paddingTop: "20px" }}
          />
          <Bar dataKey="success" fill="#10B981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
          {/* Bar hijau = berhasil, bar merah = gagal */}
        </BarChart>
      </ResponsiveContainer>

      {isExpanded && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur z-[250] flex items-center justify-center p-6">
          {/* Modal fullscreen: chart sama, tombol X untuk tutup */}
          <div className="bg-white rounded-[13px] w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg-bpk bg-bpk-orange flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-h4 font-bold text-gray-1">
                    Analisis Tingkat Keberhasilan Akses
                  </h3>
                  <span className="text-caption text-gray-3">
                    Perbandingan akses berhasil vs gagal
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
            <div className="flex-1 flex items-center justify-center p-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#6B7280", fontSize: 14 }}
                    tickFormatter={(date) => format(new Date(date), "dd MMM")}
                  />
                  <YAxis tick={{ fill: "#6B7280", fontSize: 14 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) =>
                      format(new Date(date), "dd MMMM yyyy")
                    }
                    formatter={(value: number, name: string) => {
                      const label = name === "success" ? "Berhasil" : "Gagal";
                      return [value.toLocaleString("id-ID"), label];
                    }}
                  />
                  <Legend
                    formatter={(value) =>
                      value === "success" ? "Berhasil" : "Gagal"
                    }
                    wrapperStyle={{ paddingTop: "20px", fontSize: "14px" }}
                  />
                  <Bar dataKey="success" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
