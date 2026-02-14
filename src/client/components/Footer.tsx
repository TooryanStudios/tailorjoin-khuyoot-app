import React from 'react';
import { Home, User, BarChart3, Settings, PenTool, LayoutDashboard } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { requestLoginPrompt } from '../../auth/authEvents';
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
  if (parts[0] !== 'designer-v2-1' && parts[0] !== 'tryon') return null;
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
      <button onClick={onClick} className="group relative -top-6 flex flex-col items-center justify-center p-1">
        <div className="relative overflow-hidden flex h-14 w-14 items-center justify-center rounded-full bg-theme-primary text-white shadow-xl shadow-black/20 ring-[6px] ring-[#ededed] transition-transform duration-200 active:scale-95">
          <Icon size={24} strokeWidth={2.5} className="relative transition-transform duration-300 group-hover:rotate-12" />
        </div>
        <span className="absolute -bottom-6 text-[10px] font-normal text-zinc-500 bg-white/80 px-2 rounded-full backdrop-blur-sm shadow-sm md:hidden">
          {label}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-center transition-all duration-200 active:scale-95 px-1"
    >
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 ${
        active 
            ? 'bg-[var(--theme-primary)] text-white scale-105 shadow-lg shadow-[var(--theme-primary)]/25' 
            : 'text-zinc-500 hover:bg-[var(--theme-primary)]/10 hover:text-[var(--theme-primary)]'
      }`}>
        <Icon
          size={24}
          strokeWidth={active ? 2.5 : 2}
          className={`transition-colors duration-300`}
        />
        {/* Active Indicator inside the button */}
        {active && (
           <span className="absolute -bottom-1 w-8 h-1 rounded-full bg-white/50 blur-sm"></span>
        )}
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

  return (
    <button
      onClick={onClick}
      className="group flex items-center justify-center transition-all duration-200 active:scale-95 px-1"
    >
      <div className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-300 overflow-hidden ${
        active 
            ? 'bg-[var(--theme-primary)] text-white scale-105 shadow-lg shadow-[var(--theme-primary)]/25' 
            : 'text-zinc-500 hover:bg-[var(--theme-primary)]/10 hover:text-[var(--theme-primary)]'
      }`}>
        <User
          size={24}
          strokeWidth={active ? 2.5 : 2}
          className={`transition-colors duration-300`}
        />
        {/* Active Indicator inside the button */}
        {active && (
           <span className="absolute -bottom-1 w-8 h-1 rounded-full bg-white/50 blur-sm"></span>
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
          'relative w-full max-w-[140px] h-9 rounded-full px-3 text-[12px] font-bold text-white shadow-md overflow-hidden flex items-center justify-center ring-[2px] ring-white/90 transition-[box-shadow,transform] duration-200 ' +
          (disabled
            ? 'bg-slate-400/60'
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
    location.pathname.startsWith('/designer-v2-1/') ||
    location.pathname === '/tryon' ||
    location.pathname.startsWith('/tryon/');

  const isActive = (path: string) => {
    if (path === '/designer' || path === '/designer-v2-1' || path === '/tryon') return isInDesigner;
    return location.pathname === path;
  };

  const resolvedProductId =
    getDesignerProductIdFromPath(location.pathname) ||
    getDesignerProductIdFromSelectedTemplateId(selectedTemplateId);

  const handlePlaceOrder = () => {
    if (!resolvedProductId) return;
    navigate(`/measurements/${resolvedProductId}`, {
      state: { productId: resolvedProductId, templateId: selectedTemplateId, source: 'tryon' },
    });
  };

  const isTailor = user?.role === 'tailor';
  const isBoutique = user?.role === 'boutique';
  const isShop = user?.role === 'shop';
  const isRegularUser = !user || user.role === 'user'; 

  const isRTL = i18n.dir() === 'rtl';

  return (
    // Fixed bottom navigation bar
    <div
      className="bottom-nav fixed bottom-0 left-0 right-0 z-50 !bg-white backdrop-blur-xl border border-zinc-300/70 ring-1 ring-zinc-200/90 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] pb-1 md:pb-0 rounded-t-3xl"
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 4px)',
        backgroundColor: '#ffffff',
      }}
    >
      {/* Container - stretch items completely with standard mobile tab bar spacing */}
      <div className="flex items-center justify-around h-16 w-full max-w-md mx-auto px-2">

        {/* Guest layout: Home / Account / Designer */}
        {!user && (
          <div className={`flex items-center justify-around w-full ${isRTL ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={() => navigate('/')}              title="حسابي"              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                isActive('/')
                    ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/25'
                    : 'text-zinc-500 hover:bg-[var(--theme-primary)]/10 hover:text-[var(--theme-primary)]'
              }`}
            >
              <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
              {isActive('/') && (
                <span className="absolute -bottom-1 w-8 h-1 rounded-full bg-white/50 blur-sm"></span>
              )}
            </button>

            <button
              onClick={() => {
                requestLoginPrompt('user_action');
              }}
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 ${
                isActive('/account')
                    ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/25'
                    : 'text-zinc-500 hover:bg-[var(--theme-primary)]/10 hover:text-[var(--theme-primary)]'
              }`}
            >
              <User size={24} strokeWidth={isActive('/account') ? 2.5 : 2} />
              {isActive('/account') && (
                <span className="absolute -bottom-1 w-8 h-1 rounded-full bg-white/50 blur-sm"></span>
              )}
            </button>

            <button
              onClick={() => navigate('/tryon')}
              title="المصمم"
              className={`relative flex h-12 w-12 items-center justify-center rounded-2xl transition-all duration-200 overflow-hidden ${
                isActive('/designer') || isActive('/designer-v2-1') || isActive('/tryon')
                    ? 'bg-[var(--theme-primary)] text-white shadow-lg shadow-[var(--theme-primary)]/25'
                    : 'bg-[var(--theme-primary)]/5 text-[var(--theme-primary)] hover:bg-[var(--theme-primary)]/15'
              }`}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full bg-white/40"
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
                location.pathname === '/tailor-account' ||
                location.pathname === '/boutique-account' ||
                location.pathname === '/shop-account' ||
                location.pathname === '/admin' ||
                location.pathname === '/account' ||
                location.pathname.startsWith('/tailor-account/') ||
                location.pathname.startsWith('/boutique-account/') ||
                location.pathname.startsWith('/shop-account/') ||
                location.pathname.startsWith('/admin/') ||
                location.pathname.startsWith('/account/')
              }
              onClick={() => {
                navigate(
                  user?.role === 'tailor'
                    ? '/tailor-account'
                    : user?.role === 'boutique'
                      ? '/boutique-account'
                      : user?.role === 'shop'
                        ? '/shop-account'
                        : '/account'
                );
              }}
            />

            <FooterNavItem 
              icon={PenTool} 
              label={t('navDesigner') || 'Designer'} 
              active={isInDesigner} 
              onClick={() => navigate('/tryon')} 
            />

            <FooterNavItem 
              icon={user?.role === 'admin' ? LayoutDashboard : BarChart3} 
              label={user?.role === 'admin' ? (t('navDashboard') || 'Admin') : (t('navStats') || 'Stats')} 
              active={user?.role === 'admin' ? location.pathname.startsWith('/admin') : isActive('/stats')} 
              onClick={() => navigate(user?.role === 'admin' ? '/admin' : '/stats')} 
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
