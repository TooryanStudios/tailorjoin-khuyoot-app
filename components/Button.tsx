import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  ...props 
}) => {
  const baseStyles = "rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/50",
    secondary: "bg-slate-600 hover:bg-slate-700 text-white dark:bg-slate-700 dark:hover:bg-slate-600",
    outline: "border-2 border-slate-400 hover:border-slate-500 hover:bg-slate-100 text-slate-700 dark:border-slate-500 dark:hover:border-slate-400 dark:hover:bg-slate-800 dark:text-slate-200 font-semibold",
    danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
