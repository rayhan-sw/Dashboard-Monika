/**
 * SearchSuggestions.tsx
 *
 * Dropdown saran pencarian: saat query ≥2 karakter, panggil getSuggestions (debounce 300ms).
 * Hasil dikelompokkan per tipe (user, satker, recent); klik item → onSelect(text).
 * Tampil loading atau daftar; kosong → return null.
 */

"use client";

import { useEffect, useState } from "react";
import { User, Building, Clock } from "lucide-react";
import { searchService } from "@/services/api";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
}

/** Satu saran: tipe (user/satker/recent), text, subtitle opsional. */
interface Suggestion {
  type: "user" | "satker" | "recent";
  text: string;
  subtitle?: string;
}

export default function SearchSuggestions({
  query,
  onSelect,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  /** Fetch saran saat query berubah; debounce 300ms; map response ke { type, text, subtitle }. */
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const data = await searchService.getSuggestions(query);
        const raw = data.suggestions || (data.data as { type?: string; value?: string; label?: string; text?: string; subtitle?: string }[] | undefined) || [];
        const mapped: Suggestion[] = raw.map((s) => ({
          type: (s.type as "user" | "satker" | "recent") || "user",
          text: s.text ?? s.value ?? s.label ?? "",
          subtitle: s.subtitle,
        }));
        setSuggestions(mapped);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (loading) {
    return (
      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50">
        <p className="text-sm text-gray-500 text-center">Mencari...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const groupedSuggestions = {
    users: suggestions.filter((s) => s.type === "user"),
    satker: suggestions.filter((s) => s.type === "satker"),
    recent: suggestions.filter((s) => s.type === "recent"),
  };
  /** Pisahkan saran per tipe untuk tampil per blok (Pengguna, Satuan Kerja, Pencarian Terakhir). */

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
      {groupedSuggestions.users.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 px-2 mb-2">
            <User className="w-4 h-4 text-blue-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Pengguna
            </span>
          </div>
          {groupedSuggestions.users.map((suggestion, index) => (
            <button
              key={`user-${index}`}
              onClick={() => onSelect(suggestion.text)}
              className="w-full px-3 py-2 text-left hover:bg-blue-50 rounded-lg transition-colors group"
            >
              <p className="text-sm font-medium text-gray-800 group-hover:text-blue-600">
                {suggestion.text}
              </p>
              {suggestion.subtitle && (
                <p className="text-xs text-gray-500">{suggestion.subtitle}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {groupedSuggestions.satker.length > 0 && (
        <div className="p-3 border-b border-gray-100">
          <div className="flex items-center gap-2 px-2 mb-2">
            <Building className="w-4 h-4 text-green-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Satuan Kerja
            </span>
          </div>
          {groupedSuggestions.satker.map((suggestion, index) => (
            <button
              key={`satker-${index}`}
              onClick={() => onSelect(suggestion.text)}
              className="w-full px-3 py-2 text-left hover:bg-green-50 rounded-lg transition-colors group"
            >
              <p className="text-sm font-medium text-gray-800 group-hover:text-green-600">
                {suggestion.text}
              </p>
            </button>
          ))}
        </div>
      )}

      {groupedSuggestions.recent.length > 0 && (
        <div className="p-3">
          <div className="flex items-center gap-2 px-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-semibold text-gray-600 uppercase">
              Pencarian Terakhir
            </span>
          </div>
          {groupedSuggestions.recent.map((suggestion, index) => (
            <button
              key={`recent-${index}`}
              onClick={() => onSelect(suggestion.text)}
              className="w-full px-3 py-2 text-left hover:bg-orange-50 rounded-lg transition-colors group"
            >
              <p className="text-sm font-medium text-gray-800 group-hover:text-orange-600">
                {suggestion.text}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
