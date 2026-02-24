"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  FileText,
  Brain,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: Home,
    description: "User Monitor",
  },
  {
    name: "Analisis Regional & Unit",
    href: "/regional",
    icon: BarChart3,
    description: "Regional Analysis",
  },
  {
    name: "Analisis Konten",
    href: "/content",
    icon: Brain,
    description: "Content Intelligence",
  },
  {
    name: "Laporan",
    href: "/reports",
    icon: FileText,
    description: "Reports & Export",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-80 h-screen bg-white border-r border-gray-5 flex flex-col fixed left-0 top-0 z-[110]"
    >
      <div className="h-24 flex items-center justify-center border-b border-gray-5 px-6">
        <div className="flex items-center justify-center w-full" style={{ height: "4.5rem" }}>
          <img
            src="/images/logo-monika.svg"
            alt="Logo Monika"
            className="object-contain"
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
            }}
          />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav
        className="flex-1 overflow-y-auto py-6 px-3 scrollbar-hide"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg-bpk group relative overflow-hidden px-4 py-3
                    ${
                      isActive
                        ? "bg-gradient-bpk text-white shadow-md"
                        : "text-gray-2 hover:bg-gray-6 hover:text-gray-1"
                    }
                  `}
                  style={{
                    transition: "background 120ms ease-out",
                  }}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-3 group-hover:text-bpk-orange"}`}
                  />
                  <div className="flex-1 overflow-hidden">
                    <div
                      className={`text-body font-semibold whitespace-nowrap ${isActive ? "text-white" : "text-gray-1"}`}
                    >
                      {item.name}
                    </div>
                    <div
                      className={`text-overline whitespace-nowrap ${isActive ? "text-white/80" : "text-gray-3"}`}
                    >
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <div className="w-1 h-8 bg-white rounded-full"></div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
