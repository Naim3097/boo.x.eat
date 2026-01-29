import React from 'react';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'accent' | 'mixed';
}

const gradientClasses = {
  primary: 'bg-gradient-to-r from-primary-700 to-primary-500',
  accent: 'bg-gradient-to-r from-accent-600 to-accent-400',
  mixed: 'bg-gradient-to-r from-primary-700 via-primary-500 to-accent-500',
};

export const GradientText: React.FC<GradientTextProps> = ({
  children,
  className = '',
  variant = 'primary',
}) => {
  return (
    <span className={`bg-clip-text text-transparent ${gradientClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default GradientText;
