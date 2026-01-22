import React from 'react';
import { Home, User, BarChart3, Settings, PenTool } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { useDesignerStore } from '../../store/useDesignerStore';

function roleBadge(role: string | undefined, t: (key: string) => string) {
  switch (role) {
    case 'tailor':
      return { text: t('roleTailor'), cls: 'bg-amber-500' };
    case 'boutique':
      return { text: t('roleBoutique'), cls: 'bg-purple-500' };
    case 'shop':
      return { text: t('roleShop'), cls: 'bg-green-500' };
    case 'admin':
      return { text: t('roleAdmin'), cls: 'bg-red-500' };
    default:
      return { text: t('roleAccount'), cls: 'bg-blue-500' };
  }
}

function getDesignerProductIdFromPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'designer-v2-1') return null;
  if (!parts[1] || parts[1] === 'design') return null;
  return parts[1];
}

function getDesignerProductIdFromSelectedTemplateId(selectedTemplateId: string | null | undefined) {
  if (!selectedTemplateId) return null;
  const match = /^product-(.+)-(\d+)$/.exec(selectedTemplateId);
  if (!match) return null;
  return match[1] ?? null;
}

type FooterIcon = React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;

const FooterNavItem = React.memo(function FooterNavItem({
  icon: Icon,
  label,
  onClick,
  active,
  isCenter = false,
}: {
  icon: FooterIcon;
  label: string;
  onClick: () => void;
  active: boolean;
  isCenter?: boolean;
}) {
  if (isCenter) {
    return (
      <button onClick={onClick} className="group relative -top-9 flex flex-col items-center justify-center p-1">
        <div className="relative overflow-hidden flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-[6px] ring-white dark:ring-[#1a1a1a] transition-transform duration-200 active:scale-95">
          <Icon size={24} strokeWidth={2.5} className="relative transition-transform duration-300 group-hover:rotate-12" />
        </div>
        <span className="absolute -bottom-6 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-black/50 px-2 rounded-full backdrop-blur-sm">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-center transition-all duration-200 active:scale-95 w-12 h-12"
    >
      <div className={`relative transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}>
        <Icon
          size={20}
          strokeWidth={active ? 2.5 : 2}
          className={`transition-colors duration-300 ${
            active 
              ? 'text-white' 
              : 'text-slate-400 group-hover:text-slate-300'
          }`}
        />
      </div>
    </button>
  );
});

const FooterAccountItem = React.memo(function FooterAccountItem({
  label,
  onClick,
  active,
  user,
}: {
  label: string;
  onClick: () => void;
  active: boolean;
  user: any;
}) {
  const { t } = useTranslation('common');
  const badge = roleBadge(user?.role, t);

  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-center transition-all duration-200 active:scale-95 w-12 h-12"
    >
      <div
        className={`relative transition-all duration-300 ${active ? 'scale-110' : 'scale-100'}`}
      >
        {user?.profileImage ? (
          <img src={user.profileImage} alt={t('accountImageAlt')} className="h-5 w-5 rounded-full object-cover" />
        ) : (
          <User
            size={20}
            strokeWidth={active ? 2.5 : 2}
            className={`transition-colors duration-300 ${
              active 
                ? 'text-white' 
                : 'text-slate-400 group-hover:text-slate-300'
            }`}
          />
        )}
      </div>
    </button>
  );
});

const FooterPlaceOrderCTA = React.memo(function FooterPlaceOrderCTA({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
  const { t } = useTranslation('common');
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        'group mx-1 flex flex-[1.4] flex-col items-center justify-start pt-3 gap-1 transition-transform duration-200 active:scale-95 h-full ' +
        (disabled ? 'cursor-not-allowed' : '')
      }
      aria-label={t('placeOrder')}
    >
      <div
        className={
          'relative w-full max-w-[140px] h-9 rounded-full px-3 text-[12px] font-bold text-white shadow-md overflow-hidden flex items-center justify-center ring-[2px] ring-white/90 dark:ring-[#1a1a1a] transition-[box-shadow,transform] duration-200 ' +
          (disabled
            ? 'bg-slate-400/60 dark:bg-slate-700/60'
            : 'bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 shadow-emerald-500/25')
        }
      >
        {!disabled && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 -translate-x-[160%] rotate-[18deg] bg-white/25 w-1/3 blur-[2px]"
            style={{ animation: 'khuyootFooterShine 2.6s ease-in-out infinite' }}
          />
        )}
        <span className="relative z-10 flex items-center justify-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.6)]" />
          {t('placeOrder')}
        </span>

        {/* Hover indicator (mouse only) */}
        {!disabled && (
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-2 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-400 opacity-0 shadow-[0_0_12px_rgba(52,211,153,0.8)] transition-opacity duration-200 group-hover:opacity-100"
          />
        )}
      </div>
    </button>
  );
});

export function Footer() {
  const { t, i18n } = useTranslation('common');
  const navigate = useNavigate();
  const location = useLocation();
  const selectedTemplateId = useDesignerStore((s) => s.selectedTemplateId);
  
  // Logic remains untouched
  let user, loading, appSettings;
  try {
    const context = useApp();
    user = context.user;
    loading = context.loading;
    appSettings = context.appSettings;
  } catch (error) {
    console.warn('Footer: useApp context not available yet');
    return null; 
  }

  const isInDesigner =
    location.pathname === '/designer' ||
    location.pathname.startsWith('/designer/') ||
    location.pathname === '/designer-v2-1' ||
    location.pathname.startsWith('/designer-v2-1/');

  const isActive = (path: string) => {
    if (path === '/designer') return isInDesigner;
    if (path === '/designer-v2-1') return isInDesigner;
    return location.pathname === path;
  };

  const resolvedProductId =
    getDesignerProductIdFromPath(location.pathname) ||
    getDesignerProductIdFromSelectedTemplateId(selectedTemplateId);

  const handlePlaceOrder = () => {
    if (!resolvedProductId) return;
    navigate(`/measurements/${resolvedProductId}`, {
      state: { productId: resolvedProductId, templateId: selectedTemplateId, source: 'designer-v2-1' },
    });
  };

  const isTailor = user?.role === 'tailor';
  const isBoutique = user?.role === 'boutique';
  const isShop = user?.role === 'shop';
  const isRegularUser = !user || user.role === 'user'; 

  const isRTL = i18n.dir() === 'rtl';

  return (
    // Floating rounded navigation bar
    <div
      className="bottom-nav fixed bottom-4 left-1/2 -translate-x-1/2 w-auto z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {/* Rounded pill container with stronger blur */}
      <div className="flex items-center gap-3 px-5 h-16 bg-slate-900/70 dark:bg-black/70 backdrop-blur-3xl rounded-full shadow-2xl shadow-black/40 border border-white/10">

        {/* Guest layout: Home / Account / Designer */}
        {!user && (
          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => navigate('/')}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 ${
                isActive('/')
                  ? 'border-emerald-400 bg-emerald-400/15 text-emerald-100'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20'
              }`}
            >
              <Home size={20} strokeWidth={isActive('/') ? 2.6 : 2.2} />
            </button>

            <button
              onClick={() => {
                // Open auth modal for guests
                const event = new CustomEvent('openAuthModal');
                window.dispatchEvent(event);
              }}
              className={`flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 ${
                isActive('/account')
                  ? 'border-emerald-400 bg-emerald-400/15 text-emerald-100'
                  : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/20'
              }`}
            >
              <User size={20} strokeWidth={isActive('/account') ? 2.6 : 2.2} />
            </button>

            <button
              onClick={() => navigate('/designer-v2-1')}
              className={`relative flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-200 overflow-hidden ${
                isActive('/designer') || isActive('/designer-v2-1')
                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-100'
                  : 'border-white/10 bg-gradient-to-br from-indigo-500/30 via-blue-500/20 to-cyan-500/10 text-slate-200 hover:border-white/20'
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-white/20"
                style={{ animation: 'khuyootFooterShine 2.5s ease-in-out infinite' }}
              />
              <PenTool size={21} strokeWidth={2.4} className="relative" />
            </button>
          </div>
        )}

        {/* Signed-in layout remains as before */}
        {user && (
          <>
            <FooterNavItem icon={Home} label={t('navHome')} active={isActive('/')} onClick={() => navigate('/')} />

            <FooterAccountItem
              label={t('navAccount')}
              user={user}
              active={
                isActive(
                  user?.role === 'tailor'
                    ? '/tailor-account'
                    : user?.role === 'boutique'
                      ? '/boutique-account'
                      : user?.role === 'shop'
                        ? '/shop-account'
                        : user?.role === 'admin'
                          ? '/admin'
                          : '/account'
                )
              }
              onClick={() => {
                navigate(
                  user?.role === 'tailor'
                    ? '/tailor-account'
                    : user?.role === 'boutique'
                      ? '/boutique-account'
                      : user?.role === 'shop'
                        ? '/shop-account'
                        : user?.role === 'admin'
                          ? '/admin'
                          : '/account'
                );
              }}
            />

            <FooterNavItem 
              icon={BarChart3} 
              label={t('navStats')} 
              active={isActive('/stats')} 
              onClick={() => navigate('/stats')} 
            />

            <FooterNavItem 
              icon={Settings} 
              label={t('navSettings')} 
              active={isActive('/settings')} 
              onClick={() => navigate('/settings')} 
            />
          </>
        )}

      </div>
    </div>
  );
}
