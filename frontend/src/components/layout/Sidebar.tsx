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
    href: "/content-intelligence",
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

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

export default function Sidebar({ onCollapsedChange }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();

  const handleToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    if (onCollapsedChange) {
      onCollapsedChange(newState);
    }
  };

  return (
    <aside
      className={`${
        sidebarCollapsed ? "w-20" : "w-80"
      } h-screen bg-white border-r border-gray-5 flex flex-col fixed left-0 top-0 z-[45]`}
      style={{
        transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {/* Logo Area */}
      <div
        className={`h-24 flex items-center justify-center border-b border-gray-5 relative ${
          sidebarCollapsed ? "px-4" : "px-6"
        }`}
        style={{
          transition: "padding 600ms cubic-bezier(0.4, 0, 0.2, 1)",
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
            className={`absolute inset-0 m-auto object-contain transition-all duration-600 ease-in-out ${
              sidebarCollapsed
                ? "opacity-0 scale-75 pointer-events-none"
                : "opacity-100 scale-100"
            }`}
            style={{
              maxHeight: "100%",
              maxWidth: "100%",
              transformOrigin: "center",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />

          {/* Logo M - Icon only (for collapsed state) */}
          <img
            src="/images/logo-M.svg"
            alt="Logo M"
            className={`absolute inset-0 m-auto object-contain transition-all duration-600 ease-in-out ${
              sidebarCollapsed
                ? "opacity-100 scale-100"
                : "opacity-0 scale-125 pointer-events-none"
            }`}
            style={{
              maxHeight: "2.5rem",
              maxWidth: "100%",
              transformOrigin: "center",
              transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)",
            }}
          />
        </div>

        {/* Toggle Button */}
        <button
          onClick={handleToggle}
          className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-5 rounded-full flex items-center justify-center hover:bg-gray-6 hover:border-bpk-orange hover:scale-110 shadow-sm z-[110]"
          style={{
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div
            style={{
              transition: "transform 400ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-2" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-2" />
            )}
          </div>
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
          transition: "padding 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <ul className="space-y-1">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <li
                key={item.name}
                style={{
                  animation: !sidebarCollapsed
                    ? `fadeInSlide 400ms cubic-bezier(0.4, 0, 0.2, 1) ${index * 50}ms backwards`
                    : "none",
                }}
              >
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
                    transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  title={sidebarCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-3 group-hover:text-bpk-orange"}`}
                    style={{
                      transition: "all 400ms cubic-bezier(0.4, 0, 0.2, 1)",
                      transform:
                        isActive && !sidebarCollapsed ? "scale(1.1)" : "scale(1)",
                    }}
                  />
                  <div
                    className={`flex-1 ${!sidebarCollapsed ? "opacity-100" : "opacity-0 w-0"}`}
                    style={{
                      transition: "all 600ms cubic-bezier(0.4, 0, 0.2, 1)",
                      transform: !sidebarCollapsed
                        ? "translateX(0)"
                        : "translateX(-20px)",
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
                    <div
                      className="w-1 h-8 bg-white rounded-full"
                      style={{
                        animation:
                          "slideInRight 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                      }}
                    ></div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {sidebarCollapsed && (
                    <div
                      className="absolute left-full ml-2 px-3 py-2 bg-gray-1 text-white text-sm rounded-md-bpk opacity-0 invisible group-hover:opacity-100 group-hover:visible whitespace-nowrap z-50 shadow-lg"
                      style={{
                        transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                        transform: "translateX(-8px)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateX(-8px)";
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
          transition: "all 600ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className="w-10 h-10 rounded-full bg-gradient-bpk flex items-center justify-center flex-shrink-0"
          style={{
            transition: "transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)",
            transform: sidebarCollapsed ? "scale(1)" : "scale(1.05)",
          }}
        >
          <span className="text-white font-bold text-sm">AD</span>
        </div>
        <div
          className={`flex-1 ${!sidebarCollapsed ? "opacity-100" : "opacity-0 w-0"}`}
          style={{
            transition: "all 600ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: !sidebarCollapsed ? "translateX(0)" : "translateX(-20px)",
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
          <button
            className="w-8 h-8 rounded-md-bpk hover:bg-gray-6 flex items-center justify-center"
            style={{
              transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <Settings className="w-4 h-4 text-gray-3" />
          </button>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeInSlide {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-10px) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
      `}</style>
    </aside>
  );
}
