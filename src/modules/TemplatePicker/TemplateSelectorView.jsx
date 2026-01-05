import React, { useCallback, useMemo, useState } from 'react';
import { useImageCache } from '../CacheManager';
import { useTemplateStore } from './useTemplateStore';
import { ClosetItems } from './ClosetItems.jsx';
import { ShopItems } from './ShopItems.jsx';
import { StudioItems } from './StudioItems.jsx';

const TABS = {
  STUDIO: 'Studio',
  SHOP: 'Shop',
  CLOSET: 'Closet',
};

export const TemplateSelectorView = ({
  onSelect,
  currentId,
  studioItems,
  shopItems,
  closetItems,
  enableUpload = true,
  isSubscribed = false,
  onPremiumClick,
  closetExtra = null,
}) => {
  const store = useTemplateStore();
  const cache = useImageCache({ limit: 10 });

  const [activeTab, setActiveTab] = useState(TABS.STUDIO);

  const resolvedStudioItems = studioItems ?? store.studioTemplates;
  const resolvedShopItems = shopItems ?? store.shopTemplates;
  const resolvedClosetItems = closetItems ?? store.closetTemplates;

  const onHoverTemplate = useCallback(
    (template) => {
      if (!template?.id || !template?.imageUrl) return;
      cache.prefetch(template.id, template.imageUrl).catch(() => undefined);
    },
    [cache]
  );

  const onSelectResolved = useCallback(
    async (template) => {
      if (!template) return;

      // If this came from an upload, persist to Closet (localStorage) first.
      if (template?.file instanceof File) {
        const persisted = await store.addToCloset(template.file, template.name);
        store.selectTemplate(persisted);
        onSelect(persisted);
        return;
      }

      // IMPORTANT: do not pass blob: URLs to consumers.
      // Some CSPs block connect-src to blob: which breaks fetch(blob:...).
      store.selectTemplate(template);
      onSelect(template);
    },
    [cache, onSelect, store]
  );

  const tabs = useMemo(() => {
    const base = [TABS.STUDIO, TABS.SHOP];
    return enableUpload ? [...base, TABS.CLOSET] : base;
  }, [enableUpload]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
      <div className="flex border-b border-zinc-800 bg-zinc-950/60">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 py-2 text-xs font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-zinc-950 text-purple-200 border-b-2 border-purple-500/70'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="p-3 grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar">
        {activeTab === TABS.STUDIO && (
          <StudioItems
            items={resolvedStudioItems}
            onSelect={onSelectResolved}
            currentId={currentId}
            onHover={onHoverTemplate}
            isSubscribed={isSubscribed}
            onPremiumClick={onPremiumClick}
          />
        )}
        {activeTab === TABS.SHOP && (
          <ShopItems
            items={resolvedShopItems}
            onSelect={onSelectResolved}
            currentId={currentId}
            onHover={onHoverTemplate}
            isSubscribed={isSubscribed}
            onPremiumClick={onPremiumClick}
          />
        )}
        {activeTab === TABS.CLOSET && enableUpload && (
          <ClosetItems
            items={resolvedClosetItems}
            onSelect={onSelectResolved}
            currentId={currentId}
            onUploadToCloset={store.addToCloset}
            onHover={onHoverTemplate}
            extra={closetExtra}
          />
        )}
      </div>
    </div>
  );
};
