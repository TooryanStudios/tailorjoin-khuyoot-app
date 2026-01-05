import React from 'react';
import { TemplateCard } from './TemplateCard.jsx';

export const ShopItems = React.memo(function ShopItems({
  items,
  onSelect,
  currentId,
  onHover,
  isSubscribed = false,
  onPremiumClick,
}) {
  if (!items?.length) {
    return (
      <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
        No Shop templates available.
      </div>
    );
  }

  return (
    <>
      {items.map((template) => {
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
          />
        );
      })}
    </>
  );
});
