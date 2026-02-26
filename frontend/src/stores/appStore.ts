import { create } from "zustand";
import { subDays, format } from "date-fns";

export interface DateRange {
  startDate: string;
  endDate: string;
}

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

const getDefaultDateRange = (): DateRange => {
  const endDate = new Date();
  // Use full data range from 2021 to current date to show all clusters
  const startDate = new Date("2021-01-01");
  return {
    startDate: format(startDate, "yyyy-MM-dd"),
    endDate: format(endDate, "yyyy-MM-dd"),
  };
};

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  dateRange: getDefaultDateRange(),
  actualDateRange: null,
  selectedCluster: "",
  sidebarCollapsed: false,
  setUser: (user) => set({ user }),
  setProfilePhoto: (photo) => set((state) => ({
    user: state.user ? { ...state.user, profile_photo: photo } : null
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setDateRange: (dateRange) => set({ dateRange }),
  setActualDateRange: (dateRange) => set({ actualDateRange: dateRange }),
  setSelectedCluster: (cluster) => set({ selectedCluster: cluster }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setPresetRange: (days) => {
    const actual = get().actualDateRange;
    if (days >= 9999 && actual) {
      // "Semua" button - use actual database range
      set({ dateRange: actual });
    } else {
      const endDate = new Date();
      const startDate = subDays(endDate, days);
      set({
        dateRange: {
          startDate: format(startDate, "yyyy-MM-dd"),
          endDate: format(endDate, "yyyy-MM-dd"),
        },
      });
    }
  },
  logout: () => {
    // Clear user from localStorage (token is in memory, cleared by authService)
    localStorage.removeItem("user");
    set({ user: null });
  },
}));
