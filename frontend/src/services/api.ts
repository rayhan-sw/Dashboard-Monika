import type {
  DashboardStats,
  ActivityLog,
  PaginatedResponse,
  HourlyData,
  ClusterData,
  ProvinceData,
  AccessSuccessData,
  SatkerData,
  ApiResponse,
  ReportTemplate,
  ReportGenerateResponse,
  ReportDownload,
  ReportAccessRequest,
} from "@/types/api";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function clearAuthAndRedirectToLogin() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/auth/login";
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Get user info from localStorage
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let userId = null;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id;
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (userId) {
      headers['X-User-ID'] = String(userId);
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      const status = response.status;
      const message = error.error || response.statusText;
      if (status === 401) {
        clearAuthAndRedirectToLogin();
      }
      throw new ApiError(status, message);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

// Dashboard API
export const dashboardService = {
  getClusters: () => {
    return fetchApi<ApiResponse<string[]>>("/api/dashboard/clusters");
  },

  getStats: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null)
      params.append("root_satker_id", String(rootSatkerId));
    const query = params.toString();
    const url = `/api/dashboard/stats${query ? `?${query}` : ""}`;
    return fetchApi<DashboardStats>(url);
  },

  getActivities: (
    page = 1,
    pageSize = 10,
    startDate?: string,
    endDate?: string,
    cluster?: string,
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    return fetchApi<PaginatedResponse<ActivityLog>>(
      `/api/dashboard/activities?${params.toString()}`,
    );
  },

  getHourlyChart: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null) params.append("root_satker_id", String(rootSatkerId));
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
    const query = params.toString();
    return fetchApi<ApiResponse<HourlyData[]>>(
      `/api/dashboard/charts/hourly${query ? `?${query}` : ""}`,
    );
  },

  getClusterChart: (startDate?: string, endDate?: string, cluster?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<ClusterData>>(
      `/api/dashboard/charts/cluster${query ? `?${query}` : ""}`,
    );
  },

  getProvinceChart: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<ProvinceData[]>>(
      `/api/dashboard/charts/province${query ? `?${query}` : ""}`,
    );
  },

  getAccessSuccess: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<AccessSuccessData[]>>(
      `/api/dashboard/access-success${query ? `?${query}` : ""}`,
    );
  },

  getDateRange: () =>
    fetchApi<{ min_date: string; max_date: string }>(
      "/api/dashboard/date-range",
    ),

  getLogoutErrors: (
    limit = 10,
    startDate?: string,
    endDate?: string,
    cluster?: string,
  ) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    return fetchApi<
      ApiResponse<
        {
          rank: number;
          username: string;
          error_count: number;
          latest_error: string;
        }[]
      >
    >(`/api/dashboard/logout-errors?${params.toString()}`);
  },
};

// Eselon I root unit for regional filter
export interface SatkerRoot {
  id: number;
  satker_name: string;
  eselon_level: string;
}

/** Satker unit (flat list from GET /api/metadata/satker) */
export interface SatkerUnit {
  id: number;
  satker_name: string;
  eselon_level: string;
  parent_id: number | null;
}

// Search API (suggestions + global search)
export const searchService = {
  getSuggestions: (q: string) =>
    fetchApi<{ suggestions?: { type?: string; value?: string; label?: string }[]; data?: unknown[] }>(
      `/api/search/suggestions?q=${encodeURIComponent(q)}`,
    ),

  globalSearch: (queryString: string) =>
    fetchApi<{
      data?: ActivityLog[];
      total_count?: number;
      page?: number;
      total_pages?: number;
    }>(`/api/search${queryString ? `?${queryString}` : ""}`),
};

// Metadata API (flat satker list for tree, etc.)
export const metadataService = {
  getSatkerList: () =>
    fetchApi<{ satker: SatkerUnit[] }>("/api/metadata/satker"),
};

// Regional API
export const regionalService = {
  getProvinces: () =>
    fetchApi<ApiResponse<ProvinceData[]>>("/api/regional/provinces"),

  /** Daftar unit Eselon I (root) untuk filter regional */
  getSatkerRoots: () =>
    fetchApi<{ roots: SatkerRoot[] }>("/api/metadata/satker/roots"),

  /** Anak langsung satu root (Eselon I) — hanya Eselon II, untuk chart engagement. */
  getChildrenOfRoot: (rootId: number) =>
    fetchApi<{ children: SatkerRoot[] }>(
      `/api/metadata/satker/roots/${rootId}/children`,
    ),

  getLocations: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null) params.append("root_satker_id", String(rootSatkerId));
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
    const query = params.toString();
    return fetchApi<ApiResponse<{ lokasi: string; count: number }[]>>(
      `/api/regional/locations${query ? `?${query}` : ""}`,
    );
  },

  getUnits: (
    page = 1,
    pageSize = 1000,
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null) params.append("root_satker_id", String(rootSatkerId));
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
    return fetchApi<PaginatedResponse<SatkerData>>(
      `/api/regional/units?${params.toString()}`,
    );
  },

  getUnitHourlyData: (
    satker: string,
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    params.append("satker", satker);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null) params.append("root_satker_id", String(rootSatkerId));
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
    return fetchApi<ApiResponse<HourlyData[]>>(
      `/api/regional/units/hourly?${params.toString()}`,
    );
  },

  getTopContributors: (
    limit = 10,
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null) params.append("root_satker_id", String(rootSatkerId));
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
    return fetchApi<
      ApiResponse<
        { rank: number; username: string; unit: string; requests: number }[]
      >
    >(`/api/regional/top-contributors?${params.toString()}`);
  },
};

// Content Analytics API (Analisis Konten)
export const contentService = {
  getDashboardRankings: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString();
    return fetchApi<ApiResponse<{ rank: number; name: string; count: number; percentage: number }[]>>(
      `/api/content/dashboard-rankings${query ? `?${query}` : ""}`
    );
  },

  getSearchModuleUsage: (startDate?: string, endDate?: string, cluster?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster) params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<{ name: string; count: number }[]>>(
      `/api/content/search-modules${query ? `?${query}` : ""}`
    );
  },

  getExportStats: (startDate?: string, endDate?: string, cluster?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster) params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<{ 
      view_data: number; 
      download_data: number; 
      view_details?: { detail: string; count: number }[];
      download_details?: { detail: string; count: number }[];
    }>>(
      `/api/content/export-stats${query ? `?${query}` : ""}`
    );
  },

  getOperationalIntents: (startDate?: string, endDate?: string, limit?: number, cluster?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (limit) params.append("limit", limit.toString());
    if (cluster) params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<{ name: string; count: number }[]>>(
      `/api/content/operational-intents${query ? `?${query}` : ""}`
    );
  },

  getGlobalEconomicsChart: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString();
    return fetchApi<ApiResponse<{ category: string; count: number; percentage: number }[]>>(
      `/api/content/global-economics${query ? `?${query}` : ""}`
    );
  },
};

// Reports API (Laporan)
export const reportService = {
  getTemplates: () => {
    return fetchApi<ApiResponse<ReportTemplate[]>>("/api/reports/templates");
  },

  generateReport: (templateId: string, format: string, startDate?: string, endDate?: string) => {
    return fetchApi<ReportGenerateResponse>(
      "/api/reports/generate",
      {
        method: "POST",
        body: JSON.stringify({
          template_id: templateId,
          format,
          start_date: startDate,
          end_date: endDate,
        }),
      }
    );
  },

  getRecentDownloads: (limit?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString();
    return fetchApi<ApiResponse<ReportDownload[]>>(`/api/reports/downloads${query ? `?${query}` : ""}`);
  },

  getAccessRequests: () => {
    return fetchApi<ApiResponse<{
      id: number;
      user_name: string;
      report_type: string;
      requested_at: string;
      status: string;
    }[]>>("/api/reports/access-requests");
  },

  requestAccess: (userId: number, reason: string) => {
    return fetchApi<{ success: boolean; message: string; request_id: number }>(
      "/api/reports/request-access",
      {
        method: "POST",
        body: JSON.stringify({
          user_id: userId,
          reason,
        }),
      }
    );
  },

  updateAccessRequest: (id: number, status: "approved" | "rejected") => {
    return fetchApi<{ success: boolean; message: string }>(
      `/api/reports/access-requests/${id}`,
      {
        method: "PUT",
        body: JSON.stringify({ status }),
      }
    );
  },
};

// Notification API
export const notificationService = {
  getNotifications: (userId: number) => {
    return fetchApi<{
      data: {
        id: number;
        user_id: number;
        title: string;
        message: string;
        type: string;
        is_read: boolean;
        related_entity: string;
        related_id: number | null;
        created_at: string;
      }[];
      unread_count: number;
    }>(`/api/notifications?user_id=${userId}`);
  },

  markAsRead: (id: number) => {
    return fetchApi<{ success: boolean; message: string }>(
      `/api/notifications/${id}/read`,
      {
        method: "PUT",
      }
    );
  },

  markAllAsRead: (userId: number) => {
    return fetchApi<{ success: boolean; message: string }>(
      "/api/notifications/read-all",
      {
        method: "POST",
        body: JSON.stringify({ user_id: userId }),
      }
    );
  },
};

// Profile API
export const profileService = {
  getProfile: () => {
    return fetchApi<{
      id: number;
      username: string;
      full_name: string;
      email: string;
      role: string;
      profile_photo?: string;
      report_access_status: string;
      last_login?: string;
      created_at: string;
      report_access_label: string;
    }>("/api/profile");
  },

  updateProfilePhoto: (profilePhoto: string) => {
    return fetchApi<{
      message: string;
      user: {
        id: number;
        username: string;
        full_name: string;
        email: string;
        role: string;
        profile_photo: string;
      };
    }>("/api/profile/photo", {
      method: "PUT",
      body: JSON.stringify({ profile_photo: profilePhoto }),
    });
  },

  requestReportAccess: () => {
    return fetchApi<{
      message: string;
      status: string;
    }>("/api/profile/request-access", {
      method: "POST",
    });
  },

  getPendingAccessRequests: () => {
    return fetchApi<{
      requests: Array<{
        id: number;
        username: string;
        full_name: string;
        email: string;
        report_access_status: string;
      }>;
      count: number;
    }>("/api/profile/access-requests");
  },

  approveReportAccess: (userId: number, action: "approve" | "reject") => {
    return fetchApi<{
      message: string;
      status: string;
    }>(`/api/profile/access-requests/${userId}?action=${action}`, {
      method: "PUT",
    });
  },
};

// Account API (for authenticated user account management)
export const accountService = {
  changePassword: (oldPassword: string, newPassword: string, confirmPassword: string) => {
    return fetchApi<{
      message: string;
    }>("/api/account/change-password", {
      method: "POST",
      body: JSON.stringify({
        old_password: oldPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      }),
    });
  },
};

// User API
export const userService = {
  getProfile: (userId: number) => {
    return fetchApi<{
      data: {
        id: number;
        username: string;
        role: string;
        full_name: string;
        email: string;
        is_active: boolean;
        report_access_status: string;
        created_at: string;
        updated_at: string;
        last_login: string | null;
      };
    }>(`/api/users/profile?user_id=${userId}`);
  },
};

// Health Check
export const healthCheck = () =>
  fetchApi<{ status: string; service: string; version: string }>("/health");

export { ApiError };
