"use client";

import { useState } from "react";
import { Icon } from "@iconify/react";
import type { ActivityLog } from "@/types/api";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";

interface SearchResultsProps {
  results: ActivityLog[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type ViewMode = "timeline" | "table";

export default function SearchResults({
  results,
  loading,
  totalCount,
  currentPage,
  totalPages,
  onPageChange,
}: SearchResultsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-bpk-orange border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500">Mencari data...</p>
        </div>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
        <div className="flex flex-col items-center justify-center gap-4 text-center">
          <div className="w-24 h-24 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl flex items-center justify-center">
            <Icon icon="mdi:database-search-outline" className="w-12 h-12 text-orange-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-800 mb-1">
              Tidak ada hasil ditemukan
            </p>
            <p className="text-gray-500">
              Coba ubah kata kunci atau filter pencarian Anda
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Group by date for timeline view
  const groupedByDate = results.reduce(
    (acc, item) => {
      const date = new Date(item.tanggal).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, ActivityLog[]>,
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">
              Menampilkan{" "}
              <span className="font-semibold text-gray-800">
                {results.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-800">{totalCount}</span>{" "}
              hasil
            </p>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                viewMode === "timeline"
                  ? "bg-white text-bpk-orange shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Icon icon="mdi:format-list-bulleted" className="w-4 h-4" />
              <span className="text-sm font-medium">Timeline</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`px-4 py-2 rounded-md transition-all flex items-center gap-2 ${
                viewMode === "table"
                  ? "bg-white text-bpk-orange shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              <Icon icon="mdi:table" className="w-4 h-4" />
              <span className="text-sm font-medium">Tabel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {viewMode === "timeline" ? (
        <div className="space-y-6">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div
              key={date}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <Icon icon="mdi:calendar" className="w-5 h-5 text-bpk-orange" />
                <h3 className="text-base font-semibold text-gray-800">
                  {format(new Date(date), "EEEE, dd MMMM yyyy", {
                    locale: idLocale,
                  })}
                </h3>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <TimelineItem key={item.id_trans} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TableView results={results} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>

            {(() => {
              // Calculate sliding window for pagination
              const maxVisible = 5;
              let startPage = Math.max(
                1,
                currentPage - Math.floor(maxVisible / 2),
              );
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);

              // Adjust start if we're near the end
              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              const pages = [];

              // First page button if not in range
              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => onPageChange(1)}
                    className="px-4 py-2 rounded-lg transition-colors border border-gray-300 hover:bg-gray-50"
                  >
                    1
                  </button>,
                );
                if (startPage > 2) {
                  pages.push(
                    <span key="dots-start" className="text-gray-500">
                      ...
                    </span>,
                  );
                }
              }

              // Page number buttons
              for (let page = startPage; page <= endPage; page++) {
                pages.push(
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-bpk-orange text-white"
                        : "border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>,
                );
              }

              // Last page button if not in range
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span key="dots-end" className="text-gray-500">
                      ...
                    </span>,
                  );
                }
                pages.push(
                  <button
                    key={totalPages}
                    onClick={() => onPageChange(totalPages)}
                    className="px-4 py-2 rounded-lg transition-colors border border-gray-300 hover:bg-gray-50"
                  >
                    {totalPages}
                  </button>,
                );
              }

              return pages;
            })()}

            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ item }: { item: ActivityLog }) {
  const getActivityIcon = (
    activity: string,
  ): { icon: string; color: string; bg: string } => {
    const activityLower = activity.toLowerCase();
    if (activityLower.includes("login"))
      return { icon: "mdi:login", color: "text-green-600", bg: "bg-green-100" };
    if (activityLower.includes("logout"))
      return {
        icon: "mdi:logout",
        color: "text-orange-600",
        bg: "bg-orange-100",
      };
    if (activityLower.includes("view") || activityLower.includes("lihat"))
      return {
        icon: "mdi:eye-outline",
        color: "text-blue-600",
        bg: "bg-blue-100",
      };
    if (activityLower.includes("download") || activityLower.includes("unduh"))
      return {
        icon: "mdi:download",
        color: "text-purple-600",
        bg: "bg-purple-100",
      };
    if (activityLower.includes("search") || activityLower.includes("cari"))
      return { icon: "mdi:magnify", color: "text-cyan-600", bg: "bg-cyan-100" };
    if (activityLower.includes("upload"))
      return {
        icon: "mdi:upload",
        color: "text-indigo-600",
        bg: "bg-indigo-100",
      };
    if (activityLower.includes("edit") || activityLower.includes("update"))
      return {
        icon: "mdi:pencil-outline",
        color: "text-amber-600",
        bg: "bg-amber-100",
      };
    if (activityLower.includes("delete") || activityLower.includes("hapus"))
      return {
        icon: "mdi:trash-can-outline",
        color: "text-red-600",
        bg: "bg-red-100",
      };
    return {
      icon: "mdi:file-document-outline",
      color: "text-gray-600",
      bg: "bg-gray-100",
    };
  };

  const activityStyle = getActivityIcon(item.aktifitas);

  return (
    <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100">
      <div className="flex-shrink-0">
        <div
          className={`w-10 h-10 ${activityStyle.bg} rounded-full flex items-center justify-center`}
        >
          <Icon
            icon={activityStyle.icon}
            className={`w-5 h-5 ${activityStyle.color}`}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{item.aktifitas}</p>
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                {format(new Date(item.tanggal), "HH:mm:ss")}
              </span>
              <span className="flex items-center gap-1">
                <Icon icon="mdi:account-outline" className="w-3 h-3" />
                {item.nama}
              </span>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
              item.status === "SUCCESS"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <Icon
              icon={item.status === "SUCCESS" ? "mdi:check" : "mdi:close"}
              className="w-3 h-3"
            />
            {item.status === "SUCCESS" ? "Berhasil" : "Gagal"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Icon icon="mdi:office-building-outline" className="w-3 h-3" />
            <span className="truncate">{item.satker}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Icon icon="mdi:map-marker-outline" className="w-3 h-3" />
            <span className="truncate">{item.lokasi}</span>
          </div>
        </div>

        {item.detail_aktifitas && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2">
            {item.detail_aktifitas}
          </p>
        )}
      </div>
    </div>
  );
}

function TableView({ results }: { results: ActivityLog[] }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Waktu
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Satker
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Aktivitas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Lokasi
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {results.map((item) => (
              <tr
                key={item.id_trans}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-800 whitespace-nowrap">
                  {format(new Date(item.tanggal), "dd/MM/yy HH:mm")}
                </td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-gray-800">{item.nama}</p>
                    <p className="text-xs text-gray-500">{item.eselon}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                  {item.satker}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">
                  {item.aktifitas}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {item.lokasi}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      item.status === "SUCCESS"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.status === "SUCCESS" ? (
                      <Icon icon="mdi:check-circle" className="w-3 h-3" />
                    ) : (
                      <Icon icon="mdi:close-circle" className="w-3 h-3" />
                    )}
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
