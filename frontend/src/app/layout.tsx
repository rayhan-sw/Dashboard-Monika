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

export const metadata: Metadata = {
  title: "Dashboard Monitoring BIDICS | BPK RI",
  description:
    "Dashboard pemantauan aktivitas pengguna BIDICS - Badan Pemeriksa Keuangan Republik Indonesia",
  keywords: ["BPK", "Dashboard", "Monitoring", "BIDICS", "Analytics"],
};

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
