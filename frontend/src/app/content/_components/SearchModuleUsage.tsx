"use client";

import { useEffect, useState } from "react";
import { Search, AlertCircle } from "lucide-react";
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
        selectedCluster
      );
      setModules(response.data || []);
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
          <p className="text-sm text-slate-500">Menampilkan aktivitas pencarian berdasarkan kategori atau jenis pencarian.</p>
        </div>
      </div>

      {/* Module Vertical Bar Chart */}
      <div className="h-80">
        {modules.length > 0 ? (
          <div className="h-full flex items-end justify-around gap-4 px-4">
            {modules.map((item, index) => {
              const maxCount = Math.max(...modules.map(m => m.count));
              const heightPercentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
              
              return (
                <div key={`${item.name}-${index}`} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bar */}
                  <div className="relative w-full flex flex-col items-center justify-end" style={{ height: '85%' }}>
                    <div className="absolute -top-8 text-sm font-bold text-slate-700">
                      {item.count.toLocaleString()}
                    </div>
                    <div
                      className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 flex items-start justify-center pt-2 shadow-lg"
                      style={{ height: `${heightPercentage}%`, minHeight: '30px' }}
                    >
                      <span className="text-xs font-medium text-white">
                        {heightPercentage.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="text-xs font-medium text-slate-600 text-center line-clamp-2 h-10">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500">
            Tidak ada data pencarian untuk cluster ini
          </div>
        )}
      </div>
    </div>
  );
}
