/**
 * TopContributors.tsx
 *
 * Kartu "Kontributor Aktivitas Teratas": menampilkan daftar pengguna yang diurutkan
 * menurut jumlah request (aktivitas). Setiap baris: badge ranking, username, unit,
 * dan jumlah request. Daftar scroll vertikal (max-height 500px) dengan scrollbar custom.
 * Jika data kosong, tampil state kosong dengan ikon dan teks "Tidak ada data kontributor".
 */

"use client";

import FilterBadge from "@/components/ui/FilterBadge";

/** Satu kontributor: peringkat, nama pengguna, nama unit, jumlah request. */
interface TopContributor {
  rank: number;
  username: string;
  unit: string;
  requests: number;
}

interface TopContributorsProps {
  topContributors: TopContributor[];
  dateRange?: any;
  selectedCluster?: string;
  selectedEselon?: string;
}

/** Style kartu: background abu terang, border, shadow ringan (konsisten dengan tema).
 * Header includes `FilterBadge` aligned right; header uses `flex justify-between items-start`.
 */
const CARD_STYLE = {
  backgroundColor: "#F9FAFB",
  borderColor: "#E5E5EA",
  borderWidth: 1,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
} as const;

/**
 * Render kartu kontributor: header (ikon, judul, deskripsi) + daftar scroll atau empty state.
 */
export default function TopContributors({
  topContributors,
  dateRange,
  selectedCluster,
  selectedEselon,
}: TopContributorsProps) {
  const formatDateRange = (dr: any) => {
    if (!dr || !dr.startDate || !dr.endDate) return undefined;
    try {
      const start = new Date(dr.startDate);
      const end = new Date(dr.endDate);
      const fmtShort = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
      });
      const fmtFull = new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });

      if (start.getFullYear() === end.getFullYear()) {
        return `${fmtShort.format(start)} – ${fmtFull.format(end)}`;
      }

      return `${fmtFull.format(start)} – ${fmtFull.format(end)}`;
    } catch (e) {
      return undefined;
    }
  };

  const displayDateRange = formatDateRange(dateRange);
  return (
    <div className="rounded-2xl border p-6" style={CARD_STYLE}>
      {/* Header: ikon user (kuning muda), judul "Kontributor Aktivitas Teratas", subteks */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "#FEF3C6" }}
          >
            <svg
              className="w-5 h-5"
              style={{ color: "#BB4D00" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-black mb-0.5">
              Kontributor Aktivitas Teratas
            </h2>
            <p className="text-sm text-[#8E8E93]">
              Pengguna dengan aktivitas terbanyak
            </p>
          </div>
        </div>
        <div className="flex items-start">
          <FilterBadge
            dateRange={displayDateRange}
            cluster={selectedCluster}
            eselon={selectedEselon}
          />
        </div>
      </div>

      {/* Daftar scroll: max-height 500px, overflow-y auto, jarak antar item; scrollbar di-styling di bawah */}
      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-[#E5E5EA] scrollbar-track-transparent hover:scrollbar-thumb-[#D1D1D6]">
        {topContributors.map((contributor) => (
          <div
            key={contributor.rank}
            className="rounded-xl p-4 flex items-center justify-between transition-colors duration-200 group border border-transparent hover:border-[#E5E5EA]"
            style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Badge ranking: lingkaran kuning muda, angka peringkat (warna oranye BPK) */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FFFAEB" }}
              >
                <span className="text-sm font-bold text-[#BB4D00]">
                  {contributor.rank}
                </span>
              </div>

              {/* Info user: username (tebal), unit (abu, di bawah); truncate jika panjang */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {contributor.username}
                </p>
                <p className="text-xs text-[#8E8E93] truncate mt-0.5">
                  {contributor.unit}
                </p>
              </div>
            </div>

            {/* Jumlah request: angka diformat locale, label "request" */}
            <div className="flex-shrink-0 ml-4">
              <span className="text-sm font-bold text-black">
                {contributor.requests.toLocaleString()}
              </span>
              <span className="text-xs text-[#8E8E93] ml-1">request</span>
            </div>
          </div>
        ))}

        {/* Empty state: tampil jika topContributors kosong; ikon user + teks */}
        {topContributors.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "#D1D1D6" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-sm" style={{ color: "#8E8E93" }}>
              Tidak ada data kontributor
            </p>
          </div>
        )}
      </div>

      {/* Styling scrollbar WebKit: lebar 6px, track abu, thumb abu; thumb lebih gelap saat hover */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
