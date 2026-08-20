import React from "react";
import { Loader2 } from "lucide-react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'secondary' | string;
  size?: 'sm' | 'md' | 'lg' | string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading,
  loading,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}) => {
  const isBusy = isLoading || loading;
  const isCustom = className.includes('bg-') || className.includes('border');
  
  let variantClasses = 'bg-primary hover:opacity-90 text-white shadow-lg hover:-translate-y-0.5 border border-white/20';
  if (variant === 'outline') {
    variantClasses = 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm';
  } else if (variant === 'ghost') {
    variantClasses = 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800';
  } else if (variant === 'secondary') {
    variantClasses = 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700';
  }

  const sizeClasses = size === 'sm' ? 'py-1.5 px-3 text-xs rounded-xl' : size === 'lg' ? 'py-4 px-8 text-base rounded-2xl' : 'py-3 px-5 text-sm rounded-xl';

  return (
    <button
      className={`
        relative overflow-hidden flex items-center justify-center gap-2 
        font-bold transition-all duration-300 transform active:scale-95
        disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none
        ${!isCustom ? variantClasses : ''} ${sizeClasses} ${className}
      `}
      disabled={isBusy || disabled}
      {...props}
    >
      {/* Glossy overlay effect for premium look */}
      {!isCustom && variant === 'primary' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none rounded-2xl"></div>
      )}
      
      <span className="relative z-10 flex items-center gap-2">
        {isBusy ? <Loader2 className="w-5 h-5 animate-spin" /> : leftIcon}
        {children}
        {!isBusy && rightIcon}
      </span>
    </button>
  );
};
