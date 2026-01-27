'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AccessSuccessChartProps {
  data: Array<{ scope: string; success: number; failed: number }>;
}

export default function AccessSuccessChart({ data }: AccessSuccessChartProps) {
  return (
    <div className="card-bpk p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-h5 font-bold text-gray-1">Analisis Tingkat Keberhasilan Akses</h3>
        <div className="flex items-center gap-4 text-caption">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-status-success rounded-sm"></div>
            <span className="text-gray-3">Berhasil</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-status-error rounded-sm"></div>
            <span className="text-gray-3">Gagal</span>
          </div>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis 
            dataKey="scope" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E5E5',
              borderRadius: '8px',
              padding: '8px 12px'
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            iconType="square"
          />
          <Bar 
            dataKey="success" 
            fill="#22C55E" 
            name="Berhasil"
            radius={[4, 4, 0, 0]}
          />
          <Bar 
            dataKey="failed" 
            fill="#EF4444" 
            name="Gagal"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
