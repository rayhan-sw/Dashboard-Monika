"use client";

import { useEffect, useState } from "react";
import { Target, AlertCircle } from "lucide-react";
import { contentService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";

// Types
interface IntentData {
  name: string;
  count: number;
}

// Tag colors for intents
const TAG_COLORS = [
  "bg-blue-100 text-blue-700 border-blue-300",
  "bg-emerald-100 text-emerald-700 border-emerald-300",
  "bg-orange-100 text-orange-700 border-orange-300",
  "bg-purple-100 text-purple-700 border-purple-300",
  "bg-pink-100 text-pink-700 border-pink-300",
  "bg-cyan-100 text-cyan-700 border-cyan-300",
  "bg-yellow-100 text-yellow-700 border-yellow-300",
  "bg-red-100 text-red-700 border-red-300",
  "bg-indigo-100 text-indigo-700 border-indigo-300",
  "bg-teal-100 text-teal-700 border-teal-300",
];

interface OperationalIntentsProps {
  limit?: number;
}

export default function OperationalIntents({ limit = 10 }: OperationalIntentsProps) {
  const { dateRange, selectedCluster } = useAppStore();
  const [intents, setIntents] = useState<IntentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadIntents();
  }, [dateRange, limit, selectedCluster]);

  const loadIntents = async () => {
    setLoading(true);
    try {
      const response = await contentService.getOperationalIntents(
        dateRange.startDate,
        dateRange.endDate,
        limit,
        selectedCluster
      );
      setIntents(response.data || []);
      setError(null);
    } catch (err) {
      console.error("Error loading intents:", err);
      setError(err instanceof Error ? err.message : "Failed to load intents");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-48 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-64" />
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-8 bg-slate-200 rounded-full w-24" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
          <Target className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Analisis Intensi Operasional
          </h3>
          <p className="text-sm text-slate-500">
            Rincian tindakan pengguna & fitur yang dijalankan
          </p>
        </div>
      </div>

      {/* Intent Tags */}
      <div className="flex flex-wrap gap-3">
        {intents.length > 0 ? (
          intents.map((item, index) => (
            <div
              key={`${item.name}-${index}`}
              className={`${TAG_COLORS[index % TAG_COLORS.length]} rounded-full px-4 py-2 border text-sm font-medium`}
            >
              {item.name} ({item.count.toLocaleString()})
            </div>
          ))
        ) : (
          <div className="w-full text-center py-8 text-slate-500">
            <Target className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Tidak ada data intensi operasional</p>
          </div>
        )}
      </div>
    </div>
  );
}
