import * as React from 'react';
import { useTemplateStore } from '../../../TemplatePicker/useTemplateStore';
import { useImageCache } from '../../../CacheManager';

export type MobileTemplateTab = 'studio' | 'shop' | 'closet';

export type ModelSelectorProps = {
  activeTab: MobileTemplateTab;
  onChangeTab: (next: MobileTemplateTab) => void;
  currentId?: string;
  onSelect: (template: any) => void;
  disabled?: boolean;
};

type TabButtonProps = {
  active?: boolean;
  label: string;
  onClick: () => void;
};

const TabButton = React.memo(function TabButton(props: TabButtonProps) {
  const { active, label, onClick } = props;
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3 py-2 text-[11px] font-black uppercase tracking-wider transition-colors border-b-2 ' +
        (active
          ? 'text-white border-white'
          : 'text-zinc-500 border-transparent hover:text-zinc-300')
      }
    >
      {label}
    </button>
  );
});

export const ModelSelector = React.memo(function ModelSelector(props: ModelSelectorProps) {
  const { activeTab, onChangeTab, currentId, onSelect, disabled } = props;

  const store = useTemplateStore();
  const cache = useImageCache({ limit: 10 });

  const items = React.useMemo(() => {
    if (activeTab === 'shop') return store.shopTemplates;
    if (activeTab === 'closet') return store.closetTemplates;
    return store.studioTemplates;
  }, [activeTab, store.closetTemplates, store.shopTemplates, store.studioTemplates]);

  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <nav className="flex justify-around mb-2 border-b border-zinc-800/50">
        <TabButton active={activeTab === 'studio'} label="Studio" onClick={() => onChangeTab('studio')} />
        <TabButton active={activeTab === 'shop'} label="Shop" onClick={() => onChangeTab('shop')} />
        <TabButton active={activeTab === 'closet'} label="Closet" onClick={() => onChangeTab('closet')} />
      </nav>

      <div className="overflow-x-auto hide-scrollbar">
        <div className="inline-flex gap-2.5 pr-2">
          {(!items || items.length === 0) && (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-[11px] text-zinc-500">
              No templates available.
            </div>
          )}

          {(items || []).map((t: any) => {
            const active = Boolean(currentId && t?.id === currentId);
            const src = t?.imageUrl || t?.src || t?.preview || '';
            const cached = src ? cache.get(t.id) : null;
            const displayUrl = cached || src;

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelect(t)}
                onPointerEnter={() => {
                  if (!t?.id || !src) return;
                  cache.prefetch(t.id, src).catch(() => undefined);
                }}
                className={
                  'relative w-[105px] shrink-0 rounded-xl overflow-hidden border transition-all ' +
                  (active ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-zinc-800 hover:border-zinc-700')
                }
              >
                <div className="relative w-full aspect-[3/4] bg-zinc-900">
                  {displayUrl ? (
                    <img
                      src={displayUrl}
                      alt={t?.name || t?.label || 'Template'}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-zinc-600 text-[10px]">
                      No preview
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="text-[10px] font-bold text-white truncate">
                      {t?.name || t?.label || 'Template'}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
});
