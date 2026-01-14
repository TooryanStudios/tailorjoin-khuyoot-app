import React from 'react';
import { TemplateCard } from './TemplateCard.jsx';

export const StudioItems = React.memo(function StudioItems({
  items,
  onSelect,
  currentId,
  onHover,
  isSubscribed = false,
  onPremiumClick,
  loadingTemplateId = null,
}) {
  if (!items?.length) {
    return (
      <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
        No Studio templates configured.
      </div>
    );
  }

  return (
    <>
      {items.map((template) => (
        (() => {
          const isPremium = template?.meta?.premium === true;
          const isLocked = isPremium && !isSubscribed;
          return (
        <TemplateCard
          key={template.id}
          template={template}
          isActive={Boolean(currentId && template.id === currentId)}
          onSelect={onSelect}
          onHover={onHover}
          isLocked={isLocked}
          onLockedClick={() => onPremiumClick?.(template)}
          isLoading={loadingTemplateId === template.id}
        />
          );
        })()
      ))}
    </>
  );
});
