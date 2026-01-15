import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { isAdmin } from '../../types/user-schema';
import { Settings, X, Eye, EyeOff, Home } from 'lucide-react';

/**
 * Admin-only floating dev tools panel
 * Toggle touch pointer for screen recording and other admin features
 */
export const AdminDevTools: React.FC = () => {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [touchPointerEnabled, setTouchPointerEnabled] = useState(false);

  const isAdminUser = !!user && isAdmin(user);

  // Load saved state
  useEffect(() => {
    if (!isAdminUser) return;
    const saved = localStorage.getItem('admin_touch_pointer_enabled');
    setTouchPointerEnabled(saved === 'true');
  }, [isAdminUser]);

  // Only render for admin users
  if (!isAdminUser) {
    return null;
  }

  const toggleTouchPointer = () => {
    const newState = !touchPointerEnabled;
    setTouchPointerEnabled(newState);
    
    // Dispatch event to update the overlay
    window.dispatchEvent(
      new CustomEvent('toggle-touch-pointer', {
        detail: { enabled: newState },
      })
    );
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9998] p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition-all duration-200 hover:scale-110"
        title="Admin Dev Tools"
        aria-label="Admin developer tools"
      >
        <Settings className="w-5 h-5" />
      </button>

      {/* Control panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-[9998] bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-72">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              🛠️ Admin Dev Tools
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Touch pointer toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                  {touchPointerEnabled ? (
                    <Eye className="w-4 h-4 text-purple-500" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-slate-400" />
                  )}
                  Touch Pointer
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Show visual cursor for screen recording
                </p>
              </div>
              <button
                onClick={toggleTouchPointer}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                  ${touchPointerEnabled ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'}
                `}
                role="switch"
                aria-checked={touchPointerEnabled}
              >
                <span
                  className={`
                    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                    ${touchPointerEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            {touchPointerEnabled && (
              <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 p-2 rounded">
                ✓ Touch pointer active. Your taps and clicks will show a purple indicator during screen recording.
              </div>
            )}

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <a
                href="/home-v2"
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 text-sm font-semibold transition-colors"
              >
                <Home className="w-4 h-4" />
                Visit Homepage V2
              </a>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                Opens <span className="font-mono">/home-v2</span> (direct V2 page)
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
