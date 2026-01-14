import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { X } from 'lucide-react';

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

export const V2TermsPrivacy: React.FC = React.memo(function V2TermsPrivacy() {
  const { appSettings } = useApp();
  const navigate = useNavigate();
  
  const cfg = (appSettings as any)?.homePageV2Layout?.blockConfig?.blockF;
  const title = cfg?.title || 'الخصوصية والشروط';
  const maxItems = Math.max(1, (cfg?.maxColumns || 4) * (cfg?.maxRows || 1));
  const chipWidth = cfg?.cardWidth || 140;
  const chipHeight = cfg?.cardHeight || 44;
  const chipGapPx = cfg?.cardGapPx ?? 8;
  const chipRadiusPx = cfg?.cardRadiusPx ?? 9999;

  const chips = Array.isArray(cfg?.items) && cfg!.items!.length
    ? cfg!.items!.map((item: any) => ({ id: item.id, label: item.title, href: item.href, text: item.text }))
    : [
        { id: 'terms', label: 'الشروط والأحكام', href: '/terms', text: '' },
        { id: 'privacy', label: 'سياسة الخصوصية', href: '/privacy', text: '' },
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
      // ignore
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
    if (normalized.includes('privacy') || normalized.includes('خصوصية')) {
      openModalFor('privacy');
      return;
    }
    if (normalized.includes('terms') || normalized.includes('شروط')) {
      openModalFor('terms');
      return;
    }
    openHref(navigate, href);
  };

  return (
    <>
      <section className="py-6 text-center">
        <div className="inline-flex flex-col items-center gap-3 px-6 py-5 rounded-2xl border border-white/10 bg-black/30">
          <span className="text-sm font-semibold" style={{ color: ACCENT }}>
            {title}
          </span>
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
                    {chip.id === 'privacy' && accepted.privacy && <span className="text-green-400">✓</span>}
                    {chip.id === 'terms' && accepted.terms && <span className="text-green-400">✓</span>}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">
                {modal === 'privacy' ? 'سياسة الخصوصية' : 'الشروط والأحكام'}
              </h3>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-sm text-slate-300 space-y-4">
              {modal === 'privacy' ? (
                <>
                  <p>
                    نحن في خيوط نلتزم بحماية خصوصيتك. توضح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك الشخصية.
                  </p>
                  <h4 className="font-semibold text-white mt-4">المعلومات التي نجمعها</h4>
                  <p>
                    نقوم بجمع معلومات التسجيل الأساسية مثل الاسم والبريد الإلكتروني، بالإضافة إلى معلومات الاستخدام لتحسين خدماتنا.
                  </p>
                  <h4 className="font-semibold text-white mt-4">كيفية استخدام المعلومات</h4>
                  <p>
                    نستخدم المعلومات لتقديم خدماتنا، وتحسين تجربة المستخدم، والتواصل معك بشأن التحديثات والعروض.
                  </p>
                  <h4 className="font-semibold text-white mt-4">حماية البيانات</h4>
                  <p>
                    نستخدم تقنيات التشفير والأمان المتقدمة لحماية معلوماتك الشخصية من الوصول غير المصرح به.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    مرحبًا بك في خيوط. باستخدام هذا الموقع، فإنك توافق على الالتزام بالشروط والأحكام التالية.
                  </p>
                  <h4 className="font-semibold text-white mt-4">استخدام الخدمة</h4>
                  <p>
                    يمكنك استخدام منصة خيوط للبحث عن الخياطين، وتصفح التصاميم، وإنشاء تصاميم جديدة باستخدام الذكاء الاصطناعي.
                    يجب عليك استخدام الخدمة بشكل قانوني ومسؤول.
                  </p>
                  <h4 className="font-semibold text-white mt-4">الملكية الفكرية</h4>
                  <p>
                    جميع المحتويات والتصاميم على المنصة محمية بحقوق الملكية الفكرية. لا يُسمح بنسخها أو توزيعها دون إذن.
                  </p>
                  <h4 className="font-semibold text-white mt-4">المسؤولية</h4>
                  <p>
                    نحن غير مسؤولين عن أي أضرار قد تنتج عن استخدام المنصة. استخدام الخدمة على مسؤوليتك الخاصة.
                  </p>
                </>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex flex-col gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span>أوافق على {modal === 'privacy' ? 'سياسة الخصوصية' : 'الشروط والأحكام'}</span>
              </label>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={!agree}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  قبول
                </button>
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
