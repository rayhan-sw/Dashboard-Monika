"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertCircle } from "lucide-react";
import { contentService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";

// Types
interface EconomicsData {
  category: string;
  count: number;
}

// Bar colors for chart
const BAR_COLORS = [
  "bg-blue-500",
  "bg-emerald-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
];

export default function GlobalEconomicsChart() {
  const { dateRange } = useAppStore();
  const [data, setData] = useState<EconomicsData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await contentService.getGlobalEconomicsChart(
        dateRange.startDate,
        dateRange.endDate
      );
      setData(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading economics data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
        <div className="animate-pulse">
          <div className="h-5 bg-slate-200 rounded w-40 mb-6" />
          <div className="flex items-end justify-around h-48 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <div
                  className="w-12 bg-slate-200 rounded-t"
                  style={{ height: `${Math.random() * 100 + 50}px` }}
                />
                <div className="h-3 bg-slate-200 rounded w-12" />
              </div>
            ))}
          </div>
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

  const maxCount = Math.max(...data.map((e) => e.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 h-full">
      {/* Header */}
      <h3 className="text-lg font-semibold text-slate-800 mb-4">GLOBAL ECONOMICS</h3>

      {/* Bar Chart */}
      {data.length > 0 ? (
        <div className="flex items-end justify-around h-48 border-b border-l border-slate-200 relative pl-8">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-400">
            <span>{maxCount}</span>
            <span>{Math.round(maxCount * 0.75)}</span>
            <span>{Math.round(maxCount * 0.5)}</span>
            <span>{Math.round(maxCount * 0.25)}</span>
            <span>0</span>
          </div>

          {/* Bars */}
          {data.map((item, index) => {
            const height = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div
                  className={`w-12 ${BAR_COLORS[index % BAR_COLORS.length]} rounded-t transition-all duration-500`}
                  style={{ height: `${height}%`, minHeight: "4px" }}
                  title={`${item.category}: ${item.count}`}
                />
                <span
                  className="text-xs text-slate-500 text-center w-16 truncate"
                  title={item.category}
                >
                  {item.category}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <div className="text-center">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Tidak ada data</p>
          </div>
        </div>
      )}
    </div>
  );
}
