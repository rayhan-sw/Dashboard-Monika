/**
 * StatCard.tsx
 *
 * Kartu statistik reusable: judul (title), nilai besar (value), ikon di kanan dengan
 * gradient warna (blue/green/amber/red), dan opsional trend (persen naik/turun vs minggu lalu).
 * Value number diformat toLocaleString("id-ID"); value string ditampilkan apa adanya.
 */

"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: "blue" | "green" | "amber" | "red";
}
/** Props: title, value (angka atau teks), icon, trend opsional (value %, isPositive), warna ikon. */

const colorStyles = {
  blue: "from-blue-500 to-blue-400",
  green: "from-green-500 to-green-400",
  amber: "from-amber-500 to-amber-400",
  red: "from-red-500 to-red-400",
};
/** Kelas Tailwind gradient per warna (bg-gradient-to-br). */

export default function StatCard({
  title,
  value,
  icon,
  trend,
  color = "blue",
}: StatCardProps) {
  return (
    <div className="bg-white rounded-[13px] p-6 shadow-sm hover:shadow-md transition-shadow duration-200 h-[120px]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-gray-900 mb-1">
            {typeof value === "number" ? value.toLocaleString("id-ID") : value}
          </h3>
          {/* Nilai: jika number pakai format locale Indonesia, jika string tampilkan as-is */}
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs minggu lalu</span>
            </div>
          )}
          {/* Trend: hijau + ↑ jika positif, merah + ↓ jika negatif; tampilkan |value|% dan "vs minggu lalu" */}
        </div>

        <div
          className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorStyles[color]} flex items-center justify-center text-white shadow-md`}
        >
          {icon}
        </div>
        {/* Kotak ikon: gradient sesuai color, ukuran 14x14, teks putih */}
      </div>
    </div>
  );
}
