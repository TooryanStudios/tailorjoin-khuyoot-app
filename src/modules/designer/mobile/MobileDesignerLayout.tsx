import * as React from 'react';
import { useApp } from '../../../../context/AppContext';
import { User } from 'lucide-react';
import { CreditBadge } from '../../CreditManager';
import { MobileControlDrawer, type MobileDrawerModel, type MobileDrawerTab } from '../components/MobileControlDrawer';
import type { LightingPreset } from '../../generator/hooks/useLightingGenerator';

export type MobileDesignerLayoutProps = {
  previewImage: string;
  isProcessing: boolean;

  models: MobileDrawerModel[];
  selectedModelId?: string;
  onSelectModel: (id: string) => void;

  fabricImage?: string;
  onFabricUpload: (file: File) => void;

  canGenerate: boolean;
  onGenerate: () => void;

  lightingPreset: LightingPreset;
  onSelectLightingPreset: (preset: LightingPreset) => void;

  onRefillCredits?: () => void;
};

const ENV_BAR_HEIGHT = 64; // px (stays just above the app bottom nav)
const DRAWER_PEEK_HEIGHT = 84; // px (visible grab area)

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type DrawerSnap = 'peek' | 'half' | 'full';

function useViewportHeight() {
  const [h, setH] = React.useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));

  React.useEffect(() => {
    const onResize = () => setH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return h;
}

const CanvasPlaceholder = React.memo(function CanvasPlaceholder() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative w-[220px] h-[320px] opacity-70">
        <div className="absolute inset-0 rounded-[48px] bg-gradient-to-b from-white/10 to-white/0" />
        <svg
          viewBox="0 0 200 280"
          className="absolute inset-0 w-full h-full"
          aria-hidden
        >
          <path
            d="M100 20c24 0 40 18 40 40 0 18-8 30-18 38 20 16 38 44 38 84v58c0 10-8 18-18 18H58c-10 0-18-8-18-18v-58c0-40 18-68 38-84-10-8-18-20-18-38 0-22 16-40 40-40z"
            fill="rgba(255,255,255,0.08)"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="2"
          />
        </svg>
        <div className="absolute -inset-8 rounded-[64px] blur-2xl bg-purple-500/10" />
      </div>
    </div>
  );
});

export const MobileDesignerLayout = React.memo(function MobileDesignerLayout(
  props: MobileDesignerLayoutProps
) {
  const {
    previewImage,
    isProcessing,
    models,
    selectedModelId,
    onSelectModel,
    fabricImage,
    onFabricUpload,
    canGenerate,
    onGenerate,
    lightingPreset,
    onSelectLightingPreset,
    onRefillCredits,
  } = props;

  const { user } = useApp();

  const viewportH = useViewportHeight();

  const maxDrawerH = Math.max(360, Math.floor(viewportH * 0.82));
  const halfDrawerH = Math.max(420, Math.floor(viewportH * 0.55));

  const [activeTab, setActiveTab] = React.useState<MobileDrawerTab>('studio');
  const [drawerH, setDrawerH] = React.useState<number>(() => clamp(halfDrawerH, DRAWER_PEEK_HEIGHT, maxDrawerH));

  React.useEffect(() => {
    setDrawerH((prev) => clamp(prev, DRAWER_PEEK_HEIGHT, maxDrawerH));
  }, [maxDrawerH]);

  const snapPoints = React.useMemo(
    () => ({
      peek: DRAWER_PEEK_HEIGHT,
      half: halfDrawerH,
      full: maxDrawerH,
    }),
    [halfDrawerH, maxDrawerH]
  );

  const [dragging, setDragging] = React.useState(false);
  const dragStartY = React.useRef(0);
  const dragStartH = React.useRef(0);

  const snapTo = React.useCallback(
    (snap: DrawerSnap) => {
      setDrawerH(snapPoints[snap]);
    },
    [snapPoints]
  );

  const onTouchStart = React.useCallback((e: React.TouchEvent) => {
    setDragging(true);
    dragStartY.current = e.touches[0]?.clientY ?? 0;
    dragStartH.current = drawerH;
  }, [drawerH]);

  const onTouchMove = React.useCallback(
    (e: React.TouchEvent) => {
      if (!dragging) return;
      const y = e.touches[0]?.clientY ?? 0;
      const delta = dragStartY.current - y;
      const nextH = clamp(dragStartH.current + delta, DRAWER_PEEK_HEIGHT, maxDrawerH);
      setDrawerH(nextH);
    },
    [dragging, maxDrawerH]
  );

  const onTouchEnd = React.useCallback(() => {
    setDragging(false);
    const distances: Array<{ snap: DrawerSnap; d: number }> = [
      { snap: 'peek', d: Math.abs(drawerH - snapPoints.peek) },
      { snap: 'half', d: Math.abs(drawerH - snapPoints.half) },
      { snap: 'full', d: Math.abs(drawerH - snapPoints.full) },
    ];
    distances.sort((a, b) => a.d - b.d);
    snapTo(distances[0]?.snap ?? 'half');
  }, [drawerH, snapPoints, snapTo]);

  const handleSelectModel = React.useCallback(
    (id: string) => {
      onSelectModel(id);
      // UX: once a model is selected, minimize to half height for instant canvas feedback.
      snapTo('half');
    },
    [onSelectModel, snapTo]
  );

  const envOptions: Array<{ id: LightingPreset; label: string }> = React.useMemo(
    () => [
      { id: 'night', label: 'Night' },
      { id: 'day', label: 'Day' },
      { id: 'cinematic', label: 'Cinematic' },
    ],
    []
  );

  return (
    <div
      className="relative w-full overflow-hidden bg-white text-zinc-900"
      style={{ height: '100%', minHeight: '100vh' }}
    >
      {/* Studio Canvas */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-zinc-50 to-purple-50/30" />

            {/* Floating Header Actions */}
      <div className="absolute top-3 right-3 z-30 flex items-center gap-2 scale-[0.92] origin-top-right">
        <CreditBadge onRefill={onRefillCredits} />
        {user && (
          <button 
            className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 bg-white shadow-sm flex items-center justify-center p-0.5"
            onClick={() => window.location.href = '/account'}
          >
            {user.profileImage ? (
              <img src={user.profileImage} className="w-full h-full rounded-full object-cover" alt="User" />
            ) : (
              <User size={18} className="text-zinc-400" />
            )}
          </button>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="absolute inset-0" style={{ bottom: ENV_BAR_HEIGHT }}>
        <div className="relative h-full w-full">
          {!previewImage && <CanvasPlaceholder />}

          {previewImage && (
            <img
              src={previewImage}
              alt="Designer preview"
              className="absolute inset-0 w-full h-full object-contain p-4"
              decoding="async"
            />
          )}

          {isProcessing && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white border border-zinc-100 shadow-2xl">
                <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin" />
                <div className="flex flex-col items-center gap-1">
                  <span className="text-[10px] font-black text-zinc-900 uppercase tracking-[0.2em]">جاري المعالجة...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Environment Selectors (above app bottom nav) */}
      <div
        className="absolute left-0 right-0 bottom-0 z-20"
        style={{ height: ENV_BAR_HEIGHT }}
      >
        <div className="h-full px-3 flex items-center">
          <div className="w-full overflow-x-auto kh-scrollbar">
            <div className="inline-flex gap-2 pr-2">
              {envOptions.map((o) => {
                const active = lightingPreset === o.id;
                // Arabic Labels
                const labels: Record<string, string> = {
                   'night': 'ليلي',
                   'day': 'نهاري',
                   'cinematic': 'سينمائي'
                };
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => onSelectLightingPreset(o.id)}
                    className={
                      'h-10 px-5 rounded-full border text-[11px] font-black uppercase tracking-widest transition-all ' +
                      (active
                        ? 'bg-purple-600 border-purple-600 text-white shadow-lg shadow-purple-100'
                        : 'bg-white border-zinc-200 text-zinc-400 hover:border-purple-300')
                    }
                  >
                    {labels[o.id] || o.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Designer Drawer (bottom sheet) */}
      <div
        className={
          'absolute left-0 right-0 z-40 transition-[height] duration-200 ease-out ' +
          (dragging ? '' : 'will-change-[height]')
        }
        style={{
          height: drawerH,
          bottom: ENV_BAR_HEIGHT,
        }}
      >
        {/* Grab Handle */}
        <div
          className="absolute -top-4 left-0 right-0 flex justify-center py-4"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div className="h-1.5 w-12 rounded-full bg-zinc-300" />
        </div>

        <MobileControlDrawer
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          models={models}
          selectedModelId={selectedModelId}
          onSelectModel={handleSelectModel}
          fabricImage={fabricImage}
          onFabricUpload={onFabricUpload}
          canGenerate={canGenerate}
          isProcessing={isProcessing}
          onGenerate={onGenerate}
          generateLabel="توليد وتحسين"
        />
      </div>
    </div>
  );
});
