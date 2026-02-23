"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import SimpleHeader from "@/components/layout/SimpleHeader";
import {
  SearchBar,
  SearchFilters,
  SearchResults,
  saveRecentSearch,
} from "./_components";
import type { ActivityLog } from "@/types/api";
import type { SearchFiltersState } from "./_components/SearchFilters";
import { searchService } from "@/services/api";

function SearchPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [filters, setFilters] = useState<SearchFiltersState>({
    dateRange: searchParams.get("dateRange") || "30",
    customStart: "",
    customEnd: "",
    satker: searchParams.get("satker") || "",
    satkerIds: searchParams
      .get("satkerIds")
      ?.split(",")
      .map(Number)
      .filter(Boolean) || [],
    cluster: searchParams.get("cluster") || "",
    status:
      (searchParams.get("status") as "all" | "success" | "failed") || "all",
    activityTypes:
      searchParams.get("activityTypes")?.split(",").filter(Boolean) || [],
    location: "",
  });
  const [results, setResults] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showFilters, setShowFilters] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (
    searchQuery: string,
    page = 1,
    customFilters?: SearchFiltersState,
  ) => {
    const activeFilters = customFilters || filters;

    setLoading(true);
    setHasSearched(true);

    // Save to recent searches if query exists
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery, {
        cluster: activeFilters.cluster,
        status: activeFilters.status,
        dateRange: activeFilters.dateRange,
      });
    }

    // Build query params
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);

    // Map frontend dateRange to backend format
    if (activeFilters.dateRange && activeFilters.dateRange !== "all") {
      let mappedDateRange = activeFilters.dateRange;
      if (activeFilters.dateRange === "7") mappedDateRange = "7days";
      else if (activeFilters.dateRange === "30") mappedDateRange = "30days";
      else if (activeFilters.dateRange === "90") mappedDateRange = "90days";
      params.set("dateRange", mappedDateRange);
    }

    if (activeFilters.customStart)
      params.set("startDate", activeFilters.customStart);
    if (activeFilters.customEnd) params.set("endDate", activeFilters.customEnd);
    if (activeFilters.satker) params.set("satker", activeFilters.satker);
    if (activeFilters.satkerIds && activeFilters.satkerIds.length > 0) {
      params.set("satkerIds", activeFilters.satkerIds.join(","));
    }
    if (activeFilters.cluster) params.set("cluster", activeFilters.cluster);
    if (activeFilters.status && activeFilters.status !== "all") {
      params.set("status", activeFilters.status.toUpperCase());
    }
    if (activeFilters.activityTypes.length > 0) {
      params.set("activityTypes", activeFilters.activityTypes.join(","));
    }
    params.set("page", page.toString());
    params.set("pageSize", "20");

    // Update URL
    router.push(`/search?${params.toString()}`, { scroll: false });

    try {
      const data = await searchService.globalSearch(params.toString());

      setResults(data.data || []);
      setTotalCount(data.total_count || 0);
      setCurrentPage(data.page || 1);
      setTotalPages(data.total_pages || 0);
    } catch (error) {
      console.error("Search error:", error);
      setResults([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    handleSearch(query, page);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SimpleHeader />

      <main className="pt-24 pb-12">
        <div className="max-w-[1800px] mx-auto px-6">
          {/* Search Bar */}
          <div className="mb-6">
            <SearchBar
              value={query}
              onChange={setQuery}
              onSearch={(q: string) => handleSearch(q)}
            />
          </div>

          {/* Filter Toggle Button */}
          <div className="mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-bpk-orange text-bpk-orange rounded-lg hover:bg-orange-50 transition-colors font-medium text-sm"
            >
              <Icon icon="mdi:filter-variant" className="w-4 h-4" />
              {showFilters ? "Sembunyikan Filter" : "Tampilkan Filter"}
            </button>
          </div>

          {/* Main Content: Filters + Results */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Filters Sidebar */}
            {showFilters && (
              <div className="lg:col-span-1">
                <SearchFilters
                  filters={filters}
                  onChange={setFilters}
                  onApply={() => {
                    console.log("Filter Applied, triggering search...");
                    handleSearch(query);
                  }}
                  onClear={() => {
                    const clearedFilters: SearchFiltersState = {
                      dateRange: "30",
                      customStart: "",
                      customEnd: "",
                      satker: "",
                      satkerIds: [],
                      cluster: "",
                      status: "all",
                      activityTypes: [],
                      location: "",
                    };
                    setFilters(clearedFilters);
                    setHasSearched(false);
                    setResults([]);
                    setTotalCount(0);
                  }}
                />
              </div>
            )}

            {/* Results or Empty State */}
            <div className={showFilters ? "lg:col-span-3" : "lg:col-span-4"}>
              {!hasSearched ? (
                <div className="bg-white rounded-lg-bpk shadow-sm border border-gray-200 p-12">
                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4">
                      <Icon
                        icon="mdi:magnify"
                        className="w-10 h-10 text-bpk-orange"
                      />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      Mulai Pencarian
                    </h3>
                    <p className="text-sm text-gray-500 max-w-sm">
                      Gunakan filter di samping untuk menyaring data aktivitas,
                      lalu klik tombol "Terapkan" untuk menampilkan hasil.
                    </p>
                  </div>
                </div>
              ) : (
                <SearchResults
                  results={results}
                  loading={loading}
                  totalCount={totalCount}
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Loading fallback component
function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="text-slate-600">Memuat pencarian...</p>
      </div>
    </div>
  );
}

// Main export with Suspense boundary
export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchPageContent />
    </Suspense>
  );
}
