"use client";

import { useState } from "react";

interface SatkerPerformance {
  satker: string;
  requests: number;
  peakTime: string;
  rank: number;
}

interface UnitPerformanceRankingProps {
  performanceData: SatkerPerformance[];
}

export default function UnitPerformanceRanking({
  performanceData,
}: UnitPerformanceRankingProps) {
  const [showTopPerformers, setShowTopPerformers] = useState(true);

  return (
    <div className="lg:col-span-5">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[580px]">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Peringkat Kinerja Unit Kerja
              </h2>
              <p className="text-sm text-gray-500">
                {showTopPerformers
                  ? "Unit kerja dengan aktivitas terbanyak"
                  : "Unit kerja dengan aktivitas terdikit"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Toggle Button */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setShowTopPerformers(true)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  showTopPerformers
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setShowTopPerformers(false)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  !showTopPerformers
                    ? "bg-white text-orange-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Bottom 10
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable List - Top 10 or Bottom 10 */}
        <div
          className="overflow-y-auto h-[420px] pr-2"
          style={{ scrollbarWidth: "thin" }}
        >
          {(() => {
            const displayData = showTopPerformers
              ? performanceData.slice(0, 10)
              : performanceData.slice(-10).reverse();

            return displayData.map((unit, index) => (
              <div
                key={unit.satker}
                className="bg-gray-50 rounded-xl p-4 mb-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-orange-700">
                        {index + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {unit.satker}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {unit.requests} Request
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-orange-600 rounded-full transition-all"
                        style={{
                          width: `${performanceData.length > 0 ? (unit.requests / performanceData[0].requests) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ));
          })()}
          {performanceData.length === 0 && (
            <p className="text-center text-gray-500 py-8">
              Tidak ada data satker
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
