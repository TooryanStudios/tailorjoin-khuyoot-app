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
          ? 'text-purple-600 border-purple-600'
          : 'text-zinc-400 border-transparent hover:text-zinc-600')
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
    generateLabel = 'توليد',
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
    <div className="h-full flex flex-col rounded-t-[32px] bg-white/95 backdrop-blur-xl border-t border-zinc-200 shadow-2xl">
      {/* Tab Selector - Mirroring Desktop Sidebar */}
      <nav className="flex justify-around px-4 pt-4 border-b border-zinc-100">
        <TabItem active={activeTab === 'studio'} label="ستوديو" onClick={() => onChangeTab('studio')} />
        <TabItem active={activeTab === 'shop'} label="المحل" onClick={() => onChangeTab('shop')} />
        <TabItem active={activeTab === 'closet'} label="الخزانة" onClick={() => onChangeTab('closet')} />
      </nav>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {/* Model Grid */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <div className="text-xs font-black tracking-widest text-zinc-400 uppercase">النموذج / القالب</div>
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
                    'relative overflow-hidden rounded-2xl border transition-all active:scale-95 ' +
                    (active
                      ? 'border-purple-600 ring-2 ring-purple-100 bg-purple-50'
                      : 'border-zinc-200 hover:border-purple-300 bg-white shadow-sm')
                  }
                >
                  <div className="relative w-full aspect-[3/4]">
                    {m.thumbnailUrl ? (
                      <img
                        src={m.thumbnailUrl}
                        alt={m.name}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-zinc-300 text-xs font-bold">
                        لا يوجد عرض
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <div className="text-xs font-black text-white truncate text-right">{m.name}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Fabric Upload */}
        <div className="mt-5">
          <div className="text-xs font-black tracking-widest text-zinc-400 uppercase mb-3 px-1 text-right">القماش</div>

          <label className="block active:scale-[0.98] transition-transform">
            <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 shadow-inner">
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 text-sm gap-2">
                    <div className="w-10 h-10 rounded-full bg-white border border-zinc-100 flex items-center justify-center text-purple-600 shadow-sm">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <span>اضغط لرفع القماش</span>
                  </div>
                )}
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={onPickFabric} />
          </label>
        </div>
      </div>

      {/* Primary Action - Fixed at bottom of drawer */}
      <div className="p-4 pt-2 border-t border-zinc-100 bg-white">
        <button
          type="button"
          disabled={!canGenerate || isProcessing}
          onClick={onGenerate}
          className="w-full py-4 bg-purple-600 rounded-2xl font-black text-white tracking-widest shadow-lg shadow-purple-100 disabled:bg-zinc-100 disabled:text-zinc-400 disabled:shadow-none transition-all active:scale-95"
        >
          {isProcessing ? 'جاري التوليد...' : generateLabel.toUpperCase()}
        </button>
      </div>
    </div>
  );
});
