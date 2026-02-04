"use client";

interface GeoRegion {
  total: number;
  provinces: {
    name: string;
    count: number;
    highlighted: boolean;
  }[];
}

interface GeographicDistributionListProps {
  geoData: { [key: string]: GeoRegion };
}

export default function GeographicDistributionList({
  geoData,
}: GeographicDistributionListProps) {
  const totalAccess = Object.values(geoData).reduce(
    (sum, region) => sum + region.total,
    0,
  );

  // Get all province counts to calculate thresholds
  const allCounts = Object.values(geoData).flatMap((region) =>
    region.provinces.map((p) => p.count),
  );
  const maxCount = Math.max(...allCounts, 1);
  const minCount = Math.min(...allCounts.filter((c) => c > 0), 0);

  // Calculate dynamic thresholds based on data distribution
  const range = maxCount - minCount;
  const highThreshold = minCount + range * 0.67; // Top 33%
  const mediumThreshold = minCount + range * 0.33; // Middle 33%

  // Function to get bullet color based on activity count
  const getBulletColor = (count: number) => {
    if (count >= highThreshold) {
      return "#BB4D00"; // Banyak aktivitas
    } else if (count >= mediumThreshold) {
      return "#FE9A00"; // Aktivitas sedang
    } else if (count > 0) {
      return "#FDC233"; // Sedikit aktivitas
    }
    return "#D1D5DB"; // Tidak ada aktivitas (gray-300)
  };

  return (
    <div className="lg:col-span-7">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[632px]">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-11 h-11 rounded-xl bg-amber-100 flex items-center justify-center">
            <svg
              className="w-6 h-6 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">
                  Distribusi Geografis
                </h2>
                <p className="text-sm text-gray-500">
                  Aktivitas berdasarkan wilayah
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-500">
                  Total Akses
                </p>
                <p className="text-xl font-semibold text-gray-900">
                  {totalAccess.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Geographic List */}
        <div className="h-[522px] overflow-y-auto scrollbar-hide">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(geoData).map(([region, data]) => (
              <div
                key={region}
                className="bg-gray-50 border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-300">
                  <h3 className="text-sm font-bold text-gray-500">{region}</h3>
                  <span className="text-sm font-semibold text-gray-900">
                    {data.total}
                  </span>
                </div>
                <div className="space-y-2">
                  {data.provinces.map((province, idx) => {
                    const bulletColor = getBulletColor(province.count);
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: bulletColor }}
                          />
                          <span
                            className={`text-xs ${
                              province.count >= mediumThreshold
                                ? "font-semibold text-gray-900"
                                : "text-gray-600"
                            }`}
                          >
                            {province.name}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {province.count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(geoData).length === 0 && (
              <p className="col-span-2 text-center text-gray-500 py-12">
                Tidak ada data geografis
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
