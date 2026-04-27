import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'cyan' | 'pink' | 'indigo' | 'emerald' | 'yellow';
  trend?: {
    value: string;
    icon?: LucideIcon;
  };
}

const colorClasses = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-600',
  orange: 'bg-orange-500',
  red: 'bg-red-500',
  cyan: 'bg-cyan-500',
  pink: 'bg-pink-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  yellow: 'bg-yellow-500',
};

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  const colorClass = colorClasses[color];

  return (
    <div className={`${colorClass} rounded-lg p-4 text-white shadow-lg relative overflow-hidden`}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8"></div>
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium opacity-90">{title}</p>
          <Icon className="w-8 h-8 opacity-30" />
        </div>
        <p className="text-3xl font-bold mb-1">{value}</p>
        {subtitle && (
          <p className="text-xs opacity-80">{subtitle}</p>
        )}
        {trend && (
          <p className="text-xs opacity-80 flex items-center gap-1">
            {trend.icon && <trend.icon className="w-3 h-3" />}
            {trend.value}
          </p>
        )}
      </div>
    </div>
  );
}
