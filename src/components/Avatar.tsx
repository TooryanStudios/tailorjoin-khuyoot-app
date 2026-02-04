import React from 'react';
import { RefreshCw } from 'lucide-react';
import { getProfileImageDisplay } from '../utils/imageUtils';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showReuploadTooltip?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
};

const iconSizes = {
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
};

/**
 * Smart Avatar component that:
 * - Shows profile image if it's a valid URL
 * - Shows initials if no image
 * - Shows re-upload indicator if image is base64 (deprecated)
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className = '',
  onClick,
  showReuploadTooltip = true,
}) => {
  const display = getProfileImageDisplay(src, name);
  const sizeClass = sizeClasses[size];
  const iconSize = iconSizes[size];

  const baseClasses = `relative overflow-hidden rounded-full ${sizeClass} ${className}`;
  const clickableClasses = onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : '';

  if (display.type === 'image' && display.imageUrl) {
    return (
      <div className={`${baseClasses} ${clickableClasses}`} onClick={onClick}>
        <img
          src={display.imageUrl}
          alt={name || 'User'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  if (display.type === 'reupload') {
    return (
      <div
        className={`${baseClasses} ${clickableClasses} flex items-center justify-center bg-amber-100 dark:bg-amber-900/30 border-2 border-dashed border-amber-400 dark:border-amber-600`}
        onClick={onClick}
        title={showReuploadTooltip ? 'يرجى إعادة رفع الصورة' : undefined}
      >
        <div className="flex flex-col items-center justify-center">
          <RefreshCw 
            size={iconSize} 
            className="text-amber-600 dark:text-amber-400 animate-pulse" 
          />
        </div>
      </div>
    );
  }

  // Default: show initials
  return (
    <div
      className={`${baseClasses} ${clickableClasses} flex items-center justify-center bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400`}
      onClick={onClick}
    >
      <span className="font-bold">{display.initials}</span>
    </div>
  );
};

export default Avatar;
