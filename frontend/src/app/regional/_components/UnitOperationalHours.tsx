"use client";

interface HourlyData {
  hour: number;
  count: number;
}

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
}

export default function UnitOperationalHours({
  performanceData,
  selectedUnit,
  setSelectedUnit,
  displayHourlyData,
  loadingHourly,
  getPeakTime,
}: UnitOperationalHoursProps) {
  const maxHourlyValue = Math.max(
    ...displayHourlyData.map((d) => d.count),
    20
  );

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-start gap-4 mb-4">
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

      <div className="grid grid-cols-12 gap-6">
        {/* Unit List */}
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
                      Puncak{" "}
                      {selectedUnit === unit.satker ? getPeakTime() : "10:00"}
                    </p>
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

        {/* Chart */}
        <div className="col-span-9 pl-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-gray-900 truncate">
              {selectedUnit || "Pilih unit kerja"}
            </p>
            {loadingHourly && (
              <span className="text-xs text-gray-500">Memuat data...</span>
            )}
          </div>

          {/* Smooth Area Chart with vertical scale animation */}
          <div className="relative w-full h-[280px]">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 250"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
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
                  const points = displayHourlyData.map((d, i) => {
                    const x = (i / 23) * width;
                    const y = height - (d.count / maxHourlyValue) * height;
                    return { x, y, count: d.count };
                  });

                  // Create smooth path using cubic bezier curves
                  let pathD = `M ${points[0].x} ${points[0].y}`;

                  for (let i = 0; i < points.length - 1; i++) {
                    const current = points[i];
                    const next = points[i + 1];
                    const controlPointX = (current.x + next.x) / 2;

                    pathD += ` C ${controlPointX} ${current.y}, ${controlPointX} ${next.y}, ${next.x} ${next.y}`;
                  }

                  // Create area path
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

                      {/* Area fill */}
                      <path d={areaPath} fill="url(#areaGradient)" />

                      {/* Line stroke */}
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

            {/* Add CSS animations for vertical scale */}
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

            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500 text-right pr-2 -ml-14">
              <span>{maxHourlyValue}</span>
              <span>{Math.floor(maxHourlyValue * 0.75)}</span>
              <span>{Math.floor(maxHourlyValue * 0.5)}</span>
              <span>{Math.floor(maxHourlyValue * 0.25)}</span>
              <span>0</span>
            </div>

            {/* X-axis labels */}
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
