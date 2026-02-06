"use client";

import { useState } from "react";
import { Lock, Clock, Send } from "lucide-react";
import { reportService } from "@/services/api";

interface AccessLockedViewProps {
  userId: number;
  accessStatus: string; // 'none', 'pending', 'rejected'
  onRequestSent?: () => void;
}

export default function AccessLockedView({ userId, accessStatus, onRequestSent }: AccessLockedViewProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequestAccess = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await reportService.requestAccess(userId, "Meminta akses untuk melihat halaman laporan");
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal mengirim permintaan akses");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = accessStatus === "pending";

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
      <div className="flex flex-col items-center justify-center text-center max-w-md mx-auto">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          {isPending ? (
            <Clock className="w-10 h-10 text-slate-400" />
          ) : (
            <Lock className="w-10 h-10 text-slate-400" />
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          Akses Terkunci
        </h2>

        {/* Description */}
        <p className="text-slate-500 mb-6">
          {isPending
            ? "Permintaan akses Anda sedang diproses oleh administrator. Anda akan mendapatkan notifikasi saat permintaan Anda disetujui."
            : "Halaman laporan hanya dapat diakses oleh pengguna yang memiliki izin khusus. Silahkan ajukan permintaan akses kepada administrator."}
        </p>

        {/* Error Message */}
        {error && (
          <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Action Button */}
        {isPending ? (
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-orange-400 text-orange-500 rounded-lg">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Permintaan Akses Sedang Diproses Admin</span>
          </div>
        ) : (
          <button
            onClick={handleRequestAccess}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Mengirim...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="font-medium">Minta Akses Laporan</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
