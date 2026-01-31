"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { dashboardService, regionalService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { HourlyData } from "@/types/api";

// Import regional-specific components
import UnitPerformanceRanking from "./_components/UnitPerformanceRanking";
import IndonesiaMapSection from "./_components/IndonesiaMapSection";
import UnitOperationalHours from "./_components/UnitOperationalHours";
import GeographicDistributionList from "./_components/GeographicDistributionList";
import GeographicDistributionChart from "./_components/GeographicDistributionChart";
import TopContributors from "./_components/TopContributors";
import Footer from "@/components/layout/Footer";

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
  const { selectedCluster, dateRange, sidebarCollapsed, setSidebarCollapsed } =
    useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  // State untuk data dari API
  const [performanceData, setPerformanceData] = useState<SatkerPerformance[]>(
    []
  );
  const [geoData, setGeoData] = useState<{ [key: string]: GeoRegion }>({});
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [unitHourlyData, setUnitHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [mapData, setMapData] = useState<{ name: string; count: number }[]>(
    []
  );

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

        // 1. Fetch satker performance data
        const satkerResponse = await regionalService.getUnits(
          1,
          10000,
          startDate,
          endDate,
          cluster
        );

        console.log(
          "Regional Page - Satker data fetched:",
          satkerResponse.data?.length || 0
        );

        // Filter out NULL, ---, and numeric-only satkers
        const satkerPerformance = (satkerResponse.data || [])
          .filter((item: any) => {
            const satkerName = item.satker?.trim() || "";
            if (
              satkerName === "" ||
              satkerName === "NULL" ||
              satkerName === "---"
            ) {
              return false;
            }
            if (/^\d+$/.test(satkerName)) {
              return false;
            }
            return true;
          })
          .map((item: any) => ({
            satker: item.satker,
            requests: item.count,
            peakTime: "00:00",
            rank: item.rank || 0,
          }));

        setPerformanceData(satkerPerformance);
        if (satkerPerformance.length > 0 && !selectedUnit) {
          setSelectedUnit(satkerPerformance[0].satker);
        }

        console.log(
          "Regional Page - Performance data processed:",
          satkerPerformance.length
        );

        // 2. Fetch locations
        const locationsResponse = await regionalService.getLocations(
          startDate,
          endDate,
          cluster
        );
        const locations = locationsResponse.data;

        console.log(
          "Regional Page - Locations from DB aggregation:",
          locations.length
        );

        // 3. Process Geographic Distribution for map
        const provinceMapForChart = new Map<string, number>();

        locations.forEach((item) => {
          const location = item.lokasi?.trim() || "";
          const count = item.count || 0;

          if (!location) return;

          let targetProvince = "";

          if (location.toLowerCase().includes("pusat")) {
            targetProvince = "DKI Jakarta";
          } else {
            const cleanLocation = location.toLowerCase();

            if (cleanLocation.includes("aceh")) {
              targetProvince = "DI. ACEH";
            } else if (cleanLocation.includes("yogyakarta")) {
              targetProvince = "DI. YOGYAKARTA";
            } else if (cleanLocation.includes("jakarta")) {
              targetProvince = "DKI JAKARTA";
            } else {
              const matchedProvince = Object.keys(REGION_MAP).find(
                (provinceName) => {
                  const cleanProvince = provinceName.toLowerCase();
                  return (
                    cleanLocation.includes(cleanProvince) ||
                    cleanProvince.includes(cleanLocation)
                  );
                }
              );

              if (matchedProvince) {
                targetProvince = matchedProvince;
              } else {
                targetProvince = location;
              }
            }
          }

          if (targetProvince) {
            provinceMapForChart.set(
              targetProvince,
              (provinceMapForChart.get(targetProvince) || 0) + count
            );
          }
        });

        const mapProvinceData = Array.from(provinceMapForChart.entries()).map(
          ([name, count]) => ({ name, count })
        );

        setMapData(mapProvinceData);

        console.log(
          "Regional Page - Map data processed:",
          mapProvinceData.length,
          "provinces"
        );

        // 4. Process Geographic Distribution for chart
        const provinceMap = new Map<string, number>();
        locations.forEach((item) => {
          const location = item.lokasi;
          const count = item.count || 0;
          if (location && location.trim() !== "") {
            provinceMap.set(location, count);
          }
        });

        const regionData: { [key: string]: GeoRegion } = {};
        const sortedProvinces = Array.from(provinceMap.entries()).sort(
          (a, b) => b[1] - a[1]
        );

        sortedProvinces.forEach(([location, count]) => {
          let provinceName = location;
          let region;

          if (location.toLowerCase().includes("pusat")) {
            region = "PUSAT";
            provinceName = location;
          } else {
            region = REGION_MAP[location];

            if (!region) {
              const matchedKey = Object.keys(REGION_MAP).find(
                (key) =>
                  location.toLowerCase().includes(key.toLowerCase()) ||
                  key.toLowerCase().includes(location.toLowerCase())
              );
              if (matchedKey) {
                region = REGION_MAP[matchedKey];
                provinceName = matchedKey;
              }
            }

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
            highlighted: count > 50,
          });
        });

        Object.keys(regionData).forEach((region) => {
          regionData[region].provinces.sort((a, b) => b.count - a.count);
        });

        setGeoData(regionData);

        console.log(
          "Regional Page - Geographic data processed:",
          Object.keys(regionData).length,
          "regions"
        );

        // 5. Fetch Top Contributors
        const contributorsResponse = await regionalService.getTopContributors(
          10,
          startDate,
          endDate,
          cluster
        );
        setTopContributors(contributorsResponse.data || []);

        console.log(
          "Regional Page - Top contributors fetched:",
          contributorsResponse.data?.length || 0
        );

        // 6. Fetch Hourly Chart Data
        const hourlyResponse = await dashboardService.getHourlyChart(
          startDate,
          endDate,
          cluster
        );
        setHourlyData(hourlyResponse.data || []);

        console.log(
          "Regional Page - Hourly data fetched:",
          hourlyResponse.data?.length || 0
        );
      } catch (error) {
        console.error("Error fetching regional data:", error);
        setPerformanceData([]);
        setGeoData({});
        setTopContributors([]);
        setHourlyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCluster, dateRange]);

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
          cluster
        );

        setUnitHourlyData(response.data || []);
      } catch (error) {
        console.error("Error fetching unit hourly data:", error);
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

    const maxData = unitHourlyData.reduce(
      (max, current) => (current.count > max.count ? current : max),
      unitHourlyData[0]
    );

    return `${maxData.hour.toString().padStart(2, "0")}:00`;
  };

  const displayHourlyData =
    unitHourlyData.length > 0 ? unitHourlyData : hourlyData;

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
        className={`flex-1 flex flex-col min-h-screen transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          sidebarCollapsed ? "ml-20" : "ml-80"
        }`}
      >
        <Header sidebarCollapsed={sidebarCollapsed} />
        <main className="pt-20 p-8 flex-1">
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
              <UnitPerformanceRanking performanceData={performanceData} />
              <IndonesiaMapSection mapData={mapData} />
            </div>

            {/* Row 2: Operational Hours Chart */}
            <UnitOperationalHours
              performanceData={performanceData}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              displayHourlyData={displayHourlyData}
              loadingHourly={loadingHourly}
              getPeakTime={getPeakTime}
            />

            {/* Row 3: Geographic Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <GeographicDistributionList geoData={geoData} />
              <GeographicDistributionChart geoData={geoData} />
            </div>

            {/* Row 4: Top Contributors */}
            <TopContributors topContributors={topContributors} />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
