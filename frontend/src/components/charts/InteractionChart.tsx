"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import { dashboardService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { ClusterData } from "@/types/api";
import { PieChart as PieChartIcon } from "lucide-react";

const COLORS: Record<string, string> = {
  "system auth": "#10B981", // green
  "monitoring & view": "#3B82F6", // blue
  discovery: "#F59E0B", // amber
  "data extraction": "#8B5CF6", // purple
  other: "#6B7280", // gray
};

export default function InteractionChart() {
  const { dateRange, selectedCluster } = useAppStore();
  const [data, setData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange, selectedCluster]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getClusterChart(
        dateRange.startDate,
        dateRange.endDate,
        selectedCluster,
      );
      const clusterData: ClusterData = response.data;

      if (clusterData && typeof clusterData === "object") {
        const chartData = Object.entries(clusterData).map(
          ([category, count]) => ({
            name: category,
            value: count,
            color: COLORS[category.toLowerCase()] || "#6B7280",
          }),
        );
        setData(chartData);
      } else {
        setData([]);
      }
    } catch (error) {
      console.error("Failed to load cluster data:", error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[450px] bg-gray-100 animate-pulse rounded-[13px]" />
    );
  }

  return (
    <div className="bg-white rounded-[13px] p-4 shadow-sm h-[450px] flex flex-col">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 rounded-lg-bpk bg-purple-500 flex items-center justify-center flex-shrink-0">
          <PieChartIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-1">
            Mode Interaksi Pengguna
          </h3>
          <p className="text-sm text-gray-3 mt-1">
            Analisis Pemakaian Pengguna
          </p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="42%"
              labelLine={false}
              label={false}
              outerRadius={85}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
              }}
              formatter={(value: number) => value.toLocaleString("id-ID")}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              wrapperStyle={{ fontSize: "11px" }}
              formatter={(value) => (
                <span className="text-[11px] text-gray-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
