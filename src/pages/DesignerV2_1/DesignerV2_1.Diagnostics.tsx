import React from 'react';

import { Modal } from '../../../components/Modal';
import UpgradeModal from '../../components/DesignerV2_1/UpgradeModal';
import { ImagePrepModal } from '../../components/image/ImagePrepModal';
import { usePrivacyShield } from '../../modules/PrivacyShield';

type Toggles = {
  mountPrivacyShieldProbe: boolean;
  enablePrivacyShieldInProbe: boolean;
  showBaseModal: boolean;
  showUpgradeModal: boolean;
  mountImagePrepModal: boolean;
  openImagePrepModal: boolean;
};

const DEFAULT_TOGGLES: Toggles = {
  mountPrivacyShieldProbe: false,
  enablePrivacyShieldInProbe: true,
  showBaseModal: false,
  showUpgradeModal: false,
  mountImagePrepModal: false,
  openImagePrepModal: false,
};

const ToggleRow = React.memo(function ToggleRow(props: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  const { label, description, checked, onChange } = props;
  return (
    <label className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 px-3 py-2">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="flex-1">
        <div className="text-sm font-semibold text-slate-900 dark:text-white">{label}</div>
        {description ? (
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-snug">{description}</div>
        ) : null}
      </span>
    </label>
  );
});

const PrivacyShieldProbe = React.memo(function PrivacyShieldProbe(props: { enabled: boolean }) {
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
  } = usePrivacyShield();

  React.useEffect(() => {
    console.count('[Diag] PrivacyShieldProbe render');
  });

  React.useEffect(() => {
    setPrivacyMode(props.enabled);
  }, [props.enabled, setPrivacyMode]);

  return (
    <div className="rounded-2xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-950/20 px-3 py-3">
      <div className="text-sm font-bold text-amber-900 dark:text-amber-200">PrivacyShield probe</div>
      <div className="mt-1 text-xs text-amber-900/80 dark:text-amber-200/80">
        Mounting this is the fastest way to reproduce hook/WASM-related issues.
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-white/70 dark:bg-slate-900/50 px-2 py-1.5">
          <div className="font-semibold">Enabled</div>
          <div>{String(isPrivacyMode)}</div>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-slate-900/50 px-2 py-1.5">
          <div className="font-semibold">Processing</div>
          <div>{String(isProcessingPrivacy)}</div>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs text-slate-700 dark:text-slate-200">
          Style
          <select
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
            value={maskingStyle}
            onChange={(e) => setMaskingStyle(e.target.value as any)}
          >
            <option value="feathered-blur">feathered-blur</option>
            <option value="pixelate">pixelate</option>
            <option value="emoji">emoji</option>
          </select>
        </label>

        <label className="text-xs text-slate-700 dark:text-slate-200">
          Blur
          <input
            type="range"
            min={5}
            max={80}
            value={blurStrength}
            onChange={(e) => setBlurStrength(Number(e.target.value))}
            className="mt-2 w-full"
          />
        </label>

        <label className="text-xs text-slate-700 dark:text-slate-200 col-span-2">
          Emoji
          <input
            type="text"
            value={selectedEmoji}
            onChange={(e) => setSelectedEmoji(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1"
          />
        </label>
      </div>
    </div>
  );
});

export function DesignerV2_1_DiagnosticHarness() {
  const [toggles, setToggles] = React.useState<Toggles>(DEFAULT_TOGGLES);

  const [imageFile, setImageFile] = React.useState<File | null>(null);

  const setToggle = React.useCallback(<K extends keyof Toggles>(key: K, value: Toggles[K]) => {
    setToggles((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetAll = React.useCallback(() => {
    setToggles(DEFAULT_TOGGLES);
    setImageFile(null);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-slate-50 dark:bg-slate-950 px-4 py-4">
      <div className="mx-auto w-full max-w-xl space-y-3">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="text-sm font-black text-slate-900 dark:text-white">DesignerV2_1 UI Diagnostics</div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            This mode disables the Designer page and lets you enable UI elements one-by-one. Use URL: <span className="font-mono">/designer-v2-1?uiDiag=1</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={resetAll}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            >
              Reset (zero ground)
            </button>
          </div>
        </div>

        <div className="grid gap-2">
          <ToggleRow
            label="1) Open base Modal (portal)"
            description="Tests the shared Modal overlay + portal + body scroll locking."
            checked={toggles.showBaseModal}
            onChange={(v) => setToggle('showBaseModal', v)}
          />

          <ToggleRow
            label="2) Open UpgradeModal (fixed overlay)"
            description="Tests a non-portal fixed overlay. Useful to detect stacking-context issues."
            checked={toggles.showUpgradeModal}
            onChange={(v) => setToggle('showUpgradeModal', v)}
          />

          <ToggleRow
            label="3) Mount PrivacyShield probe"
            description="Mounts usePrivacyShield (MediaPipe) without any other UI. If the app breaks here, the issue is in privacy shield / WASM init."
            checked={toggles.mountPrivacyShieldProbe}
            onChange={(v) => setToggle('mountPrivacyShieldProbe', v)}
          />

          <ToggleRow
            label="   Enable PrivacyShield inside probe"
            description="When enabled, the hook will initialize the detector. Turn off to check if init is the trigger."
            checked={toggles.enablePrivacyShieldInProbe}
            onChange={(v) => setToggle('enablePrivacyShieldInProbe', v)}
          />

          <ToggleRow
            label="4) Mount ImagePrepModal (crop+privacy)"
            description="Mounts the full ImagePrepModal component. Use this after steps 1-3."
            checked={toggles.mountImagePrepModal}
            onChange={(v) => setToggle('mountImagePrepModal', v)}
          />

          <ToggleRow
            label="   Open ImagePrepModal"
            description="Requires a selected image file first."
            checked={toggles.openImagePrepModal}
            onChange={(v) => setToggle('openImagePrepModal', v)}
          />
        </div>

        {toggles.mountPrivacyShieldProbe ? (
          <PrivacyShieldProbe enabled={toggles.enablePrivacyShieldInProbe} />
        ) : null}

        {toggles.mountImagePrepModal ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3">
            <div className="text-sm font-bold text-slate-900 dark:text-white">ImagePrepModal test</div>
            <div className="mt-2">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setImageFile(f);
                  if (!f) setToggle('openImagePrepModal', false);
                }}
              />
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
              Selected: {imageFile ? `${imageFile.name} (${Math.round(imageFile.size / 1024)} KB)` : 'none'}
            </div>
          </div>
        ) : null}

        <Modal
          isOpen={toggles.showBaseModal}
          onClose={() => setToggle('showBaseModal', false)}
          title="Base Modal Test"
          showFooter
          debugId="diag-base-modal"
        >
          <div className="text-sm text-slate-700 dark:text-slate-200">
            If this renders reliably, the portal + z-index base is OK.
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Try scrolling behind it and check if body scroll locking behaves.
          </div>
        </Modal>

        <UpgradeModal
          isOpen={toggles.showUpgradeModal}
          onClose={() => setToggle('showUpgradeModal', false)}
          onUpgradeClick={() => Promise.resolve()}
        />

        {toggles.mountImagePrepModal ? (
          <ImagePrepModal
            mode="template"
            isOpen={toggles.openImagePrepModal}
            file={imageFile}
            onCancel={() => setToggle('openImagePrepModal', false)}
            onApply={async () => {
              setToggle('openImagePrepModal', false);
            }}
            onReplaceFile={(next) => setImageFile(next)}
          />
        ) : null}
      </div>
    </div>
  );
}
