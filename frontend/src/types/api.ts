// API Response Types for Dashboard BPK

export interface DashboardStats {
  total_users: number;
  success_logins: number;
  total_activities: number;
  logout_errors: number;
  busiest_hour: {
    hour: number;
    count: number;
  };
}

export interface ActivityLog {
  id: string;
  id_trans: string;
  nama: string;
  satker: string;
  aktifitas: string;
  scope: string;
  lokasi: string;
  cluster: string;
  tanggal: string;
  token: string;
  province: string;
  region: string;
  created_at: string;
  updated_at: string;
  status?: string;
  detail_aktifitas?: string;
  eselon?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface HourlyData {
  hour: number;
  count: number;
}

export interface ClusterData {
  [cluster: string]: number;
}

export interface ProvinceData {
  province: string;
  count: number;
}

export interface AccessSuccessData {
  date: string;
  success: number;
  failed: number;
  success_rate: number;
}

export interface SatkerData {
  rank: number;
  satker: string;
  count: number;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
  message?: string;
}
