'use client';

import { AlertTriangle, AlertCircle, Flag } from 'lucide-react';

interface ErrorActivity {
  id: number;
  nama: string;
  aktifitas: string;
  status: string;
  tanggal: string;
  lokasi?: string;
}

interface ErrorMonitoringTableProps {
  errors: ErrorActivity[];
}

const getSeverityIcon = (status: string) => {
  if (status === 'FAILED') {
    return <AlertTriangle className="w-4 h-4 text-status-error" />;
  }
  return <AlertCircle className="w-4 h-4 text-status-warning" />;
};

const getSeverityLabel = (status: string) => {
  if (status === 'FAILED') return 'Critical';
  return 'Warning';
};

const getSeverityColor = (status: string) => {
  if (status === 'FAILED') return 'bg-status-error/10 text-status-error border-status-error';
  return 'bg-status-warning/10 text-status-warning border-status-warning';
};

export default function ErrorMonitoringTable({ errors }: ErrorMonitoringTableProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="card-bpk p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h5 font-bold text-gray-1">Pemantauan Kesalahan</h3>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-status-error/10 text-status-error rounded-md-bpk text-caption font-semibold">
            {errors.length} errors
          </span>
        </div>
      </div>

      <div className="overflow-auto" style={{ maxHeight: '400px' }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-gray-6 border-b border-gray-5">
            <tr>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Severity
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Pengguna
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Error Type
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Lokasi
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Timestamp
              </th>
              <th className="px-4 py-3 text-left text-caption font-semibold text-gray-2">
                Flag
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-5">
            {errors.map((error) => (
              <tr key={error.id} className="hover:bg-gray-6 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {getSeverityIcon(error.status)}
                    <span className={`px-2 py-1 rounded text-overline font-semibold border ${getSeverityColor(error.status)}`}>
                      {getSeverityLabel(error.status)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-body text-gray-1 font-medium">
                    {error.nama}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-body text-gray-2">{error.aktifitas}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-caption text-gray-3">
                    {error.lokasi || '-'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-caption text-gray-3">
                    {formatTime(error.tanggal)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="w-8 h-8 rounded-md-bpk hover:bg-gray-5 flex items-center justify-center transition-colors">
                    <Flag className="w-4 h-4 text-gray-3 hover:text-status-error" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
