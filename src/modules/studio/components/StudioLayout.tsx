import * as React from 'react';
import styles from '../styles/layout.module.css';
import { StudioSheet } from './StudioSheet';

export type StudioLayoutProps = {
  credits?: React.ReactNode;
  preview: React.ReactNode;
  lighting?: React.ReactNode;
  history?: React.ReactNode;
  panel: React.ReactNode;
  className?: string;
  panelClassName?: string;
  /** Optional extra top padding for the scrollable panel to account for fixed headers. */
  panelTopPaddingClassName?: string;
  templateThumbUrl?: string;
  fabricThumbUrl?: string;
  /** Generate button action */
  generateAction?: {
    canGenerate: boolean;
    isProcessing: boolean;
    cost?: number;
    onGenerate: () => void;
  };
};

/**
 * StudioLayout implements a layered architecture for the customization experience.
 * Background: Fixed stack (Credits -> Preview -> Lighting -> History)
 * Foreground: Draggable selection sheet with Glassmorphic aesthetic
 */
export const StudioLayout: React.FC<StudioLayoutProps> = ({
  credits,
  preview,
  lighting,
  history,
  panel,
  className,
  panelClassName,
  panelTopPaddingClassName,
  templateThumbUrl,
  fabricThumbUrl,
  generateAction,
}) => {
  return (
    <div className={[styles.container, className].filter(Boolean).join(' ')}>
      {/* Scrollable Background Layer */}
      <div className={styles.scrollableBackground}>
        {/* Credits at the very top */}
        {credits && (
          <div className={styles.creditsWrapper}>
            {credits}
          </div>
        )}
        
        {/* Preview Canvas */}
        {preview && (
          <div className={styles.previewWrapper}>
            {preview}
          </div>
        )}

        {/* Generate Button */}
        {generateAction && (
          <div className="px-4 py-1">
            <div className="flex items-stretch gap-1.5">
              <button
                type="button"
                aria-label="Template"
                onClick={() => {
                  try {
                    window.dispatchEvent(new CustomEvent('khuyoot:studio-sheet-expand'));
                    window.dispatchEvent(new CustomEvent('khuyoot:studio-open-tab', { detail: 'templates' }));
                  } catch {
                    // ignore
                  }
                }}
                className="h-12 w-12 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 text-white shadow-lg shadow-black/20 transition-all active:scale-[0.98] overflow-hidden hover:bg-zinc-800 hover:border-zinc-700"
              >
                {templateThumbUrl ? (
                  <img
                    src={templateThumbUrl}
                    alt="Selected template"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      className="text-zinc-500"
                    >
                      <path
                        d="M9 3l-1 4-3 2 3 5v7h8v-7l3-5-3-2-1-4"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <path
                        d="M9 3c1.2 1 2.4 1.5 3 1.5S13.8 4 15 3"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                )}
              </button>

              <button
                type="button"
                aria-label="Fabric"
                onClick={() => {
                  try {
                    window.dispatchEvent(new CustomEvent('khuyoot:studio-sheet-expand'));
                    window.dispatchEvent(new CustomEvent('khuyoot:studio-open-tab', { detail: 'fabric' }));
                  } catch {
                    // ignore
                  }
                }}
                className="h-12 w-12 shrink-0 rounded-xl bg-zinc-900 border border-zinc-800 text-white shadow-lg shadow-black/20 transition-all active:scale-[0.98] overflow-hidden hover:bg-zinc-800 hover:border-zinc-700"
              >
                {fabricThumbUrl ? (
                  <img
                    src={fabricThumbUrl}
                    alt="Selected fabric"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                  />
                ) : (
                  <div className="h-full w-full">
                    <div className="h-full w-full bg-[linear-gradient(45deg,theme(colors.zinc.800)_25%,theme(colors.zinc.900)_25%,theme(colors.zinc.900)_50%,theme(colors.zinc.800)_50%,theme(colors.zinc.800)_75%,theme(colors.zinc.900)_75%,theme(colors.zinc.900)_100%)] bg-[length:12px_12px]" />
                  </div>
                )}
              </button>

              <button
                type="button"
                disabled={!generateAction.canGenerate || generateAction.isProcessing}
                onClick={generateAction.onGenerate}
                className={
                  'flex-1 py-3 rounded-xl font-extrabold shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-widest text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40 border ' +
                  (!generateAction.canGenerate || generateAction.isProcessing
                    ? 'bg-purple-600/60 text-white cursor-not-allowed border-purple-500/20 opacity-50'
                    : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-[0.98] border-purple-500/40 hover:border-purple-400/60')
                }
              >
                {generateAction.isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التنفيذ...
                  </>
                ) : (
                  `توليد التصميم${typeof generateAction.cost === 'number' && generateAction.cost > 0 ? ` (${generateAction.cost})` : ''}`
                )}
              </button>
            </div>
          </div>
        )}

        {/* Lighting Presets */}
        {lighting && (
          <div className={styles.lightingWrapper}>
            {lighting}
          </div>
        )}

        {/* History & Cards Rail */}
        {history && (
          <div className={styles.historyWrapper}>
            {history}
          </div>
        )}
        
        {/* Bottom padding to prevent content from being hidden under sheet */}
        <div style={{ height: '30px' }} />
      </div>

      {/* Foreground Layer: Draggable Selection Sheet */}
      <StudioSheet initialSnap="standard">
        <div className={panelTopPaddingClassName}>
          {panel}
        </div>
      </StudioSheet>
    </div>
  );
};
