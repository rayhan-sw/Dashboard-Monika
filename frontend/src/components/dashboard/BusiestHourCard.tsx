'use client';

import { Clock, TrendingUp } from 'lucide-react';

interface BusiestHourProps {
  peakHour: { start: number; end: number; count: number };
  totalActivities: number;
}

export default function BusiestHourCard({ peakHour, totalActivities }: BusiestHourProps) {
  const percentage = ((peakHour.count / totalActivities) * 100).toFixed(1);
  
  return (
    <div className="card-bpk p-6 bg-gradient-to-br from-bpk-orange to-bpk-orange-light text-white">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-caption opacity-90 mb-1">Rata-rata Jam Tersibuk</p>
          <h3 className="text-h2 font-bold">
            {String(peakHour.start).padStart(2, '0')}.00 - {String(peakHour.end).padStart(2, '0')}.00 WIB
          </h3>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-lg-bpk flex items-center justify-center">
          <Clock className="w-6 h-6" />
        </div>
      </div>
      
      <div className="flex items-center gap-2 text-caption">
        <TrendingUp className="w-4 h-4" />
        <span>{peakHour.count} aktivitas pada jam ini</span>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white/20">
        <p className="text-overline opacity-80">Persentase dari Total</p>
        <p className="text-h5 font-bold">{percentage}%</p>
      </div>
    </div>
  );
}
