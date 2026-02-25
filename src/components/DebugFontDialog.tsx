import React from 'react';

// Lightweight debug-only font switcher. Safe to remove when no longer needed.
const FONTS: { label: string; value: string }[] = [
  { label: 'Default', value: "'Inter', system-ui, -apple-system, sans-serif" },
  { label: 'System', value: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" },
  { label: 'Manrope', value: "'Manrope', 'Inter', system-ui, sans-serif" },
  { label: 'Work Sans', value: "'Work Sans', 'Inter', system-ui, sans-serif" },
  { label: 'Poppins', value: "'Poppins', 'Inter', system-ui, sans-serif" },
  { label: 'Roboto', value: "'Roboto', system-ui, -apple-system, sans-serif" },
  { label: 'Nunito', value: "'Nunito', 'Inter', system-ui, sans-serif" },
  { label: 'Source Sans', value: "'Source Sans Pro', 'Inter', system-ui, sans-serif" },
  { label: 'Open Sans', value: "'Open Sans', 'Inter', system-ui, sans-serif" },
  { label: 'Plus Jakarta', value: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" },
  { label: 'Sora', value: "'Sora', 'Inter', system-ui, sans-serif" },
  { label: 'DM Sans', value: "'DM Sans', 'Inter', system-ui, sans-serif" },
  // Arabic-friendly options (browser-safe fallbacks included)
  { label: 'Arial (Arabic)', value: "'Arial', 'Segoe UI', Tahoma, sans-serif" },
  { label: 'Tahoma (Arabic)', value: "'Tahoma', 'Segoe UI', Arial, sans-serif" },
  { label: 'Cairo', value: "'Cairo', sans-serif" },
  { label: 'Almarai', value: "'Almarai', 'Segoe UI', Arial, sans-serif" },
  { label: 'IBM Plex Arabic', value: "'IBM Plex Sans Arabic', 'Segoe UI', Arial, sans-serif" },
  { label: 'Noto Sans Arabic', value: "'Noto Sans Arabic', 'Segoe UI', Arial, sans-serif" },
  { label: 'Changa', value: "'Changa', 'Segoe UI', Arial, sans-serif" },
  { label: 'Reem Kufi', value: "'Reem Kufi', 'Segoe UI', Arial, sans-serif" },
  { label: 'Amiri', value: "'Amiri', 'Segoe UI', Arial, serif" },
];

const STORAGE_KEY = 'debug_font_family';

export function DebugFontDialog() {
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<string>('');

  React.useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
    const defaultFont = FONTS.find((f) => f.label === 'Cairo')?.value;
    const initial = saved || defaultFont;
    if (initial) {
      applyFont(initial);
    }
  }, []);

  const applyFont = (font: string) => {
    try {
      document.documentElement.style.fontFamily = font;
      document.body.style.fontFamily = font;
      window.localStorage.setItem(STORAGE_KEY, font);
      setActive(font);
    } catch (err) {
      // ignore
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[2000]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg bg-slate-900/90 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-100 shadow-lg hover:border-slate-500"
      >
        {open ? 'Hide Fonts' : 'Fonts'}
      </button>

      {open && (
        <div className="mt-2 w-64 rounded-xl border border-slate-700 bg-slate-900/95 p-3 shadow-2xl">
          <p className="text-xs font-semibold text-slate-200 mb-2">Font debug panel</p>
          <div className="flex flex-col gap-2 max-h-64 overflow-auto pr-1">
            {FONTS.map((font) => (
              <button
                key={font.label}
                type="button"
                onClick={() => applyFont(font.value)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${
                  active === font.value
                    ? 'border-amber-300/80 bg-amber-300/10 text-amber-100'
                    : 'border-slate-700 bg-slate-800/60 text-slate-100 hover:border-slate-500'
                }`}
                style={{ fontFamily: font.value }}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
