import React from 'react';
import { useTouchPointer } from '../hooks/useTouchPointer';

interface TouchPointerOverlayProps {
  isEnabled: boolean;
}

/**
 * Visual overlay component that shows touch/click pointers for screen recording
 * Only renders when enabled and user is admin
 */
export const TouchPointerOverlay: React.FC<TouchPointerOverlayProps> = ({ isEnabled }) => {
  const touches = useTouchPointer(isEnabled);

  if (!isEnabled || touches.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999]" aria-hidden="true">
      {touches.map((touch) => (
        <div
          key={touch.id}
          className="absolute w-12 h-12 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${touch.x}px`,
            top: `${touch.y}px`,
          }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-4 border-purple-500 opacity-60 animate-ping" />
          {/* Inner dot */}
          <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50" />
          {/* Ripple effect */}
          <div className="absolute inset-0 rounded-full border-2 border-purple-400 opacity-40 animate-pulse" />
        </div>
      ))}
    </div>
  );
};
