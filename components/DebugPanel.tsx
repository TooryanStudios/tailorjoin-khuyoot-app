import React from 'react';
import { AlertCircle } from 'lucide-react';
import { isDebugEnabled } from '../utils/debug';
import { useApp } from '../context/AppContext';

type Props = {
  title?: string;
  children: React.ReactNode;
  enabled?: boolean; // Optional external gate, e.g., admin setting
  maxWidthClass?: string; // e.g., 'max-w-5xl' | 'max-w-4xl'
  className?: string; // extra wrapper classes
};

export const DebugPanel: React.FC<Props> = ({
  title = 'Debug Info',
  children,
  enabled,
  maxWidthClass = 'max-w-5xl',
  className = ''
}) => {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin';
  // Admins always see debug; others require debug flag
  const visible = isAdmin || isDebugEnabled(enabled);
  if (!visible) return null;

  return (
    <div className={`bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-4 ${className}`}>
      <div className={`${maxWidthClass} mx-auto`}>
        <h3 className="font-bold text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
          <AlertCircle size={18} />
          {title}
        </h3>
        {children}
      </div>
    </div>
  );
};

export default DebugPanel;
