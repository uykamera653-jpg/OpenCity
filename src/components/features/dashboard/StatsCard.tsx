import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'orange' | 'purple';
  trend?: { value: number; label: string };
}

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', icon: 'bg-[#2563EB] text-white', text: 'text-[#2563EB]' },
  green: { bg: 'bg-green-50', icon: 'bg-[#16A34A] text-white', text: 'text-[#16A34A]' },
  red: { bg: 'bg-red-50', icon: 'bg-[#DC2626] text-white', text: 'text-[#DC2626]' },
  orange: { bg: 'bg-orange-50', icon: 'bg-[#EA580C] text-white', text: 'text-[#EA580C]' },
  purple: { bg: 'bg-purple-50', icon: 'bg-[#7C3AED] text-white', text: 'text-[#7C3AED]' },
};

export default function StatsCard({ title, value, subtitle, icon: Icon, color = 'blue', trend }: Props) {
  const colors = COLOR_MAP[color];
  return (
    <div className={cn('rounded-xl p-5 border border-gray-100 bg-white hover:shadow-glass transition-all duration-200')}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shadow-sm', colors.icon)}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className={cn('flex items-center gap-1 mt-2 text-xs font-semibold', trend.value >= 0 ? 'text-green-600' : 'text-red-500')}>
            <span>{trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
            <span className="text-gray-400 font-normal">{trend.label}</span>
          </div>
        )}
      </div>
    </div>
  );
}
