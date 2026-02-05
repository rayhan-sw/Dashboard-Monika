"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BarChart3,
  Compass,
  FileText,
  Brain,
  Users,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppStore } from "@/stores/appStore";

const menuItems = [
  {
    name: "Dashboard",
    href: "/",
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
  const sidebarCollapsed = useAppStore((state) => state.sidebarCollapsed);
  const setSidebarCollapsed = useAppStore((state) => state.setSidebarCollapsed);

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <aside
      className={`${
        sidebarCollapsed ? "w-20" : "w-80"
      } h-screen bg-white border-r border-gray-5 flex flex-col fixed left-0 top-0 z-[110] overflow-visible will-change-[width]`}
      style={{
        transition: "width 300ms ease-out",
        contain: "layout style",
      }}
    >
      <div
        className={`h-24 flex items-center justify-center border-b border-gray-5 relative ${
          sidebarCollapsed ? "px-4" : "px-6"
        }`}
        style={{
          transition: "padding 200ms ease-out",
        }}
      >
        <div
          className="flex items-center justify-center w-full relative"
          style={{ height: "4.5rem" }}
        >
          {/* Logo Monika - Full with text (for expanded state) */}
          <img
            src="/images/logo-monika.svg"
            alt="Logo Monika"
            className={`absolute inset-0 m-auto object-contain ${
              sidebarCollapsed
                ? "opacity-0 scale-90 pointer-events-none"
                : "opacity-100 scale-100"
            }`}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
              willChange: "opacity, transform",
            }}
          />

          {/* Logo M - Icon only (for collapsed state) */}
          <img
            src="/images/logo-M.svg"
            alt="Logo M"
            className={`absolute inset-0 m-auto object-contain ${
              sidebarCollapsed
                ? "opacity-100 scale-100"
                : "opacity-0 scale-110 pointer-events-none"
            }`}
            style={{
              maxHeight: "2.5rem",
              maxWidth: "100%",
              transition: "opacity 200ms ease-out, transform 200ms ease-out",
              willChange: "opacity, transform",
            }}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className="absolute -right-4 bottom-0 translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.15)] z-[120] border-4 border-white hover:scale-110"
          style={{
            background: "linear-gradient(135deg, #FEB800 0%, #E27200 100%)",
            transition: "transform 150ms ease-out",
          }}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={`w-4 h-4 text-white ${
              sidebarCollapsed ? "rotate-180" : "rotate-0"
            }`}
            style={{
              transition: "transform 200ms ease-out",
            }}
          />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav
        className={`flex-1 overflow-y-auto py-6 ${
          sidebarCollapsed ? "px-2" : "px-3"
        } scrollbar-hide`}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          transition: "padding 200ms ease-out",
        }}
      >
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 rounded-lg-bpk group relative overflow-hidden
                    ${sidebarCollapsed ? "p-3 justify-center" : "px-4 py-3"}
                    ${
                      isActive
                        ? "bg-gradient-bpk text-white shadow-md"
                        : "text-gray-2 hover:bg-gray-6 hover:text-gray-1"
                    }
                  `}
                  style={{
                    transition:
                      "padding 200ms ease-out, background 150ms ease-out",
                  }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-3 group-hover:text-bpk-orange"}`}
                  />
                  <div
                    className={`flex-1 overflow-hidden ${!sidebarCollapsed ? "opacity-100" : "opacity-0 w-0"}`}
                    style={{
                      transition:
                        "opacity 150ms ease-out, width 200ms ease-out",
                    }}
                  >
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
                  {isActive && !sidebarCollapsed && (
                    <div className="w-1 h-8 bg-white rounded-full"></div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div
                      className="absolute left-full ml-2 px-3 py-2 bg-gray-1 text-white text-sm rounded-md-bpk opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-lg"
                      style={{
                        transition: "opacity 150ms ease-out",
                      }}
                    >
                      {item.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-1"></div>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Area */}
      <div
        className={`h-20 border-t border-gray-5 flex items-center gap-3 ${
          sidebarCollapsed ? "px-2 justify-center" : "px-4"
        }`}
        style={{
          transition: "padding 200ms ease-out",
        }}
      >
        <div className="w-10 h-10 rounded-full bg-gradient-bpk flex items-center justify-center flex-shrink-0">
          <span className="text-white font-bold text-sm">AD</span>
        </div>
        <div
          className={`flex-1 overflow-hidden ${!sidebarCollapsed ? "opacity-100" : "opacity-0 w-0"}`}
          style={{
            transition: "opacity 150ms ease-out, width 200ms ease-out",
          }}
        >
          <div className="text-body font-semibold text-gray-1 whitespace-nowrap">
            Admin User
          </div>
          <div className="text-overline text-gray-3 whitespace-nowrap">
            Administrator
          </div>
        </div>
        {!sidebarCollapsed && (
          <button className="w-8 h-8 rounded-md-bpk hover:bg-gray-6 flex items-center justify-center transition-colors">
            <Settings className="w-4 h-4 text-gray-3" />
          </button>
        )}
      </div>
    </aside>
  );
}
