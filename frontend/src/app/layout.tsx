/**
 * layout.tsx – Root layout aplikasi
 *
 * Membungkus seluruh halaman: font Plus Jakarta Sans (Google Font), impor globals.css,
 * metadata (title, description, keywords) untuk SEO. Root: <html lang="id"> dan
 * <body> dengan kelas font; children = isi halaman (outlet).
 */

import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-plus-jakarta",
  fallback: ["system-ui", "arial"],
  display: "swap",
});
/** Font Plus Jakarta Sans: subset latin, 5 berat, variabel CSS --font-plus-jakarta, display swap. */

export const metadata: Metadata = {
  title: "Dashboard Monitoring BIDICS | BPK RI",
  description:
    "Dashboard pemantauan aktivitas pengguna BIDICS - Badan Pemeriksa Keuangan Republik Indonesia",
  keywords: ["BPK", "Dashboard", "Monitoring", "BIDICS", "Analytics"],
};
/** Metadata untuk head: judul, deskripsi, kata kunci. */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={plusJakartaSans.className}>{children}</body>
    </html>
  );
}
/** Root layout: html bahasa Indonesia, body pakai kelas font Plus Jakarta Sans; children di-render di dalam. */
