import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Button: React.FC<{ label: string; onClick: () => void }> = ({ label, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-10 px-4 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors"
    >
      {label}
    </button>
  );
};

export const ClientNavDebugPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="p-4">
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">ClientLayout Navigation Debug</h2>
        <div className="mt-2 text-sm text-slate-600 dark:text-white/70">
          Current path: <span className="font-mono">{location.pathname}</span>
        </div>

        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Button label="Go /" onClick={() => navigate('/')} />
          <Button label="Go /collections" onClick={() => navigate('/collections')} />
          <Button label="Go /tailors" onClick={() => navigate('/tailors')} />
          <Button label="Go /shops" onClick={() => navigate('/shops')} />
          <Button label="Go /designer-v2-1" onClick={() => navigate('/designer-v2-1')} />
          <Button label="Go /" onClick={() => navigate('/')} />
        </div>

        <div className="mt-4 text-xs text-slate-500 dark:text-white/50">
          If URL changes but content doesn’t, the persistence/layout logic is intercepting rendering.
        </div>
      </div>
    </div>
  );
};
