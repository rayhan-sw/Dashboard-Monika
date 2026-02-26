/**
 * IndonesiaMapSection.tsx
 *
 * Section "Peta Nusantara": menampilkan peta Indonesia interaktif (choropleth) dengan
 * data per provinsi (name, count). Komponen peta di-load secara dinamis (client-only)
 * agar tidak error saat SSR (library peta biasanya butuh window).
 */

"use client";

import dynamic from "next/dynamic";
import FilterBadge from "@/components/ui/FilterBadge";

/**
 * Peta Indonesia di-import dinamis dengan ssr: false agar hanya di-render di client.
 * Menghindari error "window is not defined" atau referensi ke DOM/Canvas saat server render.
 */
const IndonesiaMap = dynamic(() => import("@/components/maps/IndonesiaMap"), {
  ssr: false,
});

/** Props: mapData = array { name (nama provinsi), count } untuk pewarnaan/ tooltip peta. */
interface IndonesiaMapSectionProps {
  mapData: { name: string; count: number }[];
  dateRange?: any;
  selectedCluster?: string;
  selectedEselon?: string;
}

/**
 * IndonesiaMapSection.tsx
 *
 * Section kartu berisi header (ikon, judul, deskripsi) dan area peta.
 * Header includes `FilterBadge` aligned to the right; header layout uses
 * `flex justify-between items-start` so title stays left-aligned.
 * Layout: lg:col-span-7, tinggi kartu 580px, area peta 480px.
 */
export default function IndonesiaMapSection({
  mapData,
  dateRange,
  selectedCluster,
  selectedEselon,
}: IndonesiaMapSectionProps) {
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
    <div className="lg:col-span-7">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[580px] relative z-0">
        {/* Header: ikon peta (hijau), judul "Peta Nusantara", deskripsi */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-500 flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Peta Nusantara
              </h2>
              <p className="text-sm text-gray-500">
                Unit kerja berdasarkan peta indonesia
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

        {/* Area peta: tinggi tetap 480px, border, overflow hidden; data mapData diteruskan ke IndonesiaMap */}
        <div className="h-[480px] rounded-xl overflow-hidden border border-gray-200 relative">
          <IndonesiaMap data={mapData} />
        </div>
      </div>
    </div>
  );
}
