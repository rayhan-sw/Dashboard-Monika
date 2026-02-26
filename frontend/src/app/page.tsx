/**
 * page.tsx – Halaman utama (root /)
 *
 * Client component: saat mount cek token di localStorage. Tidak ada token →
 * redirect ke /auth/login; ada token → redirect ke /dashboard. Selama proses
 * menampilkan spinner dan teks "Memuat...".
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      router.push("/auth/login");
    } else {
      router.push("/dashboard");
    }
  }, [router]);
  /** Cek token: tidak ada → login; ada → dashboard. */

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Memuat...</p>
        {/* Spinner + teks sementara saat redirect (biasanya sangat cepat). */}
      </div>
    </div>
  );
}
