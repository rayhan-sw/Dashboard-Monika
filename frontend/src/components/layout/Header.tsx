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
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { dashboardService } from "@/services/api";
import { useAppStore } from "@/stores/appStore";
import { format, parse } from "date-fns";
import { id } from "date-fns/locale";

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

export default function Header({ sidebarCollapsed = false }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [clusters, setClusters] = useState<string[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showClusterPicker, setShowClusterPicker] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [tempSelectedCluster, setTempSelectedCluster] = useState<string>("");
  const datePickerRef = useRef<HTMLDivElement>(null);
  const clusterPickerRef = useRef<HTMLDivElement>(null);
  const {
    selectedCluster,
    setSelectedCluster,
    dateRange,
    setDateRange,
    setPresetRange,
  } = useAppStore();

  useEffect(() => {
    loadClusters();
    setTempSelectedCluster(selectedCluster);
  }, [selectedCluster]);

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
    };

    if (showDatePicker || showClusterPicker) {
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
          <button
            className="relative w-10 h-10 rounded-md-bpk hover:bg-gray-6 
                           flex items-center justify-center transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-2" />
            <span
              className="absolute top-1 right-1 w-2 h-2 bg-status-error 
                           rounded-full ring-2 ring-white"
            ></span>
          </button>

          {/* Settings */}
          <button
            className="w-10 h-10 rounded-md-bpk hover:bg-gray-6 
                           flex items-center justify-center transition-colors"
          >
            <Settings className="w-5 h-5 text-gray-2" />
          </button>

          {/* User Profile */}
          <button
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
                Admin User
              </div>
              <div className="text-overline text-gray-3">Administrator</div>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
