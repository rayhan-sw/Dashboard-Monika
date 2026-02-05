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
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" }));
      throw new ApiError(response.status, error.error || response.statusText);
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

  getStats: (startDate?: string, endDate?: string, cluster?: string) => {
    console.log("API Service - getStats INPUT:", {
      startDate,
      endDate,
      cluster,
      clusterType: typeof cluster,
    });
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    // Only add cluster if it's not empty string (empty = all clusters)
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    const query = params.toString();
    const url = `/api/dashboard/stats${query ? `?${query}` : ""}`;
    console.log("API Service - getStats URL:", url);
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
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
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

// Regional API
export const regionalService = {
  getProvinces: () =>
    fetchApi<ApiResponse<ProvinceData[]>>("/api/regional/provinces"),

  getLocations: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
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
  ) => {
    const params = new URLSearchParams();
    params.append("page", page.toString());
    params.append("page_size", pageSize.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
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
  ) => {
    const params = new URLSearchParams();
    params.append("satker", satker);
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
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
  ) => {
    const params = new URLSearchParams();
    params.append("limit", limit.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
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
    return fetchApi<ApiResponse<{ rank: number; cluster: string; count: number }[]>>(
      `/api/content/dashboard-rankings${query ? `?${query}` : ""}`
    );
  },

  getSearchModuleUsage: (startDate?: string, endDate?: string, cluster?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster) params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<{ module: string; count: number; percentage: number }[]>>(
      `/api/content/search-modules${query ? `?${query}` : ""}`
    );
  },

  getExportStats: (startDate?: string, endDate?: string, cluster?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster) params.append("cluster", cluster);
    const query = params.toString();
    return fetchApi<ApiResponse<{ view_data: number; download_data: number; export_data: number }>>(
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
    return fetchApi<ApiResponse<{ intent: string; count: number }[]>>(
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
    return fetchApi<ApiResponse<{
      id: string;
      name: string;
      description: string;
      formats: string[];
    }[]>>("/api/reports/templates");
  },

  generateReport: (templateId: string, format: string, startDate?: string, endDate?: string) => {
    return fetchApi<{ success: boolean; filename: string; download_url: string }>(
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

  getRecentDownloads: (limit?: number) => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    const query = params.toString();
    return fetchApi<ApiResponse<{
      id: number;
      report_name: string;
      format: string;
      generated_at: string;
      downloaded_by: string;
    }[]>>(`/api/reports/downloads${query ? `?${query}` : ""}`);
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

  requestAccess: (reportType: string, reason: string) => {
    return fetchApi<{ success: boolean; message: string }>(
      "/api/reports/request-access",
      {
        method: "POST",
        body: JSON.stringify({
          report_type: reportType,
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

// Health Check
export const healthCheck = () =>
  fetchApi<{ status: string; service: string; version: string }>("/health");

export { ApiError };
