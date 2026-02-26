/**
 * RecentSearches.tsx
 *
 * Blok "Pencarian Terakhir": daftar pencarian yang disimpan di localStorage
 * (key: monika-recent-searches). Tiap item menampilkan query + badge filter (cluster,
 * status, dateRange). Klik item → onSearchClick(query); tombol hapus per item dan
 * "Hapus Semua". Jika kosong, komponen return null. Fungsi saveRecentSearch diekspor
 * untuk dipanggil saat user melakukan pencarian.
 */

"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

/** Satu entri pencarian: query, timestamp, dan filter opsional (cluster, status, dateRange). */
interface RecentSearch {
  query: string;
  timestamp: number;
  filters?: {
    cluster?: string;
    status?: string;
    dateRange?: string;
  };
}

interface RecentSearchesProps {
  onSearchClick: (query: string) => void;
  maxItems?: number;
}

/**
 * Render daftar pencarian terakhir (max maxItems); kosong → return null.
 */
export default function RecentSearches({
  onSearchClick,
  maxItems = 5,
}: RecentSearchesProps) {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  /** Muat dari localStorage saat mount / maxItems berubah; simpan max maxItems item. */
  useEffect(() => {
    const stored = localStorage.getItem("monika-recent-searches");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed.slice(0, maxItems));
      } catch (e) {
        console.error("Failed to parse recent searches:", e);
      }
    }
  }, [maxItems]);

  /** Hapus satu item di index: update state dan tulis ulang ke localStorage. */
  const handleRemove = (index: number) => {
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    localStorage.setItem("monika-recent-searches", JSON.stringify(updated));
  };

  /** Hapus semua: kosongkan state dan hapus key dari localStorage. */
  const handleClearAll = () => {
    setRecentSearches([]);
    localStorage.removeItem("monika-recent-searches");
  };

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Icon icon="lucide:clock" className="w-5 h-5 text-bpk-orange" />
          <h3 className="text-base font-semibold text-gray-800">
            Pencarian Terakhir
          </h3>
        </div>
        <button
          onClick={handleClearAll}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Hapus Semua
        </button>
      </div>

      {/* Tiap item: klik → onSearchClick(search.query); tombol X → hapus item (stopPropagation) */}
      <div className="space-y-2">
        {recentSearches.map((search, index) => (
          <div
            key={index}
            className="group flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-bpk-orange hover:bg-orange-50 transition-all cursor-pointer"
            onClick={() => onSearchClick(search.query)}
          >
            <Icon
              icon="lucide:search"
              className="w-4 h-4 text-gray-400 group-hover:text-bpk-orange transition-colors flex-shrink-0"
            />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {search.query}
              </p>
              {search.filters && (
                <div className="flex items-center gap-2 mt-1">
                  {search.filters.cluster && (
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {search.filters.cluster}
                    </span>
                  )}
                  {search.filters.status && (
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                      {search.filters.status}
                    </span>
                  )}
                  {search.filters.dateRange && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                      {search.filters.dateRange}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(index);
              }}
              className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Icon icon="lucide:x" className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Simpan pencarian ke localStorage: buang query kosong; hapus duplikat; tambah di depan; max 10.
 */
export function saveRecentSearch(
  query: string,
  filters?: {
    cluster?: string;
    status?: string;
    dateRange?: string;
  },
) {
  if (!query.trim()) return;

  const stored = localStorage.getItem("monika-recent-searches");
  let recentSearches: RecentSearch[] = [];

  if (stored) {
    try {
      recentSearches = JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse recent searches:", e);
    }
  }

  recentSearches = recentSearches.filter((s) => s.query !== query);

  recentSearches.unshift({
    query,
    timestamp: Date.now(),
    filters,
  });

  recentSearches = recentSearches.slice(0, 10);

  localStorage.setItem(
    "monika-recent-searches",
    JSON.stringify(recentSearches),
  );
}
