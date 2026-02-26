/**
 * @file utils.ts
 * @description
 * Modul utilitas global untuk frontend Dashboard BPK.
 * Berisi: penggabungan class CSS (Tailwind), format angka/tanggal/waktu,
 * perhitungan persen, warna cluster, dan pemotongan teks.
 * Semua format tanggal/waktu memakai locale Indonesia (id-ID).
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id as idLocale } from "date-fns/locale";

/**
 * Menggabungkan nama class CSS dengan aman (Tailwind).
 * clsx: gabung banyak nilai jadi string class; twMerge: hapus konflik Tailwind.
 * @param inputs - Class names (string, object, array, dll.)
 * @returns Satu string class yang siap dipakai di className
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs)); // clsx gabungkan input → twMerge rapikan konflik class Tailwind
}

/**
 * Memformat angka dengan pemisah ribuan sesuai locale Indonesia (id-ID).
 * @param num - Angka yang akan diformat
 * @returns String angka dengan format locale, misal: 1.234.567
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("id-ID").format(num); // pakai locale Indonesia untuk pemisah ribuan
}

/**
 * Memformat tanggal ke locale Indonesia.
 * @param date - Tanggal dalam bentuk string ISO atau objek Date
 * @param formatStr - Pola format date-fns (default: "dd MMM yyyy")
 * @returns String tanggal yang sudah diformat, misal: 26 Feb 2025
 */
export function formatDate(
  date: string | Date,
  formatStr = "dd MMM yyyy",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date; // string ISO → Date, kalau sudah Date dipakai langsung
  return format(dateObj, formatStr, { locale: idLocale }); // format pakai locale Indonesia
}

/**
 * Memformat tanggal dan jam ke locale Indonesia.
 * @param date - Tanggal dalam bentuk string ISO atau objek Date
 * @returns String format "dd MMM yyyy, HH:mm", misal: 26 Feb 2025, 14:30
 */
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "dd MMM yyyy, HH:mm", { locale: idLocale }); // tanggal + jam, locale id
}

/**
 * Memformat hanya jam (tanpa tanggal) ke locale Indonesia.
 * @param date - Tanggal/jam dalam bentuk string atau Date
 * @returns String jam format 2 digit (HH:mm), misal: 14:30
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date; // normalisasi ke objek Date
  return d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }); // hanya jam:menit, 2 digit, locale Indonesia
}

/**
 * Menghitung persentase value terhadap total.
 * Menghindari pembagian nol: jika total 0 mengembalikan 0.
 * @param value - Nilai bagian
 * @param total - Nilai total (penyebut)
 * @returns Persen bulat (0–100)
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0; // hindari pembagian nol
  return Math.round((value / total) * 100); // (value/total)*100 lalu dibulatkan
}

/**
 * Mengubah angka persentase menjadi string dengan satu desimal dan simbol %.
 * @param percentage - Angka persen (misal: 33.456)
 * @returns String misal: "33.5%"
 */
export function formatPercentage(percentage: number): string {
  return `${percentage.toFixed(1)}%`; // satu desimal + simbol %
}

/**
 * Mengembalikan warna hex untuk tipe cluster (pencarian, pemda, pusat).
 * Dipakai untuk badge/tag/grafik agar konsisten dengan design token.
 * @param cluster - Nama cluster (case-insensitive)
 * @returns Kode hex warna; jika tidak dikenal mengembalikan abu (#6B7280)
 */
export function getClusterColor(cluster: string): string {
  const colors: Record<string, string> = {
    pencarian: "#3B82F6", // biru
    pemda: "#10B981", // hijau
    pusat: "#F59E0B", // amber
  };
  return colors[cluster.toLowerCase()] || "#6B7280"; // cari warna by nama (lowercase); tidak ada → abu
}

/**
 * Memotong teks dan menambahkan "..." jika melebihi maxLength.
 * @param text - Teks asli
 * @param maxLength - Panjang maksimum (sebelum "...")
 * @returns Teks asli jika cukup pendek; otherwise teks dipotong + "..."
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text; // tidak perlu dipotong
  return text.slice(0, maxLength) + "..."; // potong sampai maxLength lalu tambah "..."
}
