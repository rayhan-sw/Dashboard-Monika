"use client";

import { useState, useEffect, useRef } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { dashboardService, regionalService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { HourlyData } from "@/types/api";
import { Filter, ChevronDown, Check } from "lucide-react";

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

// Province to Region mapping (using GeoJSON format - UPPERCASE)
const REGION_MAP: RegionMap = {
  ACEH: "SUMATERA",
  BALI: "JAWA, BALI & NUSA TENGGARA",
  BANTEN: "JAWA, BALI & NUSA TENGGARA",
  BENGKULU: "SUMATERA",
  "DI YOGYAKARTA": "JAWA, BALI & NUSA TENGGARA",
  "DKI JAKARTA": "JAWA, BALI & NUSA TENGGARA",
  GORONTALO: "SULAWESI",
  JAMBI: "SUMATERA",
  "JAWA BARAT": "JAWA, BALI & NUSA TENGGARA",
  "JAWA TENGAH": "JAWA, BALI & NUSA TENGGARA",
  "JAWA TIMUR": "JAWA, BALI & NUSA TENGGARA",
  "KALIMANTAN BARAT": "KALIMANTAN",
  "KALIMANTAN SELATAN": "KALIMANTAN",
  "KALIMANTAN TENGAH": "KALIMANTAN",
  "KALIMANTAN TIMUR": "KALIMANTAN",
  "KALIMANTAN UTARA": "KALIMANTAN",
  "KEPULAUAN BANGKA BELITUNG": "SUMATERA",
  "KEPULAUAN RIAU": "SUMATERA",
  LAMPUNG: "SUMATERA",
  MALUKU: "MALUKU & PAPUA",
  "MALUKU UTARA": "MALUKU & PAPUA",
  "NUSA TENGGARA BARAT": "JAWA, BALI & NUSA TENGGARA",
  "NUSA TENGGARA TIMUR": "JAWA, BALI & NUSA TENGGARA",
  PAPUA: "MALUKU & PAPUA",
  "PAPUA BARAT": "MALUKU & PAPUA",
  "PAPUA BARAT DAYA": "MALUKU & PAPUA",
  "PAPUA PEGUNUNGAN": "MALUKU & PAPUA",
  "PAPUA SELATAN": "MALUKU & PAPUA",
  "PAPUA TENGAH": "MALUKU & PAPUA",
  RIAU: "SUMATERA",
  "SULAWESI BARAT": "SULAWESI",
  "SULAWESI SELATAN": "SULAWESI",
  "SULAWESI TENGAH": "SULAWESI",
  "SULAWESI TENGGARA": "SULAWESI",
  "SULAWESI UTARA": "SULAWESI",
  "SUMATERA BARAT": "SUMATERA",
  "SUMATERA SELATAN": "SUMATERA",
  "SUMATERA UTARA": "SUMATERA",
};

export default function RegionalPage() {
  const { selectedCluster, dateRange, sidebarCollapsed, setSidebarCollapsed } =
    useAppStore();
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedEselon, setSelectedEselon] = useState<string>("Semua Eselon");
  const [tempSelectedEselon, setTempSelectedEselon] =
    useState<string>("Semua Eselon");
  const [showEselonPicker, setShowEselonPicker] = useState(false);
  const eselonPickerRef = useRef<HTMLDivElement>(null);
  const [availableEselons, setAvailableEselons] = useState<string[]>([]);

  // State untuk data dari API
  const [performanceData, setPerformanceData] = useState<SatkerPerformance[]>(
    [],
  );
  const [geoData, setGeoData] = useState<{ [key: string]: GeoRegion }>({});
  const [topContributors, setTopContributors] = useState<TopContributor[]>([]);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [unitHourlyData, setUnitHourlyData] = useState<HourlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHourly, setLoadingHourly] = useState(false);
  const [mapData, setMapData] = useState<{ name: string; count: number }[]>([]);
  const [unitPeakTimes, setUnitPeakTimes] = useState<{ [key: string]: string }>(
    {},
  );

  // Define available eselons
  const AVAILABLE_ESELONS = [
    "Eksternal",
    "Eselon 1",
    "Eselon 2",
    "Eselon 3",
    "Eselon 4",
    "Kelompok Jabatan Fungsional",
  ];

  // Sync temp with selected
  useEffect(() => {
    setTempSelectedEselon(selectedEselon);
  }, [selectedEselon]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        eselonPickerRef.current &&
        !eselonPickerRef.current.contains(event.target as Node)
      ) {
        setShowEselonPicker(false);
      }
    };

    if (showEselonPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEselonPicker]);

  // Fetch data dari API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDate = dateRange.startDate;
        const endDate = dateRange.endDate;
        const cluster =
          selectedCluster === "Semua Cluster" ? "" : selectedCluster;
        const eselon = selectedEselon === "Semua Eselon" ? "" : selectedEselon;

        console.log("Regional Page - Fetching data with params:", {
          startDate,
          endDate,
          cluster,
          eselon,
        });

        // 1. Fetch satker performance data
        const satkerResponse = await regionalService.getUnits(
          1,
          10000,
          startDate,
          endDate,
          cluster,
          eselon,
        );

        console.log(
          "Regional Page - Satker data fetched:",
          satkerResponse.data?.length || 0,
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
          satkerPerformance.length,
        );

        // 2. Fetch locations
        const locationsResponse = await regionalService.getLocations(
          startDate,
          endDate,
          cluster,
          eselon,
        );
        const locations = locationsResponse.data;

        console.log(
          "Regional Page - Locations from DB aggregation:",
          locations.length,
        );

        // 3. Process Geographic Distribution for map
        const provinceMapForChart = new Map<string, number>();

        locations.forEach((item) => {
          const location = item.lokasi?.trim() || "";
          const count = item.count || 0;

          if (!location) return;

          let targetProvince = "";

          // Normalize province names to match GeoJSON format (UPPERCASE)
          const cleanLocation = location.toLowerCase();

          if (cleanLocation.includes("pusat")) {
            targetProvince = "DKI JAKARTA";
          } else if (cleanLocation.includes("aceh")) {
            targetProvince = "ACEH";
          } else if (cleanLocation.includes("yogyakarta")) {
            targetProvince = "DI YOGYAKARTA";
          } else if (cleanLocation.includes("jakarta")) {
            targetProvince = "DKI JAKARTA";
          } else if (
            cleanLocation.includes("bangka") ||
            cleanLocation.includes("belitung")
          ) {
            targetProvince = "KEPULAUAN BANGKA BELITUNG";
          } else {
            // Try to match with REGION_MAP keys
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
              // Convert to GeoJSON format (UPPERCASE)
              targetProvince = matchedProvince.toUpperCase();
            } else {
              targetProvince = location.toUpperCase();
            }
          }

          if (targetProvince) {
            provinceMapForChart.set(
              targetProvince,
              (provinceMapForChart.get(targetProvince) || 0) + count,
            );
          }
        });

        const mapProvinceData = Array.from(provinceMapForChart.entries()).map(
          ([name, count]) => ({ name, count }),
        );

        setMapData(mapProvinceData);

        console.log(
          "Regional Page - Map data processed:",
          mapProvinceData.length,
          "provinces",
        );
        console.log("Regional Page - Province mapping:", mapProvinceData);

        // 4. Process Geographic Distribution for chart (normalize to UPPERCASE)
        const provinceMap = new Map<string, number>();
        locations.forEach((item) => {
          const location = item.lokasi?.trim() || "";
          const count = item.count || 0;

          if (!location) return;

          let normalizedProvince = "";
          const cleanLocation = location.toLowerCase();

          // Normalize province names to match GeoJSON format (UPPERCASE)
          if (cleanLocation.includes("pusat")) {
            normalizedProvince = "DKI JAKARTA";
          } else if (cleanLocation.includes("aceh")) {
            normalizedProvince = "ACEH";
          } else if (cleanLocation.includes("yogyakarta")) {
            normalizedProvince = "DI YOGYAKARTA";
          } else if (cleanLocation.includes("jakarta")) {
            normalizedProvince = "DKI JAKARTA";
          } else if (
            cleanLocation.includes("bangka") ||
            cleanLocation.includes("belitung")
          ) {
            normalizedProvince = "KEPULAUAN BANGKA BELITUNG";
          } else if (cleanLocation.includes("sumatera utara")) {
            normalizedProvince = "SUMATERA UTARA";
          } else if (cleanLocation.includes("sumatera barat")) {
            normalizedProvince = "SUMATERA BARAT";
          } else if (cleanLocation.includes("sumatera selatan")) {
            normalizedProvince = "SUMATERA SELATAN";
          } else if (cleanLocation.includes("jawa barat")) {
            normalizedProvince = "JAWA BARAT";
          } else if (cleanLocation.includes("jawa tengah")) {
            normalizedProvince = "JAWA TENGAH";
          } else if (cleanLocation.includes("jawa timur")) {
            normalizedProvince = "JAWA TIMUR";
          } else if (cleanLocation.includes("kalimantan barat")) {
            normalizedProvince = "KALIMANTAN BARAT";
          } else if (cleanLocation.includes("kalimantan tengah")) {
            normalizedProvince = "KALIMANTAN TENGAH";
          } else if (cleanLocation.includes("kalimantan selatan")) {
            normalizedProvince = "KALIMANTAN SELATAN";
          } else if (cleanLocation.includes("kalimantan timur")) {
            normalizedProvince = "KALIMANTAN TIMUR";
          } else if (cleanLocation.includes("kalimantan utara")) {
            normalizedProvince = "KALIMANTAN UTARA";
          } else if (cleanLocation.includes("sulawesi utara")) {
            normalizedProvince = "SULAWESI UTARA";
          } else if (cleanLocation.includes("sulawesi tengah")) {
            normalizedProvince = "SULAWESI TENGAH";
          } else if (cleanLocation.includes("sulawesi selatan")) {
            normalizedProvince = "SULAWESI SELATAN";
          } else if (cleanLocation.includes("sulawesi tenggara")) {
            normalizedProvince = "SULAWESI TENGGARA";
          } else if (cleanLocation.includes("sulawesi barat")) {
            normalizedProvince = "SULAWESI BARAT";
          } else if (cleanLocation.includes("nusa tenggara barat")) {
            normalizedProvince = "NUSA TENGGARA BARAT";
          } else if (cleanLocation.includes("nusa tenggara timur")) {
            normalizedProvince = "NUSA TENGGARA TIMUR";
          } else if (cleanLocation.includes("papua barat daya")) {
            normalizedProvince = "PAPUA BARAT DAYA";
          } else if (cleanLocation.includes("papua pegunungan")) {
            normalizedProvince = "PAPUA PEGUNUNGAN";
          } else if (cleanLocation.includes("papua selatan")) {
            normalizedProvince = "PAPUA SELATAN";
          } else if (cleanLocation.includes("papua tengah")) {
            normalizedProvince = "PAPUA TENGAH";
          } else if (cleanLocation.includes("papua barat")) {
            normalizedProvince = "PAPUA BARAT";
          } else if (cleanLocation.includes("papua")) {
            normalizedProvince = "PAPUA";
          } else {
            // Try to match with REGION_MAP keys (already UPPERCASE)
            const matchedProvince = Object.keys(REGION_MAP).find(
              (provinceName) => {
                const cleanProvince = provinceName.toLowerCase();
                return (
                  cleanLocation.includes(cleanProvince) ||
                  cleanProvince.includes(cleanLocation)
                );
              },
            );

            normalizedProvince = matchedProvince || location.toUpperCase();
          }

          if (normalizedProvince) {
            provinceMap.set(
              normalizedProvince,
              (provinceMap.get(normalizedProvince) || 0) + count,
            );
          }
        });

        const regionData: { [key: string]: GeoRegion } = {};
        const sortedProvinces = Array.from(provinceMap.entries()).sort(
          (a, b) => b[1] - a[1],
        );

        sortedProvinces.forEach(([provinceName, count]) => {
          let region;

          // Check if it's PUSAT
          if (
            provinceName === "DKI JAKARTA" ||
            provinceName.includes("PUSAT")
          ) {
            region = "PUSAT";
          } else {
            // Get region from REGION_MAP (keys are already UPPERCASE)
            region = REGION_MAP[provinceName];

            if (!region) {
              region = "LAINNYA";
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
          "regions",
        );

        // 5. Fetch Top Contributors
        const contributorsResponse = await regionalService.getTopContributors(
          10,
          startDate,
          endDate,
          cluster,
          eselon,
        );
        setTopContributors(contributorsResponse.data || []);

        console.log(
          "Regional Page - Top contributors fetched:",
          contributorsResponse.data?.length || 0,
        );

        // 6. Fetch Hourly Chart Data
        const hourlyResponse = await dashboardService.getHourlyChart(
          startDate,
          endDate,
          cluster,
          eselon,
        );
        setHourlyData(hourlyResponse.data || []);

        console.log(
          "Regional Page - Hourly data fetched:",
          hourlyResponse.data?.length || 0,
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
  }, [selectedCluster, dateRange, selectedEselon]);

  // Fetch peak times for all units
  useEffect(() => {
    const fetchAllUnitPeakTimes = async () => {
      if (performanceData.length === 0) return;

      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      const cluster =
        selectedCluster === "Semua Cluster" ? "" : selectedCluster;
      const eselon = selectedEselon === "Semua Eselon" ? "" : selectedEselon;

      const peakTimesMap: { [key: string]: string } = {};

      // Fetch peak time for top 10 units
      const promises = performanceData.slice(0, 10).map(async (unit) => {
        try {
          const response = await regionalService.getUnitHourlyData(
            unit.satker,
            startDate,
            endDate,
            cluster,
            eselon,
          );

          const hourlyData = response.data || [];
          if (hourlyData.length > 0) {
            const maxData = hourlyData.reduce(
              (max, current) => (current.count > max.count ? current : max),
              hourlyData[0],
            );
            peakTimesMap[unit.satker] =
              `${maxData.hour.toString().padStart(2, "0")}:00`;
          } else {
            peakTimesMap[unit.satker] = "00:00";
          }
        } catch (error) {
          console.error(`Error fetching peak time for ${unit.satker}:`, error);
          peakTimesMap[unit.satker] = "00:00";
        }
      });

      await Promise.all(promises);
      setUnitPeakTimes(peakTimesMap);
    };

    fetchAllUnitPeakTimes();
  }, [performanceData, selectedCluster, dateRange, selectedEselon]);

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
        const eselon = selectedEselon === "Semua Eselon" ? "" : selectedEselon;

        const response = await regionalService.getUnitHourlyData(
          selectedUnit,
          startDate,
          endDate,
          cluster,
          eselon,
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
  }, [selectedUnit, selectedCluster, dateRange, selectedEselon, hourlyData]);

  // Handle apply eselon filter
  const handleApplyEselon = () => {
    setSelectedEselon(tempSelectedEselon);
    setShowEselonPicker(false);
  };

  // Get eselon display text
  const getEselonDisplayText = () => {
    return selectedEselon;
  };

  // Calculate peak time from hourly data
  const getPeakTime = () => {
    if (unitHourlyData.length === 0) return "00:00";

    const maxData = unitHourlyData.reduce(
      (max, current) => (current.count > max.count ? current : max),
      unitHourlyData[0],
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
            {/* Page Header with Filter */}
            <div className="flex items-center justify-between gap-6">
              {/* Left: Page Title and Description */}
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-2">
                  Analisis Organisasi & Regional
                </h1>
                <p className="text-gray-600">
                  Analisis komprehensif kinerja unit, distribusi geografis, dan
                  keterlibatan pengguna
                </p>
              </div>

              {/* Right: Filter Eselon */}
              <div className="relative flex-shrink-0" ref={eselonPickerRef}>
                <button
                  onClick={() => setShowEselonPicker(!showEselonPicker)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-amber-500 rounded-lg hover:bg-amber-50 transition-colors shadow-sm"
                >
                  <Filter className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-gray-700 font-medium">
                    {getEselonDisplayText()}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-amber-500 transition-transform ${
                      showEselonPicker ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Eselon Picker Dropdown */}
                {showEselonPicker && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]">
                    <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                      {/* Semua Eselon Option */}
                      <button
                        onClick={() => setTempSelectedEselon("Semua Eselon")}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                          tempSelectedEselon === "Semua Eselon"
                            ? "bg-amber-50 border border-amber-500"
                            : "hover:bg-gray-100 border border-transparent"
                        }`}
                      >
                        <span
                          className={`text-sm ${
                            tempSelectedEselon === "Semua Eselon"
                              ? "text-amber-600 font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          Semua Eselon
                        </span>
                        {tempSelectedEselon === "Semua Eselon" && (
                          <Check className="w-4 h-4 text-amber-500" />
                        )}
                      </button>

                      {/* Individual Eselon Options */}
                      {AVAILABLE_ESELONS.map((eselon) => (
                        <button
                          key={eselon}
                          onClick={() => setTempSelectedEselon(eselon)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors ${
                            tempSelectedEselon === eselon
                              ? "bg-amber-50 border border-amber-500"
                              : "hover:bg-gray-100 border border-transparent"
                          }`}
                        >
                          <span
                            className={`text-sm ${
                              tempSelectedEselon === eselon
                                ? "text-amber-600 font-semibold"
                                : "text-gray-700"
                            }`}
                          >
                            {eselon}
                          </span>
                          {tempSelectedEselon === eselon && (
                            <Check className="w-4 h-4 text-amber-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Apply Button */}
                    <button
                      onClick={handleApplyEselon}
                      className="w-full py-2 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors text-sm font-semibold shadow-sm"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
              </div>
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
              unitPeakTimes={unitPeakTimes}
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
