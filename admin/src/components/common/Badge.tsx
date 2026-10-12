import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'gold' | 'sage' | 'charcoal' | 'success' | 'warning' | 'danger' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  const variantStyles = {
    emerald:
      'bg-[#123C35]/10 text-[#123C35] dark:bg-[#1F5C50]/30 dark:text-[#C6A15B] border border-[#123C35]/20 dark:border-[#1F5C50]/50',
    gold:
      'bg-[#C6A15B]/15 text-[#8A6D37] dark:bg-[#C6A15B]/20 dark:text-[#E9D6AF] border border-[#C6A15B]/30',
    sage:
      'bg-[#DDE8E1] text-[#123C35] dark:bg-[#1A3832] dark:text-[#DDE8E1] border border-[#C5D6CC] dark:border-[#234A42]',
    charcoal:
      'bg-[#202522]/10 text-[#202522] dark:bg-white/10 dark:text-white border border-[#202522]/20',
    success:
      'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning:
      'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    neutral:
      'bg-gray-100 text-gray-700 dark:bg-white/5 dark:text-gray-300 border border-gray-200 dark:border-white/10',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
