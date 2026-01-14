import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLayoutStore } from '../store/useLayoutStore';

const CHIPS = ['AI CINEMA', 'AI FACES', 'AI MAGIC', 'AI CITIES', 'AI ENVIRONMENTS', 'AI LANDS', 'AI AVATAR', 'AI TOOLS'];
const ACCENT = 'var(--theme-primary)';

function isExternalHref(href: string): boolean {
  return /^(https?:\/\/|mailto:|tel:)/i.test(href);
}

function openHref(navigate: (to: string) => void, href: string) {
  if (!href) return;
  if (isExternalHref(href)) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  navigate(href);
}

export default function BlockF() {
  const cfg = useLayoutStore((s) => s.blockConfig.blockF);
  const navigate = useNavigate();
  const title = cfg?.title || 'Privacy & Terms';
  const maxItems = Math.max(1, (cfg?.maxColumns || 4) * (cfg?.maxRows || 1));
  const chipWidth = cfg?.cardWidth || 140;
  const chipHeight = cfg?.cardHeight || 44;
  const chipGapPx = cfg?.cardGapPx ?? 8;
  const chipRadiusPx = cfg?.cardRadiusPx ?? 9999;

  const chips = Array.isArray(cfg?.items) && cfg!.items!.length
    ? cfg!.items!.map((item) => ({ id: item.id, label: item.title, href: item.href, text: item.text }))
    : [
        { id: 'terms', label: 'Terms', href: '/terms', text: '' },
        { id: 'privacy', label: 'Privacy', href: '/privacy', text: '' },
      ];

  const [modal, setModal] = React.useState<null | 'privacy' | 'terms'>(null);
  const [agree, setAgree] = React.useState(false);
  const [accepted, setAccepted] = React.useState<{ privacy: boolean; terms: boolean }>({ privacy: false, terms: false });

  React.useEffect(() => {
    try {
      const privacy = localStorage.getItem('khuyoot:privacyAccepted') ? true : false;
      const terms = localStorage.getItem('khuyoot:termsAccepted') ? true : false;
      setAccepted({ privacy, terms });
    } catch {
      // ignore storage issues
    }
  }, []);

  const openModalFor = (type: 'privacy' | 'terms') => {
    setAgree(false);
    setModal(type);
  };

  const onAccept = () => {
    if (!modal) return;
    try {
      if (modal === 'privacy') localStorage.setItem('khuyoot:privacyAccepted', String(Date.now()));
      if (modal === 'terms') localStorage.setItem('khuyoot:termsAccepted', String(Date.now()));
      setAccepted((prev) => ({
        privacy: modal === 'privacy' ? true : prev.privacy,
        terms: modal === 'terms' ? true : prev.terms,
      }));
    } catch {
      // ignore
    }
    setModal(null);
  };

  const handleChipClick = (href: string, label: string) => {
    const normalized = (href || label || '').toLowerCase();
    if (normalized.includes('privacy')) {
      openModalFor('privacy');
      return;
    }
    if (normalized.includes('terms')) {
      openModalFor('terms');
      return;
    }
    openHref(navigate, href);
  };

  return (
    <section className="py-6 text-center">
      <div className="inline-flex flex-col items-center gap-3 px-6 py-5 rounded-[16px] border border-white/10 bg-black/30">
        <span className="text-sm font-semibold" style={{ color: ACCENT }}>{title}</span>
        <div className="flex text-[11px] text-white/70 flex-wrap justify-center max-w-5xl" style={{ gap: chipGapPx }}>
          {chips.slice(0, maxItems).map((chip) => (
            <div key={chip.id} className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => handleChipClick(chip.href, chip.label)}
                className="border border-white/10 bg-white/5 rounded-full inline-flex items-center justify-center hover:bg-white/10 active:scale-[0.99] transition"
                style={{ minWidth: chipWidth, height: chipHeight, padding: '0 12px', borderRadius: chipRadiusPx }}
                title={chip.label}
              >
                <span className="inline-flex items-center gap-1">
                  {chip.label}
                  {chip.label.toLowerCase().includes('privacy') && accepted.privacy ? (
                    <span className="text-emerald-400">✓</span>
                  ) : null}
                  {chip.label.toLowerCase().includes('terms') && accepted.terms ? (
                    <span className="text-emerald-400">✓</span>
                  ) : null}
                </span>
              </button>
              {chip.text ? (
                <p className="text-[10px] text-white/50 text-center max-w-[200px] leading-tight">
                  {chip.text}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative z-10 w-full max-w-3xl mx-auto bg-slate-900 rounded-2xl shadow-2xl border border-slate-700">
            <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900">
              <h2 className="text-xl font-bold text-white">
                {modal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}
              </h2>
              <button 
                onClick={() => setModal(null)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-700/60 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto p-6 bg-slate-800">
              <div className="prose prose-slate max-w-none whitespace-pre-wrap text-base leading-relaxed text-slate-800 bg-amber-50 p-6 rounded-xl shadow-sm border border-amber-200 text-right" dir="rtl">
                {modal === 'privacy' ? (cfg?.privacyContent || 'No privacy policy has been set yet. Please contact the administrator.') : (cfg?.termsContent || 'No terms and conditions have been set yet. Please contact the administrator.')}
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900">
              <label className="inline-flex items-center gap-2.5 text-sm font-medium text-slate-200 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={agree} 
                  onChange={(e) => setAgree(e.target.checked)} 
                  className="w-5 h-5 rounded border-slate-500 text-emerald-600 focus:ring-2 focus:ring-emerald-500" 
                />
                I have read and accept these {modal === 'privacy' ? 'privacy terms' : 'terms and conditions'}
              </label>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => setModal(null)} 
                  className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={onAccept}
                  disabled={!agree}
                  className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-md ${agree ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-95' : 'bg-slate-700 text-slate-500 cursor-not-allowed shadow-none'}`}
                >
                  Accept & Continue
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
