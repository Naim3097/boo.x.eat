import React from 'react';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  children: React.ReactNode;
}

const variantClasses = {
  primary: 'text-white bg-gradient-to-r from-primary-700 to-primary-500 hover:from-primary-600 hover:to-primary-400 shadow-lg hover:shadow-glow',
  secondary: 'text-dark-800 bg-white border-2 border-gray-200 hover:border-primary-300 hover:text-primary-700',
  accent: 'text-white bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 shadow-lg hover:shadow-glow-accent',
  ghost: 'text-dark-600 hover:text-primary-700 hover:bg-primary-50',
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline',
  outline: 'text-dark-700 bg-white border-2 border-gray-300 hover:border-primary-400 hover:text-primary-700',
};

const sizeClasses = {
  sm: 'px-4 py-2 text-sm rounded-full',
  md: 'px-6 py-3 text-base rounded-full',
  lg: 'px-8 py-4 text-lg rounded-full',
  icon: 'h-10 w-10 rounded-full',
};

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none';
  
  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
