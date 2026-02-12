import React from 'react';
import { TemplateCard } from './TemplateCard.jsx';

export const ShopItems = React.memo(function ShopItems({
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
      <div className="col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-500 text-center font-bold">
        لا توجد قوالب متوفرة في المتجر حالياً.
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
            isLoading={loadingTemplateId === template.id}
          />
        );
      })}
    </>
  );
});
