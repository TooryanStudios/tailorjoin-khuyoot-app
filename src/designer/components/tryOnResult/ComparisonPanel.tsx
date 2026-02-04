import React from 'react';
import { Menu, X, HelpCircle, Download, Save } from 'lucide-react';
import { ImageComparisonSlider } from '../ImageComparisonSlider';
import { GenerationsRail, type GenerationItem } from '../../../../pages/designerV2/components/GenerationsRail';
import type { TryOnResultFeatures } from './TryOnResultFeatures';

interface ComparisonPanelProps {
  comparisonBeforeImage?: string;
  comparisonAfterImage?: string;
  comparisonBeforeLabel?: string;
  comparisonAfterLabel?: string;
  originalImageUrl?: string;
  effectiveResultImageSrc: string | null;
  sliderPosition?: number;
  effectiveLoading: boolean;
  PLACEHOLDER_BEFORE: string;
  PLACEHOLDER_AFTER: string;
  
  // Generations
  safeModalGenerations: GenerationItem[];
  onModalGenerationOpen?: (url: string) => void;
  onModalGenerationSetBefore?: (url: string) => void;
  onModalGenerationSetAfter?: (url: string) => void;
  placeholderCount: number;
  features: TryOnResultFeatures;
  showDevUi: boolean;
  
  // Actions
  onHelp?: () => void;
  onSaveToProject?: () => void;
  onDownload?: () => void;
  onOpenDrawer?: () => void;
  onRefreshAfterImage?: () => void;
  canUseResultImageActions?: boolean;
  canOpenDrawer?: boolean;
  
  // Mask toggle
  applyMask?: boolean;
  onApplyMaskChange?: (value: boolean) => void;
  
  // Watermark toggle
  watermarkEnabled?: boolean;
  onWatermarkChange?: (value: boolean) => void;
}

export const ComparisonPanel = React.memo(
  React.forwardRef<HTMLDivElement, ComparisonPanelProps>(
    function ComparisonPanel(props, ref) {
      const {
        comparisonBeforeImage,
        comparisonAfterImage,
        comparisonBeforeLabel,
      comparisonAfterLabel,
      originalImageUrl,
      effectiveResultImageSrc,
      sliderPosition,
      effectiveLoading,
      PLACEHOLDER_BEFORE,
      PLACEHOLDER_AFTER,
      safeModalGenerations,
      onModalGenerationOpen,
      onModalGenerationSetBefore,
      onModalGenerationSetAfter,
      placeholderCount,
      features,
      showDevUi,
      onHelp,
      onSaveToProject,
      onDownload,
      onOpenDrawer,
      onRefreshAfterImage,
      canUseResultImageActions = false,
      canOpenDrawer = false,
      applyMask = true,
      onApplyMaskChange,
      watermarkEnabled = true,
      onWatermarkChange,
    } = props;

    const [showMenu, setShowMenu] = React.useState(false);
    const menuRootRef = React.useRef<HTMLDivElement>(null);
    const [fitMode, setFitMode] = React.useState<'cover' | 'contain'>('cover');
    
    // TEST: Animation effect state (TODO: Remove this section when finalizing)
    const [testAnimationEffect, setTestAnimationEffect] = React.useState<string | null>(null);
    const [testAnimationNonce, setTestAnimationNonce] = React.useState(0);

    // Close menu on outside click
    React.useEffect(() => {
      if (!showMenu) return;
      const handleClickOutside = (e: MouseEvent) => {
        if (menuRootRef.current && !menuRootRef.current.contains(e.target as Node)) {
          setShowMenu(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    // TEST: Auto-apply blur effect when image is ready (DISABLED by request; keep code for later)
    const previousResultRef = React.useRef<string | null>(null);
    React.useEffect(() => {
      // Intentionally no-op: keep manual buttons only
      if (effectiveLoading) {
        setTestAnimationEffect(null);
      }
      previousResultRef.current = effectiveResultImageSrc ?? null;
    }, [effectiveLoading, effectiveResultImageSrc]);

    return (
      <div className="md:col-start-2 md:row-start-1 relative z-0 w-full">
        <div
          ref={ref}
          className={`w-full max-w-full md:max-w-[450px] mx-auto md:min-w-[450px] md:mx-0 space-y-2 md:space-y-3 ${showDevUi ? 'bg-red-500/20' : ''}`}
        >
          {/* ========================================
              COMPARISON SLIDER
              ======================================== */}
          {features.showComparisonSlider && (
            <div className="relative w-full max-w-full md:max-w-[450px] mx-auto h-[520px] md:h-[600px] bg-slate-100 dark:bg-slate-800 rounded-lg md:rounded-xl overflow-hidden flex items-center justify-center" key={`anim-${testAnimationEffect || 'none'}-${testAnimationNonce}`}>
              <div className="w-full h-full">
                <ImageComparisonSlider
                  className="h-full w-full"
                  beforeImage={comparisonBeforeImage || originalImageUrl || (comparisonAfterImage || effectiveResultImageSrc ? '' : PLACEHOLDER_BEFORE)}
                  afterImage={comparisonAfterImage || effectiveResultImageSrc || (comparisonBeforeImage || originalImageUrl ? '' : PLACEHOLDER_AFTER)}
                  beforeLabel={comparisonBeforeLabel || 'القماش'}
                  afterLabel={comparisonAfterLabel || 'النتيجة'}
                  heightScale={1}
                  animateReveal={false}
                  controlledPosition={sliderPosition}
                  isLoading={effectiveLoading}
                  fit={fitMode}
                  fixedHeight={true}
                  afterImageClassName={testAnimationEffect ? `test-reveal-${testAnimationEffect}` : ''}
                />
              </div>
              
              {/* Bottom Action Buttons - Wrapped Together */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                <div className="flex items-center bg-black/70 rounded-xl border border-white/20 shadow-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setFitMode((m) => (m === 'cover' ? 'contain' : 'cover'))}
                    className={`w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors ${
                      fitMode === 'contain' ? 'bg-white/15' : ''
                    }`}
                    title={fitMode === 'contain' ? 'ملء الارتفاع' : 'احتواء الصورة'}
                    aria-label="Toggle fit mode"
                  >
                    {fitMode === 'contain' ? (
                      // Contain: arrows pointing inward with a boxed frame
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="5" y="5" width="14" height="14" rx="2" ry="2" strokeWidth="1.8" />
                        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" />
                        <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M9 9l2-2m0 0h-2m2 0v2" />
                        <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M15 9l-2-2m0 0h2m-2 0v2" />
                        <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M9 15l2 2m0 0h-2m2 0v-2" />
                        <path strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 2m0 0h2m-2 0v-2" />
                      </svg>
                    ) : (
                      // Cover: arrows pointing outward to edges
                      <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="4" y="4" width="16" height="16" rx="3" ry="3" strokeWidth="1.8" />
                        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 9l-3-3m0 0h3m-3 0v3" />
                        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M15 9l3-3m0 0h-3m3 0v3" />
                        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M9 15l-3 3m0 0h3m-3 0v-3" />
                        <path strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" d="M15 15l3 3m0 0h-3m3 0v-3" />
                      </svg>
                    )}
                  </button>
                  <div className="w-px h-5 bg-white/20" />
                  <button
                    type="button"
                    onClick={onHelp}
                    className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="مساعدة"
                    aria-label="Help"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <div className="w-px h-5 bg-white/20" />
                  <button
                    type="button"
                    onClick={onOpenDrawer}
                    disabled={!canOpenDrawer}
                    className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="عرض الصورة الكاملة"
                    aria-label="Show full image"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <div className="w-px h-5 bg-white/20" />
                  <button
                    type="button"
                    onClick={onDownload}
                    disabled={!canUseResultImageActions}
                    className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title="تحميل الصورة"
                    aria-label="Download after image"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <div className="w-px h-5 bg-white/20" />
                  {onApplyMaskChange && (
                  <button
                    type="button"
                    onClick={() => onApplyMaskChange(!applyMask)}
                    className={`w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors ${
                      applyMask ? 'bg-white/20' : ''
                    }`}
                    title="تفعيل القناع (حماية الخلفية)"
                    aria-label="Toggle mask"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </button>
                  )}
                  {onApplyMaskChange && <div className="w-px h-5 bg-white/20" />}
                  {onWatermarkChange && (
                  <button
                    type="button"
                    onClick={() => onWatermarkChange(!watermarkEnabled)}
                    className={`w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors ${
                      watermarkEnabled ? 'bg-white/20' : ''
                    }`}
                    title={watermarkEnabled ? 'إخفاء العلامة المائية' : 'إظهار العلامة المائية'}
                    aria-label="Toggle watermark"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                  </button>
                  )}
                  {onWatermarkChange && <div className="w-px h-5 bg-white/20" />}
                  {onRefreshAfterImage && (
                  <button
                    type="button"
                    onClick={onRefreshAfterImage}
                    className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="تحديث الصورة"
                    aria-label="Refresh after image"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                  )}
                  {onRefreshAfterImage && <div className="w-px h-5 bg-white/20" />}
                  <button
                    type="button"
                    className="w-10 h-8 flex items-center justify-center hover:bg-white/10 transition-colors"
                    title="حفظ المشروع"
                    aria-label="Save project"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Test Animation Effects Bar - TODO: Remove this entire section when finalizing */}
          {showDevUi && (
          <div className="flex flex-col gap-2 mb-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400">
                TEST REVEAL EFFECTS (Active: {testAnimationEffect || 'None'})
              </div>
              <button
                onClick={() => setTestAnimationEffect(null)}
                className="px-2 py-0.5 text-[9px] font-medium rounded bg-slate-500 text-white hover:bg-slate-600 transition-colors"
                title="Reset animation"
              >
                Reset
              </button>
            </div>
            <div className="grid grid-cols-3 gap-1">
              <button 
                onClick={() => setTestAnimationEffect('fade')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  testAnimationEffect === 'fade' ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
                title="Fade In"
              >
                Fade
              </button>
              <button 
                onClick={() => setTestAnimationEffect('scale')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  testAnimationEffect === 'scale' ? 'bg-green-700 text-white' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title="Fade + Scale Up"
              >
                Scale
              </button>
              <button 
                onClick={() => setTestAnimationEffect('slide')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  testAnimationEffect === 'slide' ? 'bg-purple-700 text-white' : 'bg-purple-500 text-white hover:bg-purple-600'
                }`}
                title="Fade + Slide Up"
              >
                Slide
              </button>
              <button 
                onClick={() => setTestAnimationEffect('blur')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  testAnimationEffect === 'blur' ? 'bg-pink-700 text-white' : 'bg-pink-500 text-white hover:bg-pink-600'
                }`}
                title="Blur to Sharp"
              >
                Blur
              </button>
              <button 
                onClick={() => setTestAnimationEffect('shimmer')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  testAnimationEffect === 'shimmer' ? 'bg-indigo-700 text-white' : 'bg-indigo-500 text-white hover:bg-indigo-600'
                }`}
                title="Shimmer Reveal"
              >
                Shimmer
              </button>
              <button 
                onClick={() => setTestAnimationEffect('curtain')}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-colors ${
                  testAnimationEffect === 'curtain' ? 'bg-teal-700 text-white' : 'bg-teal-500 text-white hover:bg-teal-600'
                }`}
                title="Curtain Reveal"
              >
                Curtain
              </button>
            </div>
          </div>
          )}

        </div>
      </div>
    );
  })
);
