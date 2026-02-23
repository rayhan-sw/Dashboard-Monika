"use client";

interface TopContributor {
  rank: number;
  username: string;
  unit: string;
  requests: number;
}

interface TopContributorsProps {
  topContributors: TopContributor[];
}

const CARD_STYLE = {
  backgroundColor: "#F9FAFB",
  borderColor: "#E5E5EA",
  borderWidth: 1,
  boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
} as const;

export default function TopContributors({
  topContributors,
}: TopContributorsProps) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={CARD_STYLE}
    >
      <div className="flex items-start gap-4 mb-6">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: "#FEF3C6" }}
        >
          <svg
            className="w-5 h-5"
            style={{ color: "#BB4D00" }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-semibold text-black mb-0.5">
            Kontributor Aktivitas Teratas
          </h2>
          <p className="text-sm text-[#8E8E93]">
            Pengguna dengan aktivitas terbanyak
          </p>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-[#E5E5EA] scrollbar-track-transparent hover:scrollbar-thumb-[#D1D1D6]">
        {topContributors.map((contributor) => (
          <div
            key={contributor.rank}
            className="rounded-xl p-4 flex items-center justify-between transition-colors duration-200 group border border-transparent hover:border-[#E5E5EA]"
            style={{ backgroundColor: "rgba(255,255,255,0.6)" }}
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Ranking Badge */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: "#FFFAEB" }}
              >
                <span className="text-sm font-bold text-[#BB4D00]">
                  {contributor.rank}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-black truncate">
                  {contributor.username}
                </p>
                <p className="text-xs text-[#8E8E93] truncate mt-0.5">
                  {contributor.unit}
                </p>
              </div>
            </div>

            {/* Request Count */}
            <div className="flex-shrink-0 ml-4">
              <span className="text-sm font-bold text-black">
                {contributor.requests.toLocaleString()}
              </span>
              <span className="text-xs text-[#8E8E93] ml-1">request</span>
            </div>
          </div>
        ))}

        {topContributors.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto mb-3"
              style={{ color: "#D1D1D6" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-sm" style={{ color: "#8E8E93" }}>Tidak ada data kontributor</p>
          </div>
        )}
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f3f4f6;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  );
}
