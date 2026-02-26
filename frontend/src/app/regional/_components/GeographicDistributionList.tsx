/**
 * GeographicDistributionList.tsx
 *
 * Daftar distribusi geografis: menampilkan total akses dan per region (key = nama region),
 * tiap region berisi total + daftar provinsi dengan count. Bullet warna dinamis: tinggi (BB4D00),
 * sedang (FE9A00), rendah (FDC233), nol (abu-abu). Threshold dihitung dari distribusi data
 * (high = top 33%, medium = 33% tengah).
 */

"use client";

import FilterBadge from "@/components/ui/FilterBadge";

/** Satu region: total akses dan daftar provinsi (name, count, highlighted). */
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
  dateRange?: any;
  selectedCluster?: string;
  selectedEselon?: string;
}

/**
 * GeographicDistributionList.tsx
 *
 * List distribusi geografis: total akses di header, lalu grid 2 kolom per region (nama region, total).
 * Header sekarang menyertakan `FilterBadge` di kanan — header menggunakan `flex justify-between items-start`
 * sehingga judul tetap left-aligned dan badge berada di sisi kanan.
 */
export default function GeographicDistributionList({
  geoData,
  dateRange,
  selectedCluster,
  selectedEselon,
}: GeographicDistributionListProps) {
  // Jumlah total akses = jumlah region.total dari semua region
  const totalAccess = Object.values(geoData).reduce(
    (sum, region) => sum + region.total,
    0,
  );

  // Kumpulkan semua count provinsi untuk hitung batas warna (tinggi/sedang/rendah)
  const allCounts = Object.values(geoData).flatMap((region) =>
    region.provinces.map((p) => p.count),
  );
  const maxCount = Math.max(...allCounts, 1);
  const minCount = Math.min(...allCounts.filter((c) => c > 0), 0);

  const range = maxCount - minCount;
  const highThreshold = minCount + range * 0.67; // Batas "banyak": 67% atas
  const mediumThreshold = minCount + range * 0.33; // Batas "sedang": 33% atas

  // Warna bullet: tinggi = oranye gelap, sedang = oranye, rendah = kuning, nol = abu
  const getBulletColor = (count: number) => {
    if (count >= highThreshold) {
      return "#BB4D00";
    } else if (count >= mediumThreshold) {
      return "#FE9A00";
    } else if (count > 0) {
      return "#FDC233";
    }
    return "#D1D5DB";
  };

  return (
    <div className="lg:col-span-7">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[632px]">
        <div className="flex items-start justify-between gap-4 mb-4">
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
                <div className="mb-1">
                  <FilterBadge
                    dateRange={
                      dateRange && dateRange.startDate
                        ? new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                          }).format(new Date(dateRange.startDate)) +
                          " – " +
                          new Intl.DateTimeFormat("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }).format(new Date(dateRange.endDate))
                        : undefined
                    }
                    cluster={selectedCluster}
                    eselon={selectedEselon}
                  />
                </div>
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

        {/* Area scroll vertikal: tinggi tetap 522px, grid 2 kolom per region */}
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
                    const bulletColor = getBulletColor(province.count); // Warna berdasarkan threshold
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
