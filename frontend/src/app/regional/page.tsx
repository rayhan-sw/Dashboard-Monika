/**
 * page.tsx – Halaman Analisis Organisasi & Regional
 *
 * Layout: Sidebar + Header + main. Filter: rentang tanggal & cluster dari store;
 * filter Eselon I (dropdown) mempengaruhi semua data. Data di-fetch sekali saat
 * mount/ubah filter: performa satker, lokasi (provinsi), peta, geo region, top
 * kontributor, hourly global; peak time per unit dan hourly per unit terpilih
 * di-fetch terpisah. Komponen: UnitPerformanceRanking, Peta, Jam Operasional,
 * Distribusi Geografis (list + chart), Engagement Eselon, Top Contributors.
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import {
  dashboardService,
  regionalService,
  type SatkerRoot,
} from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import type { HourlyData } from "@/types/api";
import { Filter, ChevronDown, Check } from "lucide-react";
import Footer from "@/components/layout/Footer";

import {
  UnitPerformanceRanking,
  IndonesiaMapSection,
  UnitOperationalHours,
  GeographicDistributionList,
  GeographicDistributionChart,
  EngagementEselonChart,
  TopContributors,
} from "./_components";

/** Satu satker: nama, jumlah request, jam puncak, peringkat. */
interface SatkerPerformance {
  satker: string;
  requests: number;
  peakTime: string;
  rank: number;
}

/** Satu region geografis: total akses + daftar provinsi (name, count, highlighted). */
interface GeoRegion {
  total: number;
  provinces: {
    name: string;
    count: number;
    highlighted: boolean;
  }[];
}

/** Satu kontributor: peringkat, username, unit, jumlah request. */
interface TopContributor {
  rank: number;
  username: string;
  unit: string;
  requests: number;
}

/** Mapping nama provinsi (UPPERCASE) → nama region untuk chart/daftar geografis. */
interface RegionMap {
  [key: string]: string;
}

/** Provinsi → region (format GeoJSON UPPERCASE); dipakai untuk agregasi geoData. */
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
  const router = useRouter();
  const selectedCluster = useAppStore((state) => state.selectedCluster);
  const dateRange = useAppStore((state) => state.dateRange);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [selectedEselon, setSelectedEselon] = useState<string>("Semua Eselon");
  const [selectedEselonRootId, setSelectedEselonRootId] = useState<
    number | null
  >(null);
  const [tempSelectedEselon, setTempSelectedEselon] =
    useState<string>("Semua Eselon");
  const [tempSelectedEselonRootId, setTempSelectedEselonRootId] = useState<
    number | null
  >(null);
  const [showEselonPicker, setShowEselonPicker] = useState(false);
  const eselonPickerRef = useRef<HTMLDivElement>(null);
  const [eselonRoots, setEselonRoots] = useState<SatkerRoot[]>([]);

  /** Cek token: tidak ada → redirect ke /auth/login; ada → set authLoading false. */
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) {
      router.push("/auth/login");
    } else {
      setAuthLoading(false);
    }
  }, [router]);

  /** Ambil daftar Eselon I (roots) untuk opsi filter dropdown. */
  useEffect(() => {
    regionalService
      .getSatkerRoots()
      .then((res) => setEselonRoots(res.roots || []))
      .catch(() => setEselonRoots([]));
  }, []);

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

  /** Sinkronkan temp (pilihan di dropdown) dengan selected saat selected berubah. */
  useEffect(() => {
    setTempSelectedEselon(selectedEselon);
    setTempSelectedEselonRootId(selectedEselonRootId);
  }, [selectedEselon, selectedEselonRootId]);

  /** Tutup dropdown Eselon saat klik di luar eselonPickerRef. */
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

  /** Fetch semua data regional: satker, lokasi, peta, geo region, top contributors, hourly. */
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
          rootSatkerId: selectedEselonRootId,
        });

        /** 1. Performa satker: getUnits dengan filter root (Eselon I) opsional. */
        const satkerResponse = await regionalService.getUnits(
          1,
          10000,
          startDate,
          endDate,
          cluster,
          undefined,
          selectedEselonRootId ?? undefined,
        );

        console.log(
          "Regional Page - Satker data fetched:",
          satkerResponse.data?.length || 0,
        );

        /** Buang satker invalid: kosong, "NULL", "---", atau nama hanya angka. */
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

        /** 2. Lokasi per provinsi (agregasi dari backend) untuk peta dan distribusi geografis. */
        const locationsResponse = await regionalService.getLocations(
          startDate,
          endDate,
          cluster,
          undefined,
          selectedEselonRootId ?? undefined,
        );
        const locations = locationsResponse?.data ?? [];

        console.log(
          "Regional Page - Satker provinces from DB aggregation:",
          locations.length,
        );

        /** 3. Data peta: lokasi → { name, count }, buang yang nama kosong. */
        const mapProvinceData = locations
          .map((item: { lokasi?: string; count?: number }) => ({
            name: item.lokasi?.trim() || "",
            count: item.count || 0,
          }))
          .filter((item) => item.name !== "");

        setMapData(mapProvinceData);

        console.log(
          "Regional Page - Map data processed:",
          mapProvinceData.length,
          "provinces",
        );
        console.log("Regional Page - Province mapping:", mapProvinceData);

        /** 4. Agregasi per region: provinsi → region via REGION_MAP; DKI/PUSAT → PUSAT; provinsi diurut count desc. */
        const regionData: { [key: string]: GeoRegion } = {};

        locations.forEach((item) => {
          const provinceName = item.lokasi?.trim() || "";
          const count = item.count || 0;

          if (!provinceName) return;

          let region;

          if (
            provinceName === "DKI JAKARTA" ||
            provinceName.includes("PUSAT")
          ) {
            region = "PUSAT";
          } else {
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

        /** 5. Top 10 kontributor (username, unit, requests). */
        const contributorsResponse = await regionalService.getTopContributors(
          10,
          startDate,
          endDate,
          cluster,
          undefined,
          selectedEselonRootId ?? undefined,
        );
        setTopContributors(contributorsResponse.data || []);

        console.log(
          "Regional Page - Top contributors fetched:",
          contributorsResponse.data?.length || 0,
        );

        /** 6. Data hourly global (fallback chart jika belum pilih unit). */
        const hourlyResponse = await dashboardService.getHourlyChart(
          startDate,
          endDate,
          cluster,
          undefined,
          selectedEselonRootId ?? undefined,
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
  }, [selectedCluster, dateRange, selectedEselon, selectedEselonRootId]);

  /** Hitung jam puncak tiap unit (10 teratas): getUnitHourlyData → cari jam dengan count max. */
  useEffect(() => {
    const fetchAllUnitPeakTimes = async () => {
      if (performanceData.length === 0) return;

      const startDate = dateRange.startDate;
      const endDate = dateRange.endDate;
      const cluster =
        selectedCluster === "Semua Cluster" ? "" : selectedCluster;
      const peakTimesMap: { [key: string]: string } = {};

      // Fetch peak time for top 10 units
      const promises = performanceData.slice(0, 10).map(async (unit) => {
        try {
          const response = await regionalService.getUnitHourlyData(
            unit.satker,
            startDate,
            endDate,
            cluster,
            undefined,
            selectedEselonRootId ?? undefined,
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
  }, [performanceData, selectedCluster, dateRange, selectedEselonRootId]);

  /** Data jam-per-jam untuk unit terpilih: dipakai chart Jam Operasional. */
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
          undefined,
          selectedEselonRootId ?? undefined,
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
  }, [
    selectedUnit,
    selectedCluster,
    dateRange,
    selectedEselonRootId,
    hourlyData,
  ]);

  /** Terapkan filter Eselon: salin temp ke selected dan tutup dropdown. */
  const handleApplyEselon = () => {
    setSelectedEselon(tempSelectedEselon);
    setSelectedEselonRootId(tempSelectedEselonRootId);
    setShowEselonPicker(false);
  };

  const getEselonDisplayText = () => {
    return selectedEselon;
  };

  /** Jam puncak unit terpilih: dari unitHourlyData, ambil jam dengan count tertinggi. */
  const getPeakTime = () => {
    if (unitHourlyData.length === 0) return "00:00";

    const maxData = unitHourlyData.reduce(
      (max, current) => (current.count > max.count ? current : max),
      unitHourlyData[0],
    );

    return `${maxData.hour.toString().padStart(2, "0")}:00`;
  };

  /** Chart jam operasional: pakai data unit terpilih jika ada, else data hourly global. */
  const displayHourlyData =
    unitHourlyData.length > 0 ? unitHourlyData : hourlyData;

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-amber-500 border-r-transparent"></div>
          <p className="text-[#8E8E93]">Memuat data regional...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-h-screen ml-80">
        <Header />
        <main className="pt-20 p-8 flex-1 bg-white">
          <div className="max-w-[1800px] mx-auto space-y-8">
            <div className="flex items-center justify-between gap-6">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent mb-2">
                  Analisis Organisasi & Regional
                </h1>
                <p className="text-gray-600">
                  Analisis komprehensif kinerja unit, distribusi geografis, dan
                  keterlibatan pengguna
                </p>
              </div>

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

                {showEselonPicker && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50 min-w-[280px]">
                    <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                      <button
                        onClick={() => {
                          setTempSelectedEselon("Semua Eselon");
                          setTempSelectedEselonRootId(null);
                        }}
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

                      {eselonRoots.map((root) => (
                        <button
                          key={root.id}
                          onClick={() => {
                            setTempSelectedEselon(root.satker_name);
                            setTempSelectedEselonRootId(root.id);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-colors text-left ${
                            tempSelectedEselonRootId === root.id
                              ? "bg-amber-50 border border-amber-500"
                              : "hover:bg-gray-100 border border-transparent"
                          }`}
                        >
                          <span
                            className={`text-sm truncate ${
                              tempSelectedEselonRootId === root.id
                                ? "text-amber-600 font-semibold"
                                : "text-gray-700"
                            }`}
                            title={root.satker_name}
                          >
                            {root.satker_name}
                          </span>
                          {tempSelectedEselonRootId === root.id && (
                            <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>

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

            {/* Baris 1: Peringkat kinerja unit (Top/Bottom 10) + Peta Indonesia */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 isolate">
              <UnitPerformanceRanking
                performanceData={performanceData}
                dateRange={dateRange}
                selectedCluster={selectedCluster}
                selectedEselon={selectedEselon}
              />
              <IndonesiaMapSection
                mapData={mapData}
                dateRange={dateRange}
                selectedCluster={selectedCluster}
                selectedEselon={selectedEselon}
              />
            </div>

            {/* Baris 2: Jam operasional unit (daftar unit + chart per jam) */}
            <UnitOperationalHours
              performanceData={performanceData}
              selectedUnit={selectedUnit}
              setSelectedUnit={setSelectedUnit}
              displayHourlyData={displayHourlyData}
              loadingHourly={loadingHourly}
              getPeakTime={getPeakTime}
              unitPeakTimes={unitPeakTimes}
              dateRange={dateRange}
              selectedCluster={selectedCluster}
              selectedEselon={selectedEselon}
            />

            {/* Baris 3: Distribusi geografis (daftar region + donut chart) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <GeographicDistributionList
                geoData={geoData}
                dateRange={dateRange}
                selectedCluster={selectedCluster}
                selectedEselon={selectedEselon}
              />
              <GeographicDistributionChart
                geoData={geoData}
                dateRange={dateRange}
                selectedCluster={selectedCluster}
                selectedEselon={selectedEselon}
              />
            </div>

            {/* Baris 4: Keterlibatan per Eselon I / Eselon II */}
            <EngagementEselonChart
              dateRange={dateRange}
              selectedCluster={selectedCluster}
              selectedEselonRootId={selectedEselonRootId}
              eselonRoots={eselonRoots}
              selectedEselonName={selectedEselon}
            />

            {/* Baris 5: Kontributor aktivitas teratas */}
            <TopContributors
              topContributors={topContributors}
              dateRange={dateRange}
              selectedCluster={selectedCluster}
              selectedEselon={selectedEselon}
            />
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
