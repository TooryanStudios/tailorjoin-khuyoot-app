import React from 'react';
import { Home, Layers, ShoppingCart, PenTool, Scissors, ClipboardList, PackageOpen, Store, Box, Wand2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';

export const Footer = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
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

  const isActive = (path: string) => location.pathname === path;
  const isInDesigner = location.pathname === '/designer' || location.pathname.startsWith('/designer/');

  const NavItem = ({ icon: Icon, label, path, isCenter = false }: { icon: any, label: string, path: string, isCenter?: boolean }) => {
    const active = isActive(path);

    // 1. Center "Designer" Button - Shifted UP significantly (-top-9)
    if (isCenter) {
      const centerIsGenerate = isInDesigner;
      const CenterIcon = centerIsGenerate ? Wand2 : Icon;
      const centerLabel = centerIsGenerate ? 'توليد' : label;

      return (
        <button 
          onClick={() => {
            if (centerIsGenerate) {
              try {
                window.dispatchEvent(new CustomEvent('khuyoot:designer-generate'));
              } catch {
                // ignore
              }
              return;
            }
            navigate(path);
          }}
          className="group relative -top-9 flex flex-col items-center justify-center p-1"
        >
          {/* Restored Blue/Indigo Gradient */}
          <div
            className="relative overflow-hidden flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 ring-[6px] ring-white dark:ring-[#1a1a1a] transition-transform duration-200 active:scale-95"
          >
            {centerIsGenerate ? (
              <span aria-hidden="true" className="absolute inset-0 pointer-events-none motion-reduce:hidden">
                <span
                  className="absolute -inset-y-4 left-0 w-[60%] bg-gradient-to-r from-transparent via-white/45 to-transparent blur-[1px]"
                  style={{ animation: 'khuyootFooterShine 1.6s ease-in-out infinite' }}
                />
              </span>
            ) : null}
            <CenterIcon
              size={24}
              strokeWidth={2.5}
              className="relative transition-transform duration-300 group-hover:rotate-12"
            />
          </div>
          {/* Label sits exactly on the border line */}
          <span className="absolute -bottom-6 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-black/50 px-2 rounded-full backdrop-blur-sm">
            {centerLabel}
          </span>
        </button>
      );
    }

    // 2. Standard Items - Shifted UP using 'pb-1' and alignments
    return (
      <button 
        onClick={() => navigate(path)}
        className="group flex flex-1 flex-col items-center justify-start pt-3 gap-1 transition-all duration-200 active:scale-95 h-full"
      >
        <div className={`relative p-0.5 transition-all duration-300 ${active ? '-translate-y-1' : ''}`}>
           {/* Restored Blue Color */}
           <Icon 
             size={26} 
             strokeWidth={active ? 2.5 : 2} 
             className={`transition-colors duration-300 ${active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`} 
           />
           
           {/* Blue Active Dot */}
           {active && (
             <span className="absolute -bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blue-600 dark:bg-blue-400" />
           )}
        </div>
        
        <span className={`text-[10px] font-medium transition-colors duration-300 ${active ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {label}
        </span>
      </button>
    );
  };

  const roleBadge = (role?: string) => {
    switch (role) {
      case 'tailor': return { text: 'خياط', cls: 'bg-amber-500' };
      case 'boutique': return { text: 'بوتيك', cls: 'bg-purple-500' };
      case 'shop': return { text: 'محل', cls: 'bg-green-500' };
      case 'admin': return { text: 'إدارة', cls: 'bg-red-500' };
      default: return { text: 'حساب', cls: 'bg-blue-500' };
    }
  };

  const AccountItem = ({ label, path }: { label: string, path: string }) => {
    const badge = roleBadge(user?.role);
    const active = isActive(path);

    return (
      <button
        onClick={() => navigate(path)}
        className="group flex flex-1 flex-col items-center justify-start pt-3 gap-1 transition-all duration-200 active:scale-95 h-full"
      >
        <div className={`relative h-7 w-7 transition-all duration-300 ${active ? '-translate-y-1 ring-2 ring-blue-500 ring-offset-2 ring-offset-white dark:ring-offset-[#1a1a1a] rounded-full' : ''}`}>
          {user?.profileImage ? (
            <img src={user.profileImage} alt="صورة الحساب" className="h-full w-full rounded-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
               <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          )}
          
          {!active && (
            <span className={`absolute -bottom-1.5 -right-2 scale-[0.65] ${badge.cls} text-white px-1.5 py-0.5 rounded-full text-[9px] font-bold shadow-sm ring-2 ring-white dark:ring-[#1a1a1a]`}>
                {badge.text}
            </span>
          )}
        </div>
        <span className={`text-[10px] font-medium transition-colors duration-300 ${active ? 'text-blue-600 font-bold dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {label}
        </span>
      </button>
    );
  };

  const isTailor = user?.role === 'tailor';
  const isBoutique = user?.role === 'boutique';
  const isShop = user?.role === 'shop';
  const isRegularUser = !user || user.role === 'user'; 

  return (
    // Mobile-only bottom navigation. On desktop, this takes visual space and feels oversized.
    <div className="fixed bottom-0 left-0 z-50 w-full bg-white dark:bg-[#1a1a1a] border-t border-slate-100 dark:border-slate-800 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      <style>{`
        @keyframes khuyootFooterShine {
          0%   { transform: translateX(-160%) rotate(18deg); }
          55%  { transform: translateX(160%) rotate(18deg); }
          100% { transform: translateX(160%) rotate(18deg); }
        }
      `}</style>
      {/* Container height increased slightly to accommodate lifted icons */}
      <div className="mx-auto flex h-[74px] max-w-lg items-start justify-between px-2">
        
        <NavItem icon={Home} label="الرئيسية" path="/" />

        {!loading && (
          <>
            {isRegularUser && <NavItem icon={Layers} label="المجموعات" path="/collections" />}
            {isTailor && <NavItem icon={Scissors} label="منتجاتي" path="/tailor/collections" />}
            {isBoutique && <NavItem icon={PackageOpen} label="الطلبات" path="/boutique/orders" />}
            {isShop && <NavItem icon={Store} label="الطلبات" path="/shop/orders" />}
          </>
        )}
        
        {/* Center Button Container */}
        {appSettings.designerEnabled && (
          <div className="w-16 flex justify-center">
             <NavItem icon={PenTool} label="المصمم" path="/designer" isCenter={true} />
          </div>
        )}
        
        {!loading && (
          <>
            {appSettings.cartEnabled && isRegularUser && <NavItem icon={ShoppingCart} label="السلة" path="/cart" />}
            {isTailor && <NavItem icon={ClipboardList} label="الطلبات" path="/tailor/orders" />}
            {isShop && <NavItem icon={Box} label="المخزون" path="/shop/inventory" />}
          </>
        )}

        <AccountItem 
          label="الحساب"
          path={
            user?.role === 'tailor' ? '/tailor-account' :
            user?.role === 'boutique' ? '/boutique-account' :
            user?.role === 'shop' ? '/shop-account' :
            user?.role === 'admin' ? '/admin' :
            '/account'
          }
        />
      </div>
    </div>
  );
};