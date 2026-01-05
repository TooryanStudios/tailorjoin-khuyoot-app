import * as React from 'react';

export type MobileDrawerTab = 'studio' | 'shop' | 'closet';

export type MobileDrawerModel = {
  id: string;
  name: string;
  thumbnailUrl: string;
};

export type MobileControlDrawerProps = {
  activeTab: MobileDrawerTab;
  onChangeTab: (next: MobileDrawerTab) => void;

  models: MobileDrawerModel[];
  selectedModelId?: string;
  onSelectModel: (id: string) => void;

  fabricImage?: string;
  onFabricUpload: (file: File) => void;

  canGenerate: boolean;
  isProcessing: boolean;
  onGenerate: () => void;
  generateLabel?: string;
};

type TabItemProps = {
  active?: boolean;
  label: string;
  onClick?: () => void;
};

const TabItem = React.memo(function TabItem(props: TabItemProps) {
  const { active, label, onClick } = props;

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'px-3 py-3 text-sm font-semibold transition-colors border-b-2 ' +
        (active
          ? 'text-white border-purple-400'
          : 'text-white/60 border-transparent hover:text-white/85')
      }
    >
      {label}
    </button>
  );
});

export const MobileControlDrawer = React.memo(function MobileControlDrawer(
  props: MobileControlDrawerProps
) {
  const {
    activeTab,
    onChangeTab,
    models,
    selectedModelId,
    onSelectModel,
    fabricImage,
    onFabricUpload,
    canGenerate,
    isProcessing,
    onGenerate,
    generateLabel = 'Generate',
  } = props;

  const onPickFabric = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFabricUpload(file);
      e.currentTarget.value = '';
    },
    [onFabricUpload]
  );

  return (
    <div className="h-full flex flex-col rounded-t-[32px] bg-[#120821]/95 backdrop-blur-xl border-t border-white/10 shadow-2xl">
      {/* Tab Selector - Mirroring Desktop Sidebar */}
      <nav className="flex justify-around px-4 pt-4 border-b border-white/5">
        <TabItem active={activeTab === 'studio'} label="Studio" onClick={() => onChangeTab('studio')} />
        <TabItem active={activeTab === 'shop'} label="Shop" onClick={() => onChangeTab('shop')} />
        <TabItem active={activeTab === 'closet'} label="Closet" onClick={() => onChangeTab('closet')} />
      </nav>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Model Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold tracking-wider text-white/70 uppercase">Model / Template</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {models.map((m) => {
              const active = m.id === selectedModelId;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectModel(m.id)}
                  className={
                    'relative overflow-hidden rounded-2xl border transition-colors ' +
                    (active
                      ? 'border-purple-400/70 ring-2 ring-purple-400/30'
                      : 'border-white/10 hover:border-white/20')
                  }
                >
                  <div className="relative w-full aspect-[3/4] bg-white/5">
                    {m.thumbnailUrl ? (
                      <img
                        src={m.thumbnailUrl}
                        alt={m.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">
                        No preview
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                      <div className="text-xs font-semibold text-white truncate">{m.name}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fabric Upload */}
        <div className="mt-5">
          <div className="text-xs font-bold tracking-wider text-white/70 uppercase mb-3">Fabric</div>

          <label className="block">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <div className="relative w-full aspect-video">
                {fabricImage ? (
                  <img
                    src={fabricImage}
                    alt="Selected fabric"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50 text-sm">
                    Tap to upload fabric
                  </div>
                )}
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onPickFabric} />
          </label>
        </div>
      </div>

      {/* Primary Action - Fixed at bottom of drawer */}
      <div className="p-4 pt-2 border-t border-white/5">
        <button
          type="button"
          disabled={!canGenerate || isProcessing}
          onClick={onGenerate}
          className="w-full py-4 bg-gradient-to-r from-[#7C3AED] to-[#C084FC] rounded-2xl font-bold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Generating…' : generateLabel}
        </button>
      </div>
    </div>
  );
});
