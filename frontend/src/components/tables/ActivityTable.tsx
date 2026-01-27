'use client';

import { Clock } from 'lucide-react';

interface Activity {
  id: number;
  nama: string;
  aktifitas: string;
  status: string;
  tanggal: string;
}

interface ActivityTableProps {
  activities: Activity[];
}

const statusColors = {
  SUCCESS: 'bg-status-success text-white',
  FAILED: 'bg-status-error text-white',
  LOGOUT: 'bg-gray-3 text-white',
  default: 'bg-gray-4 text-gray-1'
};

export default function ActivityTable({ activities }: ActivityTableProps) {
  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.default;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="card-bpk p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h5 font-bold text-gray-1">Riwayat Aktivitas</h3>
        <span className="text-caption text-gray-3">
          {activities.length} aktivitas terbaru
        </span>
      </div>

      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-6 border-b border-gray-5">
            <tr>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Pengguna
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Aktivitas
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Waktu
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-5">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-6 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-bpk flex items-center justify-center">
                      <span className="text-white text-overline font-bold">
                        {activity.nama.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-body text-gray-1 font-medium">
                      {activity.nama}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-body text-gray-2">{activity.aktifitas}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-caption text-gray-3">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(activity.tanggal)}</span>
                    <span className="text-overline">• {formatDate(activity.tanggal)}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-md-bpk text-overline font-semibold ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
