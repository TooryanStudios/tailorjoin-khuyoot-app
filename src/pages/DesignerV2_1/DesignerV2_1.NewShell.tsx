import * as React from 'react';

import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { useApp } from '../../../context/AppContext';
import { CreditBadge } from '../../modules/CreditManager';
import { DesignerHeader } from '../../modules/navigation/DesignerHeader';

export function DesignerV2_1_NewShell() {
  const { t } = useTranslation(['designer']);
  const navigate = useNavigate();
  const { user } = useApp();
  const isAdminUser = user?.role === 'admin';

  const navigateHome = React.useCallback(() => {
    navigate('/');
  }, [navigate]);

  const navigateProfile = React.useCallback(() => {
    navigate(isAdminUser ? '/admin' : '/account');
  }, [navigate, isAdminUser]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-zinc-950 text-zinc-200">
      <DesignerHeader
        onHome={navigateHome}
        rightSlot={
          <div className="flex items-center gap-3">
            <CreditBadge onRefill={() => navigate('/account')} />

            <button
              type="button"
              disabled
              className="p-2 rounded-lg border transition-colors bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed"
              title={t('clearComparison')}
              aria-label={t('clearComparison')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={navigateProfile}
              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
              title={isAdminUser ? 'Go to Control Panel' : 'Go to Account'}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.email?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs text-zinc-300">{user?.email?.split('@')[0] || 'User'}</span>
            </button>
          </div>
        }
      />

      {/* Empty designer body (fresh page). We'll introduce hooks/components incrementally. */}
      <div className="flex-1 min-h-0" />
    </div>
  );
}
