/**
 * @file api.ts
 * @description
 * Modul layanan API untuk frontend Dashboard BPK. Menyediakan:
 * - Konfigurasi base URL dan helper fetch dengan auth (token + X-User-ID).
 * - Kelas ApiError untuk error dari backend (status + pesan).
 * - Layanan per domain: dashboard, search, metadata, regional, content, reports,
 *   notifications, profile, account, user, dan health check.
 * Semua request memakai JSON; 401 akan clear auth dan redirect ke /auth/login.
 */

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

/** Base URL backend: dari env NEXT_PUBLIC_API_URL atau fallback localhost:8080 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/**
 * Error khusus dari response API (bukan network error).
 * Berguna untuk bedakan 4xx/5xx dari backend dengan kegagalan koneksi.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Hapus token dan data user dari localStorage lalu redirect ke halaman login.
 * Hanya jalan di browser (window); di SSR tidak melakukan apa-apa.
 */
function clearAuthAndRedirectToLogin() {
  if (typeof window === "undefined") return; // SSR: skip
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  window.location.href = "/auth/login"; // paksa ke login
}

/**
 * Helper fetch ke API: gabung base URL + endpoint, set header JSON + Authorization + X-User-ID.
 * Jika response tidak ok: parse body error, jika 401 panggil clearAuthAndRedirectToLogin, lalu lempar ApiError.
 * Jika bukan ApiError (mis. network error), lempar Error umum.
 * @param endpoint - Path API (dimulai dengan /), digabung dengan API_BASE_URL
 * @param options - Opsi fetch (method, body, headers tambahan, dll.)
 * @returns Promise<T> hasil response.json()
 */
async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`; // URL lengkap backend

  // Ambil token dari localStorage (hanya di client)
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  // Ambil data user untuk kirim user id ke backend
  const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  let userId = null;
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      userId = user.id; // ambil id dari objek user
    } catch (e) {
      console.error('Failed to parse user from localStorage', e);
    }
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string> || {}), // gabung header dari options
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`; // auth untuk API
    }
    if (userId) {
      headers['X-User-ID'] = String(userId); // identifikasi user di backend
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: "Unknown error" })); // jika body bukan JSON
      const status = response.status;
      const message = error.error || response.statusText;
      if (status === 401) {
        clearAuthAndRedirectToLogin(); // unauthorized → logout & ke login
      }
      throw new ApiError(status, message);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error; // lempar ulang error dari backend
    }
    throw new Error(
      `Network error: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/** Layanan API Dashboard: statistik, aktivitas, grafik (hourly/cluster/province), akses sukses, rentang tanggal, error logout */
export const dashboardService = {
  /** Ambil daftar cluster yang tersedia (untuk filter) */
  getClusters: () => {
    return fetchApi<ApiResponse<string[]>>("/api/dashboard/clusters");
  },

  /** Statistik dashboard dengan filter tanggal, cluster, root_satker_id. Query string dibangun dari param yang ada. */
  getStats: (
    startDate?: string,
    endDate?: string,
    cluster?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster); // abaikan string kosong
    if (rootSatkerId != null)
      params.append("root_satker_id", String(rootSatkerId));
    const query = params.toString();
    const url = `/api/dashboard/stats${query ? `?${query}` : ""}`;
    return fetchApi<DashboardStats>(url);
  },

  /** Aktivitas terpaginate: page, page_size, filter tanggal & cluster */
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

  /** Data chart per jam. Filter: root_satker_id (prioritas) atau eselon jika tidak pakai root. */
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
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon); // eselon hanya jika tidak ada root
    const query = params.toString();
    return fetchApi<ApiResponse<HourlyData[]>>(
      `/api/dashboard/charts/hourly${query ? `?${query}` : ""}`,
    );
  },

  /** Data chart per cluster (filter tanggal & cluster) */
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

  /** Data chart per provinsi */
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

  /** Data akses sukses (untuk grafik/statistik) */
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

  /** Rentang tanggal min/max yang tersedia di data */
  getDateRange: () =>
    fetchApi<{ min_date: string; max_date: string }>(
      "/api/dashboard/date-range",
    ),

  /** Daftar error logout (ranking user by error count), dengan limit & filter tanggal/cluster */
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

/** Unit Eselon I (root) untuk filter regional; dari API satker/roots */
export interface SatkerRoot {
  id: number;
  satker_name: string;
  eselon_level: string;
}

/** Satu unit satker dalam daftar flat dari GET /api/metadata/satker (untuk tree, dll.) */
export interface SatkerUnit {
  id: number;
  satker_name: string;
  eselon_level: string;
  parent_id: number | null;
}

/** Layanan API Search: saran (suggestions) dan pencarian global */
export const searchService = {
  /** Saran pencarian berdasarkan query q; query di-encode agar aman di URL */
  getSuggestions: (q: string) =>
    fetchApi<{ suggestions?: { type?: string; value?: string; label?: string }[]; data?: unknown[] }>(
      `/api/search/suggestions?q=${encodeURIComponent(q)}`,
    ),

  /** Pencarian global; queryString bisa berisi page, keyword, filter, dll. */
  globalSearch: (queryString: string) =>
    fetchApi<{
      data?: ActivityLog[];
      total_count?: number;
      page?: number;
      total_pages?: number;
    }>(`/api/search${queryString ? `?${queryString}` : ""}`),
};

/** Layanan API Metadata: daftar satker flat (untuk membangun tree, dropdown, dll.) */
export const metadataService = {
  getSatkerList: () =>
    fetchApi<{ satker: SatkerUnit[] }>("/api/metadata/satker"),
};

/** Layanan API Regional: provinsi, root satker, anak root, lokasi, unit, hourly per unit, top kontributor */
export const regionalService = {
  getProvinces: () =>
    fetchApi<ApiResponse<ProvinceData[]>>("/api/regional/provinces"),

  /** Daftar unit Eselon I (root) untuk filter regional */
  getSatkerRoots: () =>
    fetchApi<{ roots: SatkerRoot[] }>("/api/metadata/satker/roots"),

  /** Anak langsung satu root (Eselon I) — Eselon II, untuk chart engagement */
  getChildrenOfRoot: (rootId: number) =>
    fetchApi<{ children: SatkerRoot[] }>(
      `/api/metadata/satker/roots/${rootId}/children`,
    ),

  /** Distribusi lokasi (lokasi + count). Filter: root_satker_id atau eselon */
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

  /** Daftar unit (satker) terpaginate; filter sama seperti getLocations */
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

  /** Data per jam untuk satu satker tertentu */
  getUnitHourlyData: (
    satker: string,
    startDate?: string,
    endDate?: string,
    cluster?: string,
    eselon?: string,
    rootSatkerId?: number,
  ) => {
    const params = new URLSearchParams();
    params.append("satker", satker); // satker wajib
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    if (cluster && cluster.trim() !== "") params.append("cluster", cluster);
    if (rootSatkerId != null) params.append("root_satker_id", String(rootSatkerId));
    else if (eselon && eselon.trim() !== "") params.append("eselon", eselon);
    return fetchApi<ApiResponse<HourlyData[]>>(
      `/api/regional/units/hourly?${params.toString()}`,
    );
  },

  /** Top kontributor (user) by requests, dengan limit & filter */
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

/** Layanan API Analisis Konten: ranking dashboard, modul pencarian, export, maksud operasional, global economics */
export const contentService = {
  /** Ranking untuk dashboard konten (nama, count, persentase) */
  getDashboardRankings: (startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString();
    return fetchApi<ApiResponse<{ rank: number; name: string; count: number; percentage: number }[]>>(
      `/api/content/dashboard-rankings${query ? `?${query}` : ""}`
    );
  },

  /** Penggunaan modul pencarian (nama modul + count) */
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

  /** Statistik export: view_data, download_data, plus detail per jenis */
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

  /** Maksud operasional (nama + count), opsional limit & cluster */
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

  /** Data chart global economics (kategori, count, persentase) */
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

/** Layanan API Laporan: template, generate, unduhan terbaru, permintaan akses */
export const reportService = {
  /** Daftar template laporan yang tersedia */
  getTemplates: () => {
    return fetchApi<ApiResponse<ReportTemplate[]>>("/api/reports/templates");
  },

  /** Generate laporan: POST dengan template_id, format, dan opsional start_date/end_date */
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

  /** Daftar unduhan laporan terbaru (opsional limit & filter tanggal) */
  getRecentDownloads: (limit?: number, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append("limit", limit.toString());
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString();
    return fetchApi<ApiResponse<ReportDownload[]>>(`/api/reports/downloads${query ? `?${query}` : ""}`);
  },

  /** Daftar permintaan akses laporan (untuk admin) */
  getAccessRequests: () => {
    return fetchApi<ApiResponse<{
      id: number;
      user_name: string;
      report_type: string;
      requested_at: string;
      status: string;
    }[]>>("/api/reports/access-requests");
  },

  /** User mengajukan permintaan akses laporan (user_id + alasan) */
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

  /** Update status permintaan akses: approved atau rejected */
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

/** Layanan API Notifikasi: daftar notif per user, tandai baca satu, tandai semua baca */
export const notificationService = {
  /** Ambil notifikasi user + jumlah belum dibaca */
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

  /** Tandai satu notifikasi sebagai sudah dibaca (PUT) */
  markAsRead: (id: number) => {
    return fetchApi<{ success: boolean; message: string }>(
      `/api/notifications/${id}/read`,
      {
        method: "PUT",
      }
    );
  },

  /** Tandai semua notifikasi user sebagai sudah dibaca (POST body user_id) */
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

/** Layanan API Profil: profil user login, foto, permintaan akses laporan, daftar & approve permintaan */
export const profileService = {
  /** Profil user yang sedang login (termasuk report_access_status, report_access_label) */
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

  /** Update foto profil (PUT body profile_photo) */
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

  /** User mengajukan permintaan akses laporan (POST, tanpa body) */
  requestReportAccess: () => {
    return fetchApi<{
      message: string;
      status: string;
    }>("/api/profile/request-access", {
      method: "POST",
    });
  },

  /** Daftar permintaan akses yang pending (untuk admin) */
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

  /** Approve atau reject permintaan akses by user_id (PUT query action=approve|reject) */
  approveReportAccess: (userId: number, action: "approve" | "reject") => {
    return fetchApi<{
      message: string;
      status: string;
    }>(`/api/profile/access-requests/${userId}?action=${action}`, {
      method: "PUT",
    });
  },
};

/** Layanan API Akun (user yang login): ganti password */
export const accountService = {
  /** Ganti password: POST dengan old_password, new_password, confirm_password */
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

/** Layanan API User (profil user by id, untuk admin/detail user) */
export const userService = {
  /** Ambil profil user by user_id (query user_id) */
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

/** Health check backend: status, service, version */
export const healthCheck = () =>
  fetchApi<{ status: string; service: string; version: string }>("/health");
