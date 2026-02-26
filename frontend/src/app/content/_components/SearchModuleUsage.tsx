"use client";

import { useEffect, useState } from "react";
import { Search, AlertCircle } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { contentService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";

// Types
interface ModuleData {
  name: string;
  count: number;
}

export default function SearchModuleUsage() {
  const { dateRange, selectedCluster } = useAppStore();
  const [modules, setModules] = useState<ModuleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadModules();
  }, [dateRange, selectedCluster]);

  const loadModules = async () => {
    setLoading(true);
    try {
      const response = await contentService.getSearchModuleUsage(
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );
      // Map API response to expected format
      const mappedModules: ModuleData[] = (response.data || []).map(
        (item: { name: string; count: number }) => ({
          name: item.name,
          count: item.count,
        }),
      );
      setModules(mappedModules);
      setError(null);
    } catch (err) {
      console.error("Error loading modules:", err);
      setError(err instanceof Error ? err.message : "Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-40 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-48" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex justify-between py-2">
              <div className="h-4 bg-slate-200 rounded w-32" />
              <div className="h-4 bg-slate-200 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Search className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Penggunaan Modul Pencarian
          </h3>
          <p className="text-sm text-slate-500">
            Menampilkan aktivitas pencarian berdasarkan kategori atau jenis
            pencarian.
          </p>
        </div>
      </div>

      {/* Module Vertical Bar Chart */}
      <div className="h-80">
        {modules.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={modules}
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fill: "#64748B", fontSize: 11 }}
              />
              <YAxis
                tick={{ fill: "#64748B", fontSize: 11 }}
                label={{
                  value: "Jumlah Pencarian",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: "#64748B", fontSize: 12 },
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #E5E7EB",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
                labelStyle={{ color: "#1E293B", fontWeight: 600 }}
                formatter={(value: number) => [
                  value.toLocaleString(),
                  "Jumlah",
                ]}
              />
              <Bar
                dataKey="count"
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
                maxBarSize={80}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Tidak ada data pencarian untuk cluster ini
          </div>
        )}
      </div>
    </div>
  );
}
