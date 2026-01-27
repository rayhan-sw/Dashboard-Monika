'use client';

import { Users, LogIn, Activity, AlertTriangle } from 'lucide-react';
import StatCard from '../ui/StatCard';

interface DashboardStatsProps {
  stats: {
    totalUsers: number;
    successLogins: number;
    totalActivity: number;
    logoutErrors: number;
  };
}

export default function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatCard
        title="Total Pengguna"
        value={stats.totalUsers}
        icon={Users}
        color="gold"
        trend={{ value: 12.5, isPositive: true }}
      />
      
      <StatCard
        title="Login Berhasil"
        value={stats.successLogins}
        icon={LogIn}
        color="blue"
        trend={{ value: 8.2, isPositive: true }}
      />
      
      <StatCard
        title="Total Aktivitas"
        value={stats.totalActivity}
        icon={Activity}
        color="orange"
        trend={{ value: 15.7, isPositive: true }}
      />
      
      <StatCard
        title="Kesalahan Logout"
        value={stats.logoutErrors}
        icon={AlertTriangle}
        color="red"
        trend={{ value: 3.4, isPositive: false }}
      />
    </div>
  );
}
