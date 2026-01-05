import React from 'react';

/**
 * StandardContainer - Enforces consistent horizontal alignment across all sections
 * 
 * Design System:
 * - Max Width: 1200px (7xl) for desktop
 * - Horizontal Padding: 24px (px-6) on mobile, same on desktop
 * - Ensures logo, banners, cards, and lists all align to the same vertical edge
 */

interface StandardContainerProps {
  children: React.ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'header' | 'footer' | 'main';
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

const maxWidthClasses = {
  none: '',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '6xl': 'max-w-6xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
};

export const StandardContainer = React.memo<StandardContainerProps>(function StandardContainer({
  children,
  className = '',
  as: Component = 'div',
  maxWidth = '7xl',
}) {
  const maxWidthClass = maxWidthClasses[maxWidth];

  return (
    <Component className={`w-full ${maxWidthClass} mx-auto px-6 ${className}`}>
      {children}
    </Component>
  );
});
