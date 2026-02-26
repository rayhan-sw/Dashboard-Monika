/**
 * HourlyActivityChart.tsx
 *
 * Chart garis "Distribusi Aktivitas": tren aktivitas per jam (0–23). Data dari
 * getHourlyChart; filter dateRange dan selectedCluster dari store. Data diurut
 * menurut hour; sumbu X jam (format "n.00"), sumbu Y jumlah; tooltip "Jam n:00" + nilai.
 */

"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { dashboardService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { HourlyData } from "@/types/api";
import { Flame } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function HourlyActivityChart() {
  const dateRange = useAppStore((state) => state.dateRange);
  const selectedCluster = useAppStore((state) => state.selectedCluster);
  const [data, setData] = useState<{ hour: number; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedCluster]);
  /** Muat ulang data saat rentang tanggal atau cluster berubah. */

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getHourlyChart(
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );
      if (response.data && Array.isArray(response.data)) {
        const sorted = response.data.sort((a, b) => a.hour - b.hour);
        setData(sorted);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to load hourly data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };
  /** Ambil data per jam dari API; urutkan menurut hour (0→23). */

  const formatPeriod = () => {
    try {
      const start = new Date(dateRange.startDate);
      const end = new Date(dateRange.endDate);
      return `Tren per jam untuk periode ${format(start, "dd MMM yyyy", { locale: id })} hingga ${format(end, "dd MMM yyyy", { locale: id })}`;
    } catch {
      return "Tren per jam untuk periode yang dipilih";
    }
  };
  /** Teks subjudul: "Tren per jam untuk periode dd MMM yyyy hingga dd MMM yyyy". */

  if (loading) {
    return (
      <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg-bpk" />
    );
  }

  return (
    <div className="bg-white rounded-lg-bpk p-6 shadow-md border border-gray-5 h-[400px]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg-bpk bg-blue-500 flex items-center justify-center flex-shrink-0">
          <Flame className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-1">
            Distribusi Aktivitas
          </h3>
          <p className="text-sm text-gray-3 mt-1">{formatPeriod()}</p>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 5, left: -20, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="5 5"
            stroke="#E5E7EB"
            vertical={false}
          />
          <XAxis
            dataKey="hour"
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            tickFormatter={(hour) => `${hour}.00`}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#9CA3AF", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
            labelFormatter={(hour) => `Jam ${hour}:00`}
            formatter={(value: number) => [
              value.toLocaleString("id-ID"),
              "Aktivitas",
            ]}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#3B82F6"
            strokeWidth={2.5}
            dot={{ fill: "#3B82F6", r: 5, strokeWidth: 0 }}
            activeDot={{ r: 7, fill: "#3B82F6" }}
          />
          {/* Garis biru: dataKey count per jam */}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
