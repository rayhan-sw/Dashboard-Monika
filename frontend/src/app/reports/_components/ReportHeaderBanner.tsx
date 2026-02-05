"use client";

interface ReportHeaderBannerProps {
  title?: string;
  subtitle?: string;
}

export default function ReportHeaderBanner({
  title = "Badan Pemeriksa Keuangan Republik Indonesia",
  subtitle = "Laporan dengan Kop Surat Resmi BPK RI",
}: ReportHeaderBannerProps) {
  return (
    <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl p-6 mb-6 flex items-center gap-4">
      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
        <img
          src="/images/logo-bpk.png"
          alt="BPK Logo"
          className="w-12 h-12 object-contain"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            e.currentTarget.parentElement!.innerHTML =
              '<span class="text-orange-500 font-bold text-xl">BPK</span>';
          }}
        />
      </div>
      <div className="text-white">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-orange-100">{subtitle}</p>
      </div>
    </div>
  );
}
