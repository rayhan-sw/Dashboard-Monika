"use client";

import { useEffect, useState } from "react";
import { BarChart3, AlertCircle } from "lucide-react";
import { contentService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";

// Types
interface RankingData {
  rank: number;
  name: string;
  count: number;
  percentage: number;
}

// Color gradients for rankings
const getColorGradient = (rank: number, totalCount: number) => {
  // TOP 5: Gradient from #10B981 (emerald-500) to #A4F4CF (emerald-200)
  if (rank <= 5) {
    const ratio = (rank - 1) / 4; // 0 to 1 for ranks 1-5
    return `linear-gradient(135deg, rgb(16, 185, 129) ${(1 - ratio) * 100}%, rgb(164, 244, 207) ${ratio * 100}%)`;
  }

  // BOTTOM 5: Gradient from #EF4444 (red-500) to #FF696B (red-400)
  if (rank > totalCount - 5) {
    const ratio = (rank - (totalCount - 4)) / 4; // 0 to 1 for last 5
    return `linear-gradient(135deg, rgb(239, 68, 68) ${(1 - ratio) * 100}%, rgb(255, 105, 107) ${ratio * 100}%)`;
  }

  // MIDDLE: Gradient from #FDC233 (amber-400) to #FFE06F (amber-200)
  const middleRatio = (rank - 6) / Math.max(1, totalCount - 11);
  return `linear-gradient(135deg, rgb(253, 194, 51) ${(1 - middleRatio) * 100}%, rgb(255, 224, 111) ${middleRatio * 100}%)`;
};

export default function DashboardRankings() {
  const { dateRange } = useAppStore();
  const [rankings, setRankings] = useState<RankingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRankings();
  }, [dateRange]);

  const loadRankings = async () => {
    setLoading(true);
    try {
      const response = await contentService.getDashboardRankings(
        dateRange.startDate,
        dateRange.endDate,
      );
      // Map API response to expected format
      const data = response.data || [];
      const totalCount = data.reduce(
        (sum: number, item: { count: number }) => sum + item.count,
        0,
      );
      const mappedRankings: RankingData[] = data.map(
        (item: { rank: number; name: string; count: number; percentage: number }) => ({
          rank: item.rank,
          name: item.name,
          count: item.count,
          percentage: item.percentage || (totalCount > 0 ? (item.count / totalCount) * 100 : 0),
        }),
      );
      setRankings(mappedRankings);
      setError(null);
    } catch (err) {
      console.error("Error loading rankings:", err);
      setError(err instanceof Error ? err.message : "Failed to load rankings");
    } finally {
      setLoading(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-5 bg-slate-200 rounded w-48 mb-2" />
              <div className="h-4 bg-slate-200 rounded w-64" />
            </div>
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-7 h-7 bg-slate-200 rounded-full" />
              <div className="h-4 bg-slate-200 rounded w-32" />
              <div className="flex-1 h-3 bg-slate-200 rounded-full" />
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
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...rankings.map((r) => r.count), 1);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Peringkat Penggunaan Dashboard
          </h3>
          <p className="text-sm text-slate-500">
            Klaster analitik yang paling sering dikunjungi
          </p>
        </div>
      </div>

      {/* Rankings List */}
      <div className="space-y-3">
        {rankings.length > 0 ? (
          rankings.map((item, index) => {
            const rank = index + 1;
            const totalCount = rankings.length;
            const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

            return (
              <div
                key={`${item.name}-${index}`}
                className="flex items-center gap-4"
              >
                {/* Rank number circle with gradient */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: getColorGradient(rank, totalCount) }}
                >
                  {rank}
                </div>
                {/* Name */}
                <span
                  className="text-sm font-medium text-slate-700 w-48 truncate"
                  title={item.name}
                >
                  {item.name}
                </span>
                {/* Progress bar with gradient */}
                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      background: getColorGradient(rank, totalCount),
                    }}
                  />
                </div>
                {/* Count and Percentage */}
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800">
                    {item.count.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500">
                    {item.percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Tidak ada data peringkat</p>
          </div>
        )}
      </div>
    </div>
  );
}
