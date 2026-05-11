import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white',
    secondary: 'bg-slate-100 text-slate-900',
    outline: 'border border-slate-300 bg-white text-slate-900',
    destructive: 'bg-gradient-to-r from-red-600 to-pink-600 text-white'
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-all duration-200 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}