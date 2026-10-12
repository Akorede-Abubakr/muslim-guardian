import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98]';

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2.5 gap-2',
    lg: 'text-base px-6 py-3.5 gap-2.5',
  };

  const variantStyles = {
    primary:
      'bg-[#123C35] hover:bg-[#1F5C50] text-white shadow-sm hover:shadow focus:ring-[#123C35] dark:bg-[#1F5C50] dark:hover:bg-[#2A7B6B]',
    secondary:
      'bg-[#DDE8E1] hover:bg-[#C5D6CC] text-[#123C35] focus:ring-[#123C35] dark:bg-[#1A3832] dark:text-[#DDE8E1] dark:hover:bg-[#234A42]',
    outline:
      'border border-[#DDE8E1] dark:border-white/10 hover:border-[#123C35] dark:hover:border-[#C6A15B] text-[#202522] dark:text-white bg-transparent hover:bg-stone-100/70 dark:hover:bg-white/5 focus:ring-[#123C35]',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-sm focus:ring-red-500',
    ghost:
      'text-[#202522] dark:text-white hover:bg-[#F8F5ED] dark:hover:bg-white/5 focus:ring-[#123C35]',
    gold:
      'bg-[#C6A15B] hover:bg-[#B38F48] text-white shadow-sm hover:shadow focus:ring-[#C6A15B]',
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        icon && <span className="flex-shrink-0">{icon}</span>
      )}
      {children}
    </button>
  );
};
