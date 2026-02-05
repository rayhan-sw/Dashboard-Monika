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

const colorStyles = {
  blue: "from-blue-500 to-blue-400",
  green: "from-green-500 to-green-400",
  amber: "from-amber-500 to-amber-400",
  red: "from-red-500 to-red-400",
};

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
          {trend && (
            <div className="flex items-center gap-1">
              <span
                className={`text-sm font-semibold ${
                  trend.isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
              </span>
              <span className="text-xs text-gray-500">vs last week</span>
            </div>
          )}
        </div>

        <div
          className={`w-14 h-14 rounded-lg bg-gradient-to-br ${colorStyles[color]} flex items-center justify-center text-white shadow-md`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
