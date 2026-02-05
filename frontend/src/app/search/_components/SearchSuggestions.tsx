"use client";

import { useEffect, useState } from "react";
import { User, Building, Clock } from "lucide-react";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
}

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

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/search/suggestions?q=${encodeURIComponent(query)}`,
        );
        const data = await response.json();
        setSuggestions(data.data || []);
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

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-96 overflow-y-auto z-50">
      {/* Users */}
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

      {/* Satker */}
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

      {/* Recent */}
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
