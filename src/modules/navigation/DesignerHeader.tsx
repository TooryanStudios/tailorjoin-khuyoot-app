import * as React from 'react';
import { Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/i18n';

export type DesignerHeaderProps = {
  onHome: () => void;
  title?: string;
  rightSlot?: React.ReactNode;
};

export function DesignerHeader(props: DesignerHeaderProps) {
  const { onHome, title, rightSlot } = props;
  const { t, i18n } = useTranslation(['common']);
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);

  const activeLang = React.useMemo(() => {
    const lower = (i18n.language || 'ar').toLowerCase();
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('fr')) return 'fr';
    return 'en';
  }, [i18n.language]);

  const handleLanguageChange = React.useCallback((code: 'ar' | 'en' | 'fr') => {
    setLanguage(code);
  }, []);

  const languageOptions = React.useMemo(() => [
    {
      code: 'ar' as const,
      label: t('arabic'),
      icon: <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800/60">ع</span>
    },
    {
      code: 'en' as const,
      label: t('english'),
      icon: <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-700">EN</span>
    },
    {
      code: 'fr' as const,
      label: t('french'),
      icon: <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60">FR</span>
    }
  ], [t]);

  const activeLangOption = languageOptions.find(o => o.code === activeLang);

  return (
    <div className="h-14 border-b border-zinc-800 px-6 flex items-center justify-between bg-zinc-950">
      <button
        onClick={onHome}
        className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        title={t('backToHome')}
        aria-label={t('backToHome')}
      >
        <img 
          src="/logo_big.png" 
          alt="خيوط" 
          className="h-12 w-auto object-contain"
        />
        {title && (
          <span className="text-sm font-bold text-white whitespace-nowrap">
            {title}
          </span>
        )}
      </button>

      <div className="flex items-center gap-4">
        {/* Language Selector */}
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(v => !v)}
            className="h-8 px-3 rounded-full border border-zinc-700 text-zinc-200 hover:bg-zinc-800 transition-colors text-xs font-bold inline-flex items-center gap-2"
            aria-label={t('language')}
            aria-haspopup="menu"
            aria-expanded={langMenuOpen}
          >
            {activeLangOption?.icon}
            <span className="truncate max-w-[92px]">{activeLangOption?.label}</span>
            <span aria-hidden className="text-[10px] opacity-70">▾</span>
          </button>

          {langMenuOpen && (
            <div
              role="menu"
              aria-label={t('language')}
              className="absolute right-0 z-[1100] mt-2 w-32 rounded-xl border border-zinc-700 bg-zinc-900 shadow-xl overflow-hidden"
              onMouseLeave={() => setLangMenuOpen(false)}
            >
                {languageOptions.map((opt) => {
                  const isActive = opt.code === activeLang;
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleLanguageChange(opt.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs font-semibold text-right transition-colors ${
                        isActive
                          ? 'bg-purple-900/30 text-purple-200'
                          : 'text-zinc-200 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 min-w-0">
                          {opt.icon}
                          <span className="truncate">{opt.label}</span>
                        </span>
                        {isActive && <span aria-hidden className="text-[10px]">✓</span>}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
        
        {rightSlot}
      </div>
    </div>
  );
}
