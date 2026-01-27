'use client';

import { Search, Bell, Settings, User, Calendar } from 'lucide-react';
import { useState } from 'react';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <header className="h-20 bg-white border-b border-gray-5 fixed top-0 right-0 z-30"
            style={{ left: '320px' }}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-3" />
            <input
              type="text"
              placeholder="Search activities, users, or reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-lg-bpk border border-gray-5 
                       focus:border-bpk-orange focus:ring-2 focus:ring-bpk-orange/20 
                       outline-none transition-all text-body text-gray-1 
                       placeholder:text-gray-3"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 ml-6">
          {/* Date Display */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gray-6 rounded-md-bpk">
            <Calendar className="w-4 h-4 text-bpk-orange" />
            <span className="text-caption text-gray-2 font-medium">{currentDate}</span>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-md-bpk hover:bg-gray-6 
                           flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-gray-2" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-status-error 
                           rounded-full ring-2 ring-white"></span>
          </button>

          {/* Settings */}
          <button className="w-10 h-10 rounded-md-bpk hover:bg-gray-6 
                           flex items-center justify-center transition-colors">
            <Settings className="w-5 h-5 text-gray-2" />
          </button>

          {/* User Profile */}
          <button className="flex items-center gap-3 px-3 py-2 rounded-lg-bpk 
                           hover:bg-gray-6 transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-bpk 
                          flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-caption font-semibold text-gray-1">Admin User</div>
              <div className="text-overline text-gray-3">Administrator</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
