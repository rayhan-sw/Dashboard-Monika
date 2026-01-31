"use client";

interface GeoRegion {
  total: number;
  provinces: {
    name: string;
    count: number;
    highlighted: boolean;
  }[];
}

interface GeographicDistributionChartProps {
  geoData: { [key: string]: GeoRegion };
}

export default function GeographicDistributionChart({
  geoData,
}: GeographicDistributionChartProps) {
  const total = Object.values(geoData).reduce(
    (sum, region) => sum + region.total,
    0
  );

  const colors: { [key: string]: string } = {
    PUSAT: "#3B82F6",
    "JAWA, BALI & NUSA TENGGARA": "#F59E0B",
    SUMATERA: "#10B981",
    SULAWESI: "#8B5CF6",
    KALIMANTAN: "#A855F7",
    "MALUKU & PAPUA": "#6B21A8",
    LAINNYA: "#6B7280",
  };

  const regionColors: { [key: string]: string } = {
    PUSAT: "bg-blue-500",
    "JAWA, BALI & NUSA TENGGARA": "bg-amber-500",
    SUMATERA: "bg-green-500",
    SULAWESI: "bg-purple-500",
    KALIMANTAN: "bg-purple-400",
    "MALUKU & PAPUA": "bg-purple-900",
    LAINNYA: "bg-gray-500",
  };

  // Generate donut chart segments
  let currentAngle = -90;
  const centerX = 140;
  const centerY = 140;
  const radius = 110;
  const innerRadius = 70;

  const segments =
    Object.keys(geoData).length > 0
      ? Object.entries(geoData).map(([regionName, regionData]) => {
          const percentage = (regionData.total / total) * 100;
          const angle = (regionData.total / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle = endAngle;

          const startRad = (startAngle * Math.PI) / 180;
          const endRad = (endAngle * Math.PI) / 180;

          const x1 = centerX + radius * Math.cos(startRad);
          const y1 = centerY + radius * Math.sin(startRad);
          const x2 = centerX + radius * Math.cos(endRad);
          const y2 = centerY + radius * Math.sin(endRad);

          const ix1 = centerX + innerRadius * Math.cos(startRad);
          const iy1 = centerY + innerRadius * Math.sin(startRad);
          const ix2 = centerX + innerRadius * Math.cos(endRad);
          const iy2 = centerY + innerRadius * Math.sin(endRad);

          const largeArc = angle > 180 ? 1 : 0;

          const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;

          // Label position (outside the donut)
          const midAngle = (startAngle + endAngle) / 2;
          const midRad = (midAngle * Math.PI) / 180;
          const labelRadius = radius + 28;
          const labelX = centerX + labelRadius * Math.cos(midRad);
          const labelY = centerY + labelRadius * Math.sin(midRad);

          return {
            path,
            color: colors[regionName] || "#6B7280",
            labelX,
            labelY,
            percentage,
            regionName,
            count: regionData.total,
          };
        })
      : [];

  return (
    <div className="lg:col-span-5">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[632px]">
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
                d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Distribusi Geografis
            </h2>
            <p className="text-sm text-gray-500">
              Aktivitas berdasarkan wilayah
            </p>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="flex items-center justify-center h-[260px] mb-6">
          {Object.keys(geoData).length > 0 ? (
            <div className="relative">
              <svg width="340" height="280" viewBox="0 0 280 280">
                {segments.map((seg, idx) => (
                  <g key={idx}>
                    <path
                      d={seg.path}
                      fill={seg.color}
                      className="hover:opacity-90 transition-opacity cursor-pointer"
                      stroke="#fff"
                      strokeWidth="3"
                    />
                    {/* Percentage label */}
                    <text
                      x={seg.labelX}
                      y={seg.labelY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-xs font-semibold fill-gray-700"
                    >
                      {seg.percentage.toFixed(1)}%
                    </text>
                  </g>
                ))}
                {/* Center text */}
                <text
                  x="140"
                  y="130"
                  textAnchor="middle"
                  className="text-xs fill-gray-500 font-medium"
                >
                  Total
                </text>
                <text
                  x="140"
                  y="155"
                  textAnchor="middle"
                  className="text-2xl fill-gray-900 font-bold"
                >
                  {total.toLocaleString()}
                </text>
              </svg>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500 text-sm">Tidak ada data</p>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="space-y-3">
          {Object.entries(geoData).map(([regionName, regionData], idx) => {
            const percentage =
              total > 0
                ? ((regionData.total / total) * 100).toFixed(2)
                : "0.00";
            return (
              <div
                key={regionName}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-3 h-3 rounded-full ${regionColors[regionName] || "bg-gray-500"}`}
                  />
                  <span className="text-xs text-gray-600">{regionName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-semibold text-gray-900">
                    {regionData.total}
                  </span>
                  <span className="text-xs text-gray-500">{percentage}%</span>
                </div>
              </div>
            );
          })}
          {Object.keys(geoData).length === 0 && (
            <p className="text-center text-gray-500 py-4 text-xs">
              Tidak ada data
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
