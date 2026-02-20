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
  id: number;
  id_trans: string;
  nama: string;
  satker: string;
  aktifitas: string;
  cluster: string;
  lokasi: string;
  province: string;
  scope: string;
  detail_aktifitas: string;
  status: string;
  eselon: string;
  tanggal: string;
  created_at: string;
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

// Report Types
export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  formats: string[];
}

export interface ReportGenerateRequest {
  template_id: string;
  format: string;
  start_date?: string;
  end_date?: string;
}

export interface ReportGenerateResponse {
  success: boolean;
  template_id: string;
  format: string;
  filename: string;
  download_url: string;
  file_size: string;
  generated_at: string;
}

export interface ReportDownload {
  id: number;
  report_name: string;
  format: string;
  downloaded_by: string;
  generated_at: string;
  file_size?: string;
}

export interface ReportAccessRequest {
  id: number;
  user_id: number;
  user_name: string;
  unit: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

