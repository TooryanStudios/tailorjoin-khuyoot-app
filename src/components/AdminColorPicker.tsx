/**
 * AdminColorPicker
 * ─────────────────────────────────────────────────────────────
 * Self-contained floating dialog for admin-only primary-color
 * selection.  To remove this feature completely:
 *   1. Delete this file.
 *   2. Remove the import + <AdminColorPicker> usage from MontHeader.tsx.
 *   3. Remove the "restore on load" block from index.html (optional cleanup).
 * Nothing else in the app depends on this component.
 * ─────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import { Palette, X, Check } from 'lucide-react';

// ── localStorage key ────────────────────────────────────────
const STORAGE_KEY = 'khuyoot_admin_primary_color';

// ── Colour palette ───────────────────────────────────────────
export const COLOR_SWATCHES: { label: string; hex: string; group: string }[] = [
  // Default
  { label: 'بنفسجي ملكي', hex: '#63498B', group: 'default' },

  // Oranges / Yellowish-oranges (muted)
  { label: 'برتقالي محترق', hex: '#C47035', group: 'orange' },
  { label: 'عنبر دافئ',     hex: '#C49535', group: 'orange' },
  { label: 'تيراكوتا',      hex: '#B85530', group: 'orange' },
  { label: 'برتقالي رملي',  hex: '#C4863A', group: 'orange' },

  // Reddish (muted)
  { label: 'أحمر مدخّن',    hex: '#A34545', group: 'red' },

  // Other variations
  { label: 'أزرق فولاذي',   hex: '#4A6A9E', group: 'other' },
  { label: 'زمردي معتم',    hex: '#3D8B7A', group: 'other' },
  { label: 'مريمية',        hex: '#5A7A5A', group: 'other' },
  { label: 'وردي ترابي',    hex: '#9B5A6B', group: 'other' },
  { label: 'بني ذهبي',      hex: '#7A6A4A', group: 'other' },
];

// ── Helpers ──────────────────────────────────────────────────
function hexToRgbComponents(hex: string): [number, number, number] | null {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  if (isNaN(num)) return null;
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function darkenRgb(r: number, g: number, b: number, amount = 0.2): [number, number, number] {
  return [
    Math.round(r * (1 - amount)),
    Math.round(g * (1 - amount)),
    Math.round(b * (1 - amount)),
  ];
}

export function applyPrimaryColor(hex: string) {
  const components = hexToRgbComponents(hex);
  if (!components) return;
  const [r, g, b] = components;
  const [dr, dg, db] = darkenRgb(r, g, b, 0.22);

  const root = document.documentElement;
  root.style.setProperty('--theme-primary-rgb', `${r} ${g} ${b}`);
  root.style.setProperty('--theme-primary-dark-rgb', `${dr} ${dg} ${db}`);
  // Also set the direct vars for contexts that read them without rgb()
  root.style.setProperty('--theme-primary', `rgb(${r} ${g} ${b})`);
  root.style.setProperty('--theme-primary-dark', `rgb(${dr} ${dg} ${db})`);
  root.style.setProperty('--theme-primary-glow', `rgb(${r} ${g} ${b} / 0.15)`);
  root.style.setProperty('--theme-master', `rgb(${r} ${g} ${b})`);

  localStorage.setItem(STORAGE_KEY, hex);
}

export function restoreAdminPrimaryColor() {
  const saved = localStorage.getItem(STORAGE_KEY);
  applyPrimaryColor(saved || '#63498B');
}

export function getCurrentAdminPrimaryColor(): string {
  return localStorage.getItem(STORAGE_KEY) || '#63498B';
}

// ── Component ────────────────────────────────────────────────
interface AdminColorPickerProps {
  onClose: () => void;
  /** Anchor element – the dialog floats near it */
  anchorRef?: React.RefObject<HTMLElement>;
}

export const AdminColorPicker = React.memo(function AdminColorPicker({
  onClose,
  anchorRef,
}: AdminColorPickerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const currentColor = getCurrentAdminPrimaryColor();

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dialogRef.current &&
        !dialogRef.current.contains(e.target as Node) &&
        !(anchorRef?.current?.contains(e.target as Node))
      ) {
        onClose();
      }
    };
    // Slight delay so the triggering click doesn't immediately close
    const id = setTimeout(() => window.addEventListener('mousedown', handler), 50);
    return () => {
      clearTimeout(id);
      window.removeEventListener('mousedown', handler);
    };
  }, [onClose, anchorRef]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const groups: Record<string, typeof COLOR_SWATCHES> = {};
  COLOR_SWATCHES.forEach(s => {
    if (!groups[s.group]) groups[s.group] = [];
    groups[s.group].push(s);
  });

  const groupLabels: Record<string, string> = {
    default: 'الافتراضي',
    orange: 'برتقالي / ذهبي',
    red: 'أحمر',
    other: 'ألوان أخرى',
  };

  return (
    <div
      ref={dialogRef}
      dir="rtl"
      className="absolute top-10 left-0 w-64 bg-white border border-zinc-200 rounded-2xl shadow-2xl z-[99999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/60">
        <div className="flex items-center gap-2">
          <Palette size={13} className="text-zinc-500" />
          <span className="text-[11px] font-bold text-zinc-700 tracking-wide">لون الهوية</span>
        </div>
        <button
          onClick={onClose}
          className="w-5 h-5 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center transition-colors"
        >
          <X size={10} className="text-zinc-500" />
        </button>
      </div>

      {/* Swatches */}
      <div className="p-3 space-y-3">
        {Object.entries(groups).map(([groupKey, swatches]) => (
          <div key={groupKey}>
            <p className="text-[9px] font-black uppercase text-zinc-400 mb-1.5 tracking-widest">
              {groupLabels[groupKey] || groupKey}
            </p>
            <div className="flex flex-wrap gap-2">
              {swatches.map((swatch) => {
                const isActive = currentColor.toLowerCase() === swatch.hex.toLowerCase();
                return (
                  <button
                    key={swatch.hex}
                    title={swatch.label}
                    onClick={() => {
                      applyPrimaryColor(swatch.hex);
                      // Force re-render by dispatching a custom event
                      window.dispatchEvent(new CustomEvent('khuyoot:primary-color-changed', { detail: swatch.hex }));
                      onClose();
                    }}
                    className="relative group w-7 h-7 rounded-full border-2 transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1"
                    style={{
                      backgroundColor: swatch.hex,
                      borderColor: isActive ? swatch.hex : 'transparent',
                      boxShadow: isActive
                        ? `0 0 0 2px white, 0 0 0 4px ${swatch.hex}`
                        : '0 1px 3px rgba(0,0,0,0.15)',
                    }}
                  >
                    {isActive && (
                      <Check
                        size={11}
                        className="absolute inset-0 m-auto text-white drop-shadow"
                        strokeWidth={3}
                      />
                    )}
                    {/* Tooltip */}
                    <span className="pointer-events-none absolute bottom-full mb-1.5 right-1/2 translate-x-1/2 bg-zinc-800 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {swatch.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Reset to default */}
      <div className="px-3 pb-3">
        <button
          onClick={() => {
            applyPrimaryColor('#63498B');
            window.dispatchEvent(new CustomEvent('khuyoot:primary-color-changed', { detail: '#63498B' }));
            onClose();
          }}
          className="w-full text-[10px] text-zinc-400 hover:text-zinc-600 py-1.5 border border-dashed border-zinc-200 rounded-lg hover:border-zinc-400 transition-colors"
        >
          إعادة اللون الافتراضي
        </button>
      </div>
    </div>
  );
});
