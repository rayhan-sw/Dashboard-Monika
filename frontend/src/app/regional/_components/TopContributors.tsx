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

export default function TopContributors({
  topContributors,
}: TopContributorsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white"
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
          <h2 className="text-xl font-semibold text-gray-900 mb-1">
            Kontributor Aktivitas Teratas
          </h2>
          <p className="text-sm text-gray-500">
            Pengguna dengan aktivitas terbanyak
          </p>
        </div>
      </div>

      {/* Scrollable List */}
      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
        {topContributors.map((contributor) => (
          <div
            key={contributor.rank}
            className="bg-gray-50 rounded-xl p-4 flex items-center justify-between hover:bg-gray-100 transition-all duration-200 group"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Ranking Badge */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center flex-shrink-0 group-hover:from-amber-200 group-hover:to-amber-100 transition-all">
                <span className="text-sm font-bold text-amber-700">
                  {contributor.rank}
                </span>
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {contributor.username}
                </p>
                <p className="text-xs text-gray-500 truncate mt-0.5">
                  {contributor.unit}
                </p>
              </div>
            </div>

            {/* Request Count */}
            <div className="flex-shrink-0 ml-4">
              <span className="text-sm font-bold text-gray-900">
                {contributor.requests.toLocaleString()}
              </span>
              <span className="text-xs text-gray-500 ml-1">request</span>
            </div>
          </div>
        ))}

        {topContributors.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 text-gray-300 mx-auto mb-3"
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
            <p className="text-gray-500 text-sm">Tidak ada data kontributor</p>
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
