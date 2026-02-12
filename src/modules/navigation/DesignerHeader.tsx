import * as React from 'react';
import { Home, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { setLanguage } from '../../i18n/i18n';
import { useAuth } from '../../auth/useAuth';
import { requestLoginPrompt } from '../../auth/authEvents';
import { motion, AnimatePresence } from 'framer-motion';

export type DesignerHeaderProps = {
  hideUserSection?: boolean;
  onHome: () => void;
  title?: string;
  rightSlot?: React.ReactNode;
  hideLogo?: boolean;
  credits?: number | string;
  tier?: string;
  userName?: string;
  profileImage?: string;
};

export function DesignerHeader(props: DesignerHeaderProps) {
  const { onHome, title, rightSlot, hideLogo = false, hideUserSection = false, credits, tier, userName, profileImage } = props;
  const { t, i18n } = useTranslation(['common']);
  const { user: authUser, status: authStatus, logout: authLogout } = useAuth();

  // Use authUser as the primary source of user data
  const user = authUser;
  const authLoading = authStatus === 'loading' && !user;
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);

  // Close language menu on click outside - ref for menu container
  const langMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const activeLang = React.useMemo(() => {
    const lower = (i18n.language || 'ar').toLowerCase();
    if (lower.startsWith('ar')) return 'ar';
    if (lower.startsWith('fr')) return 'fr';
    return 'en';
  }, [i18n.language]);

  const handleLanguageChange = React.useCallback((code: 'ar' | 'en' | 'fr') => {
    setLanguage(code);
    setLangMenuOpen(false);
  }, []);

  const handleLogout = () => {
    if (confirm(t('confirmLogout') || (activeLang === 'ar' ? 'هل تريد تسجيل الخروج؟' : 'Log out?'))) {
      authLogout();
    }
  };

  const languageOptions = React.useMemo(() => [
    {
      code: 'ar' as const,
      label: 'AR',
      icon: <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none bg-blue-50 text-blue-700 border-blue-200 dark:bg-theme-primary/30 dark:text-theme-primary dark:border-theme-primary/60">Ø¹</span>
    },
    {
      code: 'en' as const,
      label: 'EN',
      icon: <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200 dark:border-slate-700">EN</span>
    },
    {
      code: 'fr' as const,
      label: 'FR',
      icon: <span className="inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full border text-[10px] font-extrabold leading-none bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800/60">FR</span>
    }
  ], [t]);

  const activeLangOption = languageOptions.find(o => o.code === activeLang);

  return (
    <div className="h-[72px] border-b border-zinc-100 dark:border-white/10 px-6 flex items-center justify-between bg-white dark:bg-black text-zinc-900 dark:text-zinc-200">
      {/* Left Section: Branding only */}
      <div className="flex items-center gap-6">
        <button
          onClick={onHome}
          className="flex items-center gap-4 hover:scale-105 transition-transform active:scale-95"
        >
          {!hideLogo && (
            <img
              src="/logo_big.png"
              alt="Khuyoot"
              className="h-9 w-auto object-contain brightness-110"
            />
          )}
          {title && (
            <div className="flex flex-col">
              <span className="text-[13px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.2em] opacity-90">
                {title}
              </span>
              <div className="h-0.5 w-full bg-purple-600 dark:bg-theme-primary/50 rounded-full mt-0.5" />
            </div>
          )}
        </button>
      </div>

      {/* Right Section: Optional Slot */}
      <div className="flex items-center gap-4">

        {/* Global Controls */}
        <div className="flex items-center gap-2 ml-2">
          {/* Language Menu */}
          <div className="relative" ref={langMenuRef}>
            <button
              onClick={() => setLangMenuOpen(!langMenuOpen)}
              className="h-10 px-3 flex items-center gap-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all font-bold text-zinc-900 dark:text-zinc-200"
            >
              {activeLangOption?.icon}
              <span className="text-xs font-bold">{activeLangOption?.label}</span>
            </button>

            <AnimatePresence>
              {langMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[100] backdrop-blur-xl"
                >
                  {languageOptions.map((opt) => (
                    <button
                      key={opt.code}
                      onClick={() => handleLanguageChange(opt.code)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors text-xs font-bold ${
                        activeLang === opt.code ? 'text-purple-600 dark:text-theme-primary bg-purple-50 dark:bg-theme-primary/5' : 'text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {opt.icon}
                      {opt.code.toUpperCase()}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {rightSlot}
      </div>
    </div>
  );
}

