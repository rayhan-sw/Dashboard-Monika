/**
 * @file api.ts
 * @description
 * Tipe TypeScript untuk response dan payload API Dashboard BPK. Berisi: statistik dashboard,
 * log aktivitas, response terpaginate, data chart (hourly, cluster, provinsi), akses sukses,
 * satker, wrapper ApiResponse/ApiError, serta tipe modul laporan (template, generate, unduhan, permintaan akses).
 * Dipakai oleh services/api.ts dan komponen yang memakai data API.
 */

/** Statistik utama dashboard: jumlah user, login sukses, aktivitas, error logout, jam tersibuk */
export interface DashboardStats {
  total_users: number;
  success_logins: number;
  total_activities: number;
  logout_errors: number;
  busiest_hour: {
    hour: number;   // 0–23
    count: number;
  };
}

/** Satu baris log aktivitas pengguna (dari API aktivitas/pencarian) */
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

/** Response standar list terpaginate: data array + info halaman */
export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

/** Satu titik data chart per jam (jam 0–23 dan jumlah) */
export interface HourlyData {
  hour: number;
  count: number;
}

/** Data chart per cluster: nama cluster sebagai key, nilai count sebagai value */
export interface ClusterData {
  [cluster: string]: number;
}

/** Satu baris data chart per provinsi */
export interface ProvinceData {
  province: string;
  count: number;
}

/** Data akses (login) per tanggal: sukses, gagal, dan persentase sukses */
export interface AccessSuccessData {
  date: string;
  success: number;
  failed: number;
  success_rate: number;
}

/** Satu baris ranking satker (unit) dengan jumlah aktivitas */
export interface SatkerData {
  rank: number;
  satker: string;
  count: number;
}

/** Wrapper response API yang membungkus data di property `data` */
export interface ApiResponse<T> {
  data: T;
}

/** Bentuk error dari body response API (bukan kelas ApiError di services) */
export interface ApiError {
  error: string;
  message?: string;
}

/** Template laporan: id, judul, deskripsi, dan format yang didukung (mis. pdf, xlsx) */
export interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  formats: string[];
}

/** Payload request generate laporan (POST /api/reports/generate) */
export interface ReportGenerateRequest {
  template_id: string;
  format: string;
  start_date?: string;
  end_date?: string;
}

/** Response setelah generate laporan: URL unduh, nama file, ukuran, waktu generate */
export interface ReportGenerateResponse {
  success: boolean;
  template_id: string;
  format: string;
  filename: string;
  download_url: string;
  file_size: string;
  generated_at: string;
}

/** Satu record unduhan laporan (siapa, kapan, format, ukuran) */
export interface ReportDownload {
  id: number;
  report_name: string;
  format: string;
  downloaded_by: string;
  generated_at: string;
  file_size?: string;
}

/** Satu permintaan akses laporan: user, unit, status, alasan opsional */
export interface ReportAccessRequest {
  id: number;
  user_id: number;
  user_name: string;
  unit: string;
  requested_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

