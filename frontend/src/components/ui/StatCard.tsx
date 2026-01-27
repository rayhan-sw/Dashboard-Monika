'use client';

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'gold' | 'orange' | 'blue' | 'red';
}

const colorStyles = {
  gold: 'from-bpk-gold to-bpk-gold-light',
  orange: 'from-bpk-orange to-bpk-orange-light',
  blue: 'from-blue-500 to-blue-400',
  red: 'from-status-error to-red-400',
};

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  color = 'gold' 
}: StatCardProps) {
  return (
    <div className="card-bpk p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-caption text-gray-3 font-medium mb-2">{title}</p>
          <h3 className="text-h3 font-bold text-gray-1 mb-1">
            {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
          </h3>
          {trend && (
            <div className="flex items-center gap-1">
              <span className={`text-caption font-semibold ${
                trend.isPositive ? 'text-status-success' : 'text-status-error'
              }`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
              <span className="text-overline text-gray-3">vs last week</span>
            </div>
          )}
        </div>
        
        <div className={`w-14 h-14 rounded-lg-bpk bg-gradient-to-br ${colorStyles[color]} 
                        flex items-center justify-center shadow-md`}>
          <Icon className="w-7 h-7 text-white" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
}
