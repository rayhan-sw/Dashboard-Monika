"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  BarChart3,
  FileText,
  Brain,
  Settings,
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

interface CurrentUser {
  id: number;
  username: string;
  role: string;
  full_name?: string;
}

export default function Sidebar() {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        setCurrentUser(JSON.parse(userStr));
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, []);

  const displayName = currentUser?.full_name || currentUser?.username || 'User';
  const roleDisplay = currentUser?.role === 'admin' ? 'Administrator' : 'Monitoring - Biro TI';
  const initials = displayName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  const handleProfileClick = () => {
    router.push('/settings');
  };

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

      {/* User Profile Area */}
      <div 
        className="h-20 border-t border-gray-5 flex items-center gap-3 px-4 cursor-pointer hover:bg-gray-6 transition-colors"
        onClick={handleProfileClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleProfileClick();
          }
        }}
      >
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
            currentUser?.role === 'admin' ? 'bg-gradient-bpk' : 'bg-red-500'
          }`}
        >
          <span className="text-white font-bold text-sm">{initials}</span>
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-body font-semibold text-gray-1 whitespace-nowrap">
            {displayName}
          </div>
          <div className="text-overline text-gray-3 whitespace-nowrap">
            {roleDisplay}
          </div>
        </div>
        <div className="w-8 h-8 rounded-md-bpk hover:bg-gray-5 flex items-center justify-center transition-colors">
          <Settings className="w-4 h-4 text-gray-3" />
        </div>
      </div>
    </aside>
  );
}
