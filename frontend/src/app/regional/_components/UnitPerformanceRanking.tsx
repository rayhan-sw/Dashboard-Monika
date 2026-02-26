/**
 * UnitPerformanceRanking.tsx
 *
 * Widget "Peringkat Kinerja Unit Kerja": toggle Top 10 / Bottom 10, daftar unit dengan
 * ranking badge, nama satker, jumlah request, dan progress bar (lebar relatif terhadap
 * unit dengan request terbanyak). Data dari performanceData (sudah terurut dari parent).
 */

"use client";

import { useState } from "react";
import FilterBadge from "@/components/ui/FilterBadge";

/** Satu satker: nama, jumlah request, jam puncak, peringkat. */
interface SatkerPerformance {
  satker: string;
  requests: number;
  peakTime: string;
  rank: number;
}

interface UnitPerformanceRankingProps {
  performanceData: SatkerPerformance[];
  dateRange?: any;
  selectedCluster?: string;
  selectedEselon?: string;
}

/**
 * UnitPerformanceRanking.tsx
 *
 * Render kartu: header (ikon, judul, subteks dinamis) + toggle Top 10/Bottom 10 + daftar scroll.
 * Header includes `FilterBadge` at the right — the header uses `flex justify-between items-start`
 * so the title remains left-aligned and the badge sits to the right.
 */
export default function UnitPerformanceRanking({
  performanceData,
  dateRange,
  selectedCluster,
  selectedEselon,
}: UnitPerformanceRankingProps) {
  const [showTopPerformers, setShowTopPerformers] = useState(true);

  const formatDateRange = (dr: any) => {
    if (!dr || !dr.startDate || !dr.endDate) return undefined;
    try {
      const start = new Date(dr.startDate);
      const end = new Date(dr.endDate);
      const fmtShort = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      });
      const fmtFull = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (start.getFullYear() === end.getFullYear()) {
        return `${fmtShort.format(start)} – ${fmtFull.format(end)}`;
      }

      return `${fmtFull.format(start)} – ${fmtFull.format(end)}`;
    } catch (e) {
      return undefined;
    }
  };

  const displayDateRange = formatDateRange(dateRange);

  return (
    <div className="lg:col-span-5">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[580px]">
        {/* Header: ikon badge (gradien amber-orange), judul, subteks berubah sesuai toggle */}
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
          <div className="flex items-start gap-2">
            <FilterBadge
              dateRange={displayDateRange}
              cluster={selectedCluster}
              eselon={selectedEselon}
            />
            {/* Toggle: Top 10 (10 teratas) atau Bottom 10 (10 terbawah, urutan dibalik) */}
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

        {/* Daftar scroll: Top 10 = slice(0,10); Bottom 10 = slice(-10) lalu reverse */}
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
                    {/* Badge peringkat: index+1 (1–10), lingkaran oranye muda */}
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
                  {/* Progress bar: lebar = (unit.requests / maxRequest) * 100%; max = performanceData[0].requests */}
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
          {/* Empty state: tampil jika performanceData kosong */}
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
