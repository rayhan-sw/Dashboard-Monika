'use client';

import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

interface HourlyActivityChartProps {
  data: Array<{ hour: number; count: number }>;
}

export default function HourlyActivityChart({ data }: HourlyActivityChartProps) {
  const formattedData = data.map(item => ({
    hour: `${String(item.hour).padStart(2, '0')}:00`,
    count: item.count,
  }));

  return (
    <div className="card-bpk p-6">
      <h3 className="text-h5 font-bold text-gray-1 mb-4">Distribusi Aktivitas per Jam</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={formattedData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E5E5" />
          <XAxis 
            dataKey="hour" 
            stroke="#6B7280"
            style={{ fontSize: '12px' }}
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
            iconType="line"
          />
          <Line 
            type="monotone" 
            dataKey="count" 
            stroke="#E27200" 
            strokeWidth={3}
            dot={{ fill: '#E27200', r: 4 }}
            activeDot={{ r: 6 }}
            name="Aktivitas"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
