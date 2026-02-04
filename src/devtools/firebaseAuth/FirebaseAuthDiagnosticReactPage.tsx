import * as React from 'react';

import { ChevronDown, Loader2, LogIn, LogOut, Trash2, Upload, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as firebaseApp from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  getAuth,
  inMemoryPersistence,
  initializeAuth,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
  type Auth,
} from 'firebase/auth';

import { doc, getDoc, getFirestore, onSnapshot, type Firestore } from 'firebase/firestore';

import { DesignerHeader } from '../../modules/navigation/DesignerHeader';
import { TemplateSelectorView } from '../../modules/TemplatePicker';

type LogType = 'log' | 'success' | 'warning' | 'error';

type LogEntry = {
  ts: number;
  type: LogType;
  message: string;
};

type PersistenceMode = 'local' | 'session' | 'memory';

type DesignerSidebarCtx = any;

// IMPORTANT: This is a direct port of the DesignerV2_1 left sidebar markup.
// We keep the JSX structure/classes/buttons the same, but wire it to local (safe) state
// so it can live inside this diagnostic route without pulling the whole Designer runtime.
function DesignerV2_1LeftSidebar({ ctx }: { ctx: DesignerSidebarCtx }) {
  const {
    t,
    features,
    sidebarHasVisibleContent,
    uiState,
    templateInputRef,
    fabricInputRef,
    sourcePreviewUrl,
    fabricPreviewUrl,
    openUserImagePrep,
    openFabricPrep,
    setFabricTilingOpen,
    setFabricMaterial,
    fabricMaterial,
    handleFabricSwap,
    isProcessing,
    creditsEnabled,
    generationCost,
    handleTemplateSelect,
    setLastActiveTemplateTab,
    selectedTemplate,
    isLoadingProduct,
    loadingTemplateId,
    isSubscribed,
    canAfford,
    openUpgradeModal,
    isPrivacyMode,
    setPrivacyMode,
    isProcessingTemplate,
    isProcessingFabric,
    isProcessingPrivacy,
    maskingStyle,
    setMaskingStyle,
    blurStrength,
    setBlurStrength,
    selectedEmoji,
    setSelectedEmoji,
    upscaleEngine,
    setUpscaleEngine,
    outputFit,
    setOutputFit,
    handleUpscale,
    isUpscaling,
    upscaleProgress,
    upscaleCost,
    isWatermarkEnabled,
    setIsWatermarkEnabled,
    user,
  } = ctx;

  return (
    <aside className="w-[280px] shrink-0 border-r-2 border-zinc-700 flex flex-col h-screen bg-zinc-900 overflow-hidden">
      {/* Header & Scrollable Inputs */}
      <div
        className={`flex-1 ${sidebarHasVisibleContent ? 'overflow-y-auto custom-scrollbar' : 'overflow-y-hidden'} overflow-x-hidden p-4 space-y-6 pb-10`}
      >
        {/* Sidebar is cleaner without header - title moved to top bar */}

        {/* User Image Upload Card */}
        <div>
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{t('userImageLabel')}</div>
          <label
            className={`relative h-[8.4rem] rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 flex flex-col items-center justify-center gap-2 overflow-hidden ${
              uiState.uploadsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <input
              ref={templateInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={uiState.uploadsDisabled}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  openUserImagePrep(file);
                  e.currentTarget.value = '';
                }
              }}
            />
            {sourcePreviewUrl ? (
              <img
                src={sourcePreviewUrl}
                alt="User Image"
                className="absolute inset-0 w-full h-full object-contain object-center"
                loading="lazy"
                decoding="async"
                onClick={() => templateInputRef.current?.click()}
              />
            ) : (
              <button
                type="button"
                onClick={() => templateInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2"
              >
                <Upload className="w-5 h-5 text-zinc-500" />
                <div className="text-xs text-zinc-500">{t('uploadImage')}</div>
              </button>
            )}
            {sourcePreviewUrl && (
              <div className="absolute bottom-2 left-2 text-xs font-normal px-3 py-1 rounded-md bg-black/60 border border-zinc-700 text-zinc-200">
                {t('change')}
              </div>
            )}
          </label>
        </div>

        {/* Fabric/Pattern Image */}
        {features.showFabricUpload && (
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{t('fabricPatternLabel')}</div>
            <div
              className={`grid grid-cols-[1fr_96px] gap-2 ${
                uiState.uploadsDisabled ? 'opacity-50' : ''
              }`}
            >
              <input
                ref={fabricInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uiState.uploadsDisabled}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) openFabricPrep(file);
                  e.currentTarget.value = '';
                }}
              />
              <div className="relative h-28 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 overflow-hidden">
                {fabricPreviewUrl ? (
                  <img
                    src={fabricPreviewUrl}
                    alt="Fabric"
                    className="absolute inset-2 w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-cover object-center rounded-lg cursor-pointer"
                    loading="lazy"
                    decoding="async"
                    onClick={() => fabricInputRef.current?.click()}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => fabricInputRef.current?.click()}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-zinc-500"
                  >
                    <Upload className="w-5 h-5" />
                    <span>{t('noFabric')}</span>
                  </button>
                )}
              </div>
              <div className="h-28 rounded-xl border border-dashed border-zinc-700 bg-zinc-950/60 p-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => fabricInputRef.current?.click()}
                  className="w-full h-10 rounded-md border border-zinc-700 bg-zinc-900 text-xs text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  {fabricPreviewUrl ? t('change') : t('upload')}
                </button>
                <button
                  type="button"
                  onClick={() => setFabricTilingOpen(true)}
                  disabled={!fabricPreviewUrl}
                  className={`w-full h-10 rounded-md border text-xs transition-colors ${
                    fabricPreviewUrl
                      ? 'border-zinc-700 bg-zinc-900 text-zinc-100 hover:bg-zinc-800'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-600 cursor-not-allowed'
                  }`}
                >
                  {t('tile')}
                </button>
              </div>
            </div>

            {/* Fabric Material Selection */}
            <details className="mt-3 mb-4">
              <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t('fabricType')}
              </summary>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {[
                  { id: 'silk', label: t('materialSilk'), icon: '✨' },
                  { id: 'cotton', label: t('materialCotton'), icon: '☁️' },
                  { id: 'linen', label: t('materialLinen'), icon: '🌾' },
                  { id: 'velvet', label: t('materialVelvet'), icon: '🎭' },
                  { id: 'transparent', label: t('materialTransparent'), icon: '💎' },
                  { id: 'wool', label: t('materialWool'), icon: '🧶' },
                ].map((material) => (
                  <button
                    key={material.id}
                    type="button"
                    onClick={() => setFabricMaterial(material.id as any)}
                    disabled={uiState.uploadsDisabled}
                    className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all duration-200 flex flex-col items-center gap-1 ${
                      fabricMaterial === material.id
                        ? 'bg-purple-500/30 border-2 border-purple-500 text-purple-200'
                        : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400 hover:border-zinc-600'
                    } ${uiState.uploadsDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    title={material.label}
                  >
                    <span className="text-lg">{material.icon}</span>
                    <span className="text-[10px]">{material.label}</span>
                  </button>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Sidebar Generate button */}
        {features.showRefinementPrompt && (
          <button
            type="button"
            disabled={uiState.generationDisabled}
            onClick={handleFabricSwap}
            className={`generateButtonShine w-full px-4 py-3 rounded-xl font-extrabold tracking-wide text-base transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-500/40 border ${
              uiState.generationDisabled
                ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20'
                : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95 border-purple-500/40 hover:border-purple-400/60'
            }`}
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {isProcessing ? (
              t('processing')
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-pulse">✨</span>
                <span>
                  {t('generateOne')}
                </span>
              </span>
            )}
          </button>
        )}

        {/* Model/Template Gallery */}
        {features.showTemplateUpload && (
          <div>
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              {t('modelTemplateLabel')}
              {isLoadingProduct && (
                <span className="ml-2 text-[10px] text-purple-400 animate-pulse">{t('loading')}</span>
              )}
            </div>
            <div className={uiState.uploadsDisabled ? 'opacity-50' : ''}>
              <TemplateSelectorView
                onSelect={handleTemplateSelect}
                onTabChange={(tab: any) => {
                  // Update active tab immediately when user clicks tab button
                  setLastActiveTemplateTab(tab);
                  // eslint-disable-next-line no-console
                  console.log(`[DesignerSidebar] Tab switched to: ${tab}`);
                }}
                currentId={selectedTemplate?.id}
                shopItems={undefined}
                closetItems={undefined}
                enableUpload
                isSubscribed={isSubscribed || canAfford('premium_template')}
                onPremiumClick={() => openUpgradeModal('template_premium_click')}
                defaultTab="Closet"
                loadingTemplateId={isLoadingProduct ? 'loading-product' : loadingTemplateId}
              />
            </div>
          </div>
        )}

        {/* Privacy Shield Section */}
        <div className="pt-6 border-t border-zinc-800">
          <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">{t('privacyProtectionTitle')}</div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-zinc-300">{t('privacyModeLabel')}</label>
              <span className="text-[10px] text-purple-400">{t('localOnlyBadge')}</span>
            </div>
            <button
              onClick={() => {
                // eslint-disable-next-line no-console
                console.log('[Privacy Toggle] Current state:', isPrivacyMode, '→ New state:', !isPrivacyMode);
                setPrivacyMode(!isPrivacyMode);
              }}
              disabled={isProcessingTemplate || isProcessingFabric || isProcessingPrivacy}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                isPrivacyMode
                  ? 'bg-purple-500/40 border border-purple-500/60'
                  : 'bg-zinc-800 border border-zinc-700'
              } ${(isProcessingTemplate || isProcessingFabric || isProcessingPrivacy) ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  isPrivacyMode ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 p-3 bg-zinc-900/50 rounded border border-zinc-800 mb-4">
            {isPrivacyMode ? (
              <>
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-emerald-400">✓</span>
                  <span>{t('privacyMaskingEnabled')}</span>
                </div>
                <div className="text-[9px] text-zinc-500">
                  {t('privacyMaskingDescription')}
                </div>
              </>
            ) : (
              <span>{t('privacyMaskingPrompt')}</span>
            )}
          </div>

          {/* Masking Settings Collapsible */}
          {isPrivacyMode && (
            <details className="mb-4">
              <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {t('maskingModeSettings')}
              </summary>

              <div className="mt-3 p-3 bg-zinc-900/50 border-2 border-purple-500/30 rounded-lg space-y-3">
                {/* Masking Style Cards */}
                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">{t('maskingStyleLabel')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: 'feathered-blur', icon: '🎭', label: t('maskingStyleBlur') },
                      { value: 'pixelate', icon: '🔲', label: t('maskingStylePixelate') },
                      { value: 'emoji', icon: '😊', label: t('maskingStyleEmoji') },
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setMaskingStyle(style.value as any)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center justify-center ${
                          maskingStyle === style.value
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-purple-500/50'
                        }`}
                      >
                        <div className="text-2xl leading-none mb-1">{style.icon}</div>
                        <div className="text-[11px] font-semibold leading-tight">{style.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Blur Strength Slider */}
                {maskingStyle === 'feathered-blur' && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">{t('intensityLabel')}</label>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-zinc-400">{t('blurStrengthLabel')}</span>
                      <span className="text-xs text-purple-400">{blurStrength}px</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={blurStrength}
                      onChange={(e) => setBlurStrength(Number(e.target.value))}
                      className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-500"
                    />
                    <div className="flex justify-between text-[9px] text-zinc-500 mt-1">
                      <span>{t('lightLabel')}</span>
                      <span>{t('heavyLabel')}</span>
                    </div>
                  </div>
                )}

                {/* Emoji Selector */}
                {maskingStyle === 'emoji' && (
                  <div className="pt-2 border-t border-zinc-800">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">{t('chooseEmojiLabel')}</label>
                    <div className="grid grid-cols-6 gap-2">
                      {['😊', '😃', '🙂', '😄', '😁', '🥰', '😍', '🤗', '😌', '😎', '🤩', '😇'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => setSelectedEmoji(emoji)}
                          className={`p-2 text-2xl rounded-lg border transition-all ${
                            selectedEmoji === emoji
                              ? 'bg-purple-500/20 border-purple-500 scale-110'
                              : 'bg-zinc-900 border-zinc-700 hover:border-purple-500/50'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </details>
          )}
        </div>

        {(features.showModelSelection || features.showRefinementPrompt) && (
          <details className="pt-6 border-t border-zinc-800">
            <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t('advancedSettings')}
            </summary>
            <div className="mt-3 text-xs text-zinc-500">—</div>
          </details>
        )}

        {/* Output Quality Section */}
        {features.showOutputQuality && (
          <div className="pt-6 border-t border-zinc-800">
            <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">{t('outputQuality')}</div>

            {features.showUpscaleEngine && (
              <div className="mb-3">
                <div className="text-xs text-zinc-500 mb-1.5">{t('upscaleEngine')}</div>
                <div className={`relative ${uiState.allDisabled ? 'opacity-60' : ''}`}>
                  <select
                    value={upscaleEngine}
                    disabled={uiState.allDisabled}
                    onChange={(e) => setUpscaleEngine(e.target.value as 'standard' | 'creative')}
                    className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="standard">{t('upscaleStandard')}</option>
                    <option value="creative">{t('upscaleCreative')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {features.showOutputFit && (
              <div className="mb-1">
                <div className="text-xs text-zinc-500 mb-1.5">{t('outputFit')}</div>
                <div className={`relative ${uiState.inputsDisabled ? 'opacity-60' : ''}`}>
                  <select
                    value={outputFit}
                    disabled={uiState.inputsDisabled}
                    onChange={(e) => setOutputFit(e.target.value as 'contain' | 'cover')}
                    className="w-full appearance-none bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  >
                    <option value="contain">{t('fitContain')}</option>
                    <option value="cover">{t('fitCover')}</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {features.showUpscaleButton && uiState.showUpscaleButton && (
              <div className="mt-4 pt-4 border-t border-zinc-700">
                <button
                  onClick={handleUpscale}
                  disabled={uiState.upscaleDisabled}
                  className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    uiState.upscaleDisabled
                      ? 'bg-purple-500/30 text-purple-300 cursor-wait'
                      : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {isUpscaling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                      {t('upscalingInProgress', { percent: Math.round(upscaleProgress) })}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>
                        ✨ {t('upscaleResult')}
                        {creditsEnabled && upscaleCost > 0 ? ` (${upscaleCost})` : ''}
                      </span>
                    </span>
                  )}
                </button>
                <div className="text-xs text-zinc-500 text-center mt-2">
                  {t('upscaleDescription')}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Export Settings Section */}
        {features.showExportSettings && (
          <details className="pt-6 border-t border-zinc-800">
            <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              {t('exportSettings')}
            </summary>

            <div className="mt-3">
              {features.showWatermarkToggle && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-zinc-300">{t('addWatermark')}</label>
                      {!isSubscribed && <span className="text-[10px] text-purple-400">{t('freeMode')}</span>}
                      {isSubscribed && <span className="text-[10px] text-emerald-400">{t('proMode')}</span>}
                    </div>
                    <button
                      onClick={() => {
                        if (!isSubscribed) {
                          // Free users can only toggle ON (watermark always required)
                          if (!isWatermarkEnabled) {
                            openUpgradeModal('watermark_upgrade');
                            return;
                          }
                        } else {
                          // Pro users can toggle freely
                          setIsWatermarkEnabled(!isWatermarkEnabled);
                        }
                      }}
                      disabled={uiState.watermarkDisabled}
                      className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
                        isWatermarkEnabled
                          ? 'bg-purple-500/40 border border-purple-500/60'
                          : 'bg-zinc-800 border border-zinc-700'
                      } ${uiState.watermarkDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span
                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                          isWatermarkEnabled ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>

                  {isWatermarkEnabled && (
                    <div className="text-[10px] text-zinc-400 p-2 bg-zinc-900/50 rounded border border-zinc-800 mb-4">
                      {t('watermarkApplied')}
                    </div>
                  )}
                </>
              )}

              {features.showSubscriptionControls && uiState.showUpgradePrompt && (
                <button
                  onClick={() => {
                    // eslint-disable-next-line no-console
                    console.log('upgrade click', { context: 'watermark_upgrade', user: user?.uid || 'unknown' });
                    openUpgradeModal('watermark_upgrade_button');
                  }}
                  className="w-full mt-4 px-3 py-2 text-sm font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/30 rounded-lg hover:bg-purple-500/20 hover:border-purple-500/50 transition-all"
                >
                  {t('upgradeToPro')}
                </button>
              )}

              {features.showSubscriptionControls && uiState.showProFeatures && (
                <div className="w-full mt-4 px-3 py-2 text-sm font-semibold text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                  {t('proFeaturesUnlocked')}
                </div>
              )}
            </div>
          </details>
        )}
      </div>
    </aside>
  );
}

const APP_NAME = 'khuyoot-auth-diagnostic';
const APP_USER_CACHE_KEY = 'currentUser';

function getCachedCredits(uid: string): number | null {
  try {
    const raw = window.localStorage.getItem(`khuyoot:credits:lastBalance:${uid}`);
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.floor(n));
  } catch {
    return null;
  }
}

function getCachedUserName(uid: string): string | null {
  try {
    const raw = window.localStorage.getItem(APP_USER_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as any;
    if (!parsed || typeof parsed !== 'object') return null;
    if (String(parsed.id || '') !== uid) return null;
    const name = String(parsed.shopName || parsed.name || '').trim();
    return name ? name : null;
  } catch {
    return null;
  }
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString();
}

function getInitialPersistenceMode(): PersistenceMode {
  try {
    const params = new URLSearchParams(window.location.search || '');
    const mode = String(params.get('p') || 'local').toLowerCase();
    if (mode === 'local' || mode === 'session' || mode === 'memory') return mode;
  } catch {
    // ignore
  }
  return 'local';
}

function interestingUrl(url: string) {
  return (
    url.includes('identitytoolkit.googleapis.com') ||
    url.includes('securetoken.googleapis.com') ||
    url.includes('www.googleapis.com') ||
    url.includes('google.com/recaptcha') ||
    url.includes('gstatic.com/recaptcha') ||
    url.includes('recaptcha')
  );
}

async function deleteIndexedDb(name: string): Promise<{ name: string; status: string }> {
  if (!window.indexedDB) return { name, status: 'no-indexeddb' };
  return await new Promise((resolve) => {
    let resolved = false;
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => {
      if (resolved) return;
      resolved = true;
      resolve({ name, status: 'deleted' });
    };
    req.onerror = () => {
      if (resolved) return;
      resolved = true;
      resolve({ name, status: 'error' });
    };
    req.onblocked = () => {
      if (resolved) return;
      resolved = true;
      resolve({ name, status: 'blocked' });
    };

    window.setTimeout(() => {
      if (resolved) return;
      resolved = true;
      resolve({ name, status: 'timeout' });
    }, 4000);
  });
}

export function FirebaseAuthDiagnosticReactPage() {
  const { t } = useTranslation(['designer', 'common']);

  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [statusHtml, setStatusHtml] = React.useState<string>('Status: initializing…');
  const [authUserText, setAuthUserText] = React.useState<string>('(waiting)');

  const [email, setEmail] = React.useState('admin@test.com');
  const [password, setPassword] = React.useState('');

  const [mode, setMode] = React.useState<PersistenceMode>(() => getInitialPersistenceMode());
  const [isSignedIn, setIsSignedIn] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const [headerName, setHeaderName] = React.useState<string>('User');
  const [headerCredits, setHeaderCredits] = React.useState<number | null>(null);
  const [headerCreditsLoading, setHeaderCreditsLoading] = React.useState<boolean>(false);

  const [errorModal, setErrorModal] = React.useState<{ title: string; message: string } | null>(null);

  const signInSectionRef = React.useRef<HTMLDivElement | null>(null);
  const emailInputRef = React.useRef<HTMLInputElement | null>(null);

  // DesignerV2_1 sidebar (DEV-only): minimal local wiring so the ported markup can render safely.
  const templateInputRef = React.useRef<HTMLInputElement | null>(null);
  const fabricInputRef = React.useRef<HTMLInputElement | null>(null);
  const sourceObjectUrlRef = React.useRef<string | null>(null);
  const fabricObjectUrlRef = React.useRef<string | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = React.useState<string | null>(null);
  const [fabricPreviewUrl, setFabricPreviewUrl] = React.useState<string | null>(null);
  const [fabricMaterial, setFabricMaterial] = React.useState<string>('cotton');
  const [fabricTilingOpen, setFabricTilingOpen] = React.useState<boolean>(false);
  const [isPrivacyMode, setPrivacyMode] = React.useState<boolean>(true);
  const [maskingStyle, setMaskingStyle] = React.useState<string>('feathered-blur');
  const [blurStrength, setBlurStrength] = React.useState<number>(24);
  const [selectedEmoji, setSelectedEmoji] = React.useState<string>('😊');
  const [upscaleEngine, setUpscaleEngine] = React.useState<'standard' | 'creative'>('standard');
  const [outputFit, setOutputFit] = React.useState<'contain' | 'cover'>('contain');
  const [isWatermarkEnabled, setIsWatermarkEnabled] = React.useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = React.useState<any>(null);
  const [loadingTemplateId, setLoadingTemplateId] = React.useState<string | null>(null);
  const [lastActiveTemplateTab, setLastActiveTemplateTab] = React.useState<any>('Closet');
  const [isUpscaling, setIsUpscaling] = React.useState<boolean>(false);
  const [upscaleProgress, setUpscaleProgress] = React.useState<number>(0);

  React.useEffect(() => {
    return () => {
      try {
        if (sourceObjectUrlRef.current) URL.revokeObjectURL(sourceObjectUrlRef.current);
      } catch {
        // ignore
      }
      try {
        if (fabricObjectUrlRef.current) URL.revokeObjectURL(fabricObjectUrlRef.current);
      } catch {
        // ignore
      }
    };
  }, []);

  const openUserImagePrep = React.useCallback(
    (file: File) => {
      try {
        if (sourceObjectUrlRef.current) URL.revokeObjectURL(sourceObjectUrlRef.current);
      } catch {
        // ignore
      }
      const url = URL.createObjectURL(file);
      sourceObjectUrlRef.current = url;
      setSourcePreviewUrl(url);
    },
    [setSourcePreviewUrl]
  );

  const openFabricPrep = React.useCallback(
    (file: File) => {
      try {
        if (fabricObjectUrlRef.current) URL.revokeObjectURL(fabricObjectUrlRef.current);
      } catch {
        // ignore
      }
      const url = URL.createObjectURL(file);
      fabricObjectUrlRef.current = url;
      setFabricPreviewUrl(url);
    },
    [setFabricPreviewUrl]
  );

  const authRef = React.useRef<Auth | null>(null);
  const appRef = React.useRef<firebaseApp.FirebaseApp | null>(null);
  const dbRef = React.useRef<Firestore | null>(null);
  const unsubscribeRef = React.useRef<null | (() => void)>(null);
  const unsubscribeCreditsRef = React.useRef<null | (() => void)>(null);
  const originalFetchRef = React.useRef<typeof window.fetch | null>(null);
  const initRunIdRef = React.useRef(0);

  const addLog = React.useCallback((message: string, type: LogType = 'log') => {
    const entry: LogEntry = { ts: Date.now(), type, message };
    setLogs((prev) => [...prev, entry]);
    try {
      // Also mirror to console for easy copy/paste.
      // eslint-disable-next-line no-console
      console.log(message);
    } catch {
      // ignore
    }
  }, []);

  const copyLogs = React.useCallback(async () => {
    const text = logs
      .map((l) => `[${formatTime(l.ts)}] ${l.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
  }, [logs]);

  // DEV tool: keep the page isolated from app bootstrap, but allow an explicit user click to go home.
  const navigateHome = React.useCallback(() => {
    try {
      window.location.assign('/');
    } catch {
      // ignore
    }
  }, []);

  const focusSignIn = React.useCallback(() => {
    try {
      signInSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(() => {
        emailInputRef.current?.focus();
      }, 50);
    } catch {
      // ignore
    }
  }, []);

  const applyModeReload = React.useCallback((nextMode: PersistenceMode) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set('p', nextMode);
      window.location.assign(url.toString());
    } catch {
      // ignore
    }
  }, []);

  const instrumentFetch = React.useCallback(() => {
    if (!window.fetch) {
      addLog('⚠️ window.fetch is not available; cannot instrument network calls', 'warning');
      return () => undefined;
    }

    if (originalFetchRef.current) return () => undefined;

    const original = window.fetch.bind(window);
    originalFetchRef.current = original;

    window.fetch = async (input: any, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input?.url;
      const method = String(init?.method || (typeof input !== 'string' ? input?.method : 'GET') || 'GET').toUpperCase();
      const startedAt = performance.now();

      if (typeof url === 'string' && interestingUrl(url)) {
        addLog(`🌍 fetch ${method} ${url}`, 'log');
      }

      try {
        const res = await original(input, init);
        if (typeof url === 'string' && interestingUrl(url)) {
          const ms = Math.round(performance.now() - startedAt);
          addLog(`🌍 fetch DONE ${res.status} (${ms}ms) ${method} ${url}`, res.ok ? 'success' : 'warning');
        }
        return res;
      } catch (e: any) {
        if (typeof url === 'string' && interestingUrl(url)) {
          const ms = Math.round(performance.now() - startedAt);
          addLog(`🌍 fetch FAILED (${ms}ms) ${method} ${url} :: ${e?.message || e}`, 'error');
        }
        throw e;
      }
    };

    addLog('✅ Network instrumentation enabled (fetch logging for googleapis + recaptcha)', 'success');

    return () => {
      try {
        if (originalFetchRef.current) {
          window.fetch = originalFetchRef.current;
          originalFetchRef.current = null;
        }
      } catch {
        // ignore
      }
    };
  }, [addLog]);

  const initFirebase = React.useCallback(async () => {
    const runId = ++initRunIdRef.current;
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
    };

    addLog('🚀 Initializing Firebase (React diagnostic)…', 'log');

    setStatusHtml(
      `Status: <b>Initializing</b><small>Mode: <b>${mode}</b>. Waiting for Firebase Auth state…</small>`
    );

    const existing = firebaseApp.getApps().find((a) => a.name === APP_NAME);
    const app = existing ? firebaseApp.getApp(APP_NAME) : firebaseApp.initializeApp(firebaseConfig, APP_NAME);
    appRef.current = app;
    dbRef.current = getFirestore(app);

    const persistence =
      mode === 'memory' ? inMemoryPersistence : mode === 'session' ? browserSessionPersistence : browserLocalPersistence;

    let auth: Auth;
    try {
      auth = initializeAuth(app, { persistence: [persistence] });
      addLog(`✅ Firebase Auth instance created (${mode})`, 'success');
    } catch (e) {
      auth = getAuth(app);
      addLog('⚠️ initializeAuth failed; using getAuth fallback', 'warning');
      try {
        await setPersistence(auth, persistence);
      } catch {
        // ignore
      }
    }

    authRef.current = auth;

    addLog(`   Auth domain: ${firebaseConfig.authDomain}`, 'log');
    addLog(`   Project ID: ${firebaseConfig.projectId}`, 'log');
    addLog(`   API key prefix: ${String(firebaseConfig.apiKey || '').substring(0, 10)}...`, 'log');

    addLog('', 'log');
    addLog('📡 Test 1: Setting up auth state listener...', 'log');

    let authStateResolved = false;
    const watchdog = window.setTimeout(() => {
      if (initRunIdRef.current !== runId) return;
      if (authStateResolved) return;
      addLog(
        '⚠️ Auth state did not resolve within 4 seconds. This often means IndexedDB/persistence is blocked or hanging.',
        'warning'
      );
      setStatusHtml(
        `Status: <b>Stuck initializing</b><small>Auth state callback did not fire. If mode is <b>local</b>, try switching to <b>memory</b> and reloading.</small>`
      );
      if (mode === 'local') {
        addLog('💡 Tip: switch Persistence mode to "Memory" and reload to bypass IndexedDB.', 'warning');
      }
    }, 4000);

    if (unsubscribeRef.current) {
      try {
        unsubscribeRef.current();
      } catch {
        // ignore
      }
      unsubscribeRef.current = null;
    }

    if (unsubscribeCreditsRef.current) {
      try {
        unsubscribeCreditsRef.current();
      } catch {
        // ignore
      }
      unsubscribeCreditsRef.current = null;
    }

    unsubscribeRef.current = onAuthStateChanged(
      auth,
      (u) => {
        if (initRunIdRef.current !== runId) return;
        authStateResolved = true;
        window.clearTimeout(watchdog);

        if (u) {
          setIsSignedIn(true);
          setAuthUserText(`${u.email || '(no email)'} / ${u.uid}`);
          // Fast header hydration: use cached app user name if present.
          setHeaderName(getCachedUserName(u.uid) || u.displayName || u.email?.split('@')[0] || 'User');
          addLog(`✅ Auth state changed: User signed in (${u.email || '(no email)'})`, 'success');
          setStatusHtml(`Status: <b>Signed in</b> as <b>${u.email || '(no email)'}</b><small>UID: ${u.uid}</small>`);

          const db = dbRef.current;
          if (db) {
            // Fast credits hydration: show cached balance immediately while Firestore warms up.
            const cachedBal = getCachedCredits(u.uid);
            if (cachedBal != null) setHeaderCredits(cachedBal);

            // Fetch user doc (users/{uid}) for the actual name.
            void (async () => {
              try {
                const snap = await getDoc(doc(db, 'users', u.uid));
                if (initRunIdRef.current !== runId) return;
                if (!snap.exists()) return;
                const data: any = snap.data() || {};
                const resolvedName =
                  String(data.shopName || data.name || '').trim() || u.displayName || u.email?.split('@')[0] || 'User';
                setHeaderName(resolvedName);
              } catch (e: any) {
                if (initRunIdRef.current !== runId) return;
                addLog(`⚠️ Failed to load user profile (users/${u.uid}): ${e?.message || e}`, 'warning');
              }
            })();

            // Subscribe to credits (user_profiles/{uid}).
            setHeaderCreditsLoading(true);
            try {
              const profileRef = doc(db, 'user_profiles', u.uid);
              unsubscribeCreditsRef.current = onSnapshot(
                profileRef,
                (snap) => {
                  if (initRunIdRef.current !== runId) return;
                  if (!snap.exists()) {
                    setHeaderCredits(0);
                    setHeaderCreditsLoading(false);
                    return;
                  }
                  const data: any = snap.data() || {};
                  const bal = typeof data.credit_balance === 'number' ? data.credit_balance : 0;
                  const normalized = Math.max(0, Math.floor(bal));
                  setHeaderCredits(normalized);
                  try {
                    window.localStorage.setItem(`khuyoot:credits:lastBalance:${u.uid}`, String(normalized));
                  } catch {
                    // ignore
                  }
                  setHeaderCreditsLoading(false);
                },
                (err) => {
                  if (initRunIdRef.current !== runId) return;
                  addLog(`⚠️ Credits subscription error: ${err?.message || err}`, 'warning');
                  setHeaderCreditsLoading(false);
                }
              );
            } catch (e: any) {
              if (initRunIdRef.current !== runId) return;
              addLog(`⚠️ Failed to subscribe to credits: ${e?.message || e}`, 'warning');
              setHeaderCreditsLoading(false);
            }
          }
        } else {
          setIsSignedIn(false);
          setAuthUserText('(signed out)');
          setHeaderName('User');
          setHeaderCredits(null);
          setHeaderCreditsLoading(false);

          if (unsubscribeCreditsRef.current) {
            try {
              unsubscribeCreditsRef.current();
            } catch {
              // ignore
            }
            unsubscribeCreditsRef.current = null;
          }
          addLog('ℹ️ Auth state changed: No user signed in', 'warning');
          setStatusHtml('Status: <b>Signed out</b>');
        }
      },
      (err) => {
        if (initRunIdRef.current !== runId) return;
        authStateResolved = true;
        window.clearTimeout(watchdog);
        addLog(`❌ Auth state listener error: ${err?.message || err}`, 'error');
        setStatusHtml(`Status: <b>Error</b><small>${err?.message || String(err)}</small>`);
      }
    );

    addLog('', 'log');
    addLog('🌐 Test 2: Connectivity ping (CSP-safe)…', 'log');
    addLog('   Note: this app CSP blocks fetch to https://<project>.firebaseapp.com, so we ping googleapis endpoints instead.', 'log');

    const pingTargets = [
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
    ];

    for (const target of pingTargets) {
      try {
        await fetch(target, { mode: 'no-cors' });
        addLog(`✅ Network request to ${target} succeeded (or was blocked by CORS, which is expected)`, 'success');
      } catch (err: any) {
        addLog(`❌ Network request to ${target} failed: ${err?.message || err}`, 'error');
      }
    }

    addLog('', 'log');
    addLog('💾 Test 4: Checking IndexedDB (used by Firebase Auth for persistence)...', 'log');

    if (mode !== 'local') {
      addLog(`ℹ️ Skipping IndexedDB open test (mode is ${mode})`, 'warning');
    } else if (window.indexedDB) {
      addLog('✅ IndexedDB is available', 'success');
      addLog('⏳ Attempting to open firebaseLocalStorageDb...', 'log');

      await new Promise<void>((resolve) => {
        const req = indexedDB.open('firebaseLocalStorageDb');
        let done = false;

        const openWatchdog = window.setTimeout(() => {
          if (done) return;
          addLog(
            '⚠️ IndexedDB open is taking too long (3s). This can happen if another tab holds the DB open or the browser is blocking it.',
            'warning'
          );
          addLog('💡 Tip: Switch Persistence mode to "Memory" and reload to bypass IndexedDB.', 'warning');
        }, 3000);

        req.onsuccess = () => {
          done = true;
          window.clearTimeout(openWatchdog);
          addLog('✅ Firebase IndexedDB can be opened', 'success');
          try {
            req.result.close();
          } catch {
            // ignore
          }
          resolve();
        };

        req.onerror = () => {
          done = true;
          window.clearTimeout(openWatchdog);
          addLog('❌ Firebase IndexedDB error while opening', 'error');
          resolve();
        };

        req.onblocked = () => {
          done = true;
          window.clearTimeout(openWatchdog);
          addLog('❌ Firebase IndexedDB open was BLOCKED. Close other tabs and try again.', 'error');
          resolve();
        };
      });
    } else {
      addLog('❌ IndexedDB is NOT available (required for local persistence)', 'error');
    }

    addLog('', 'log');
    addLog('📦 Test 5: Checking localStorage...', 'log');
    try {
      localStorage.setItem('test', 'value');
      const value = localStorage.getItem('test');
      localStorage.removeItem('test');
      addLog(`✅ localStorage is working (${value === 'value' ? 'ok' : 'unexpected'})`, 'success');
    } catch (err: any) {
      addLog(`❌ localStorage error: ${err?.message || err}`, 'error');
    }
  }, [addLog, mode]);

  React.useEffect(() => {
    const unpatch = instrumentFetch();
    void initFirebase();

    return () => {
      try {
        if (unsubscribeRef.current) unsubscribeRef.current();
      } catch {
        // ignore
      }
      unsubscribeRef.current = null;

      try {
        unpatch();
      } catch {
        // ignore
      }
    };
  }, [initFirebase, instrumentFetch]);

  const directSignInFetch = React.useCallback(
    async (emailArg: string, passwordArg: string) => {
      const firebaseConfig = {
        apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      };

      const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 10000);
      const startedAt = performance.now();

      try {
        addLog(`⏱️ Direct fetch starting (10s timeout) :: ${endpoint}`, 'log');
        addLog(`   Email: ${emailArg || '(empty)'}`, 'log');
        addLog('   Password: [hidden]', 'log');

        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailArg, password: passwordArg, returnSecureToken: true }),
          signal: controller.signal,
        });

        const ms = Math.round(performance.now() - startedAt);
        const text = await res.text();

        if (res.ok) {
          addLog(`✅ Direct fetch SUCCESS (${ms}ms) status=${res.status}`, 'success');
          try {
            const json = JSON.parse(text);
            const uid = json?.localId;
            const hasIdToken = !!json?.idToken;
            addLog(`   Parsed response: uid=${uid || '(none)'} idToken=${hasIdToken ? '[present]' : '[missing]'}`, 'success');
          } catch {
            addLog('   Parsed response: [non-JSON body]', 'warning');
          }
        } else {
          addLog(`⚠️ Direct fetch returned error (${ms}ms) status=${res.status}`, 'warning');
          try {
            const json = JSON.parse(text);
            const message = json?.error?.message || '(no message)';
            addLog(`   error.message: ${message}`, 'warning');
          } catch {
            addLog(`   body: ${text.substring(0, 200)}${text.length > 200 ? '…' : ''}`, 'warning');
          }
        }
      } catch (e: any) {
        const ms = Math.round(performance.now() - startedAt);
        const msg = e?.name === 'AbortError' ? 'aborted (timeout)' : e?.message || String(e);
        addLog(`❌ Direct fetch FAILED (${ms}ms): ${msg}`, 'error');
      } finally {
        window.clearTimeout(timeoutId);
      }
    },
    [addLog]
  );

  const signIn = React.useCallback(async () => {
    const auth = authRef.current;
    if (!auth) {
      addLog('❌ Sign-in FAILED: Firebase Auth is not initialized', 'error');
      setErrorModal({
        title: 'فشل تسجيل الدخول',
        message: 'Firebase Auth غير مهيأ. تحقق من Console ثم أعد تحميل الصفحة.',
      });
      return;
    }

    if (!email || !password) {
      addLog('❌ Sign-in FAILED: Email or password missing', 'error');
      return;
    }

    if (auth.currentUser?.email && auth.currentUser.email === email) {
      addLog(`ℹ️ Already signed in as ${auth.currentUser.email} — nothing to do`, 'warning');
      return;
    }

    setBusy(true);
    try {
      addLog('', 'log');
      addLog('🔐 Test 3: Attempting sign-in with timeout...', 'log');
      addLog(`   Email: ${email}`, 'log');
      addLog('   Password: [hidden]', 'log');
      addLog('   Timeout: 10 seconds', 'log');

      // Parallel REST request to distinguish SDK hang vs network/creds.
      void directSignInFetch(email, password);

      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('Sign-in timeout after 10 seconds')), 10000);
      });

      const signInPromise = signInWithEmailAndPassword(auth, email, password);
      const result = await Promise.race([signInPromise, timeoutPromise]);

      addLog(`✅ Sign-in SUCCESS! User: ${result.user.email || '(no email)'}`, 'success');
      addLog(`   UID: ${result.user.uid}`, 'success');

      // Update UI immediately (don't wait for onAuthStateChanged).
      setIsSignedIn(true);
      setAuthUserText(`${result.user.email || '(no email)'} / ${result.user.uid}`);
      setStatusHtml(
        `Status: <b>Signed in</b> as <b>${result.user.email || '(no email)'}</b><small>UID: ${result.user.uid}</small>`
      );

      // Avoid dumping tokens in logs. Just verify it exists.
      const token = await result.user.getIdToken();
      addLog(`✅ ID Token obtained: ${token ? '[present]' : '[missing]'}`, 'success');
    } catch (err: any) {
      addLog(`❌ Sign-in FAILED: ${err?.message || err}`, 'error');
      setErrorModal({
        title: 'فشل تسجيل الدخول',
        message: err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول.',
      });
    } finally {
      setBusy(false);
    }
  }, [addLog, directSignInFetch, email, password]);

  const signOutNow = React.useCallback(async () => {
    const auth = authRef.current;
    if (!auth) {
      addLog('⚠️ Auth not initialized; cannot sign out', 'warning');
      return;
    }
    setBusy(true);
    try {
      await signOut(auth);
      addLog('✅ Signed out', 'success');
    } catch (err: any) {
      addLog(`❌ Sign-out FAILED: ${err?.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [addLog]);

  const clearSession = React.useCallback(async () => {
    setBusy(true);
    try {
      const auth = authRef.current;
      try {
        if (auth) await signOut(auth);
      } catch {
        // ignore
      }

      // Mirrors the standalone HTML behavior (aggressive). This is DEV-only.
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }

      if (mode !== 'local') {
        addLog(`✅ Clear session complete (mode=${mode}). Skipped IndexedDB deletes.`, 'success');
        addLog('ℹ️ Reloading page...', 'log');
        window.location.reload();
        return;
      }

      const dbNames = ['firebaseLocalStorageDb', 'firebase-installations-database', 'firebase-heartbeat-database'];
      const results: Array<{ name: string; status: string }> = [];
      for (const name of dbNames) {
        results.push(await deleteIndexedDb(name));
      }

      const blocked = results.filter((r) => r.status === 'blocked');
      const summary = results.map((r) => `${r.name}:${r.status}`).join(', ');
      addLog(`✅ Clear session complete. IndexedDB results: ${summary}`, 'success');

      if (blocked.length > 0) {
        addLog('⚠️ Some IndexedDB deletes were BLOCKED (another tab may be open). Close other tabs then try again.', 'warning');
        setErrorModal({
          title: 'تعذر تنظيف الجلسة بالكامل',
          message:
            'حذف قاعدة بيانات IndexedDB كان BLOCKED (غالباً توجد صفحة أخرى مفتوحة على نفس الموقع). أغلق أي تبويب آخر ثم جرّب مرة أخرى.',
        });
        return;
      }

      addLog('ℹ️ Reloading page...', 'log');
      window.location.reload();
    } catch (err: any) {
      addLog(`❌ Clear session FAILED: ${err?.message || err}`, 'error');
    } finally {
      setBusy(false);
    }
  }, [addLog, mode]);

  const features = React.useMemo(
    () => ({
      showFabricUpload: true,
      showRefinementPrompt: true,
      showTemplateUpload: true,
      showModelSelection: true,
      showOutputQuality: true,
      showUpscaleEngine: true,
      showOutputFit: true,
      showUpscaleButton: true,
      showExportSettings: true,
      showWatermarkToggle: true,
      showSubscriptionControls: true,
    }),
    []
  );

  const uiState = React.useMemo(
    () => ({
      uploadsDisabled: busy,
      generationDisabled: busy,
      allDisabled: busy,
      inputsDisabled: busy,
      showUpscaleButton: true,
      upscaleDisabled: busy || isUpscaling,
      watermarkDisabled: busy,
      showUpgradePrompt: false,
      showProFeatures: false,
    }),
    [busy, isUpscaling]
  );

  const creditsEnabled = true;
  const generationCost = 1;
  const upscaleCost = 1;

  const canAfford = React.useCallback(
    (_kind: string) => {
      // Keep the sidebar interactive in the diagnostic route.
      return true;
    },
    []
  );

  const openUpgradeModal = React.useCallback(
    (context?: string) => {
      addLog(`ℹ️ Upgrade modal requested (${context || 'n/a'})`, 'log');
    },
    [addLog]
  );

  const handleTemplateSelect = React.useCallback(
    (tpl: any) => {
      setSelectedTemplate(tpl);
      setLoadingTemplateId(String(tpl?.id || ''));
      window.setTimeout(() => setLoadingTemplateId(null), 400);
    },
    []
  );

  const handleFabricSwap = React.useCallback(() => {
    addLog('✨ Sidebar Generate clicked (no-op in diagnostic route)', 'log');
  }, [addLog]);

  const handleUpscale = React.useCallback(() => {
    if (isUpscaling) return;
    setIsUpscaling(true);
    setUpscaleProgress(0);
    const start = Date.now();
    const tick = () => {
      const p = Math.min(100, ((Date.now() - start) / 900) * 100);
      setUpscaleProgress(p);
      if (p >= 100) {
        setIsUpscaling(false);
        return;
      }
      window.setTimeout(tick, 50);
    };
    tick();
  }, [isUpscaling]);

  const isSubscribed = false;
  const isProcessing = false;
  const isProcessingTemplate = false;
  const isProcessingFabric = false;
  const isProcessingPrivacy = false;
  const isLoadingProduct = false;

  const user = React.useMemo(
    () => ({ uid: authRef.current?.currentUser?.uid || null }),
    [isSignedIn]
  );

  const sidebarHasVisibleContent = true;

  const designerSidebarCtx = React.useMemo(
    () => ({
      t,
      features,
      sidebarHasVisibleContent,
      uiState,
      templateInputRef,
      fabricInputRef,
      sourcePreviewUrl,
      fabricPreviewUrl,
      openUserImagePrep,
      openFabricPrep,
      setFabricTilingOpen,
      setFabricMaterial,
      fabricMaterial,
      handleFabricSwap,
      isProcessing,
      creditsEnabled,
      generationCost,
      handleTemplateSelect,
      setLastActiveTemplateTab,
      selectedTemplate,
      isLoadingProduct,
      loadingTemplateId,
      isSubscribed,
      canAfford,
      openUpgradeModal,
      isPrivacyMode,
      setPrivacyMode,
      isProcessingTemplate,
      isProcessingFabric,
      isProcessingPrivacy,
      maskingStyle,
      setMaskingStyle,
      blurStrength,
      setBlurStrength,
      selectedEmoji,
      setSelectedEmoji,
      upscaleEngine,
      setUpscaleEngine,
      outputFit,
      setOutputFit,
      handleUpscale,
      isUpscaling,
      upscaleProgress,
      upscaleCost,
      isWatermarkEnabled,
      setIsWatermarkEnabled,
      user,
      // Unused in diagnostic port but expected by markup/props patterns
      fabricTilingOpen,
      lastActiveTemplateTab,
    }),
    [
      t,
      features,
      sidebarHasVisibleContent,
      uiState,
      sourcePreviewUrl,
      fabricPreviewUrl,
      openUserImagePrep,
      openFabricPrep,
      fabricMaterial,
      handleFabricSwap,
      creditsEnabled,
      generationCost,
      handleTemplateSelect,
      selectedTemplate,
      isSubscribed,
      canAfford,
      openUpgradeModal,
      isPrivacyMode,
      isProcessingTemplate,
      isProcessingFabric,
      isProcessingPrivacy,
      maskingStyle,
      blurStrength,
      selectedEmoji,
      upscaleEngine,
      outputFit,
      handleUpscale,
      isUpscaling,
      upscaleProgress,
      upscaleCost,
      isWatermarkEnabled,
      user,
      fabricTilingOpen,
      lastActiveTemplateTab,
    ]
  );

  return (
    <div className="flex min-h-[100dvh] flex-col bg-zinc-950 text-zinc-200">
      <DesignerHeader
        onHome={navigateHome}
        title="Firebase Auth Diagnostic"
        rightSlot={
          <div className="flex items-center gap-3">
            {/* Credits (real, from user_profiles/{uid}) */}
            <div className="h-8 px-3 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-bold text-zinc-200 inline-flex items-center tabular-nums">
              {isSignedIn ? (
                <span className={typeof headerCredits === 'number' ? '' : 'text-zinc-400'}>
                  Credits: {typeof headerCredits === 'number' ? headerCredits : '—'}
                  {headerCreditsLoading && <span className="text-zinc-500"> …</span>}
                </span>
              ) : (
                <span className="text-zinc-500">Credits: —</span>
              )}
            </div>

            {/* Keep the Designer trash icon as a non-functional visual element */}
            <button
              type="button"
              disabled
              className="p-2 rounded-lg border transition-colors bg-zinc-900/40 border-zinc-800 text-zinc-600 cursor-not-allowed"
              title={t('clearComparison')}
              aria-label={t('clearComparison')}
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Header login (wired to diagnostic auth state) */}
            {isSignedIn ? (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-lg border border-zinc-800 text-zinc-200"
                  title={authUserText}
                >
                  <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-200">
                    <User className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold truncate max-w-[160px]">{headerName || 'User'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => void signOutNow()}
                  disabled={busy}
                  className="h-8 px-3 rounded-full border border-zinc-700 bg-zinc-900 text-xs font-extrabold text-zinc-200 hover:bg-zinc-800 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  aria-label="Sign out"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={focusSignIn}
                disabled={busy}
                className="h-8 px-3 rounded-full border border-blue-600/60 bg-blue-600/15 text-xs font-extrabold text-blue-100 hover:bg-blue-600/25 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                aria-label="Sign in"
                title="Sign in"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign in</span>
              </button>
            )}
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        <DesignerV2_1LeftSidebar ctx={designerSidebarCtx} />

        <main className="flex-1 overflow-y-auto min-w-0">
          <div id="diag-top" className="mx-auto w-full max-w-5xl px-4 py-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold">🔥 Firebase Auth Connectivity Diagnostic (React)</div>
                <div className="text-sm text-zinc-400">
                  This is a React port of <span className="font-mono">firebase-auth-diagnostic.html</span> with the Designer header.
                </div>
                <div className="mt-1 text-xs text-zinc-500">Auth state: {authUserText}</div>
              </div>

              <button
                type="button"
                onClick={() => void copyLogs()}
                className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-50"
                disabled={busy}
              >
                📋 Copy Logs
              </button>
            </div>

            <div id="diag-sign-in" ref={signInSectionRef} className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={emailInputRef}
              className="h-10 w-[260px] rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-sm text-zinc-200"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={busy || isSignedIn}
            />
            <input
              className="h-10 w-[260px] rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-sm text-zinc-200"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              disabled={busy || isSignedIn}
            />

            <button
              type="button"
              onClick={() => void signIn()}
              disabled={busy || isSignedIn}
              className="h-10 px-4 rounded-lg bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 disabled:opacity-50"
            >
              🔐 Sign In
            </button>

            <button
              type="button"
              onClick={() => void signOutNow()}
              disabled={busy || !isSignedIn}
              className="h-10 px-4 rounded-lg bg-zinc-800 text-zinc-100 text-sm font-bold hover:bg-zinc-700 disabled:opacity-50"
            >
              🚪 Sign Out
            </button>

            <button
              type="button"
              onClick={() => void clearSession()}
              disabled={busy}
              className="h-10 px-4 rounded-lg bg-amber-600 text-black text-sm font-extrabold hover:bg-amber-500 disabled:opacity-50"
            >
              🧽 Clear Session
            </button>

            <select
              className="h-10 rounded-lg bg-zinc-900 border border-zinc-700 px-3 text-sm text-zinc-200"
              value={mode}
              onChange={(e) => setMode(e.target.value as PersistenceMode)}
              disabled={busy}
              aria-label="Persistence mode"
            >
              <option value="local">Local (IndexedDB)</option>
              <option value="session">Session (sessionStorage)</option>
              <option value="memory">Memory (no persistence)</option>
            </select>

            <button
              type="button"
              onClick={() => applyModeReload(mode)}
              disabled={busy}
              className="h-10 px-4 rounded-lg bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
            >
              ⚙️ Apply Mode (reload)
            </button>
          </div>
        </div>

            <div
              id="diag-status"
          className="rounded-xl border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-sm text-zinc-200"
          dangerouslySetInnerHTML={{ __html: statusHtml }}
        />

            <div id="diag-logs" className="rounded-xl border border-zinc-800 bg-black/40 overflow-hidden">
          <div className="px-3 py-2 border-b border-zinc-800 text-xs text-zinc-400">Logs</div>
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3 space-y-1">
            {logs.map((l, idx) => {
              const color =
                l.type === 'error'
                  ? 'border-red-500 text-red-200'
                  : l.type === 'warning'
                    ? 'border-amber-400 text-amber-100'
                    : l.type === 'success'
                      ? 'border-emerald-500 text-emerald-200'
                      : 'border-zinc-500 text-zinc-200';
              return (
                <div key={idx} className={`border-l-4 ${color} bg-zinc-950/40 px-3 py-1 rounded`}> 
                  <span className="text-zinc-500">[{formatTime(l.ts)}]</span> {l.message}
                </div>
              );
            })}
          </div>
        </div>
          </div>
        </main>
      </div>

      {errorModal ? (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-700 bg-zinc-950 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="text-sm font-extrabold text-red-200">{errorModal.title}</div>
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="px-2 py-1 rounded bg-red-400 text-black font-bold"
              >
                ✕
              </button>
            </div>
            <div className="px-4 py-4 text-sm text-red-100 whitespace-pre-wrap leading-relaxed">{errorModal.message}</div>
            <div className="px-4 py-3 border-t border-zinc-800 flex justify-end">
              <button
                type="button"
                onClick={() => setErrorModal(null)}
                className="px-4 py-2 rounded-lg bg-red-400 text-black font-extrabold"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
