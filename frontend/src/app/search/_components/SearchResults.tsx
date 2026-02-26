/**
 * SearchResults.tsx
 *
 * Tampilan hasil pencarian: dua mode (Linimasa / Tabel). Linimasa: grup per tanggal,
 * dalam tiap tanggal grup per cluster; klik cluster untuk expand aktivitas. Tabel:
 * grup per tanggal, baris header tanggal + baris data. Pagination dengan sliding window
 * (max 5 nomor). Komponen TimelineItem dan TableView dipakai di dalam.
 */

"use client";

import React, { useState } from "react";
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
  const [expandedClusters, setExpandedClusters] = useState<Set<string>>(new Set());
  /** Key expand: "date|clusterName" — cluster mana yang sedang dibuka di linimasa. */

  const toggleCluster = (date: string, clusterName: string) => {
    const key = `${date}|${clusterName}`;
    setExpandedClusters((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  /** Toggle expand/collapse cluster di linimasa (tambah/hapus key dari expandedClusters). */

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

  const groupedByDate = results.reduce(
    (acc, item) => {
      const date = new Date(item.tanggal).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, ActivityLog[]>,
  );
  /** Grup hasil per tanggal (toDateString). */

  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
  sortedDates.forEach((date) => {
    groupedByDate[date].sort(
      (a, b) =>
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );
  });
  /** Tanggal terurut terbaru dulu; dalam tiap hari aktivitas terlama → terbaru. */

  const byDateByCluster: Record<string, Record<string, ActivityLog[]>> = {};
  sortedDates.forEach((date) => {
    byDateByCluster[date] = {};
    groupedByDate[date].forEach((item) => {
      const clusterName = item.cluster || item.lokasi || "Lainnya";
      if (!byDateByCluster[date][clusterName]) byDateByCluster[date][clusterName] = [];
      byDateByCluster[date][clusterName].push(item);
    });
  });
  /** Struktur linimasa: per tanggal → per cluster (item.cluster || item.lokasi || "Lainnya"). */

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Menampilkan{" "}
              <span className="font-semibold text-gray-900">
                {results.length}
              </span>{" "}
              dari{" "}
              <span className="font-semibold text-gray-900">{totalCount}</span>{" "}
              hasil
            </p>
          </div>

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
              <span className="text-sm font-medium">Linimasa</span>
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

      {viewMode === "timeline" ? (
        <div className="space-y-4">
          {sortedDates.map((date) => {
            const clustersInDate = byDateByCluster[date] || {};
            const clusterNames = Object.keys(clustersInDate);
            return (
              <div
                key={date}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col sm:flex-row"
              >
                {/* Tanggal di sebelah kiri - sticky */}
                <div
                  className="sm:sticky sm:top-24 sm:self-start sm:z-10 sm:w-52 flex-shrink-0 bg-gray-50 border-b sm:border-b-0 sm:border-r border-gray-200 p-4 flex items-center gap-3 sm:min-h-[5rem] sm:shadow-[2px_0_8px_rgba(0,0,0,0.06)]"
                  style={{ scrollMarginTop: "6rem" }}
                >
                  <Icon icon="mdi:calendar" className="w-5 h-5 text-bpk-orange flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-600 uppercase tracking-wider leading-tight">
                      Tanggal
                    </p>
                    <p className="text-base font-semibold text-gray-900 leading-snug mt-0.5">
                      {format(new Date(date), "EEEE, dd MMM yyyy", {
                        locale: idLocale,
                      })}
                    </p>
                  </div>
                </div>

                {/* Daftar cluster (minimalis): klik untuk expand aktivitas */}
                <div className="flex-1 min-w-0 p-4">
                  <div className="space-y-2">
                    {clusterNames.map((clusterName) => {
                      const activities = clustersInDate[clusterName] || [];
                      const key = `${date}|${clusterName}`;
                      const isExpanded = expandedClusters.has(key);
                      const waktuAwal = activities.length > 0 ? new Date(activities[0].tanggal) : null;
                      const waktuAkhir = activities.length > 0 ? new Date(activities[activities.length - 1].tanggal) : null;
                      const rentangWaktu =
                        waktuAwal && waktuAkhir
                          ? `${format(waktuAwal, "HH:mm:ss")} – ${format(waktuAkhir, "HH:mm:ss")}`
                          : null;

                      return (
                        <div key={key} className="rounded-xl border border-gray-200 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => toggleCluster(date, clusterName)}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-orange-50/70 transition-colors border-b border-gray-100 last:border-b-0"
                          >
                            <span className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-3 min-w-0">
                              <span className="flex items-center gap-2.5 min-w-0">
                                <Icon
                                  icon="mdi:chart-box-outline"
                                  className="w-5 h-5 text-bpk-orange flex-shrink-0"
                                />
                                <span className="text-base font-semibold text-gray-900 leading-snug">
                                  {clusterName}
                                </span>
                                <span className="text-sm text-gray-600">
                                  ({activities.length} aktivitas)
                                </span>
                              </span>
                              {rentangWaktu && (
                                <span className="text-sm text-gray-600 font-mono tabular-nums ml-7 sm:ml-0">
                                  {rentangWaktu}
                                </span>
                              )}
                            </span>
                            <Icon
                              icon={isExpanded ? "mdi:chevron-up" : "mdi:chevron-down"}
                              className="w-5 h-5 text-gray-500 flex-shrink-0"
                            />
                          </button>
                          {isExpanded && (
                            <div className="bg-gray-50/50 border-t border-gray-100">
                              {activities.map((item, index) => {
                                const clusterLabel = item.cluster || item.lokasi || "—";
                                return (
                                  <div key={item.id_trans}>
                                    <TimelineItem
                                      item={item}
                                      showCluster={true}
                                      clusterLabel={clusterLabel}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
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
              className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sebelumnya
            </button>

            {(() => {
              /** Sliding window: tampilkan max 5 nomor halaman di sekitar currentPage. */
              const maxVisible = 5;
              let startPage = Math.max(
                1,
                currentPage - Math.floor(maxVisible / 2),
              );
              let endPage = Math.min(totalPages, startPage + maxVisible - 1);

              if (endPage - startPage < maxVisible - 1) {
                startPage = Math.max(1, endPage - maxVisible + 1);
              }

              const pages = [];

              if (startPage > 1) {
                pages.push(
                  <button
                    key={1}
                    onClick={() => onPageChange(1)}
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg transition-colors border border-gray-300 hover:bg-gray-50"
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

              for (let page = startPage; page <= endPage; page++) {
                pages.push(
                  <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-bpk-orange text-white"
                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>,
                );
              }

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
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg transition-colors border border-gray-300 hover:bg-gray-50"
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
              className="px-4 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Satu baris aktivitas di linimasa: ikon sesuai jenis, waktu, nama, cluster, detail, status. */
function TimelineItem({
  item,
  showCluster = false,
  clusterLabel = "",
}: {
  item: ActivityLog;
  showCluster?: boolean;
  clusterLabel?: string;
}) {
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
  /** Ikon + warna per jenis aktivitas (login, logout, view, download, search, dll.). */

  const activityStyle = getActivityIcon(item.aktifitas);
  const cluster = clusterLabel || item.cluster || item.lokasi || "—";

  return (
    <div className="flex items-start gap-3 py-3.5 px-4 rounded-lg hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-b-0">
      <div className="flex-shrink-0">
        <div
          className={`w-9 h-9 ${activityStyle.bg} rounded-lg flex items-center justify-center`}
        >
          <Icon
            icon={activityStyle.icon}
            className={`w-4 h-4 ${activityStyle.color}`}
          />
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[15px] leading-relaxed">
          <span className="font-semibold text-gray-900">{item.aktifitas}</span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 flex items-center gap-1.5">
            <Icon icon="mdi:clock-outline" className="w-4 h-4 flex-shrink-0" />
            <span className="font-mono tabular-nums">{format(new Date(item.tanggal), "HH:mm:ss")}</span>
          </span>
          <span className="text-gray-400">•</span>
          <span className="text-gray-600 flex items-center gap-1.5">
            <Icon icon="mdi:account-outline" className="w-4 h-4 flex-shrink-0" />
            {item.nama}
          </span>
        </div>

        {showCluster && (
          <div className="mt-2 flex items-center gap-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-bpk-orange/10 text-bpk-orange font-medium text-sm">
              <Icon icon="mdi:chart-box-outline" className="w-4 h-4 flex-shrink-0" />
              Cluster: {cluster}
            </span>
          </div>
        )}

        {!showCluster && (item.cluster || item.lokasi) && (
          <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-600">
            <Icon icon="mdi:map-marker-outline" className="w-4 h-4 flex-shrink-0" />
            <span>{item.cluster || item.lokasi}</span>
          </div>
        )}

        {item.detail_aktifitas && (
          <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
            {item.detail_aktifitas}
          </p>
        )}

        <div className="mt-2 flex items-center justify-end">
          <span
            className={`px-2.5 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 flex-shrink-0 ${
              item.status === "SUCCESS"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            <Icon
              icon={item.status === "SUCCESS" ? "mdi:check" : "mdi:close"}
              className="w-3.5 h-3.5"
            />
            {item.status === "SUCCESS" ? "Berhasil" : "Gagal"}
          </span>
        </div>
      </div>
    </div>
  );
}

/** Tabel hasil: grup per tanggal, baris header tanggal lalu baris data per aktivitas. */
function TableView({ results }: { results: ActivityLog[] }) {
  const groupedByDate = results.reduce(
    (acc, item) => {
      const date = new Date(item.tanggal).toDateString();
      if (!acc[date]) acc[date] = [];
      acc[date].push(item);
      return acc;
    },
    {} as Record<string, ActivityLog[]>,
  );
  const sortedDates = Object.keys(groupedByDate).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime(),
  );
  sortedDates.forEach((date) => {
    groupedByDate[date].sort(
      (a, b) =>
        new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );
  });

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-gray-50 border-b-2 border-gray-200 sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tanggal
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Jam
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden lg:table-cell">
                Satker
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Cluster
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Aktivitas
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide hidden md:table-cell max-w-[200px]">
                Detail / Scope
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide w-24">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedDates.map((date) => (
              <React.Fragment key={date}>
                {/* Baris pengelompokan tanggal */}
                <tr
                  className="bg-bpk-orange/10 border-y border-bpk-orange/20"
                >
                  <td
                    colSpan={8}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-800 flex items-center gap-2"
                  >
                    <Icon icon="mdi:calendar" className="w-4 h-4 text-bpk-orange" />
                    {format(new Date(date), "EEEE, dd MMMM yyyy", {
                      locale: idLocale,
                    })}
                  </td>
                </tr>
                {/* Baris data per aktivitas */}
                {groupedByDate[date].map((item) => (
                  <tr
                    key={item.id_trans}
                    className="hover:bg-orange-50/50 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-sm text-gray-500 whitespace-nowrap">
                      {format(new Date(item.tanggal), "dd/MM/yyyy")}
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800 whitespace-nowrap">
                      {format(new Date(item.tanggal), "HH:mm:ss")}
                    </td>
                    <td className="px-4 py-2.5 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{item.nama}</p>
                        {item.eselon && (
                          <p className="text-xs text-gray-500">{item.eselon}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-600 max-w-[180px] truncate hidden lg:table-cell" title={item.satker}>
                      {item.satker}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-bpk-orange/10 text-bpk-orange text-xs font-medium">
                        <Icon icon="mdi:chart-box-outline" className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[120px]" title={item.cluster || item.lokasi}>
                          {item.cluster || item.lokasi || "—"}
                        </span>
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-sm font-medium text-gray-800">
                      {item.aktifitas}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-500 max-w-[200px] truncate hidden md:table-cell" title={item.detail_aktifitas || item.scope}>
                      {item.detail_aktifitas || item.scope || "—"}
                    </td>
                    <td className="px-4 py-2.5">
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
                        {item.status === "SUCCESS" ? "Berhasil" : "Gagal"}
                      </span>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
