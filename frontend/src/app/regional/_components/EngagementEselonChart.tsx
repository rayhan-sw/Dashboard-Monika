/**
 * EngagementEselonChart.tsx
 *
 * EngagementEselonChart.tsx
 *
 * Chart batang (Recharts) keterlibatan per Eselon: Pengguna Unik vs Total Aktivitas.
 * Dua mode: (1) Semua Eselon — sumbu X = Eselon I (dari eselonRoots), getStats per root.
 * (2) Satu Eselon I dipilih — sumbu X = anak Eselon II (getChildrenOfRoot), getStats per anak.
 * Jika Eselon II > 15: tampil top 15 dulu, tombol "Tampilkan semua" untuk scroll horizontal.
 * Header includes `FilterBadge` aligned right; header uses `flex justify-between items-start`
 * to keep the title left-aligned while showing active filters on the right.
 * Rata-rata Pengguna Unik dan Total Aktivitas ditampilkan sebagai ReferenceLine dan footer.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import FilterBadge from "@/components/ui/FilterBadge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  dashboardService,
  regionalService,
  type SatkerRoot,
} from "@/services/api";

/** Warna chart: biru Pengguna Unik, oranye Total Aktivitas, plus card/grid/text */
const COLORS = {
  uniqueUser: "#3B83F1",
  totalAktivitas: "#FE9A00",
  cardBg: "#FFFFFF",
  gridBorder: "#E5E5EA",
  textPrimary: "#000000",
  textSecondary: "#8E8E93",
} as const;

export interface EngagementChartData {
  labels: string[];
  uniqueUsers: number[];
  totalActivities: number[];
}

interface DateRange {
  startDate: string;
  endDate: string;
}

interface EngagementEselonChartProps {
  dateRange: DateRange;
  selectedCluster: string;
  selectedEselonRootId: number | null;
  eselonRoots: SatkerRoot[];
  selectedEselonName?: string;
}

/** Potong label panjang untuk sumbu X; lebih dari maxLen diganti dengan … */
function shortenLabel(label: string, maxLen = 14): string {
  if (!label || label.length <= maxLen) return label;
  return label.slice(0, maxLen).trim() + "…";
}

/**
 * Chart keterlibatan per Eselon I atau Eselon II; fetchData tergantung selectedEselonRootId (null = semua Eselon I, isi = anak Eselon II).
 */
export default function EngagementEselonChart({
  dateRange,
  selectedCluster,
  selectedEselonRootId,
  eselonRoots,
  selectedEselonName,
}: EngagementEselonChartProps) {
  const [data, setData] = useState<EngagementChartData>({
    labels: [],
    uniqueUsers: [],
    totalActivities: [],
  });
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noEselonIIChildren, setNoEselonIIChildren] = useState(false);
  const [showAllEselonII, setShowAllEselonII] = useState(false);

  const clusterParam =
    selectedCluster === "Semua Cluster" ? "" : selectedCluster;
  const startDate = dateRange.startDate ?? "";
  const endDate = dateRange.endDate ?? "";

  const fetchData = useCallback(async () => {
    setError(null);
    setShowAllEselonII(false);
    setNoEselonIIChildren(false);
    setLoading(true);
    try {
      if (selectedEselonRootId == null) {
        if (!eselonRoots.length) {
          setData({
            labels: [],
            uniqueUsers: [],
            totalActivities: [],
          });
          setTitle("Keterlibatan per Eselon I");
          setSubtitle("Pengguna Unik vs Total Aktivitas per unit Eselon I");
          return;
        }
        const results = await Promise.all(
          eselonRoots.map((root) =>
            dashboardService.getStats(
              startDate,
              endDate,
              clusterParam,
              root.id,
            ),
          ),
        );
        setData({
          labels: eselonRoots.map((r) => r.satker_name),
          uniqueUsers: results.map((r) => r.total_users ?? 0),
          totalActivities: results.map((r) => r.total_activities ?? 0),
        });
        setTitle("Keterlibatan per Eselon I");
        setSubtitle("Pengguna Unik vs Total Aktivitas per unit Eselon I");
      } else {
        const selectedRoot = eselonRoots.find(
          (r) => r.id === selectedEselonRootId,
        );
        const rootName = selectedRoot?.satker_name ?? "Unit";
        const childrenRes =
          await regionalService.getChildrenOfRoot(selectedEselonRootId);
        const children = childrenRes.children ?? [];
        if (children.length === 0) {
          setNoEselonIIChildren(true);
          setData({
            labels: [],
            uniqueUsers: [],
            totalActivities: [],
          });
          setTitle(`Keterlibatan dalam ${rootName}`);
          setSubtitle("Pengguna Unik vs Total Aktivitas per unit Eselon II");
          return;
        }
        const results = await Promise.all(
          children.map((child) =>
            dashboardService.getStats(
              startDate,
              endDate,
              clusterParam,
              child.id,
            ),
          ),
        );
        setData({
          labels: children.map((c) => c.satker_name),
          uniqueUsers: results.map((r) => r.total_users ?? 0),
          totalActivities: results.map((r) => r.total_activities ?? 0),
        });
        setTitle(`Keterlibatan dalam ${rootName}`);
        setSubtitle("Pengguna Unik vs Total Aktivitas per unit Eselon II");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat data engagement.";
      setError(message);
      setData({
        labels: [],
        uniqueUsers: [],
        totalActivities: [],
      });
      setTitle("");
      setSubtitle(undefined);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, clusterParam, selectedEselonRootId, eselonRoots]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /** Baris untuk Recharts: name (singkat), fullName (tooltip), uniqueUsers, totalActivities, ratio aktivitas/user */
  const chartRows =
    data.labels?.map((label, i) => ({
      name: shortenLabel(label),
      fullName: label,
      uniqueUsers: data.uniqueUsers?.[i] ?? 0,
      totalActivities: data.totalActivities?.[i] ?? 0,
      ratio:
        (data.uniqueUsers?.[i] ?? 0) > 0
          ? (
              (data.totalActivities?.[i] ?? 0) / (data.uniqueUsers?.[i] ?? 1)
            ).toFixed(1)
          : "0",
    })) ?? [];

  const isEselonIIMode = selectedEselonRootId != null;
  // Mode Eselon II: urutkan menurut totalActivities descending; mode Semua Eselon: urutan asli
  const sortedRows = isEselonIIMode
    ? [...chartRows].sort((a, b) => b.totalActivities - a.totalActivities)
    : chartRows;
  const ESELON_II_TOP_LIMIT = 15;
  // Tampilkan hanya 15 teratas jika mode Eselon II, ada >15 baris, dan user belum klik "Tampilkan semua"
  const showTop15Only =
    isEselonIIMode &&
    sortedRows.length > ESELON_II_TOP_LIMIT &&
    !showAllEselonII;
  const displayRows = showTop15Only
    ? sortedRows.slice(0, ESELON_II_TOP_LIMIT)
    : sortedRows;

  // Rata-rata untuk ReferenceLine (sumbu kiri = uniqueUsers, kanan = totalActivities)
  const avgUniqueUsers =
    displayRows.length > 0
      ? displayRows.reduce((s, r) => s + r.uniqueUsers, 0) / displayRows.length
      : 0;
  const avgTotalActivities =
    displayRows.length > 0
      ? displayRows.reduce((s, r) => s + r.totalActivities, 0) /
        displayRows.length
      : 0;

  if (error) {
    return (
      <div
        className="rounded-2xl border p-4 min-h-[340px] flex flex-col items-center justify-center gap-3"
        style={{
          backgroundColor: COLORS.cardBg,
          borderColor: COLORS.gridBorder,
          borderWidth: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <p
          className="text-sm text-center"
          style={{ color: COLORS.textSecondary }}
        >
          {error}
        </p>
        <button
          type="button"
          onClick={() => fetchData()}
          className="px-4 py-2 text-sm font-medium rounded-lg border transition-colors"
          style={{
            borderColor: COLORS.gridBorder,
            color: COLORS.textPrimary,
          }}
        >
          Coba lagi
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        className="rounded-2xl border p-4 min-h-[340px] animate-pulse"
        style={{
          backgroundColor: COLORS.cardBg,
          borderColor: COLORS.gridBorder,
          borderWidth: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      />
    );
  }

  if (!chartRows.length) {
    return (
      <div
        className="rounded-2xl border p-4 min-h-[340px] flex items-center justify-center"
        style={{
          backgroundColor: COLORS.cardBg,
          borderColor: COLORS.gridBorder,
          borderWidth: 1,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <p
          className="text-sm text-center max-w-md"
          style={{ color: COLORS.textSecondary }}
        >
          {noEselonIIChildren
            ? "Unit ini tidak memiliki unit Eselon II. Pilih 'Semua Eselon' untuk melihat perbandingan per Eselon I."
            : "Tidak ada data untuk ditampilkan."}
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-4"
      style={{
        backgroundColor: COLORS.cardBg,
        borderColor: COLORS.gridBorder,
        borderWidth: 1,
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3
            className="text-lg font-semibold"
            style={{ color: COLORS.textPrimary }}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className="text-sm mt-0.5"
              style={{ color: COLORS.textSecondary }}
            >
              {subtitle}
            </p>
          )}
          {/* Jika hanya tampil 15 teratas: teks info + tombol "Tampilkan semua" */}
          {showTop15Only && (
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>
                Menampilkan 15 unit Eselon II teratas
              </p>
              <button
                type="button"
                onClick={() => setShowAllEselonII(true)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors hover:opacity-90"
                style={{
                  borderColor: COLORS.gridBorder,
                  color: COLORS.textPrimary,
                }}
              >
                Tampilkan semua
              </button>
            </div>
          )}
        </div>
        <div className="flex items-start">
          <FilterBadge
            dateRange={
              dateRange
                ? `${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(new Date(dateRange.startDate))} – ${new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(dateRange.endDate))}`
                : undefined
            }
            cluster={selectedCluster}
            eselon={selectedEselonName}
          />
        </div>
      </div>
      {/* Jika > 15 baris: container scroll horizontal, lebar min = 52px per bar */}
      <div
        className={displayRows.length > 15 ? "overflow-x-auto" : ""}
        style={displayRows.length > 15 ? { minHeight: 340 } : undefined}
      >
        <div
          style={
            displayRows.length > 15
              ? { minWidth: displayRows.length * 52 }
              : undefined
          }
        >
          <ResponsiveContainer
            width={displayRows.length > 15 ? displayRows.length * 52 : "100%"}
            height={340}
          >
            <BarChart
              data={displayRows}
              margin={{ top: 8, right: 56, left: 48, bottom: 80 }}
              barCategoryGap="20%"
              barGap={6}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={COLORS.gridBorder}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                angle={-40}
                textAnchor="end"
                height={56}
                interval={0}
                tick={(props) => {
                  const { x, y, payload, index } = props;
                  const fullName =
                    displayRows[index]?.fullName ?? payload?.value ?? "";
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <title>{fullName}</title>
                      <text
                        textAnchor="end"
                        fill={COLORS.textSecondary}
                        fontSize={10}
                        x={0}
                        y={0}
                        dy={4}
                        transform="rotate(-40 0 0)"
                      >
                        {payload?.value ?? ""}
                      </text>
                    </g>
                  );
                }}
              />
              <YAxis
                yAxisId="left"
                tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
                stroke={COLORS.textSecondary}
                width={42}
                label={{
                  value: "Pengguna Unik",
                  angle: -90,
                  position: "insideLeft",
                  style: { fill: COLORS.textSecondary, fontSize: 10 },
                  dx: -8,
                }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fill: COLORS.textSecondary, fontSize: 11 }}
                stroke={COLORS.textSecondary}
                width={50}
                label={{
                  value: "Total Aktivitas",
                  angle: 90,
                  position: "insideRight",
                  style: { fill: COLORS.textSecondary, fontSize: 10 },
                  dx: 8,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: `1px solid ${COLORS.gridBorder}`,
                  borderRadius: "8px",
                }}
                labelStyle={{ color: COLORS.textPrimary }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0].payload;
                  return (
                    <div
                      className="rounded-lg border px-3 py-2 shadow-sm text-left min-w-[180px]"
                      style={{
                        backgroundColor: "#fff",
                        borderColor: COLORS.gridBorder,
                      }}
                    >
                      <p
                        className="font-medium text-sm mb-1.5 truncate max-w-[240px]"
                        style={{ color: COLORS.textPrimary }}
                        title={p.fullName}
                      >
                        {p.fullName}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: COLORS.textSecondary }}
                      >
                        Pengguna Unik:{" "}
                        <span style={{ color: COLORS.textPrimary }}>
                          {p.uniqueUsers.toLocaleString()}
                        </span>
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: COLORS.textSecondary }}
                      >
                        Total Aktivitas:{" "}
                        <span style={{ color: COLORS.textPrimary }}>
                          {p.totalActivities.toLocaleString()}
                        </span>
                      </p>
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: COLORS.textSecondary }}
                      >
                        Rasio aktivitas/user:{" "}
                        <span style={{ color: COLORS.textPrimary }}>
                          {p.ratio}
                        </span>
                      </p>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                formatter={(value) => (
                  <span style={{ color: COLORS.textPrimary }}>{value}</span>
                )}
              />
              {/* Garis rata-rata (dash) untuk Pengguna Unik (kiri) dan Total Aktivitas (kanan) */}
              <ReferenceLine
                yAxisId="left"
                y={avgUniqueUsers}
                stroke={COLORS.uniqueUser}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <ReferenceLine
                yAxisId="right"
                y={avgTotalActivities}
                stroke={COLORS.totalAktivitas}
                strokeDasharray="4 4"
                strokeWidth={1.5}
              />
              <Bar
                dataKey="uniqueUsers"
                name="Pengguna Unik"
                fill={COLORS.uniqueUser}
                radius={[4, 4, 0, 0]}
                yAxisId="left"
              />
              <Bar
                dataKey="totalActivities"
                name="Total Aktivitas"
                fill={COLORS.totalAktivitas}
                radius={[4, 4, 0, 0]}
                yAxisId="right"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      {/* Footer: tampilkan rata-rata Pengguna Unik dan Total Aktivitas (sesuai data yang ditampilkan) */}
      <div
        className="flex flex-wrap items-center justify-center gap-6 pt-3 mt-1 border-t"
        style={{ borderColor: COLORS.gridBorder }}
      >
        <span className="text-sm" style={{ color: COLORS.uniqueUser }}>
          Rata-rata Pengguna Unik:{" "}
          {avgUniqueUsers % 1 === 0
            ? avgUniqueUsers.toLocaleString("id-ID")
            : avgUniqueUsers.toFixed(2)}
        </span>
        <span className="text-sm" style={{ color: COLORS.totalAktivitas }}>
          Rata-rata Total Aktivitas:{" "}
          {avgTotalActivities % 1 === 0
            ? avgTotalActivities.toLocaleString("id-ID")
            : avgTotalActivities.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
