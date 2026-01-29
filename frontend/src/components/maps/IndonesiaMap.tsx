"use client";

import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

interface ProvinceData {
  name: string;
  count: number;
}

interface IndonesiaMapProps {
  data: ProvinceData[];
}

export default function IndonesiaMap({ data }: IndonesiaMapProps) {
  const mapRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null); // Store map instance for reliable cleanup
  const [map, setMap] = useState<any>(null);
  const geoJsonLayerRef = useRef<any>(null);

  // Initialize map once
  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return; // Don't reinitialize if map instance exists

    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Fix default marker icon issue with webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current) return;

      // Check if the container already has a map (defensive check)
      if (mapRef.current._leaflet_id) {
        return;
      }

      // Initialize map with bounds locked to Indonesia
      const indonesiaBounds: [[number, number], [number, number]] = [
        [-11, 94], // Southwest coordinates
        [6, 141], // Northeast coordinates
      ];

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

      // Store in ref for reliable cleanup
      mapInstanceRef.current = mapInstance;

      // Add CartoDB Positron tile layer for clean look
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        },
      ).addTo(mapInstance);

      setMap(mapInstance);

      // Load GeoJSON Indonesia
      try {
        const response = await fetch("/geojson/indonesia-provinces.json");
        const geoData = await response.json();

        // Get max count for color scaling
        const maxCount = Math.max(...data.map((d) => d.count), 1);

        // Create a map for quick lookup
        const dataMap = new Map(
          data.map((d) => [d.name.toLowerCase(), d.count]),
        );

        // Function to get color based on count (simplified to 3 levels)
        const getColor = (count: number) => {
          const ratio = count / maxCount;
          if (ratio > 0.6) return "#047857"; // Tinggi - Dark green
          if (ratio > 0.3) return "#34d399"; // Sedang - Medium green
          if (ratio > 0) return "#a7f3d0"; // Rendah - Light green
          return "#d1fae5"; // No data - Very light green
        };

        // Style function
        const style = (feature: any) => {
          const provinceName = feature.properties.Propinsi || "";
          // Normalize province name for matching
          const normalizedName = provinceName
            .replace(/NUSATENGGARA/g, "NUSA TENGGARA")
            .trim();
          const count = dataMap.get(normalizedName.toLowerCase()) || 0;

          return {
            fillColor: getColor(count),
            weight: 1,
            opacity: 1,
            color: "#10b981",
            fillOpacity: 0.7,
          };
        };

        // Add GeoJSON layer
        geoJsonLayerRef.current = L.geoJSON(geoData, {
          style: style,
          onEachFeature: (feature: any, layer: any) => {
            const rawProvinceName = feature.properties.Propinsi || "Unknown";
            const provinceName = rawProvinceName
              .replace(/NUSATENGGARA/g, "NUSA TENGGARA")
              .trim();
            const count = dataMap.get(provinceName.toLowerCase()) || 0;

            // Popup
            layer.bindPopup(`
              <div style="font-family: system-ui; padding: 4px;">
                <strong style="font-size: 14px; color: #1f2937;">${provinceName}</strong><br/>
                <span style="font-size: 13px; color: #6b7280;">${count} aktivitas unit kerja</span>
              </div>
            `);

            // Hover effect
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
          },
        }).addTo(mapInstance);
      } catch (error) {
        console.error("Error loading GeoJSON:", error);
      }
    };

    initMap();

    // Cleanup only when component unmounts
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []); // Empty dependency - only run once

  // Update map colors when data changes
  useEffect(() => {
    if (!map || !geoJsonLayerRef.current || data.length === 0) return;

    const maxCount = Math.max(...data.map((d) => d.count), 1);
    const dataMap = new Map(data.map((d) => [d.name.toLowerCase(), d.count]));

    const getColor = (count: number) => {
      const ratio = count / maxCount;
      if (ratio > 0.6) return "#047857";
      if (ratio > 0.3) return "#34d399";
      if (ratio > 0) return "#a7f3d0";
      return "#d1fae5";
    };

    // Update each layer's style
    geoJsonLayerRef.current.eachLayer((layer: any) => {
      const feature = layer.feature;
      const provinceName = feature.properties.Propinsi || "";
      const normalizedName = provinceName
        .replace(/NUSATENGGARA/g, "NUSA TENGGARA")
        .trim();
      const count = dataMap.get(normalizedName.toLowerCase()) || 0;

      layer.setStyle({
        fillColor: getColor(count),
        weight: 1,
        opacity: 1,
        color: "#10b981",
        fillOpacity: 0.7,
      });

      // Update popup
      layer.bindPopup(`
        <div style="font-family: system-ui; padding: 4px;">
          <strong style="font-size: 14px; color: #1f2937;">${normalizedName}</strong><br/>
          <span style="font-size: 13px; color: #6b7280;">${count} aktivitas unit kerja</span>
        </div>
      `);
    });
  }, [data, map]);

  return (
    <div className="relative w-full h-full" style={{ zIndex: 1 }}>
      <div ref={mapRef} className="w-full h-full rounded-xl overflow-hidden" />

      {/* Legend - Simplified to 3 levels */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 z-50">
        <p className="text-xs font-semibold text-gray-700 mb-2">
          Jumlah Aktivitas
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-4 rounded"
              style={{ backgroundColor: "#047857" }}
            ></div>
            <span className="text-xs text-gray-700 font-medium">Tinggi</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-4 rounded"
              style={{ backgroundColor: "#34d399" }}
            ></div>
            <span className="text-xs text-gray-700 font-medium">Sedang</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-4 rounded"
              style={{ backgroundColor: "#a7f3d0" }}
            ></div>
            <span className="text-xs text-gray-700 font-medium">Rendah</span>
          </div>
        </div>
      </div>
    </div>
  );
}
