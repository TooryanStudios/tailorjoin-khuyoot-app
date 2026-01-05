import * as React from 'react';

export type MaskingStyle = 'feathered-blur' | 'pixelate' | 'emoji';

export type PrivacyProtectionProps = {
  isPrivacyMode: boolean;
  setPrivacyMode: (next: boolean) => void;
  maskingStyle: MaskingStyle;
  setMaskingStyle: (next: MaskingStyle) => void;
  blurStrength: number;
  setBlurStrength: (next: number) => void;
  selectedEmoji: string;
  setSelectedEmoji: (next: string) => void;
  isProcessingPrivacy: boolean;
  canApplyToCurrentTemplate: boolean;
  onApplyToCurrentTemplate: () => void;
  disabled?: boolean;
};

export const PrivacyProtection = React.memo(function PrivacyProtection(props: PrivacyProtectionProps) {
  const {
    isPrivacyMode,
    setPrivacyMode,
    maskingStyle,
    setMaskingStyle,
    blurStrength,
    setBlurStrength,
    selectedEmoji,
    setSelectedEmoji,
    isProcessingPrivacy,
    canApplyToCurrentTemplate,
    onApplyToCurrentTemplate,
    disabled,
  } = props;

  const controlsDisabled = Boolean(disabled) || Boolean(isProcessingPrivacy);

  return (
    <div className={controlsDisabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className="pt-6 border-t border-zinc-800">
        <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">Privacy Protection</div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-zinc-300">Privacy Mode</label>
            <span className="text-[10px] text-purple-400">🛡️ Local Only</span>
          </div>
          <button
            type="button"
            onClick={() => setPrivacyMode(!isPrivacyMode)}
            disabled={controlsDisabled}
            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
              isPrivacyMode
                ? 'bg-purple-500/40 border border-purple-500/60'
                : 'bg-zinc-800 border border-zinc-700'
            } ${controlsDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
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
                <span>
                  Faces will be automatically blurred <strong>locally</strong> before upload
                </span>
              </div>
              <div className="text-[9px] text-zinc-500">
                Processing happens on your device. Original unblurred images never leave your computer.
              </div>
            </>
          ) : (
            <span>Enable to automatically blur faces in uploaded images for privacy protection</span>
          )}
        </div>

        {isPrivacyMode && (
          <details className="mb-4">
            <summary className="cursor-pointer select-none text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Masking Style & Settings
            </summary>

            <div className="mt-3 p-3 bg-zinc-900/50 border-2 border-purple-500/30 rounded-lg space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Style</label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'feathered-blur' as const, icon: '🎭', label: 'Blur' },
                    { value: 'pixelate' as const, icon: '🔲', label: 'Pixelation' },
                    { value: 'emoji' as const, icon: '😊', label: 'Emoji' },
                  ].map((style) => (
                    <button
                      key={style.value}
                      type="button"
                      onClick={() => setMaskingStyle(style.value)}
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

              {maskingStyle === 'feathered-blur' && (
                <div className="pt-2 border-t border-zinc-800">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Intensity</label>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-zinc-400">Blur Strength</span>
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
                    <span>Light</span>
                    <span>Heavy</span>
                  </div>
                </div>
              )}

              {maskingStyle === 'emoji' && (
                <div className="pt-2 border-t border-zinc-800">
                  <label className="text-[10px] text-zinc-500 uppercase tracking-wider mb-2 block">Choose Emoji</label>
                  <div className="grid grid-cols-6 gap-2">
                    {['😊', '😃', '🙂', '😄', '😁', '🥰', '😍', '🤗', '😌', '😎', '🤩', '😇'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
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

        {isPrivacyMode && canApplyToCurrentTemplate && (
          <button
            type="button"
            onClick={onApplyToCurrentTemplate}
            disabled={isProcessingPrivacy}
            className={`w-full px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              isProcessingPrivacy
                ? 'bg-purple-500/30 text-purple-300 cursor-wait'
                : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95'
            }`}
          >
            {isProcessingPrivacy ? (
              <span className="flex items-center justify-center gap-2">
                <span className="inline-block w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                Applying...
              </span>
            ) : (
              '🛡️ Apply Privacy Shield'
            )}
          </button>
        )}
      </div>
    </div>
  );
});
