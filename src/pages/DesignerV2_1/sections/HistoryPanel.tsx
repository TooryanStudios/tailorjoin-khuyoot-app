import React from 'react';
import { HistoryFilmstrip } from '../components/HistoryFilmstrip';
import type { DesignerV2Features } from '../types';

type HistoryPanelProps = {
  features: DesignerV2Features;
  history: any[];
  isLoading: boolean;
  activeId: string | null;
  onSelect: (item: any) => void;
  onDelete: (id: string) => void;
  onSetBefore: (item: any) => void;
  onSetAfter: (item: any) => void;
  deletingItemId?: string | null;
};

export function HistoryPanel({
  features,
  history,
  isLoading,
  activeId,
  onSelect,
  onDelete,
  onSetBefore,
  onSetAfter,
  deletingItemId,
}: HistoryPanelProps) {
  if (!features.showHistoryFilmstrip) return null;

  return (
    <HistoryFilmstrip
      history={history}
      isLoading={isLoading}
      activeId={activeId}
      onSelect={onSelect}
      onDelete={onDelete}
      onSetBefore={onSetBefore}
      onSetAfter={onSetAfter}
      deletingItemId={deletingItemId}
    />
  );
}
