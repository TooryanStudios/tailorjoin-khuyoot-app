import React from 'react';
import { TFunction } from 'i18next';
import { Trash2 } from 'lucide-react';
import { DesignerHeader } from '../../../modules/navigation/DesignerHeader';
import { CreditBadge } from '../../../modules/CreditManager';
import type { User } from '../../../../types';

export type TopBarProps = {
  t: TFunction<'common'>;
  user: User | null;
  onHome: () => void;
  onClearSelections: () => void;
  clearDisabled: boolean;
  isAdminUser: boolean;
  debugPanelOpen: boolean;
  onOpenDebug: () => void;
  onRefillCredits: () => void;
  navigateProfile: () => void;
};

export function TopBar(props: TopBarProps) {
  const {
    t,
    user,
    onHome,
    onClearSelections,
    clearDisabled,
    isAdminUser,
    debugPanelOpen,
    onOpenDebug,
    onRefillCredits,
    navigateProfile,
  } = props;

  return (
    <DesignerHeader
      onHome={onHome}
      rightSlot={
        <div className="flex items-center gap-3">
          <CreditBadge onRefill={onRefillCredits} />

          <button
            type="button"
            onClick={onClearSelections}
            disabled={clearDisabled}
            className={`p-2 rounded-lg border transition-colors ${
              clearDisabled
                ? 'bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
            }`}
            title={t('clearComparison')}
            aria-label={t('clearComparison')}
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isAdminUser && (
            <button
              type="button"
              onClick={onOpenDebug}
              className={`p-2 rounded-lg border transition-colors ${
                debugPanelOpen
                  ? 'bg-purple-500/15 border-purple-500/40 text-purple-200'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
              }`}
              title="Debug State"
              aria-label="Debug State"
            >
              <span className="w-4 h-4 flex items-center justify-center leading-none">🛠️</span>
            </button>
          )}

          <button
            onClick={navigateProfile}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
            title={isAdminUser ? 'Go to Control Panel' : 'Go to Account'}
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
              {String((user?.name?.[0] || user?.email?.[0] || 'U')).toUpperCase()}
            </div>
            <span className="text-xs text-zinc-300">
              {user?.name || user?.email?.split('@')[0] || 'Account'}
            </span>
          </button>
        </div>
      }
    />
  );
}
