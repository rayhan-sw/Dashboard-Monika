/**
 * Footer.tsx
 *
 * Footer layout: satu baris dengan logo (logo-footer.svg) di tengah. Background putih,
 * border atas, mt-auto agar menempel di bawah saat konten pendek. Dipakai di halaman
 * yang punya Sidebar + Header (dashboard, regional, dll.).
 */

"use client";

import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          <Image
            src="/images/logo-footer.svg"
            alt="Monitoring Kluster Analitik"
            width={300}
            height={60}
            className="h-8 w-auto object-contain"
          />
        </div>
      </div>
    </footer>
  );
}
