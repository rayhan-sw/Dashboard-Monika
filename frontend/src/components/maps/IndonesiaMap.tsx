/**
 * IndonesiaMap.tsx
 *
 * Peta Indonesia choropleth (Leaflet): GeoJSON provinsi diwarnai menurut data
 * aktivitas (name, count). Warna: tidak ada = abu; rendah = hijau muda; sedang =
 * hijau; terbanyak = hijau tua. Popup per provinsi: nama, count, kategori. Zoom
 * dikunci di batas Indonesia; tile CartoDB Positron. Legend bisa di-minimize.
 * Inisialisasi sekali; saat data berubah hanya style dan popup di-update.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface ProvinceData {
  name: string;
  count: number;
}
/** Satu provinsi: nama (harus match dengan GeoJSON) dan jumlah aktivitas. */

interface IndonesiaMapProps {
  data: ProvinceData[];
}

export default function IndonesiaMap({ data }: IndonesiaMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const geoJsonLayerRef = useRef<any>(null);
  const [legendMinimized, setLegendMinimized] = useState(false);
  /** Ref instance Leaflet untuk cleanup; geoJsonLayerRef untuk update style saat data berubah. */

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      /** Atur ulang URL ikon marker default Leaflet agar tidak error di webpack. */

      if (!mapRef.current) return;

      if (mapRef.current._leaflet_id) {
        return;
      }
      /** Hindari inisialisasi ganda jika container sudah punya peta. */

      const indonesiaBounds: [[number, number], [number, number]] = [
        [-11, 94],
        [6, 141],
      ];
      /** Batas peta: barat-daya dan timur-laut Indonesia. */

      const mapInstance = L.map(mapRef.current, {
        center: [-2.5, 118],
        zoom: 5,
        minZoom: 4,
        maxZoom: 8,
        maxBounds: indonesiaBounds,
        maxBoundsViscosity: 1.0,
        zoomControl: true,
        scrollWheelZoom: true,
      });
      mapInstanceRef.current = mapInstance;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        },
      ).addTo(mapInstance);
      /** Tile layer CartoDB Positron (tampilan bersih). */

      setMap(mapInstance);

      try {
        const response = await fetch("/geojson/indonesia-provinces-38.json");
        const geoData = await response.json();

        const maxCount = Math.max(...data.map((d) => d.count), 1);

        const dataMap = new Map(
          data.map((d) => [d.name.toLowerCase(), d.count]),
        );
        /** Lookup count per provinsi (nama lowercase) untuk style dan popup. */

        const getColorAndCategory = (count: number) => {
          if (count === 0)
            return { color: "#e5e7eb", category: "Tidak ada aktivitas" }; // Abu-abu
          const ratio = count / maxCount;
          if (ratio > 0.6)
            return { color: "#047857", category: "Aktivitas Terbanyak" }; // Hijau tua
          if (ratio > 0.3)
            return { color: "#86efac", category: "Aktivitas Sedang" }; // Hijau muda
          return { color: "#d1fae5", category: "Aktivitas Rendah" };
        };
        /** Warna & kategori: 0=abu; ratio>0.6=hijau tua; >0.3=hijau; else hijau muda. */

        const style = (feature: any) => {
          const provinceName = feature.properties.name || "";
          const count = dataMap.get(provinceName.toLowerCase()) || 0;
          const { color } = getColorAndCategory(count);

          return {
            fillColor: color,
            weight: 1,
            opacity: 1,
            color: "#10b981",
            fillOpacity: 0.7,
          };
        };
        /** Style tiap feature: fillColor dari getColorAndCategory, border hijau. */

        geoJsonLayerRef.current = L.geoJSON(geoData, {
          style: style,
          onEachFeature: (feature: any, layer: any) => {
            const provinceName = feature.properties.name || "Unknown";
            const count = dataMap.get(provinceName.toLowerCase()) || 0;
            const { color, category } = getColorAndCategory(count);

            const popupContent = `
              <div style="font-family: system-ui; padding: 8px; min-width: 200px;">
                <strong style="font-size: 14px; color: #1f2937; display: block; margin-bottom: 4px;">${provinceName}</strong>
                <span style="font-size: 13px; color: #6b7280; display: block; margin-bottom: 6px;">${count} aktivitas unit kerja</span>
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px;">
                  <div style="width: 18px; height: 18px; background-color: ${color}; border: 1px solid #9ca3af; border-radius: 3px; flex-shrink: 0;"></div>
                  <span style="font-size: 12px; color: #374151; font-weight: 600;">${category}</span>
                </div>
              </div>
            `.trim();

            layer.bindPopup(popupContent, {
              className: "custom-popup",
              closeButton: true,
              autoPan: true,
            });

            layer.on({
              mouseover: (e: any) => {
                const layer = e.target;
                layer.setStyle({
                  weight: 3,
                  color: "#059669",
                  fillOpacity: 0.9,
                });
              },
              mouseout: (e: any) => {
                geoJsonLayerRef.current.resetStyle(e.target);
              },
              click: (e: any) => {
                mapInstance.fitBounds(e.target.getBounds());
              },
            });
            /** Hover: tebal border + fillOpacity 0.9; mouseout: resetStyle; click: zoom ke bounds provinsi. */
          },
        }).addTo(mapInstance);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);
  /** Inisialisasi peta sekali saat mount; cleanup remove map saat unmount. */

  useEffect(() => {
    if (!map || !geoJsonLayerRef.current || data.length === 0) return;

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const dataMap = new Map(data.map((d) => [d.name.toLowerCase(), d.count]));

    const getColorAndCategory = (count: number) => {
      if (count === 0)
        return { color: "#e5e7eb", category: "Tidak ada aktivitas" };
      const ratio = count / maxCount;
      if (ratio > 0.6)
        return { color: "#047857", category: "Aktivitas Terbanyak" };
      if (ratio > 0.3)
        return { color: "#86efac", category: "Aktivitas Sedang" };
      return { color: "#d1fae5", category: "Aktivitas Rendah" };
    };

    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      const provinceName = feature.properties.name || "";
      const count = dataMap.get(provinceName.toLowerCase()) || 0;
      const { color, category } = getColorAndCategory(count);

      layer.setStyle({
        fillColor: color,
        weight: 1,
        opacity: 1,
        color: "#10b981",
        fillOpacity: 0.7,
      });

      const popupContent = `
        <div style="font-family: system-ui; padding: 8px; min-width: 200px;">
          <strong style="font-size: 14px; color: #1f2937; display: block; margin-bottom: 4px;">${provinceName}</strong>
          <span style="font-size: 13px; color: #6b7280; display: block; margin-bottom: 6px;">${count} aktivitas unit kerja</span>
          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb; display: flex; align-items: center; gap: 8px;">
            <div style="width: 18px; height: 18px; background-color: ${color}; border: 1px solid #9ca3af; border-radius: 3px; flex-shrink: 0;"></div>
            <span style="font-size: 12px; color: #374151; font-weight: 600;">${category}</span>
          </div>
        </div>
      `.trim();

      layer.bindPopup(popupContent, {
        className: "custom-popup",
        closeButton: true,
        autoPan: true,
      });
    });
  }, [data, map]);
  /** Saat data atau map berubah: update style dan popup tiap layer GeoJSON (tanpa load ulang peta). */

  return (
    <div className="relative w-full h-full" style={{ zIndex: 1 }}>
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />

      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 z-[1000] overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
          <p className="text-xs font-semibold text-gray-700">
            Kategori Aktivitas
          </p>
          <button
            onClick={() => setLegendMinimized(!legendMinimized)}
            className="text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            aria-label={legendMinimized ? "Expand legend" : "Collapse legend"}
          >
            {legendMinimized ? (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
            )}
          </button>
        </div>

        {!legendMinimized && (
          <div className="p-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: "#047857" }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">
                  Aktivitas Terbanyak
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: "#86efac" }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">
                  Aktivitas Sedang
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: "#d1fae5" }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">
                  Aktivitas Rendah
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-4 rounded"
                  style={{ backgroundColor: "#e5e7eb" }}
                ></div>
                <span className="text-xs text-gray-700 font-medium">
                  Tidak ada aktivitas
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
