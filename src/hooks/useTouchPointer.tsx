import { useEffect, useState } from 'react';

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

/**
 * Hook to show visual touch pointers for mobile screen recording
 * Only works for admin users and can be toggled on/off
 */
export function useTouchPointer(isEnabled: boolean = false) {
  const [touches, setTouches] = useState<TouchPoint[]>([]);

  useEffect(() => {
    if (!isEnabled) {
      setTouches([]);
      return;
    }

    const handleTouchStart = (e: TouchEvent) => {
      const newTouches: TouchPoint[] = Array.from(e.touches).map((touch, index) => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      }));
      setTouches(newTouches);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const newTouches: TouchPoint[] = Array.from(e.touches).map((touch) => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      }));
      setTouches(newTouches);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const remainingTouches: TouchPoint[] = Array.from(e.touches).map((touch) => ({
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      }));
      setTouches(remainingTouches);
    };

    const handleMouseMove = (e: MouseEvent) => {
      setTouches([{ id: 0, x: e.clientX, y: e.clientY }]);
    };

    const handleMouseDown = (e: MouseEvent) => {
      setTouches([{ id: 0, x: e.clientX, y: e.clientY }]);
    };

    const handleMouseUp = () => {
      setTouches([]);
    };

    // Add event listeners
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEnabled]);

  return touches;
}
