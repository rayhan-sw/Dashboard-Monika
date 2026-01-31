"use client";

import dynamic from "next/dynamic";

// Dynamic import for map component (client-side only)
const IndonesiaMap = dynamic(() => import("@/components/maps/IndonesiaMap"), {
  ssr: false,
});

interface IndonesiaMapSectionProps {
  mapData: { name: string; count: number }[];
}

export default function IndonesiaMapSection({
  mapData,
}: IndonesiaMapSectionProps) {
  return (
    <div className="lg:col-span-7">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 h-[580px] relative z-0">
        <div className="flex items-start gap-4 mb-4">
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

        {/* Interactive Map */}
        <div className="h-[480px] rounded-xl overflow-hidden border border-gray-200 relative">
          <IndonesiaMap data={mapData} />
        </div>
      </div>
    </div>
  );
}
