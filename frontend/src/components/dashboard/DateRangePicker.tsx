"use client";

import { useAppStore } from "@/stores/appStore";
import { dashboardService } from "@/services/api";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { useEffect } from "react";

export default function DateRangePicker() {
  const {
    dateRange,
    actualDateRange,
    setDateRange,
    setActualDateRange,
    setPresetRange,
  } = useAppStore();

  // Fetch actual date range from database on mount
  useEffect(() => {
    const fetchActualRange = async () => {
      try {
        const data = await dashboardService.getDateRange();
        const range = { startDate: data.min_date, endDate: data.max_date };
        setActualDateRange(range);
        // Set initial date range to actual range
        setDateRange(range);
      } catch (error) {
        console.error("Failed to fetch date range:", error);
      }
    };
    fetchActualRange();
  }, []);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({ ...dateRange, startDate: e.target.value });
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange({ ...dateRange, endDate: e.target.value });
  };

  const presets = [
    { label: "7 Hari", days: 7 },
    { label: "30 Hari", days: 30 },
    { label: "90 Hari", days: 90 },
    { label: "Semua", days: 9999 },
  ];

  return (
    <div className="bg-white rounded-[13px] shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-wrap items-center gap-4">
        {/* Icon & Title */}
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#E27200]" />
          <h3 className="font-semibold text-gray-900">Filter Tanggal</h3>
        </div>

        {/* Date Inputs */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Dari</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={handleStartDateChange}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FEB800] focus:border-transparent"
            />
          </div>

          <span className="text-gray-400 mt-5">—</span>

          <div className="flex flex-col">
            <label className="text-xs text-gray-600 mb-1">Sampai</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={handleEndDateChange}
              max={actualDateRange?.endDate || undefined}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#FEB800] focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-gray-600">Quick:</span>
          {presets.map((preset) => (
            <button
              key={preset.days}
              onClick={() => setPresetRange(preset.days)}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-[#FEB800] hover:text-white rounded-lg transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Range Display */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-600">
          Menampilkan data dari{" "}
          <span className="font-semibold text-gray-900">
            {format(new Date(dateRange.startDate), "d MMM yyyy", {
              locale: id,
            })}
          </span>{" "}
          sampai{" "}
          <span className="font-semibold text-gray-900">
            {format(new Date(dateRange.endDate), "d MMM yyyy", { locale: id })}
          </span>
        </p>
      </div>
    </div>
  );
}
