/**
 * SearchBar.tsx
 *
 * Input pencarian + dropdown saran: value/onChange dikontrol parent; ketik ≥2 karakter
 * memicu getSuggestions (debounce 300ms). Saran dikelompokkan per tipe (user, satker,
 * lokasi); klik saran → isi value + panggil onSearch. Submit form → onSearch(value.trim()).
 */

"use client";

import { Icon } from "@iconify/react";
import { useState, useRef, useEffect } from "react";
import { searchService } from "@/services/api";

/** Satu saran: tipe (user/satker/lokasi), value, label. */
interface Suggestion {
  type: "user" | "satker" | "lokasi";
  value: string;
  label: string;
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: (query: string) => void;
}

export default function SearchBar({
  value,
  onChange,
  onSearch,
}: SearchBarProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /** Tutup dropdown saran saat klik di luar containerRef. */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /** Ambil saran saat value ≥2 karakter; debounce 300ms; map response ke { type, value, label }. */
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }

    const debounce = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchService.getSuggestions(q);

        const mappedSuggestions: Suggestion[] = (data.suggestions || []).map(
          (s: { type?: string; value?: string; label?: string }) => ({
            type: (s.type as "user" | "satker" | "lokasi") || "user",
            value: s.value || s.label || "",
            label: s.label || s.value || "",
          }),
        );

        setSuggestions(mappedSuggestions);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onSearch(value.trim());
      setShowSuggestions(false);
    }
  };
  /** Submit: panggil onSearch dengan value trim, tutup dropdown. */

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    onChange(suggestion.value);
    onSearch(suggestion.value);
    setShowSuggestions(false);
  };
  /** Klik saran: isi value, trigger onSearch, tutup dropdown. */

  const getIconForType = (type: string) => {
    switch (type) {
      case "user":
        return "mdi:account";
      case "satker":
        return "mdi:office-building";
      case "lokasi":
        return "mdi:map-marker";
      default:
        return "mdi:magnify";
    }
  };

  /** Ikon: user=account, satker=gedung, lokasi=map-marker. Warna: biru/hijau/ungu per tipe. */

  const getColorForType = (type: string) => {
    switch (type) {
      case "user":
        return "text-blue-500 bg-blue-50";
      case "satker":
        return "text-green-500 bg-green-50";
      case "lokasi":
        return "text-purple-500 bg-purple-50";
      default:
        return "text-gray-500 bg-gray-50";
    }
  };

  const getLabelForType = (type: string) => {
    switch (type) {
      case "user":
        return "Pengguna";
      case "satker":
        return "Satuan Kerja";
      case "lokasi":
        return "Lokasi";
      default:
        return "Lainnya";
    }
  };

  /** Kelompokkan saran per type untuk tampil per kategori di dropdown. */
  const groupedSuggestions = suggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = [];
      }
      acc[suggestion.type].push(suggestion);
      return acc;
    },
    {} as Record<string, Suggestion[]>,
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center gap-4">
          {/* Search Input Container */}
          <div className="relative flex-1">
            <Icon
              icon="mdi:magnify"
              className="absolute left-5 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400 pointer-events-none"
            />

            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Cari user, aktivitas, satker, atau lokasi..."
              className="w-full h-14 pl-14 pr-16 text-base rounded-xl border-2 border-gray-200 
                       focus:border-bpk-orange focus:ring-4 focus:ring-bpk-orange/10 
                       outline-none transition-all text-gray-800 placeholder:text-gray-400
                       shadow-sm hover:border-gray-300 bg-white"
            />

            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 
                         w-8 h-8 flex items-center justify-center rounded-full
                         text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                         transition-all duration-200"
                aria-label="Hapus pencarian"
              >
                <Icon icon="mdi:close" className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="h-14 px-10 bg-gradient-to-r from-bpk-orange to-orange-600 
                     text-white rounded-xl hover:from-orange-600 hover:to-orange-700
                     transition-all duration-200 font-semibold text-base
                     shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-95
                     flex items-center gap-2.5 whitespace-nowrap flex-shrink-0"
          >
            <Icon icon="mdi:magnify" className="w-5 h-5" />
            <span>Cari</span>
          </button>
        </div>
      </form>

      {showSuggestions && value.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-200 max-h-[500px] overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-12 h-12 mx-auto mb-3 relative">
                <Icon
                  icon="mdi:loading"
                  className="w-12 h-12 animate-spin text-bpk-orange"
                />
              </div>
              <p className="text-sm font-medium text-gray-600">Mencari...</p>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <Icon
                  icon="mdi:magnify-close"
                  className="w-8 h-8 text-gray-400"
                />
              </div>
              <p className="text-base font-medium text-gray-700 mb-1">
                Tidak ada hasil ditemukan
              </p>
              <p className="text-sm text-gray-500">
                Tekan{" "}
                <span className="font-semibold text-bpk-orange">Cari</span>{" "}
                untuk mencari &quot;{value}&quot;
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-[500px] custom-scrollbar">
              {Object.entries(groupedSuggestions).map(([type, items]) => (
                <div
                  key={type}
                  className="border-b border-gray-100 last:border-b-0"
                >
                  {/* Category Header */}
                  <div className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-gray-50 to-transparent sticky top-0 z-10">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center ${getColorForType(type)}`}
                    >
                      <Icon icon={getIconForType(type)} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                      {getLabelForType(type)}
                    </span>
                    <span className="text-xs font-medium text-gray-400 ml-1">
                      {items.length}
                    </span>
                  </div>

                  {/* Suggestion Items */}
                  <div className="divide-y divide-gray-50">
                    {items.map((suggestion, index) => (
                      <button
                        key={`${type}-${index}`}
                        onClick={() => handleSuggestionSelect(suggestion)}
                        className="w-full px-5 py-3.5 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-transparent
                                 transition-all duration-150 group flex items-center gap-3.5"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${getColorForType(type)} 
                                    group-hover:scale-110 transition-transform duration-200`}
                        >
                          <Icon
                            icon={getIconForType(type)}
                            className="w-5 h-5"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-sm font-semibold text-gray-800 group-hover:text-bpk-orange 
                                      truncate transition-colors duration-150"
                          >
                            {suggestion.label}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {getLabelForType(type)}
                          </p>
                        </div>
                        <Icon
                          icon="mdi:arrow-top-left"
                          className="w-5 h-5 text-gray-300 group-hover:text-bpk-orange 
                                   opacity-0 group-hover:opacity-100 transition-all duration-150 
                                   group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
