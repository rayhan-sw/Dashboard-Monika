"use client";

import { useEffect, useState, useCallback } from "react";
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
import { dashboardService, regionalService, type SatkerRoot } from "@/services/api";

// Desain Rainfall vs Evaporation: batang berkelompok biru + hijau lime
const COLORS = {
  uniqueUser: "#3B82F6",
  totalAktivitas: "#84CC16",
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
}

function shortenLabel(label: string, maxLen = 14): string {
  if (!label || label.length <= maxLen) return label;
  return label.slice(0, maxLen).trim() + "…";
}

export default function EngagementEselonChart({
  dateRange,
  selectedCluster,
  selectedEselonRootId,
  eselonRoots,
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
  /** True when filter = satu Eselon I and that root has no Eselon II children */
  const [noEselonIIChildren, setNoEselonIIChildren] = useState(false);
  /** When Eselon II > 15, false = show top 15 only; true = show all with horizontal scroll */
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
        // Mode Semua Eselon: sumbu X = Eselon I dari eselonRoots
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
        // Mode satu Eselon I: sumbu X = Eselon II (anak langsung)
        const selectedRoot = eselonRoots.find(
          (r) => r.id === selectedEselonRootId,
        );
        const rootName = selectedRoot?.satker_name ?? "Unit";
        const childrenRes = await regionalService.getChildrenOfRoot(
          selectedEselonRootId,
        );
        const children = childrenRes.children ?? [];
        if (children.length === 0) {
          setNoEselonIIChildren(true);
          setData({
            labels: [],
            uniqueUsers: [],
            totalActivities: [],
          });
          setTitle(`Keterlibatan dalam ${rootName}`);
          setSubtitle(
            "Pengguna Unik vs Total Aktivitas per unit Eselon II",
          );
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
        setSubtitle(
          "Pengguna Unik vs Total Aktivitas per unit Eselon II",
        );
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
  }, [
    startDate,
    endDate,
    clusterParam,
    selectedEselonRootId,
    eselonRoots,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const chartRows =
    data.labels?.map((label, i) => ({
      name: shortenLabel(label),
      fullName: label,
      uniqueUsers: data.uniqueUsers?.[i] ?? 0,
      totalActivities: data.totalActivities?.[i] ?? 0,
      ratio:
        (data.uniqueUsers?.[i] ?? 0) > 0
          ? ((data.totalActivities?.[i] ?? 0) / (data.uniqueUsers?.[i] ?? 1)).toFixed(1)
          : "0",
    })) ?? [];

  const isEselonIIMode = selectedEselonRootId != null;
  const sortedRows = isEselonIIMode
    ? [...chartRows].sort((a, b) => b.totalActivities - a.totalActivities)
    : chartRows;
  const ESELON_II_TOP_LIMIT = 15;
  const showTop15Only =
    isEselonIIMode &&
    sortedRows.length > ESELON_II_TOP_LIMIT &&
    !showAllEselonII;
  const displayRows = showTop15Only
    ? sortedRows.slice(0, ESELON_II_TOP_LIMIT)
    : sortedRows;

  const avgUniqueUsers =
    displayRows.length > 0
      ? displayRows.reduce((s, r) => s + r.uniqueUsers, 0) / displayRows.length
      : 0;
  const avgTotalActivities =
    displayRows.length > 0
      ? displayRows.reduce((s, r) => s + r.totalActivities, 0) / displayRows.length
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
        <p className="text-sm text-center" style={{ color: COLORS.textSecondary }}>
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
      <div className="mb-2">
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
        {showTop15Only && (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <p
              className="text-sm"
              style={{ color: COLORS.textSecondary }}
            >
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
      <div
        className={displayRows.length > 15 ? "overflow-x-auto" : ""}
        style={
          displayRows.length > 15
            ? { minHeight: 340 }
            : undefined
        }
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
                  const fullName = displayRows[index]?.fullName ?? payload?.value ?? "";
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
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        Pengguna Unik:{" "}
                        <span style={{ color: COLORS.textPrimary }}>
                          {p.uniqueUsers.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-xs" style={{ color: COLORS.textSecondary }}>
                        Total Aktivitas:{" "}
                        <span style={{ color: COLORS.textPrimary }}>
                          {p.totalActivities.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: COLORS.textSecondary }}>
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
      <div
        className="flex flex-wrap items-center justify-center gap-6 pt-3 mt-1 border-t"
        style={{ borderColor: COLORS.gridBorder }}
      >
        <span className="text-sm" style={{ color: COLORS.uniqueUser }}>
          Rata-rata Pengguna Unik:{" "}
          {avgUniqueUsers % 1 === 0 ? avgUniqueUsers.toLocaleString("id-ID") : avgUniqueUsers.toFixed(2)}
        </span>
        <span className="text-sm" style={{ color: COLORS.totalAktivitas }}>
          Rata-rata Total Aktivitas:{" "}
          {avgTotalActivities % 1 === 0 ? avgTotalActivities.toLocaleString("id-ID") : avgTotalActivities.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
