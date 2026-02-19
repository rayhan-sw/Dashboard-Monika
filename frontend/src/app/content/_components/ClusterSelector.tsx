"use client";

import { useEffect, useState } from "react";
import { contentService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import { Layers, AlertCircle } from "lucide-react";

interface ClusterSelectorProps {
  onClusterChange: (cluster: string) => void;
  selectedCluster: string;
}

export default function ClusterSelector({
  onClusterChange,
  selectedCluster,
}: ClusterSelectorProps) {
  const { dateRange } = useAppStore();
  const [clusters, setClusters] = useState<{ name: string; count: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadClusters();
  }, [dateRange]);

  const loadClusters = async () => {
    setLoading(true);
    try {
      const response = await contentService.getDashboardRankings(
        dateRange.startDate,
        dateRange.endDate,
      );
      // API returns: { rank, name, count, percentage }[]
      // We only need name and count
      const mappedClusters = (response.data || []).map(
        (item) => ({
          name: item.name,
          count: item.count,
        }),
      );
      setClusters(mappedClusters);
      setError(null);
    } catch (err) {
      console.error("Error loading clusters:", err);
      setError(err instanceof Error ? err.message : "Failed to load clusters");
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
          <div className="flex flex-wrap gap-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-200 rounded-lg w-32" />
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
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-800">
            Pilih Dashboard / Cluster
          </h3>
          <p className="text-sm text-slate-600">
            Rincian alat pencarian spesifik
          </p>
        </div>
      </div>

      {/* Cluster Buttons - Vertical Scrollable */}
      <div
        className="flex-1 overflow-y-auto space-y-2 pr-2"
        style={{ maxHeight: "400px" }}
      >
        {/* All Clusters Option */}
        <button
          onClick={() => onClusterChange("")}
          className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between ${
            selectedCluster === ""
              ? "bg-blue-600 text-white shadow-lg"
              : "bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-300 border border-slate-200"
          }`}
        >
          <span>Semua Cluster</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              selectedCluster === ""
                ? "bg-blue-500 text-white"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {clusters.reduce((sum, c) => sum + c.count, 0).toLocaleString()}
          </span>
        </button>

        {/* Individual Clusters */}
        {clusters.map((cluster) => (
          <button
            key={cluster.name}
            onClick={() => onClusterChange(cluster.name)}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-between ${
              selectedCluster === cluster.name
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-white text-slate-700 hover:bg-blue-50 hover:border-blue-300 border border-slate-200"
            }`}
          >
            <span className="text-left">{cluster.name}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                selectedCluster === cluster.name
                  ? "bg-blue-500 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {cluster.count.toLocaleString()}
            </span>
          </button>
        ))}
      </div>

      {/* Info Message */}
      {selectedCluster && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-300 rounded-lg text-sm text-blue-800">
          <strong>Cluster terpilih:</strong> {selectedCluster}
        </div>
      )}

      {!selectedCluster && (
        <div className="mt-4 p-3 bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700">
          Menampilkan data untuk <strong>semua cluster</strong>
        </div>
      )}
    </div>
  );
}
