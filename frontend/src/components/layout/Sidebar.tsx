'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  BarChart3, 
  Compass, 
  FileText, 
  Brain, 
  Users, 
  Bell, 
  Settings 
} from 'lucide-react';

const menuItems = [
  { 
    name: 'Dashboard', 
    href: '/', 
    icon: Home,
    description: 'User Monitor'
  },
  { 
    name: 'Analisis Regional & Unit', 
    href: '/regional', 
    icon: BarChart3,
    description: 'Regional Analysis'
  },
  { 
    name: 'Analisis Konten', 
    href: '/content-intelligence', 
    icon: Brain,
    description: 'Content Intelligence'
  },
  { 
    name: 'Laporan', 
    href: '/reports', 
    icon: FileText,
    description: 'Reports & Export'
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-80 h-screen bg-white border-r border-gray-5 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo Area */}
      <div className="h-20 flex items-center px-6 border-b border-gray-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-bpk flex items-center justify-center">
            <span className="text-white font-bold text-lg">BPK</span>
          </div>
          <div>
            <h1 className="text-h5 font-bold text-gray-1">Dashboard BIDICS</h1>
            <p className="text-overline text-gray-3">Monitoring System</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg-bpk
                    transition-all duration-200 group
                    ${isActive 
                      ? 'bg-gradient-bpk text-white shadow-md' 
                      : 'text-gray-2 hover:bg-gray-6 hover:text-gray-1'
                    }
                  `}
                >
                  <Icon 
                    className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-3 group-hover:text-bpk-orange'}`} 
                  />
                  <div className="flex-1">
                    <div className={`text-body font-semibold ${isActive ? 'text-white' : 'text-gray-1'}`}>
                      {item.name}
                    </div>
                    <div className={`text-overline ${isActive ? 'text-white/80' : 'text-gray-3'}`}>
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
      <div className="h-20 border-t border-gray-5 px-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-bpk flex items-center justify-center">
          <span className="text-white font-bold text-sm">AD</span>
        </div>
        <div className="flex-1">
          <div className="text-body font-semibold text-gray-1">Admin User</div>
          <div className="text-overline text-gray-3">Administrator</div>
        </div>
        <button className="w-8 h-8 rounded-md-bpk hover:bg-gray-6 flex items-center justify-center">
          <Settings className="w-4 h-4 text-gray-3" />
        </button>
      </div>
    </aside>
  );
}
