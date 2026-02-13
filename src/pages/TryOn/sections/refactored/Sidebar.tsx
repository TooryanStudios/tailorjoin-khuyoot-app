import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  ChevronDown, 
  Loader2, 
  Upload, 
  PanelLeftClose,
  PanelLeftOpen,
  Image as ImageIcon,
  Palette,
  Zap,
  User,
  Coins,
  LogOut,
  HelpCircle,
  FileText,
  Settings2,
  Sparkles,
  History as HistoryIcon,
  Plus,
  Share2,
  Download,
  ZoomIn,
  Maximize2,
  X,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TemplateSelectorView } from '../../../../modules/TemplatePicker';
import { DesignerUserDataDisplay } from '../../components/userData/DesignerUserDataDisplay';
import { useDesignerUserData } from '../../components/userData/useDesignerUserData';
import { useAuth } from '../../../../auth/useAuth';
import { requestLoginPrompt } from '../../../../auth/authEvents';
import { LightingPresets } from '../../components/LightingPresets';

interface SidebarProps {
  features: any;
  uiState: any;
  user: any;
  isAdminUser: boolean;
  isSubscribed: boolean;
  canAfford: (feature: string) => boolean;
  openUpgradeModal: (context: string) => void;
  // State from parent
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  refinementPrompt: string;
  setRefinementPrompt: (val: string) => void;
  selectedTemplate: any;
  handleTemplateSelect: (template: any) => void;
  setLastActiveTemplateTab: (tab: string) => void;
  isLoadingProduct: boolean;
  loadingTemplateId: string | null;
  // Upload refs/handlers
  sourceInputRef: React.RefObject<HTMLInputElement | null>;
  fabricInputRef: React.RefObject<HTMLInputElement | null>;
  sourcePreviewUrl: string | null;
  fabricPreviewUrl: string | null;
  fabricMaterial: string;
  setFabricMaterial: (material: string) => void;
  setFabricTilingOpen: (open: boolean) => void;
  // Generation
  isProcessing: boolean;
  progress: number;
  generationCost: number;
  handleFabricSwap: () => void;
  // Privacy logic
  isPrivacyMode: boolean;
  setPrivacyMode: (mode: boolean) => void;
  isProcessingTemplate: boolean;
  isProcessingFabric: boolean;
  isProcessingPrivacy: boolean;
  maskingStyle: string;
  setMaskingStyle: (style: any) => void;
  blurStrength: number;
  setBlurStrength: (val: number) => void;
  selectedEmoji: string;
  setSelectedEmoji: (emoji: string) => void;
  // Upscale logic
  upscaleEngine: string;
  setUpscaleEngine: (engine: 'standard' | 'creative') => void;
  outputFit: string;
  setOutputFit: (fit: 'contain' | 'cover') => void;
  handleUpscale: () => void;
  isUpscaling: boolean;
  upscaleProgress: number;
  upscaleCost: number;
  // Output settings
  isWatermarkEnabled: boolean;
  setIsWatermarkEnabled: (val: boolean) => void;
  // Upload handlers
  onPickSource: (file: File) => Promise<void>;
  onPickFabric: (file: File) => Promise<void>;
  openUserImagePrep: (file: File) => void;
  openFabricPrep: (file: File) => void;
  // Debug
  lastRequestDebug: any;
  lastResponseDebug: any;
  navigate: (path: string) => void;
  // UI State
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  isHistoryCollapsed: boolean;
  setIsHistoryCollapsed: (collapsed: boolean) => void;
  // Sharing & Tools
  handleShareTask: () => void;
  shareUrlCopied: boolean;
  currentTaskId: string | null;
  history: any[];
  // Tiling
  fabricTilingOpen: boolean;
  setFabricTilingOpen: (val: boolean) => void;
  fabricScale: number;
  setFabricScale: (val: number) => void;
  originalFabricData: { url: string; base64: string; mimeType?: string } | null;
  setOriginalFabricData: (data: { url: string; base64: string; mimeType: string } | null) => void;
  setFabricPreviewUrl: (url: string | null) => void;
  fabricImageBase64: string | null;
  fabricImageMimeType: string | null;
  setFabricImageBase64: (val: string | null) => void;
  setFabricImageMimeType: (val: string | null) => void;
  persistFabricSelection: (selection: any) => void;
  lightingGenerator: any;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { t } = useTranslation(['designer']);
  const {
    features, uiState, user, isAdminUser, isSubscribed, canAfford, openUpgradeModal,
    selectedModel, setSelectedModel, refinementPrompt, setRefinementPrompt,
    selectedTemplate, handleTemplateSelect, 
    setLastActiveTemplateTab, isLoadingProduct, loadingTemplateId,
    sourceInputRef, fabricInputRef, sourcePreviewUrl, fabricPreviewUrl,
    fabricMaterial, setFabricMaterial, setFabricTilingOpen,
    isProcessing, generationCost, handleFabricSwap,
    progress,
    isPrivacyMode, setPrivacyMode, isProcessingTemplate, isProcessingFabric, isProcessingPrivacy,
    maskingStyle, setMaskingStyle, blurStrength, setBlurStrength, selectedEmoji, setSelectedEmoji,
    upscaleEngine, setUpscaleEngine, outputFit, setOutputFit, handleUpscale, 
    isUpscaling, upscaleProgress, upscaleCost,
    isWatermarkEnabled, setIsWatermarkEnabled,
    onPickSource, onPickFabric,
    openUserImagePrep, openFabricPrep,
    isSidebarCollapsed, setIsSidebarCollapsed,
    isHistoryCollapsed, setIsHistoryCollapsed,
    handleShareTask, shareUrlCopied, currentTaskId,
    history, navigate,
    fabricScale,
    setFabricScale,
    originalFabricData,
    setOriginalFabricData,
    setFabricPreviewUrl,
    fabricImageBase64,
    fabricImageMimeType,
    setFabricImageBase64,
    setFabricImageMimeType,
    persistFabricSelection,
    fabricTilingOpen,
    lightingGenerator,
  } = props;

  const { logout } = useAuth();
  const { serverUser } = useDesignerUserData();
  const credits = serverUser?.billing?.credits ?? (serverUser as any)?.credits ?? 0;
  const tier = serverUser?.billing?.tier || 'free';
  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = React.useState(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = React.useState(false);
  const tilingStartPreviewRef = React.useRef<{ url: string; base64: string | null; mimeType: string | null } | null>(null);

  React.useEffect(() => {
    if (!isSidebarCollapsed) {
      setUserMenuOpen(false);
    }
  }, [isSidebarCollapsed]);

  const handleApplyTiling = async () => {
    console.log('[Tiling] Applying tiling with scale:', fabricScale);
    if (!originalFabricData || !originalFabricData.url) {
      console.warn('[Tiling] No original fabric data found');
      return;
    }
    
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      const loadPromise = new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = (e) => reject(new Error('Failed to load fabric image for tiling'));
        // Add a timeout just in case
        setTimeout(() => reject(new Error('Fabric image load timeout')), 10000);
      });

      const sourceMimeType = originalFabricData.mimeType || fabricImageMimeType || 'image/jpeg';
      const sourceDataUrl = originalFabricData.base64
        ? `data:${sourceMimeType};base64,${originalFabricData.base64}`
        : '';
      const sourceUrl = sourceDataUrl || originalFabricData.url || fabricPreviewUrl || '';
      if (!sourceUrl) throw new Error('No fabric source available for tiling');

      img.src = sourceUrl;
      await loadPromise;
      
      console.log('[Tiling] Image loaded:', img.naturalWidth, 'x', img.naturalHeight);
      
      const canvas = document.createElement('canvas');
      const size = 1024;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) throw new Error('Could not get canvas context');
      
      // scale 1 is original. scale 0.5 is smaller (more tiles).
      const tileW = Math.max(16, img.naturalWidth * fabricScale);
      const tileH = Math.max(16, img.naturalHeight * fabricScale);
      
      console.log('[Tiling] Tile size:', tileW, 'x', tileH);
      
      const tileCanvas = document.createElement('canvas');
      tileCanvas.width = tileW;
      tileCanvas.height = tileH;
      const tctx = tileCanvas.getContext('2d');
      if (tctx) {
        tctx.drawImage(img, 0, 0, tileW, tileH);
        const pattern = ctx.createPattern(tileCanvas, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(0, 0, size, size);
          
          const tiledDataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('[Tiling] Tiled image generated, length:', tiledDataUrl.length);
          
          setFabricPreviewUrl(tiledDataUrl);
          setFabricImageBase64(tiledDataUrl.split(',')[1]);
          setFabricImageMimeType('image/jpeg');

          // Rebase tiling source to the committed result so user can tile again incrementally
          setOriginalFabricData({
            base64: tiledDataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            url: tiledDataUrl,
          });
          
          persistFabricSelection({
            fabricId: null,
            image: { base64: tiledDataUrl.split(',')[1], mimeType: 'image/jpeg' },
          });
          
          setFabricTilingOpen(false);
        } else {
          throw new Error('Could not create tiling pattern');
        }
      } else {
        throw new Error('Could not get tile canvas context');
      }
    } catch (err) {
      console.error('[Tiling] Apply failed:', err);
      // Keep current preview as-is; do not force-revert to original
      setFabricTilingOpen(false);
    }
  };

  const handleCancelTiling = () => {
    const startPreview = tilingStartPreviewRef.current;
    if (startPreview?.url) {
      setFabricPreviewUrl(startPreview.url);
      setFabricImageBase64(startPreview.base64);
      if (startPreview.mimeType) {
        setFabricImageMimeType(startPreview.mimeType);
      }
    }
    setFabricTilingOpen(false);
    setFabricScale(1);
    tilingStartPreviewRef.current = null;
  };

  const creditsEnabled = true;

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isSidebarCollapsed ? 80 : 320 }}
      className={`h-full bg-[#ededed] flex flex-col items-center z-50 relative`}
    >
      {/* Black divider line at the end of the sidebar */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-300 z-[100]" />

      {/* Hidden constant inputs */}
      <input
        ref={sourceInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        title="Upload Source Image"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openUserImagePrep(file);
          e.target.value = ''; // Reset for same file re-upload
        }}
      />
      <input
        ref={fabricInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        title="Upload Fabric Image"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) openFabricPrep(file);
          e.target.value = ''; // Reset for same file re-upload
        }}
      />

      <AnimatePresence mode="popLayout" initial={false}>
        {isSidebarCollapsed ? (
          <motion.div 
            key="collapsed"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full flex flex-col items-center py-2 gap-2 h-full"
          >
            {/* Navigation & Actions */}
            <div className="flex-1 flex flex-col items-center py-2 gap-2 w-full">
              {/* Toggle Button - Collapsed (Top) */}
              <button 
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-3 rounded-xl bg-white border border-zinc-200 text-zinc-600 hover:text-purple-600 hover:border-purple-400 hover:bg-purple-50 transition-all active:scale-95 group"
                title={t('expandSidebar')}
              >
                <PanelLeftClose size={18} className="group-hover:scale-110 transition-transform" />
              </button>
              <div className="w-8 h-px bg-zinc-200 my-0.5" />

              {/* Credits (Collapsed) - Premium Amber Style */}
              <button 
                type="button"
                className="group flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 hover:scale-110"
                onClick={() => openUpgradeModal('sidebar_credits_collapsed_click')}
              >
                <span className="text-xl font-normal text-amber-500 leading-none tracking-tight drop-shadow-[0_0_8px_rgba(245,158,11,0.3)]">
                  {credits}
                </span>
                <span className="text-[7px] font-normal text-amber-500/40 uppercase tracking-[0.2em] mt-0.5 group-hover:text-amber-400 transition-colors">
                  {t('credits')}
                </span>
              </button>

              <div className="w-8 h-px bg-zinc-200 my-0.5" />

              {/* Quick Tools */}
              <div className="flex flex-col gap-3 w-full px-3">
                <button 
                  type="button"
                  disabled={uiState.uploadsDisabled}
                  onClick={() => sourceInputRef.current?.click()}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl border border-solid transition-all relative group ${
                    sourcePreviewUrl 
                      ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' 
                      : 'border-zinc-200 bg-white hover:border-purple-400 hover:bg-purple-50'
                  } ${uiState.uploadsDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                  title={t('originalModel')}
                >
                  {sourcePreviewUrl ? (
                    <img src={sourcePreviewUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <ImageIcon size={20} />
                  )}
                </button>

                <button 
                  type="button"
                  disabled={uiState.uploadsDisabled}
                  onClick={() => fabricInputRef.current?.click()}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl border border-solid transition-all relative group ${
                    fabricPreviewUrl 
                      ? 'border-theme-primary bg-theme-primary/10 text-theme-primary' 
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-purple-400 hover:bg-purple-50'
                  } ${uiState.uploadsDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer active:scale-95'}`}
                  title={t('fabricTexture')}
                >
                  {fabricPreviewUrl ? (
                    <img src={fabricPreviewUrl} alt="" className="w-full h-full object-contain rounded-lg" />
                  ) : (
                    <Palette size={20} />
                  )}
                </button>

                <button 
                  type="button"
                  onClick={handleFabricSwap}
                  disabled={uiState.generationDisabled}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl transition-all relative group overflow-visible ${
                    uiState.generationDisabled 
                      ? 'bg-zinc-100 border border-zinc-200 text-zinc-600 opacity-50' 
                      : 'bg-blue-500 text-white hover:bg-blue-600 active:scale-95'
                  }`}
                  title={t('generateOne')}
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center leading-none gap-1">
                      <Loader2 size={16} className="animate-spin" />
                      <span className="text-[9px] font-normal">{Math.round(progress)}%</span>
                    </div>
                  ) : (
                    <>
                      <Zap size={18} />
                      <div className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[10px] font-normal flex items-center justify-center shadow-xl shadow-amber-900/30 border border-white/20 z-20 select-none pointer-events-none group-hover:scale-110 transition-transform">
                        {generationCost}
                      </div>
                    </>
                  )}
                </button>

                {/* History/Activity Strip Toggle - Only show if history exists */}
                {history.length > 0 && (
                  <button 
                    type="button"
                    onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                    className={`w-full aspect-square flex items-center justify-center rounded-xl border border-solid transition-all relative group shadow-sm ${
                      !isHistoryCollapsed 
                        ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-purple-400 hover:bg-purple-50'
                    }`}
                    title={t('history')}
                  >
                    <HistoryIcon size={18} />
                    {!isHistoryCollapsed && <div className="absolute -right-1 -top-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse border-2 border-[#020202]" />}
                  </button>
                )}

                {/* Share (Collapsed) */}
                <button 
                  type="button"
                  onClick={handleShareTask}
                  disabled={!currentTaskId}
                  title={t('shareDesign')}
                  className={`w-full aspect-square flex items-center justify-center rounded-xl border border-solid transition-all relative group shadow-sm ${
                    shareUrlCopied 
                      ? 'border-green-500 bg-green-500/10 text-green-500' 
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-400 hover:bg-zinc-50'
                  } ${!currentTaskId ? 'opacity-30 cursor-not-allowed' : 'active:scale-95'}`}
                >
                  <Share2 size={18} />
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="expanded"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="w-full h-full flex flex-col"
          >
            {/* Credits Section (Below Divider) - Tightened */}
            <div className="px-5 py-3 border-b border-zinc-200 bg-transparent">
              <div 
                className="group flex items-center justify-between pl-1.5 pr-1.5 py-1.5 rounded-2xl border border-zinc-200 bg-white shadow-sm" 
              >
                {/* 1. Credits Display (Left-aligned via flex-1) */}
                <div className="flex-1 flex items-center pl-1">
                  <div className="group flex items-center gap-2 cursor-pointer active:scale-95" onClick={() => openUpgradeModal('sidebar_credits_click')}>
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white leading-none overflow-hidden shadow-sm">
                      <Coins size={16} />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xl font-normal text-amber-500 leading-none tracking-tight md:group-hover:text-amber-600 transition-colors">{credits || 0}</span>
                      <span className="text-[9px] text-amber-500/60 font-normal uppercase tracking-[0.1em] leading-none">{t('credits')}</span>
                    </div>
                  </div>
                </div>

                {/* 2. Transactions History (Perfectly Centered) */}
                <div className="flex-shrink-0 border-l border-zinc-200 pl-2 mx-1.5">
                  <button 
                    onClick={() => navigate('/account/billing')}
                    className="p-1.5 rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 transition-all active:scale-90"
                    title="Transaction History"
                  >
                    <HistoryIcon size={16} />
                  </button>
                </div>

                {/* 3. Refill Button (Right-aligned via flex-1) */}
                <div className="flex-1 flex justify-end">
                  <button 
                    onClick={() => openUpgradeModal('refill_button')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 transition-all active:scale-90"
                    title={t('refill')}
                  >
                    <span className="text-[10px] font-normal tracking-widest uppercase">Refill</span>
                    <Zap size={12} fill="currentColor" />
                  </button>
                </div>

                {/* 4. Collapse Button (Right) */}
                <button 
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="p-1.5 rounded-lg text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 transition-all active:scale-95 border border-transparent hover:border-zinc-300"
                  title={t('collapseSidebar')}
                >
                  <PanelLeftOpen size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 custom-scrollbar">
              
              {/* 1. PRIMARY ACTIONS HUB - Selection & Execution */}
              <div className="p-3 rounded-2xl border border-dashed border-zinc-400 bg-[#fcfcfc] space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {/* Template Selection */}
                  {features.showTemplateUpload && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest px-1">
                        {t('originalModel')}
                      </div>
                      <div 
                        className={`relative group rounded-2xl border border-dashed h-[180px] transition-all overflow-hidden ${
                          sourcePreviewUrl 
                            ? 'border-zinc-400 bg-purple-50/30' 
                            : 'border-zinc-300 bg-zinc-100 hover:border-zinc-400 hover:bg-zinc-200'
                        }`}
                        style={{ borderSpacing: '8px' }}
                      >
                        {sourcePreviewUrl ? (
                          <div className="absolute inset-0 cursor-pointer" onClick={() => sourceInputRef.current?.click()}>
                            <img src={sourcePreviewUrl} alt="Template" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-zinc-950/60 transition-all flex flex-col items-center justify-center">
                              <Upload size={14} className="text-white" />
                              <span className="text-[8px] font-medium text-white uppercase tracking-widest">{t('change')}</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => sourceInputRef.current?.click()}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-theme-primary transition-all"
                          >
                            <Upload size={16} />
                            <span className="text-[11px] font-medium uppercase tracking-widest">{t('upload')}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fabric Selection */}
                  {features.showFabricUpload && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-medium text-zinc-500 uppercase tracking-widest px-1">
                        {t('fabricTexture')}
                      </div>
                      <div 
                        className={`relative group rounded-2xl border border-dashed h-[180px] transition-all overflow-hidden ${
                          fabricPreviewUrl 
                            ? 'border-zinc-400 bg-purple-50/30' 
                            : 'border-zinc-300 bg-zinc-100 hover:border-zinc-400 hover:bg-zinc-200'
                        }`}
                        style={{ borderSpacing: '8px' }}
                      >
                        {fabricPreviewUrl ? (
                          <div className="absolute inset-0 cursor-pointer" onClick={() => fabricInputRef.current?.click()}>
                            <div className="relative w-full h-full">
                              <img
                                src={fabricPreviewUrl}
                                alt="Fabric"
                                className="w-full h-full object-contain"
                              />

                              {fabricTilingOpen && (
                                <div 
                                  className="absolute inset-0"
                                  style={{ 
                                    backgroundImage: `url("${originalFabricData?.url || fabricPreviewUrl}")`,
                                    backgroundRepeat: 'repeat',
                                    backgroundSize: `${(fabricScale || 1) * 100}%`,
                                    backgroundPosition: 'center'
                                  }}
                                />
                              )}
                            </div>
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-zinc-950/60 transition-all flex flex-col items-center justify-center">
                                <Upload size={14} className="text-white" />
                                <span className="text-[8px] font-medium text-white uppercase tracking-widest">{t('change')}</span>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => fabricInputRef.current?.click()}
                              className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-zinc-500 hover:text-theme-primary transition-all"
                            >
                              <Palette size={16} />
                              <span className="text-[11px] font-medium uppercase tracking-widest">{t('noFabric')}</span>
                            </button>
                          )}

                        {/* Secondary Tiling Toggle (Overlay) - High Utility Badge Style */}
                        {features.showTilingControls && fabricPreviewUrl && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              tilingStartPreviewRef.current = {
                                url: fabricPreviewUrl,
                                base64: fabricImageBase64,
                                mimeType: fabricImageMimeType,
                              };
                              if (fabricPreviewUrl) {
                                // Always use current preview as tiling base so user can re-tile repeatedly
                                setOriginalFabricData({ 
                                  base64: fabricImageBase64 || '', 
                                  mimeType: fabricImageMimeType || 'image/jpeg', 
                                  url: fabricPreviewUrl 
                                });
                              }
                              setFabricTilingOpen(true);
                            }}
                            className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-500 text-black hover:scale-110 active:scale-95 transition-all group/tile"
                            title={t('tile')}
                          >
                            <Zap size={10} fill="currentColor" />
                            <span className="text-[9px] font-normal uppercase tracking-tight">{t('tile')}</span>
                          </button>
                        )}
                        </div>
                      </div>
                    )}
                  </div>

                {/* Tiling Slider Row (Shown when active) */}
                <AnimatePresence>
                  {fabricTilingOpen && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-3 mb-1 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-normal text-amber-500 uppercase tracking-widest">
                            {t('tiling')} Scale
                          </span>
                          <span className="text-[9px] font-mono text-amber-500/60 bg-amber-500/10 px-1.5 py-0.5 rounded">
                            {fabricScale.toFixed(2)}x
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <input 
                            type="range"
                            min={0.1}
                            max={2}
                            step={0.05}
                            value={fabricScale}
                            title="Tiling Scale"
                            onChange={(e) => setFabricScale(Number(e.target.value))}
                            className="flex-1 accent-purple-500 h-1 bg-zinc-300 rounded-full appearance-none cursor-pointer"
                          />
                          
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              onClick={handleCancelTiling}
                              className="p-1.5 rounded-lg bg-white border border-zinc-200 text-purple-600 hover:text-purple-700 transition-colors"
                              title={t('cancel')}
                            >
                              <X size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={handleApplyTiling}
                              className="p-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-400 transition-colors"
                              title={t('apply')}
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Primary Execution Row - Now directly below card grid */}
                <div className="pt-0.5 flex gap-2">
                  <button
                    type="button"
                    disabled={uiState.generationDisabled}
                    onClick={handleFabricSwap}
                    className={`generateButtonShine flex-1 px-4 py-3.5 rounded-xl font-normal tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-xl ${
                      uiState.generationDisabled
                        ? 'bg-zinc-100 text-zinc-600 cursor-not-allowed border border-zinc-200'
                        : 'bg-[var(--theme-primary)] hover:bg-[var(--theme-primary-dark)] text-white hover:scale-[1.01] active:scale-95 shadow-theme-primary/30 border border-white/20'
                    }`}
                  >
                    {isProcessing ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{Math.round(progress)}%</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles size={14} fill="currentColor" />
                        {t('generateOne').toUpperCase()}
                        {generationCost > 0 && (
                          <div className="bg-amber-500/10 text-amber-500 text-[9px] font-normal ml-1.5 px-1.5 py-0.5 rounded border border-amber-500/30 flex items-center justify-center">
                            {generationCost}
                          </div>
                        )}
                      </>
                    )}
                  </button>

                  {/* History Toggle (Compact inside HUB) */}
                  {history.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsHistoryCollapsed(!isHistoryCollapsed)}
                      className={`w-12 aspect-square flex items-center justify-center rounded-xl border transition-all active:scale-95 ${
                        !isHistoryCollapsed
                          ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-lg shadow-amber-500/10'
                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                      }`}
                      title={isHistoryCollapsed ? "Open History" : "Close History"}
                    >
                      <HistoryIcon size={16} className={!isHistoryCollapsed ? 'animate-pulse' : ''} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tailor It Button - New Row */}
              <button
                type="button"
                onClick={() => {
                  const idToUse = currentTaskId || 'default';
                  window.location.href = `/studio/measurements/${idToUse}`;
                }}
                disabled={!currentTaskId && !sourcePreviewUrl}
                className={`w-full py-3 rounded-xl text-white font-normal text-[11px] uppercase tracking-widest transition-all shadow-sm ${
                  !currentTaskId && !sourcePreviewUrl
                    ? 'bg-gradient-to-r from-zinc-300 to-zinc-400 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-r from-[#63498b] to-[#7a5fa3] hover:from-[#7a5fa3] hover:to-[#63498b] active:scale-95'
                }`}
              >
                إبدأ التفصيل
              </button>

              {/* 2. TOOLS GROUP - Share, Download, Zoom, Maximize */}
              <div className="p-2 rounded-2xl border border-zinc-200 bg-white shadow-sm flex items-center justify-around gap-1">
                <button
                  type="button"
                  title={shareUrlCopied ? t('shareLinkCopied') : t('shareDesign')}
                  onClick={handleShareTask}
                  disabled={!currentTaskId}
                  className={`p-2.5 rounded-xl border transition-all flex-1 flex justify-center ${
                    shareUrlCopied
                      ? 'border-green-500/60 bg-green-500/10 text-green-400'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:border-purple-400 hover:bg-purple-50'
                  } ${!currentTaskId ? 'opacity-30 cursor-not-allowed' : 'active:scale-90'}`}
                >
                  <Share2 size={16} />
                </button>

                <button
                  type="button"
                  title={t('download')}
                  className="p-2.5 rounded-xl border border-zinc-200 bg-white/50 text-zinc-600 hover:border-purple-400 hover:text-purple-600 transition-all flex-1 flex justify-center active:scale-90"
                >
                  <Download size={16} />
                </button>

                <button
                  type="button"
                  title={t('zoomIn')}
                  className="p-2.5 rounded-xl border border-zinc-200 bg-white/50 text-zinc-600 hover:border-purple-400 hover:text-purple-600 transition-all flex-1 flex justify-center active:scale-90"
                >
                  <ZoomIn size={16} />
                </button>

                <button
                  type="button"
                  title={t('fullscreen')}
                  className="p-2.5 rounded-xl border border-zinc-200 bg-white/50 text-zinc-600 hover:border-purple-400 hover:text-purple-600 transition-all flex-1 flex justify-center active:scale-90"
                >
                  <Maximize2 size={16} />
                </button>
              </div>

              {/* Advanced Settings - Collapsible - NOW ABOVE GALLERY */}
              <div className="pt-2 border-t border-zinc-200">
                <button 
                  onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                  className="w-full flex items-center justify-between py-2 px-1 text-zinc-500 hover:text-zinc-300 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 size={14} className="group-hover:rotate-45 transition-transform" />
                    <span className="text-[11px] font-medium uppercase tracking-wider">{t('advancedSettings')}</span>
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-300 ${isAdvancedOpen ? 'rotate-180' : ''}`} 
                  />
                </button>

                <AnimatePresence>
                  {isAdvancedOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden space-y-6 pt-4 pb-2"
                    >
                      {/* Model Selection */}
                      {features.showModelSelection && (
                        <div>
                          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2 px-1">
                            {t('engineModel')}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {(['NanoBana', 'Pro'] as const).map(model => (
                              <button
                                key={model}
                                type="button"
                                onClick={() => setSelectedModel(model)}
                                className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                  selectedModel === model
                                    ? 'bg-theme-primary/20 border border-theme-primary/50 text-theme-primary'
                                    : 'bg-white border border-zinc-200 text-zinc-600 hover:border-purple-400'
                                }`}
                              >
                                {model === 'NanoBana' ? 'Bana 2.1' : 'Ultra Pro'}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lighting Settings */}
                      <div>
                        <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-3 px-1">
                          {t('lighting')}
                        </div>
                        <div className="px-1">
                          <LightingPresets 
                            value={lightingGenerator.value} 
                            onChange={lightingGenerator.onSelectPreset} 
                          />
                        </div>
                      </div>

                      {/* Output Quality */}
                      {features.showOutputQuality && (
                        <div className="space-y-4">
                          <div>
                            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2 px-1">
                              {t('outputFit')}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {([
                                { id: 'contain', label: t('fitContain') },
                                { id: 'cover', label: t('fitCover') }
                              ] as const).map(fit => (
                                <button
                                  key={fit.id}
                                  type="button"
                                  onClick={() => setOutputFit(fit.id)}
                                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                                    outputFit === fit.id
                                      ? 'bg-zinc-100 text-zinc-950'
                                      : 'bg-white border border-zinc-200 text-zinc-600'
                                  }`}
                                >
                                  {fit.label}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Upscale Controls */}
                      {features.showUpscaleButton && uiState.showUpscaleButton && (
                        <div className="space-y-3 pt-2 border-t border-zinc-200">
                          <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
                            <span>{t('upscaleResult')}</span>
                            {features.showUpscaleEngine && (
                              <select 
                                value={upscaleEngine}
                                title="Upscale Engine"
                                onChange={(e) => setUpscaleEngine(e.target.value as any)}
                                className="bg-transparent border-none text-[9px] font-medium text-theme-primary focus:ring-0 cursor-pointer"
                              >
                                <option value="standard" className="bg-white text-black">{t('upscaleStandard')}</option>
                                <option value="creative" className="bg-white text-black">{t('upscaleCreative')}</option>
                              </select>
                            )}
                          </div>
                          
                          <button
                            onClick={handleUpscale}
                            disabled={uiState.upscaleDisabled || isUpscaling}
                            className={`w-full px-4 py-2 rounded-lg font-medium text-[11px] transition-all flex items-center justify-center gap-2 ${
                              uiState.upscaleDisabled || isUpscaling
                                ? 'bg-theme-primary/10 text-theme-primary/30 cursor-wait border border-theme-primary/10'
                                : 'bg-theme-primary/10 text-theme-primary border border-theme-primary/40 hover:bg-theme-primary hover:text-white shadow-lg shadow-theme-primary/10'
                            }`}
                          >
                            {isUpscaling ? (
                              <div className="flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" />
                                <span>{Math.round(upscaleProgress)}%</span>
                              </div>
                            ) : (
                              <>
                                <Sparkles size={12} />
                                {t('upscaleResult').toUpperCase()}
                                {upscaleCost > 0 && <span className="opacity-50 text-[9px]">({upscaleCost})</span>}
                              </>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Privacy Shield Section */}
                      {features.showPrivacySettings && (
                        <div className="pt-2 border-t border-zinc-200 space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <div className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest">{t('privacyProtectionTitle')}</div>
                            <button
                              onClick={() => setPrivacyMode(!isPrivacyMode)}
                              disabled={isProcessingPrivacy}
                              title={isPrivacyMode ? t('disablePrivacy') : t('enablePrivacy')}
                              className={`relative inline-flex items-center h-4 w-8 rounded-full transition-colors ${
                                isPrivacyMode ? 'bg-theme-primary' : 'bg-zinc-700'
                              } ${isProcessingPrivacy ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                              <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isPrivacyMode ? 'translate-x-[1.125rem]' : 'translate-x-0.5'}`} />
                            </button>
                          </div>

                          {isPrivacyMode && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                              <div>
                                <label className="text-[9px] text-zinc-500 uppercase font-normal mb-2 block tracking-widest px-1">{t('maskingStyleLabel')}</label>
                                <div className="grid grid-cols-3 gap-2">
                                  {[
                                    { value: 'feathered-blur', icon: '🎭', label: t('maskingStyleBlur') },
                                    { value: 'pixelate', icon: '🔲', label: t('maskingStylePixelate') },
                                    { value: 'emoji', icon: '😊', label: t('maskingStyleEmoji') },
                                  ].map((style) => (
                                    <button
                                      key={style.value}
                                      onClick={() => setMaskingStyle(style.value)}
                                      className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all ${
                                        maskingStyle === style.value
                                          ? 'bg-theme-primary/20 border-theme-primary text-theme-primary'
                                          : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                                      }`}
                                    >
                                      <span className="text-base mb-0.5">{style.icon}</span>
                                      <span className="text-[8px] font-medium uppercase truncate w-full text-center">{style.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {maskingStyle === 'feathered-blur' && (
                                <div className="px-1">
                                  <div className="flex items-center justify-between text-[9px] text-zinc-500 uppercase font-normal mb-2 tracking-widest">
                                    <span>{t('intensityLabel')}</span>
                                    <span className="text-theme-primary font-mono">{blurStrength}px</span>
                                  </div>
                                  <input
                                    type="range"
                                    min="10"
                                    max="50"
                                    value={blurStrength}
                                    title="Blur Strength"
                                    onChange={(e) => setBlurStrength(Number(e.target.value))}
                                    className="w-full h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-theme-primary"
                                  />
                                </div>
                              )}

                              {maskingStyle === 'emoji' && (
                                <div className="grid grid-cols-6 gap-1 px-1">
                                  {['😊', '😃', '🙂', '😄', '😁', '🥰', '😍', '🤗', '😌', '😎', '🤩', '😇'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      onClick={() => setSelectedEmoji(emoji)}
                                      className={`text-sm aspect-square flex items-center justify-center rounded transition-all ${
                                        selectedEmoji === emoji ? 'bg-theme-primary/30 ring-1 ring-theme-primary' : 'bg-transparent hover:bg-zinc-100'
                                      }`}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Watermark Toggle */}
                      {features.showExportSettings && (
                        <label className="flex items-center justify-between p-2 rounded-xl bg-white border border-zinc-200 cursor-pointer hover:bg-purple-50 transition-colors">
                          <span className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider">{t('watermark')}</span>
                          <div className="relative">
                            <input
                              type="checkbox"
                              checked={isWatermarkEnabled}
                              onChange={(e) => setIsWatermarkEnabled(e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-zinc-700 rounded-full peer peer-checked:bg-theme-primary after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:translate-x-4"></div>
                          </div>
                        </label>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Galleries - NOW AT THE BOTTOM */}
              <div className="pt-4 border-t border-zinc-200 space-y-2 pb-12">
                <button 
                  onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                  className="w-full flex items-center justify-between py-2 px-1 text-zinc-500 hover:text-zinc-300 transition-colors group"
                >
                  <div className="text-[10px] font-normal uppercase tracking-widest flex items-center gap-2">
                    <ImageIcon size={12} className="group-hover:scale-110 transition-transform" />
                    {t('modelTemplateLabel')}
                  </div>
                  <ChevronDown 
                    size={14} 
                    className={`transition-transform duration-300 ${isTemplatesOpen ? 'rotate-180' : ''}`} 
                  />
                </button>
                 
                <AnimatePresence>
                  {isTemplatesOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden space-y-4"
                    >
                      <TemplateSelectorView
                        onSelect={handleTemplateSelect}
                        onTabChange={(tab) => setLastActiveTemplateTab(tab as any)}
                        currentId={selectedTemplate?.id}
                        closetItems={undefined}
                        enableUpload={true}
                        isSubscribed={isSubscribed || canAfford('premium_template')}
                        onPremiumClick={() => openUpgradeModal('template_premium_click')}
                        defaultTab="Closet"
                        loadingTemplateId={isLoadingProduct ? 'loading-product' : loadingTemplateId}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.aside>
  );
};

