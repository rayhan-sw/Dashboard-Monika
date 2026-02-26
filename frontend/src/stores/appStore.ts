/**
 * @file appStore.ts
 * @description
 * Store global aplikasi (Zustand) untuk Dashboard BPK. Menyimpan: user login, loading/error,
 * rentang tanggal (dateRange + actualDateRange dari API), cluster terpilih, state sidebar.
 * Juga menyediakan action: set user/foto/loading/error, set tanggal (manual atau preset hari),
 * set cluster/sidebar, dan logout. Rentang tanggal default: 2021-01-01 sampai hari ini.
 */

import { create } from "zustand";
import { subDays, format } from "date-fns";

/** Rentang tanggal dalam format string yyyy-MM-dd (untuk filter API & tampilan) */
export interface DateRange {
  startDate: string;
  endDate: string;
}

/** State dan action store aplikasi */
interface AppState {
  user: {
    id: string;
    username: string;
    role: string;
    profile_photo?: string;
  } | null;
  isLoading: boolean;
  error: string | null;
  dateRange: DateRange;
  actualDateRange: DateRange | null;
  selectedCluster: string;
  sidebarCollapsed: boolean;
  setUser: (user: AppState["user"]) => void;
  setProfilePhoto: (photo: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDateRange: (dateRange: DateRange) => void;
  setActualDateRange: (dateRange: DateRange) => void;
  setPresetRange: (days: number) => void;
  setSelectedCluster: (cluster: string) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  logout: () => void;
}

/**
 * Rentang tanggal default: dari 2021-01-01 sampai hari ini.
 * Dipakai agar semua cluster/data tampil di awal; format yyyy-MM-dd untuk API.
 */
const getDefaultDateRange = (): DateRange => {
  const endDate = new Date(); // hari ini
  const startDate = new Date("2021-01-01"); // data tersedia dari 2021
  return {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
};

/** Hook Zustand untuk akses store global aplikasi (set/get state & actions) */
export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  dateRange: getDefaultDateRange(), // inisial pakai rentang default
  actualDateRange: null, // diisi dari API date-range (min/max nyata di DB)
  selectedCluster: "", // kosong = semua cluster
  sidebarCollapsed: false,
  setUser: (user) => set({ user }),
  setProfilePhoto: (photo) => set((state) => ({
    user: state.user ? { ...state.user, profile_photo: photo } : null // update hanya foto, user tetap
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDateRange: (dateRange) => set({ dateRange }),
  setActualDateRange: (dateRange) => set({ actualDateRange: dateRange }),
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  /** Preset rentang: days = jumlah hari dari hari ini ke belakang; 9999+ = pakai actualDateRange ("Semua") */
  setPresetRange: (days) => {
    const actual = get().actualDateRange; // ambil rentang nyata dari API
    if (days >= 9999 && actual) {
      set({ dateRange: actual }); // tombol "Semua" → pakai min/max dari database
    } else {
      const endDate = new Date();
      const startDate = subDays(endDate, days); // hari ini minus N hari
      set({
        dateRange: {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        },
      });
    }
  },
  /** Hapus token dari localStorage dan clear user di store (tidak redirect; biasanya dipanggil sebelum redirect) */
  logout: () => {
    // Clear user from localStorage (token is in memory, cleared by authService)
    localStorage.removeItem("user");
    set({ user: null });
  },
}));
