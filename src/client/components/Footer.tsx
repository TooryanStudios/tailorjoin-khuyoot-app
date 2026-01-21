import React from 'react';
import { Home, Layers, ShoppingCart, PenTool, Scissors, ClipboardList, PackageOpen, Store, Box } from 'lucide-react';
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
      className="group flex flex-1 flex-col items-center justify-start pt-3 gap-1 transition-all duration-200 active:scale-95 h-full"
    >
      <div className={`relative p-0.5 transition-all duration-300 ${active ? '-translate-y-1' : ''}`}>
        <Icon
          size={26}
          strokeWidth={active ? 2.5 : 2}
          className={`transition-colors duration-300 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}
        />

        {active && <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />}
      </div>

      <span
        className={`text-[10px] font-medium transition-colors duration-300 ${active ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
      >
        {label}
      </span>
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
      className="group flex flex-1 flex-col items-center justify-start pt-3 gap-1 transition-all duration-200 active:scale-95 h-full"
    >
      <div
        className={`relative h-7 w-7 transition-all duration-300 ${
          active ? '-translate-y-1 ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a1a] rounded-full' : ''
        }`}
      >
        {user?.profileImage ? (
          <img src={user.profileImage} alt={t('accountImageAlt')} className="h-full w-full rounded-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}

        {!active && (
          <span
            className={`absolute -bottom-1.5 -right-2 scale-[0.65] ${badge.cls} text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ring-2 ring-white dark:ring-[#1a1a1a]`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <span
        className={`text-[10px] font-medium transition-colors duration-300 ${active ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
      >
        {label}
      </span>
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
  const { t } = useTranslation('common');
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

  return (
    // Mobile-only bottom navigation. On desktop, this takes visual space and feels oversized.
    <div
      className="bottom-nav fixed bottom-0 left-0 right-0 w-full bg-white/10 dark:bg-black/10 backdrop-blur-xl border-t border-white/20 dark:border-white/10 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.08)] overflow-visible shrink-0 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)', display: 'flex' }}
    >
      <style>{`
        @keyframes khuyootFooterShine {
          0%   { transform: translateX(-160%) rotate(18deg); }
          55%  { transform: translateX(160%) rotate(18deg); }
          100% { transform: translateX(160%) rotate(18deg); }
        }
      `}</style>
      {/* Container height increased slightly to accommodate lifted icons */}
      <div className="mx-auto flex h-[74px] w-full max-w-lg items-start justify-between px-2">

        <FooterNavItem icon={Home} label={t('navHome')} active={isActive('/')} onClick={() => navigate('/')} />

        {!loading && (
          <>
            {isRegularUser && (
              <FooterNavItem
                icon={Layers}
                label={t('navCollections')}
                active={isActive('/collections')}
                onClick={() => navigate('/collections')}
              />
            )}
            {isTailor && (
              <FooterNavItem
                icon={Scissors}
                label={t('navMyProducts')}
                active={isActive('/tailor/collections')}
                onClick={() => navigate('/tailor/collections')}
              />
            )}
            {isBoutique && (
              <FooterNavItem
                icon={PackageOpen}
                label={t('orders')}
                active={isActive('/boutique/orders')}
                onClick={() => navigate('/boutique/orders')}
              />
            )}
            {isShop && (
              <FooterNavItem
                icon={Store}
                label={t('orders')}
                active={isActive('/shop/orders')}
                onClick={() => navigate('/shop/orders')}
              />
            )}
          </>
        )}

        {appSettings.designerEnabled &&
          (isInDesigner ? (
            <FooterPlaceOrderCTA onClick={handlePlaceOrder} disabled={!resolvedProductId} />
          ) : (
            <FooterNavItem
              icon={PenTool}
              label={t('navDesigner')}
              active={isInDesigner}
              onClick={() => navigate('/designer-v2-1')}
            />
          ))}
        
        {!loading && (
          <>
            {appSettings.cartEnabled && isRegularUser && (
              <FooterNavItem
                icon={ShoppingCart}
                label={t('cart')}
                active={isActive('/cart')}
                onClick={() => navigate('/cart')}
              />
            )}
            {isTailor && (
              <FooterNavItem
                icon={ClipboardList}
                label={t('orders')}
                active={isActive('/tailor/orders')}
                onClick={() => navigate('/tailor/orders')}
              />
            )}
            {isShop && (
              <FooterNavItem
                icon={Box}
                label={t('navInventory')}
                active={isActive('/shop/inventory')}
                onClick={() => navigate('/shop/inventory')}
              />
            )}
          </>
        )}

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
          onClick={() =>
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
            )
          }
        />
      </div>
    </div>
  );
}
