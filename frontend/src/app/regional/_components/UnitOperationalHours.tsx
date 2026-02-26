/**
 * UnitOperationalHours.tsx
 *
 * Widget "Jam Operasional Unit Kerja": daftar unit (10 teratas) di kiri, chart area
 * jam-per-jam di kanan. User pilih unit → chart menampilkan aktivitas per jam (00–23).
 * Data chart: displayHourlyData (dari parent). Garis halus pakai cubic bezier, area
 * diisi gradient ungu, animasi scaleUp; sumbu Y dinamis dari max count, sumbu X jam genap.
 */

"use client";

import FilterBadge from "@/components/ui/FilterBadge";

/** Satu titik data: jam (0–23) dan jumlah aktivitas. */
interface HourlyData {
  hour: number;
  count: number;
}

/** Data performa satu satker: nama, jumlah request, jam puncak, peringkat. */
interface SatkerPerformance {
  satker: string;
  requests: number;
  peakTime: string;
  rank: number;
}

interface UnitOperationalHoursProps {
  performanceData: SatkerPerformance[];
  selectedUnit: string;
  setSelectedUnit: (unit: string) => void;
  displayHourlyData: HourlyData[];
  loadingHourly: boolean;
  getPeakTime: () => string;
  unitPeakTimes: { [key: string]: string };
  dateRange?: any;
  selectedCluster?: string;
  selectedEselon?: string;
}

/**
 * Render kartu: header (ikon, judul) + grid 3 kolom (daftar unit) + 9 kolom (chart area).
 * Header includes `FilterBadge` at the right; header layout uses `flex justify-between items-start`
 * so the title remains left-aligned. Skala Y chart = max dari displayHourlyData.count, minimal 20 agar chart terbaca.
 */
export default function UnitOperationalHours({
  performanceData,
  selectedUnit,
  setSelectedUnit,
  displayHourlyData,
  loadingHourly,
  getPeakTime,
  unitPeakTimes,
  dateRange,
  selectedCluster,
  selectedEselon,
}: UnitOperationalHoursProps) {
  const maxHourlyValue = Math.max(...displayHourlyData.map((d) => d.count), 20);

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
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {/* Header: ikon gedung (ungu), judul "Jam Operasional Unit Kerja", subteks pola puncak */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-purple-500 flex items-center justify-center">
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
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Jam Operasional Unit Kerja
            </h2>
            <p className="text-sm text-gray-500">
              Pola puncak aktivitas per unit
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <FilterBadge
            dateRange={displayDateRange}
            cluster={selectedCluster}
            eselon={selectedEselon}
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Daftar unit: hanya 10 teratas (slice(0,10)), scroll vertikal; tiap item = tombol pilih unit */}
        <div className="col-span-3">
          <div className="h-[300px] overflow-y-auto overflow-x-hidden scrollbar-hide space-y-2 pr-1">
            {performanceData.slice(0, 10).map((unit, idx) => (
              <div key={unit.satker} className="w-full">
                <button
                  onClick={() => setSelectedUnit(unit.satker)}
                  className={`w-full rounded-xl p-3 text-left transition-all block ${
                    selectedUnit === unit.satker
                      ? "bg-blue-50 border-2 border-blue-500"
                      : "bg-gray-50 hover:bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  <div className="w-full">
                    <p className="text-sm font-medium text-gray-900 truncate pr-1">
                      {unit.satker}
                    </p>
                    <p className="text-xs text-blue-600 mt-1 truncate pr-1">
                      <svg
                        className="inline w-3 h-3 mr-1 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Puncak {unitPeakTimes[unit.satker] || "..."}
                    </p>
                    {/* Jumlah request unit diformat locale + label "skt" */}
                    <p className="text-xs text-gray-500 mt-0.5 truncate pr-1">
                      {unit.requests.toLocaleString()} skt
                    </p>
                  </div>
                </button>
              </div>
            ))}
            {performanceData.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-xs">
                Tidak ada data
              </p>
            )}
          </div>
        </div>

        {/* Area chart: judul = selectedUnit atau "Pilih unit kerja"; indikator loading */}
        <div className="col-span-9 pl-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedUnit || "Pilih unit kerja"}
            </p>
            {loadingHourly && (
              <span className="text-xs text-gray-500">Memuat data...</span>
            )}
          </div>

          <div className="relative w-full h-[280px]">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 250"
              preserveAspectRatio="none"
            >
              {/* Garis grid horizontal (0, 62.5, 125, 187.5, 250) */}
              <line
                x1="0"
                y1="0"
                x2="1000"
                y2="0"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
              <line
                x1="0"
                y1="62.5"
                x2="1000"
                y2="62.5"
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1="0"
                y1="125"
                x2="1000"
                y2="125"
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1="0"
                y1="187.5"
                x2="1000"
                y2="187.5"
                stroke="#e5e7eb"
                strokeWidth="1"
                opacity="0.5"
              />
              <line
                x1="0"
                y1="250"
                x2="1000"
                y2="250"
                stroke="#e5e7eb"
                strokeWidth="1"
              />

              {displayHourlyData.length > 0 &&
                (() => {
                  const width = 1000;
                  const height = 250;
                  // Koordinat tiap jam: x = (i/23)*width; y dari bawah (height - (count/max)*height)
                  const points = displayHourlyData.map((d, i) => {
                    const x = (i / 23) * width;
                    const y = height - (d.count / maxHourlyValue) * height;
                    return { x, y, count: d.count };
                  });

                  // Path garis halus: cubic bezier dengan control point X di tengah antara current dan next
                  let pathD = `M ${points[0].x} ${points[0].y}`;

                  for (let i = 0; i < points.length - 1; i++) {
                    const current = points[i];
                    const next = points[i + 1];
                    const controlPointX = (current.x + next.x) / 2;

                    pathD += ` C ${controlPointX} ${current.y}, ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
                  }

                  // Area: path garis + garis ke bawah kanan, bawah kiri, tutup (Z)
                  const areaPath = `${pathD} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`;

                  return (
                    <g
                      key={selectedUnit}
                      style={{
                        transformOrigin: "center bottom",
                        animation: "scaleUp 0.8s ease-out",
                      }}
                    >
                      {/* Gradient definition */}
                      <defs>
                        <linearGradient
                          id="areaGradient"
                          x1="0%"
                          y1="0%"
                          x2="0%"
                          y2="100%"
                        >
                          <stop
                            offset="0%"
                            stopColor="#8b5cf6"
                            stopOpacity="0.3"
                          />
                          <stop
                            offset="100%"
                            stopColor="#8b5cf6"
                            stopOpacity="0.05"
                          />
                        </linearGradient>
                      </defs>

                      <path d={areaPath} fill="url(#areaGradient)" />

                      {/* Garis tepi area: pathD, stroke ungu, rounded */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#8b5cf6"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  );
                })()}
            </svg>

            {/* Animasi: scaleY dari 0 ke 1, opacity 0 → 0.5 → 1 (0.8s ease-out) */}
            <style jsx>{`
              @keyframes scaleUp {
                0% {
                  transform: scaleY(0);
                  opacity: 0;
                }
                50% {
                  opacity: 0.5;
                }
                100% {
                  transform: scaleY(1);
                  opacity: 1;
                }
              }
            `}</style>

            {/* Label sumbu Y: max, 75%, 50%, 25%, 0 */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 text-right pr-2 -ml-14">
              <span>{maxHourlyValue}</span>
              <span>{Math.floor(maxHourlyValue * 0.75)}</span>
              <span>{Math.floor(maxHourlyValue * 0.5)}</span>
              <span>{Math.floor(maxHourlyValue * 0.25)}</span>
              <span>0</span>
            </div>

            {/* Label sumbu X: jam 0, 2, 4, ... 22 (genap saja) */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              {Array.from({ length: 24 }, (_, i) => i)
                .filter((h) => h % 2 === 0)
                .map((hour) => (
                  <span key={hour} className="w-8 text-center">
                    {hour}h
                  </span>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
