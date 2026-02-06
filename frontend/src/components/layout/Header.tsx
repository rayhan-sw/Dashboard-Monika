"use client";

import {
  Search,
  Bell,
  Settings,
  User,
  Calendar,
  Filter,
  ChevronDown,
  Check,
  LogOut,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { dashboardService, notificationService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";

interface Notification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  related_entity: string;
  related_id: number | null;
  created_at: string;
}

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

export default function Header({ sidebarCollapsed = false }: HeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [clusters, setClusters] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClusterPicker, setShowClusterPicker] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<{ id: number; username: string; role: string } | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [tempSelectedCluster, setTempSelectedCluster] = useState<string>("");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const clusterPickerRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const {
    selectedCluster,
    setSelectedCluster,
    dateRange,
    setDateRange,
    setPresetRange,
  } = useAppStore();

  // Load user and notifications
  useEffect(() => {
    loadClusters();
    setTempSelectedCluster(selectedCluster);
    
    // Load current user from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setCurrentUser(user);
        // Load notifications for this user
        if (user.id) {
          loadNotifications(user.id);
        }
      } catch (e) {
        console.error('Failed to parse user data:', e);
      }
    }
  }, [selectedCluster]);

  const loadNotifications = async (userId: number) => {
    try {
      const response = await notificationService.getNotifications(userId);
      setNotifications(response.data || []);
      setUnreadCount(response.unread_count || 0);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleMarkNotificationRead = async (notifId: number) => {
    try {
      await notificationService.markAsRead(notifId);
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notifId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setShowDatePicker(false);
      }
      if (
        clusterPickerRef.current &&
        !clusterPickerRef.current.contains(event.target as Node)
      ) {
        setShowClusterPicker(false);
      }
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
      if (
        notifRef.current &&
        !notifRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
    };

    if (showDatePicker || showClusterPicker || showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker, showClusterPicker]);

  const loadClusters = async () => {
    try {
      const response = await dashboardService.getClusters();
      setClusters(response.data);
    } catch (error) {
      console.error("Failed to load clusters:", error);
    }
  };

  const formatDateDisplay = () => {
    try {
      const start = parse(dateRange.startDate, "yyyy-MM-dd", new Date());
      const end = parse(dateRange.endDate, "yyyy-MM-dd", new Date());
      return `${format(start, "d MMM", { locale: id })} - ${format(end, "d MMM yyyy", { locale: id })}`;
    } catch {
      return "Pilih Tanggal";
    }
  };

  const handleQuickSelect = (days: number) => {
    setPresetRange(days);
    setShowDatePicker(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const handleDateClick = (date: Date) => {
    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      // Start new selection
      setTempStartDate(date);
      setTempEndDate(null);
    } else {
      // Complete selection
      if (date < tempStartDate) {
        setTempStartDate(date);
        setTempEndDate(tempStartDate);
      } else {
        setTempEndDate(date);
      }
    }
  };

  const handleApplyDateRange = () => {
    if (tempStartDate && tempEndDate) {
      const newDateRange = {
        startDate: format(tempStartDate, "yyyy-MM-dd"),
        endDate: format(tempEndDate, "yyyy-MM-dd"),
      };
      console.log("=== APPLYING DATE RANGE ===");
      console.log("Previous dateRange:", dateRange);
      console.log("New dateRange:", newDateRange);
      console.log("Current cluster:", selectedCluster);
      setDateRange(newDateRange);
      setShowDatePicker(false);
      setTempStartDate(null);
      setTempEndDate(null);
    }
  };

  const isDateInRange = (date: Date) => {
    if (!tempStartDate) return false;
    if (!tempEndDate) return date.getTime() === tempStartDate.getTime();
    return date >= tempStartDate && date <= tempEndDate;
  };

  const isDateRangeEdge = (date: Date) => {
    if (!tempStartDate) return false;
    return (
      date.getTime() === tempStartDate.getTime() ||
      (tempEndDate && date.getTime() === tempEndDate.getTime())
    );
  };

  const handleApplyCluster = () => {
    console.log("=== APPLYING CLUSTER ===");
    console.log("Previous cluster:", selectedCluster);
    console.log("New cluster:", tempSelectedCluster);
    console.log("Type:", typeof tempSelectedCluster);
    setSelectedCluster(tempSelectedCluster);
    setShowClusterPicker(false);
    console.log("Cluster applied, picker closed");
  };

  const getClusterDisplayText = () => {
    if (!selectedCluster) return "Semua Cluster";
    return selectedCluster;
  };

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login
    router.push('/auth/login');
  };

  return (
    <header
      className={`h-20 bg-white border-b border-gray-5 fixed top-0 right-0 z-[100] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'left-20' : 'left-80'}`}
    >
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
          {/* Date Range Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-bpk-orange rounded-lg-bpk hover:bg-orange-50 transition-colors"
            >
              <Calendar className="w-4 h-4 text-bpk-orange" />
              <span className="text-caption text-gray-1 font-medium">
                {formatDateDisplay()}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-bpk-orange transition-transform ${showDatePicker ? "rotate-180" : ""}`}
              />
            </button>

            {/* Date Picker Dropdown */}
            {showDatePicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg-bpk shadow-lg border border-gray-5 p-4 z-[200] min-w-[320px]">
                {/* Quick Select Buttons */}
                <div className="flex gap-2 mb-4 pb-4 border-b border-gray-5">
                  <button
                    onClick={() => handleQuickSelect(7)}
                    className="px-3 py-1.5 text-caption rounded-md-bpk border border-gray-5 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                  >
                    7 Hari
                  </button>
                  <button
                    onClick={() => handleQuickSelect(30)}
                    className="px-3 py-1.5 text-caption rounded-md-bpk border border-gray-5 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                  >
                    30 Hari
                  </button>
                  <button
                    onClick={() => handleQuickSelect(90)}
                    className="px-3 py-1.5 text-caption rounded-md-bpk border border-gray-5 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                  >
                    90 Hari
                  </button>
                  <button
                    onClick={() => handleQuickSelect(9999)}
                    className="px-3 py-1.5 text-caption rounded-md-bpk border border-gray-5 hover:border-bpk-orange hover:bg-orange-50 transition-colors"
                  >
                    Semua
                  </button>
                </div>

                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() =>
                      setSelectedMonth(
                        new Date(
                          selectedMonth.getFullYear(),
                          selectedMonth.getMonth() - 1,
                        ),
                      )
                    }
                    className="p-1 hover:bg-gray-6 rounded"
                  >
                    ←
                  </button>
                  <span className="text-body font-semibold">
                    {format(selectedMonth, "MMMM yyyy", { locale: id })}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedMonth(
                        new Date(
                          selectedMonth.getFullYear(),
                          selectedMonth.getMonth() + 1,
                        ),
                      )
                    }
                    className="p-1 hover:bg-gray-6 rounded"
                  >
                    →
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1 mb-4">
                  {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center text-overline text-gray-3 font-semibold py-1"
                      >
                        {day}
                      </div>
                    ),
                  )}
                  {getDaysInMonth(selectedMonth).map((date, index) => {
                    if (!date) {
                      return (
                        <div key={`empty-${index}`} className="aspect-square" />
                      );
                    }
                    const isInRange = isDateInRange(date);
                    const isEdge = isDateRangeEdge(date);
                    const isToday =
                      format(date, "yyyy-MM-dd") ===
                      format(new Date(), "yyyy-MM-dd");

                    return (
                      <button
                        key={index}
                        onClick={() => handleDateClick(date)}
                        className={`aspect-square text-caption rounded-md flex items-center justify-center transition-colors
                          ${isEdge ? "bg-bpk-orange text-white font-semibold" : ""}
                          ${isInRange && !isEdge ? "bg-orange-100 text-bpk-orange" : ""}
                          ${!isInRange && !isEdge ? "hover:bg-gray-6 text-gray-1" : ""}
                          ${isToday && !isInRange ? "border border-bpk-orange" : ""}
                        `}
                      >
                        {date.getDate()}
                      </button>
                    );
                  })}
                </div>

                {/* Apply Button */}
                {tempStartDate && tempEndDate && (
                  <button
                    onClick={handleApplyDateRange}
                    className="w-full py-2 bg-bpk-orange text-white rounded-md-bpk hover:bg-orange-600 transition-colors text-caption font-semibold"
                  >
                    Terapkan
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Cluster Filter */}
          <div className="relative" ref={clusterPickerRef}>
            <button
              onClick={() => setShowClusterPicker(!showClusterPicker)}
              className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-bpk-orange rounded-lg-bpk hover:bg-orange-50 transition-colors"
            >
              <Filter className="w-4 h-4 text-bpk-orange" />
              <span className="text-caption text-gray-1 font-medium">
                {getClusterDisplayText()}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-bpk-orange transition-transform ${showClusterPicker ? "rotate-180" : ""}`}
              />
            </button>

            {/* Cluster Picker Dropdown */}
            {showClusterPicker && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg-bpk shadow-lg border border-gray-5 p-4 z-[200] min-w-[280px]">
                <div className="space-y-2 mb-4 max-h-[300px] overflow-y-auto">
                  {/* Semua Cluster Option */}
                  <button
                    onClick={() => setTempSelectedCluster("")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md-bpk transition-colors ${
                      tempSelectedCluster === ""
                        ? "bg-orange-50 border border-bpk-orange"
                        : "hover:bg-gray-6 border border-transparent"
                    }`}
                  >
                    <span
                      className={`text-caption ${tempSelectedCluster === "" ? "text-bpk-orange font-semibold" : "text-gray-1"}`}
                    >
                      Semua Cluster
                    </span>
                    {tempSelectedCluster === "" && (
                      <Check className="w-4 h-4 text-bpk-orange" />
                    )}
                  </button>

                  {/* Individual Cluster Options */}
                  {clusters.map((cluster) => (
                    <button
                      key={cluster}
                      onClick={() => setTempSelectedCluster(cluster)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-md-bpk transition-colors ${
                        tempSelectedCluster === cluster
                          ? "bg-orange-50 border border-bpk-orange"
                          : "hover:bg-gray-6 border border-transparent"
                      }`}
                    >
                      <span
                        className={`text-caption ${tempSelectedCluster === cluster ? "text-bpk-orange font-semibold" : "text-gray-1"}`}
                      >
                        {cluster}
                      </span>
                      {tempSelectedCluster === cluster && (
                        <Check className="w-4 h-4 text-bpk-orange" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Apply Button */}
                <button
                  onClick={handleApplyCluster}
                  className="w-full py-2 bg-bpk-orange text-white rounded-md-bpk hover:bg-orange-600 transition-colors text-caption font-semibold"
                >
                  Terapkan
                </button>
              </div>
            )}
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-10 h-10 rounded-md-bpk hover:bg-gray-6 
                             flex items-center justify-center transition-colors"
            >
              <Bell className="w-5 h-5 text-gray-2" />
              {unreadCount > 0 && (
                <span
                  className="absolute top-1 right-1 w-2 h-2 bg-status-error 
                             rounded-full ring-2 ring-white"
                ></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg-bpk shadow-lg border border-gray-5 z-[200] min-w-[280px] max-w-[320px]">
                <div className="px-4 py-3 border-b border-gray-5">
                  <h3 className="font-semibold text-gray-1">Notifikasi</h3>
                </div>
                
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => !notif.is_read && handleMarkNotificationRead(notif.id)}
                        className={`px-4 py-3 border-b border-gray-5 last:border-0 cursor-pointer hover:bg-gray-6 transition-colors ${
                          !notif.is_read ? 'bg-orange-50' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 ${
                            notif.type === 'success' ? 'text-emerald-500' :
                            notif.type === 'error' ? 'text-red-500' :
                            'text-blue-500'
                          }`}>
                            {notif.type === 'success' ? <CheckCircle className="w-4 h-4" /> :
                             notif.type === 'error' ? <XCircle className="w-4 h-4" /> :
                             <Info className="w-4 h-4" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-1">{notif.title}</p>
                            <p className="text-xs text-gray-3">{notif.message}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-center text-gray-3 text-sm">
                      Tidak ada notifikasi
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Settings */}
          <button
            className="w-10 h-10 rounded-md-bpk hover:bg-gray-6 
                           flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-2" />
          </button>

          {/* User Profile */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg-bpk 
                           hover:bg-gray-6 transition-colors"
            >
              <div
                className="w-9 h-9 rounded-full bg-gradient-bpk 
                          flex items-center justify-center"
              >
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-caption font-semibold text-gray-1">
                  {currentUser?.username || 'User'}
                </div>
                <div className="text-overline text-gray-3">
                  {currentUser?.role === 'admin' ? 'Administrator' : 'User'}
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-3 transition-transform ${showUserMenu ? "rotate-180" : ""}`}
              />
            </button>

            {/* User Menu Dropdown */}
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg-bpk shadow-lg border border-gray-5 py-2 z-[200] min-w-[200px]">
                <div className="px-4 py-2 border-b border-gray-5">
                  <div className="text-caption font-semibold text-gray-1">
                    {currentUser?.username || 'User'}
                  </div>
                  <div className="text-overline text-gray-3">
                    {currentUser?.role === 'admin' ? 'Administrator' : 'User'}
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-red-50 transition-colors text-left group"
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className="text-caption text-red-600 font-medium">
                    Logout
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
