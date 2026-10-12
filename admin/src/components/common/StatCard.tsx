import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  change?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'emerald' | 'gold' | 'sage' | 'charcoal';
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  change,
  variant = 'emerald',
}) => {
  const iconVariants = {
    emerald: 'bg-[#123C35]/10 text-[#123C35] dark:bg-[#1F5C50]/30 dark:text-[#C6A15B]',
    gold: 'bg-[#C6A15B]/15 text-[#8A6D37] dark:bg-[#C6A15B]/25 dark:text-[#E9D6AF]',
    sage: 'bg-[#DDE8E1] text-[#123C35] dark:bg-[#1A3832] dark:text-[#DDE8E1]',
    charcoal: 'bg-[#202522]/10 text-[#202522] dark:bg-white/10 dark:text-white',
  };

  return (
    <div className="stat-card bg-white dark:bg-[#0E2622] rounded-2xl p-6 border border-[#DDE8E1] dark:border-white/10 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-[#202522]/60 dark:text-gray-400">
          {title}
        </span>
        <div className={`p-3 rounded-xl ${iconVariants[variant]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <div className="font-sans tabular-nums text-2xl sm:text-3xl font-bold text-[#202522] dark:text-white">
          {value}
        </div>
        {change && (
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
              change.isPositive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            {change.isPositive ? '+' : ''}
            {change.value}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-[#202522]/50 dark:text-gray-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
