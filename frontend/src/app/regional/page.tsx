"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { dashboardService, regionalService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { ActivityLog, HourlyData, ProvinceData } from "@/types/api";
import dynamic from "next/dynamic";

// Dynamic import for map component (client-side only)
const IndonesiaMap = dynamic(() => import("@/components/maps/IndonesiaMap"), {
  ssr: false,
});

// Interfaces untuk data regional
interface SatkerPerformance {
  satker: string;
  requests: number;
  peakTime: string;
  rank: number;
}

interface GeoRegion {
  total: number;
  provinces: {
    name: string;
    count: number;
    highlighted: boolean;
  }[];
}

interface TopContributor {
  rank: number;
  username: string;
  unit: string;
  requests: number;
}

interface RegionMap {
  [key: string]: string;
}

const REGION_MAP: RegionMap = {
  "DKI Jakarta": "JAWA, BALI & NUSA TENGGARA",
  "Jawa Barat": "JAWA, BALI & NUSA TENGGARA",
  "Jawa Tengah": "JAWA, BALI & NUSA TENGGARA",
  "DI Yogyakarta": "JAWA, BALI & NUSA TENGGARA",
  "Jawa Timur": "JAWA, BALI & NUSA TENGGARA",
  Banten: "JAWA, BALI & NUSA TENGGARA",
  Bali: "JAWA, BALI & NUSA TENGGARA",
  "Nusa Tenggara Barat": "JAWA, BALI & NUSA TENGGARA",
  "Nusa Tenggara Timur": "JAWA, BALI & NUSA TENGGARA",
  Aceh: "SUMATERA",
  "Sumatera Utara": "SUMATERA",
  "Sumatera Barat": "SUMATERA",
  Riau: "SUMATERA",
  "Kepulauan Riau": "SUMATERA",
  Jambi: "SUMATERA",
  "Sumatera Selatan": "SUMATERA",
  "Bangka Belitung": "SUMATERA",
  Bengkulu: "SUMATERA",
  Lampung: "SUMATERA",
  "Sulawesi Utara": "SULAWESI",
  "Sulawesi Tengah": "SULAWESI",
  "Sulawesi Selatan": "SULAWESI",
  "Sulawesi Tenggara": "SULAWESI",
  Gorontalo: "SULAWESI",
  "Sulawesi Barat": "SULAWESI",
  "Kalimantan Barat": "KALIMANTAN",
  "Kalimantan Tengah": "KALIMANTAN",
  "Kalimantan Selatan": "KALIMANTAN",
  "Kalimantan Timur": "KALIMANTAN",
  "Kalimantan Utara": "KALIMANTAN",
  Maluku: "MALUKU & PAPUA",
  "Maluku Utara": "MALUKU & PAPUA",
  Papua: "MALUKU & PAPUA",
  "Papua Barat": "MALUKU & PAPUA",
  "Papua Selatan": "MALUKU & PAPUA",
  "Papua Tengah": "MALUKU & PAPUA",
  "Papua Pegunungan": "MALUKU & PAPUA",
  "Papua Barat Daya": "MALUKU & PAPUA",
};

export default function RegionalPage() {
  const { selectedCluster, dateRange, sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<string>("");


  // State untuk performance ranking
  const [showTopPerformers, setShowTopPerformers] = useState(true); // true = top 5, false = bottom 5

  // State untuk data dari API
  const [performanceData, setPerformanceData] = useState<SatkerPerformance[]>(
    [],
  );
  const [geoData, setGeoData] = useState<{ [key: string]: GeoRegion }>({});
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [unitHourlyData, setUnitHourlyData] = useState<HourlyData[]>([]); // New: Unit-specific hourly data
  const [loading, setLoading] = useState(true);
  const [loadingHourly, setLoadingHourly] = useState(false); // New: Loading state for hourly data
  const [mapData, setMapData] = useState<{ name: string; count: number }[]>([]);

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;
        const cluster =
          selectedCluster === "Semua Cluster" ? "" : selectedCluster;

        console.log("Regional Page - Fetching data with params:", {
          startDate,
          endDate,
          cluster,
        });

        // 1. Fetch satker performance data directly from aggregated API
        const satkerResponse = await regionalService.getUnits(
          1,
          10000, // Get all satkers
          startDate,
          endDate,
          cluster,
        );

        console.log(
          "Regional Page - Satker data fetched:",
          satkerResponse.data.length,
        );
        console.log("Regional Page - Total pages:", satkerResponse.total_pages);
        console.log(
          "Regional Page - Sample satker data:",
          satkerResponse.data.slice(0, 5),
        );

        // Filter out NULL, ---, and numeric-only satkers
        const satkerPerformance = satkerResponse.data
          .filter((item: any) => {
            const satkerName = item.satker?.trim() || "";
            // Filter out empty, NULL, ---, and pure numeric names
            if (
              satkerName === "" ||
              satkerName === "NULL" ||
              satkerName === "---"
            ) {
              return false;
            }
            // Filter out pure numeric strings (only digits)
            if (/^\d+$/.test(satkerName)) {
              return false;
            }
            return true;
          })
          .map((item: any) => ({
            satker: item.satker,
            requests: item.count,
            peakTime: "00:00", // We don't need peak time anymore
            rank: item.rank || 0,
          }));

        setPerformanceData(satkerPerformance);
        if (satkerPerformance.length > 0 && !selectedUnit) {
          setSelectedUnit(satkerPerformance[0].satker);
        }

        console.log(
          "Regional Page - Performance data processed:",
          satkerPerformance.length,
        );

        // 2. Fetch locations directly from aggregated endpoint (mengambil SEMUA 67K+ data dengan efisien)
        const locationsResponse = await regionalService.getLocations(
          startDate,
          endDate,
          cluster,
        );
        const locations = locationsResponse.data;

        console.log(
          "Regional Page - Locations from DB aggregation:",
          locations.length,
        );

        // 3. Process Geographic Distribution for map (dari lokasi dengan mapping logic)
        const provinceMapForChart = new Map<string, number>();

        locations.forEach((item) => {
          const location = item.lokasi?.trim() || "";
          const count = item.count || 0;

          if (!location) return;

          let targetProvince = "";

          // Logic 1: Jika mengandung "Pusat" -> DKI Jakarta
          if (location.toLowerCase().includes("pusat")) {
            targetProvince = "DKI Jakarta";
          } else {
            // Logic 2: Normalize to match GeoJSON province names
            const cleanLocation = location.toLowerCase();

            // Special mappings to match GeoJSON names
            if (cleanLocation.includes("aceh")) {
              targetProvince = "DI. ACEH";
            } else if (cleanLocation.includes("yogyakarta")) {
              targetProvince = "DI. YOGYAKARTA";
            } else if (cleanLocation.includes("jakarta")) {
              targetProvince = "DKI JAKARTA";
            } else {
              // Try to match against REGION_MAP keys
              const matchedProvince = Object.keys(REGION_MAP).find(
                (provinceName) => {
                  const cleanProvince = provinceName.toLowerCase();
                  return (
                    cleanLocation.includes(cleanProvince) ||
                    cleanProvince.includes(cleanLocation)
                  );
                },
              );

              if (matchedProvince) {
                targetProvince = matchedProvince;
              } else {
                // If no match found, use location as is
                targetProvince = location;
              }
            }
          }

          if (targetProvince) {
            provinceMapForChart.set(
              targetProvince,
              (provinceMapForChart.get(targetProvince) || 0) + count,
            );
          }
        });

        // Convert to array for map component
        const mapProvinceData = Array.from(provinceMapForChart.entries()).map(
          ([name, count]) => ({ name, count }),
        );

        setMapData(mapProvinceData);

        console.log(
          "Regional Page - Map data processed:",
          mapProvinceData.length,
          "provinces",
        );
        console.log(
          "Regional Page - Sample map data:",
          mapProvinceData.slice(0, 5),
        );

        // 4. Process Geographic Distribution (untuk chart pie - dari locations juga)
        const provinceMap = new Map<string, number>();
        locations.forEach((item) => {
          const location = item.lokasi;
          const count = item.count || 0;
          if (location && location.trim() !== "") {
            provinceMap.set(location, count);
          }
        });

        console.log("Regional Page - Province map size:", provinceMap.size);

        // Group provinces by region
        const regionData: { [key: string]: GeoRegion } = {};
        const sortedProvinces = Array.from(provinceMap.entries()).sort(
          (a, b) => b[1] - a[1],
        );

        sortedProvinces.forEach(([location, count]) => {
          // Try to match province name in REGION_MAP
          // Extract province name from lokasi (e.g., "DKI Jakarta I" -> "DKI Jakarta")
          let provinceName = location;
          let region;

          // Check if location contains "Pusat" - prioritize PUSAT category
          if (location.toLowerCase().includes("pusat")) {
            region = "PUSAT";
            provinceName = location;
          } else {
            // Try exact match first
            region = REGION_MAP[location];

            // If no exact match, try to find partial match
            if (!region) {
              const matchedKey = Object.keys(REGION_MAP).find(
                (key) =>
                  location.toLowerCase().includes(key.toLowerCase()) ||
                  key.toLowerCase().includes(location.toLowerCase()),
              );
              if (matchedKey) {
                region = REGION_MAP[matchedKey];
                provinceName = matchedKey;
              }
            }

            // Default to "LAINNYA" if no match found
            if (!region) {
              region = "LAINNYA";
              provinceName = location;
            }
          }
          
          if (!regionData[region]) {
            regionData[region] = { total: 0, provinces: [] };
          }
          regionData[region].total += count;
          regionData[region].provinces.push({
            name: provinceName,
            count,
            highlighted: count > 50, // Highlight provinces dengan aktivitas tinggi
          });
        });

        // Sort provinces within each region
        Object.keys(regionData).forEach((region) => {
          regionData[region].provinces.sort((a, b) => b.count - a.count);
        });

        setGeoData(regionData);

        console.log(
          "Regional Page - Geographic data processed:",
          Object.keys(regionData).length,
          "regions",
        );

        // 4. Process Top Contributors - Disabled temporarily (requires detailed activity data)
        // Top contributors feature memerlukan data aktivitas detail yang sekarang tidak diambil
        // untuk efisiensi (aggregated data only)
        setTopContributors([]);

        console.log(
          "Regional Page - Top contributors: Feature disabled for performance",
        );

        // 5. Fetch Hourly Chart Data
        const hourlyResponse = await dashboardService.getHourlyChart(
          startDate,
          endDate,
          cluster,
        );
        setHourlyData(hourlyResponse.data || []);

        console.log(
          "Regional Page - Hourly data fetched:",
          hourlyResponse.data?.length || 0,
        );
      } catch (error) {
        console.error("Error fetching regional data:", error);
        // Reset all data on error
        setPerformanceData([]);
        setGeoData({});
        setTopContributors([]);
        setHourlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCluster, dateRange]); // Removed selectedUnit from dependency

  // Fetch hourly data for selected unit
  useEffect(() => {
    const fetchUnitHourlyData = async () => {
      if (!selectedUnit) {
        setUnitHourlyData([]);
        return;
      }

      try {
        setLoadingHourly(true);
        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;
        const cluster =
          selectedCluster === "Semua Cluster" ? "" : selectedCluster;

        const response = await regionalService.getUnitHourlyData(
          selectedUnit,
          startDate,
          endDate,
          cluster,
        );

        setUnitHourlyData(response.data || []);
      } catch (error) {
        console.error("Error fetching unit hourly data:", error);
        // Fallback to global data if unit-specific data fails
        setUnitHourlyData(hourlyData);
      } finally {
        setLoadingHourly(false);
      }
    };

    fetchUnitHourlyData();
  }, [selectedUnit, selectedCluster, dateRange, hourlyData]);

  // Calculate peak time from hourly data
  const getPeakTime = () => {
    if (unitHourlyData.length === 0) return "00:00";
    
    const maxData = unitHourlyData.reduce((max, current) => 
      current.count > max.count ? current : max
    , unitHourlyData[0]);
    
    return `${maxData.hour.toString().padStart(2, '0')}:00`;
  };

  const displayHourlyData = unitHourlyData.length > 0 ? unitHourlyData : hourlyData;
  const maxHourlyValue = Math.max(...displayHourlyData.map((d) => d.count), 20);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-gray-600">Memuat data regional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar onCollapsedChange={setSidebarCollapsed} />

      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? "ml-20" : "ml-80"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-20 p-8">
          <div className="max-w-[1800px] mx-auto space-y-8">
            {/* Page Header */}
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-2">
                Analisis Organisasi & Regional
              </h1>
              <p className="text-gray-600">
                Analisis komprehensif kinerja unit, distribusi geografis, dan
                keterlibatan pengguna
              </p>
            </div>

            {/* Row 1: Performance Ranking + Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 isolate">
              {/* Peringkat Kinerja Unit Kerja */}
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

              {/* Peta Nusantara */}
              <div className="lg:col-span-7">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[580px] relative z-0">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center">
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
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        Peta Nusantara
                      </h2>
                      <p className="text-sm text-gray-500">
                        Unit kerja berdasarkan peta indonesia
                      </p>
                    </div>
                  </div>

                  {/* Interactive Map */}
                  <div className="h-[480px] rounded-xl overflow-hidden border border-gray-200 relative">
                    <IndonesiaMap data={mapData} />
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Operational Hours Chart */}
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
                      <div
                        key={unit.satker}
                        className="w-full"
                      >
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
                              Puncak {selectedUnit === unit.satker ? getPeakTime() : "10:00"}
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
                      <line x1="0" y1="0" x2="1000" y2="0" stroke="#e5e7eb" strokeWidth="1" />
                      <line x1="0" y1="62.5" x2="1000" y2="62.5" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                      <line x1="0" y1="125" x2="1000" y2="125" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                      <line x1="0" y1="187.5" x2="1000" y2="187.5" stroke="#e5e7eb" strokeWidth="1" opacity="0.5" />
                      <line x1="0" y1="250" x2="1000" y2="250" stroke="#e5e7eb" strokeWidth="1" />

                      {displayHourlyData.length > 0 && (() => {
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
                              transformOrigin: 'center bottom',
                              animation: 'scaleUp 0.8s ease-out',
                            }}
                          >
                            {/* Gradient definition */}
                            <defs>
                              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
                              </linearGradient>
                            </defs>
                            
                            {/* Area fill */}
                            <path
                              d={areaPath}
                              fill="url(#areaGradient)"
                            />
                            
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
                      {Array.from({ length: 24 }, (_, i) => i).filter(h => h % 2 === 0).map((hour) => (
                        <span key={hour} className="w-8 text-center">{hour}h</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 3: Geographic Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* List View */}
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
                            {Object.values(geoData)
                              .reduce((sum, region) => sum + region.total, 0)
                              .toLocaleString()}
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
                            <h3 className="text-sm font-bold text-gray-500">
                              {region}
                            </h3>
                            <span className="text-sm font-semibold text-gray-900">
                              {data.total}
                            </span>
                          </div>
                          <div className="space-y-2">
                            {data.provinces.map((province, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2.5 h-2.5 rounded-full ${
                                      province.highlighted
                                        ? "bg-blue-500"
                                        : "bg-gray-400"
                                    }`}
                                  />
                                  <span
                                    className={`text-xs ${
                                      province.highlighted
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
                            ))}
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

              {/* Pie Chart */}
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
                        {(() => {
                          const total = Object.values(geoData).reduce((sum, region) => sum + region.total, 0);
                          
                          const colors: { [key: string]: string } = {
                            "PUSAT": "#3B82F6",
                            "JAWA, BALI & NUSA TENGGARA": "#F59E0B",
                            "SUMATERA": "#10B981",
                            "SULAWESI": "#8B5CF6",
                            "KALIMANTAN": "#A855F7",
                            "MALUKU & PAPUA": "#6B21A8",
                            "LAINNYA": "#6B7280",
                          };

                          let currentAngle = -90;
                          const centerX = 140;
                          const centerY = 140;
                          const radius = 110;
                          const innerRadius = 70;

                          const segments = Object.entries(geoData).map(([regionName, regionData]) => {
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
                            };
                          });

                          return (
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
                              <text x="140" y="130" textAnchor="middle" className="text-xs fill-gray-500 font-medium">
                                Total
                              </text>
                              <text x="140" y="155" textAnchor="middle" className="text-2xl fill-gray-900 font-bold">
                                {total.toLocaleString()}
                              </text>
                            </svg>
                          );
                        })()}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500 text-sm">Tidak ada data</p>
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="space-y-3">
                    {(() => {
                      const regionColors: { [key: string]: string } = {
                        "PUSAT": "bg-blue-500",
                        "JAWA, BALI & NUSA TENGGARA": "bg-amber-500",
                        SUMATERA: "bg-green-500",
                        SULAWESI: "bg-purple-500",
                        KALIMANTAN: "bg-purple-400",
                        "MALUKU & PAPUA": "bg-purple-900",
                        LAINNYA: "bg-gray-500",
                      };
                      const total = Object.values(geoData).reduce(
                        (sum, region) => sum + region.total,
                        0,
                      );

                      return Object.entries(geoData).map(
                        ([regionName, regionData], idx) => {
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
                                <span className="text-xs text-gray-600">
                                  {regionName}
                                </span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs font-semibold text-gray-900">
                                  {regionData.total}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {percentage}%
                                </span>
                              </div>
                            </div>
                          );
                        },
                      );
                    })()}
                    {Object.keys(geoData).length === 0 && (
                      <p className="text-center text-gray-500 py-4 text-xs">
                        Tidak ada data
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Row 4: Top Contributors */}
            <div>
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Kontributor Aktivitas Teratas
                </h2>
                <div className="space-y-2">
                  {topContributors.map((contributor) => (
                    <div
                      key={contributor.rank}
                      className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center">
                          <span className="text-sm font-semibold text-orange-700">
                            {contributor.rank}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {contributor.username}
                          </p>
                          <p className="text-xs text-gray-500">
                            {contributor.unit}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-900">
                        {contributor.requests} request
                      </span>
                    </div>
                  ))}
                  {topContributors.length === 0 && (
                    <p className="text-center text-gray-500 py-8">
                      Tidak ada data kontributor
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
