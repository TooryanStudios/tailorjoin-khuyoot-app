import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Menu, X, Instagram, Twitter, Facebook, User, ChevronDown, LogOut, Scissors, ClipboardList, Store, LayoutDashboard, Package } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MontHeader = React.memo(function MontHeader() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, loading, logout, toggleAuthModal, cartCount, ordersCount } = useApp();
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const onPointerDown = (e: MouseEvent | PointerEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', onPointerDown);
    return () => window.removeEventListener('mousedown', onPointerDown);
  }, [userMenuOpen]);

  const roleLinks = useMemo(() => {
    // Determine user role - handle legacy roles and new shopType model
    if (!user) {
      console.log('[MontHeader] No user - returning empty links');
      return [];
    }
    
    let role = user.role;
    const shopType = (user as any).shopType;
    
    // Debug logging with actual values
    console.log('[MontHeader] User role detection:', { 
      originalRole: user.role,
      roleType: typeof user.role,
      shopType, 
      userName: user.name,
      email: user.email,
      userKeys: Object.keys(user)
    });
    
    if (role === 'tailor' && shopType) {
      if (shopType === 'boutique') role = 'boutique';
      else if (shopType === 'shop' || shopType === 'fabric_store' || shopType === 'sewing_supplies') {
        role = 'shop';
      }
    }

    const links = {
      admin: [
        { id: 'admin', label: 'لوحتي', path: '/admin', icon: LayoutDashboard },
        { id: 'shop', label: 'المنتجات', path: '/female', icon: ShoppingBag },
        { id: 'orders', label: 'طلباتي', path: '/orders', icon: Package, badge: ordersCount },
        { id: 'account', label: 'حسابي', path: '/account', icon: User },
      ],
      tailor: [
        { id: 'products', label: 'منتجاتي', path: '/tailor/collections', icon: Scissors },
        { id: 'orders', label: 'الطلبات', path: '/tailor/orders', icon: ClipboardList, badge: ordersCount },
        { id: 'dashboard', label: 'لوحتي', path: '/tailor-dashboard', icon: LayoutDashboard },
      ],
      boutique: [
        { id: 'orders', label: 'طلباتي', path: '/boutique/orders', icon: Package, badge: ordersCount },
        { id: 'dashboard', label: 'لوحتي', path: '/boutique-account', icon: Store },
      ],
      shop: [
        { id: 'orders', label: 'طلباتي', path: '/shop/orders', icon: Store, badge: ordersCount },
        { id: 'dashboard', label: 'لوحتي', path: '/shop-account', icon: Store },
      ],
      user: [
        { id: 'tracking', label: 'طلباتي', path: '/orders', icon: Package },
        { id: 'dashboard', label: 'حسابي', path: '/account', icon: User },
      ],
      customer: [
        { id: 'tracking', label: 'طلباتي', path: '/orders', icon: Package },
        { id: 'dashboard', label: 'حسابي', path: '/account', icon: User },
      ],
    };

    const result = links[role as keyof typeof links] || [];
    console.log('[MontHeader] Final roleLinks:', { role, linksCount: result.length, links: result });
    return result;
  }, [user, ordersCount]);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-[#ededed] z-[10000]">
        <div className="max-w-[1400px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-8">
            <button className="md:hidden text-black/80 hover:text-black transition-colors" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            
            <div className="text-xl md:text-2xl font-black tracking-tighter uppercase cursor-pointer text-black" onClick={() => navigate('/')}>KHUYOOT</div>
            <div className="hidden md:flex items-center gap-6 text-[11px] font-bold text-black">
              <button onClick={() => navigate('/')} className="hover:text-black transition-colors">الرئيسية</button>
              
              {/* Dynamic Role Links */}
              {roleLinks.map(link => (
                <button 
                  key={link.id} 
                  onClick={() => navigate(link.path)} 
                  className="hover:text-black transition-colors flex items-center gap-1"
                >
                  {link.label}
                  {link.badge && link.badge > 0 ? (
                    <span className="bg-[var(--theme-primary)] text-white text-[8px] w-3 h-3 rounded-full flex items-center justify-center">
                      {link.badge}
                    </span>
                  ) : null}
                </button>
              ))}

              <button onClick={() => navigate('/tailors')} className="hover:text-black transition-colors">الخياطون</button>
              <button onClick={() => {}} className="hover:text-black transition-colors">تواصل</button>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="relative hidden sm:block bg-white rounded-full border border-zinc-300 overflow-hidden h-[34px] w-52 shadow-sm">
              <input 
                type="text" 
                placeholder="...Search" 
                className="w-full h-full bg-white border-none pl-10 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400 text-black placeholder-zinc-500 appearance-none"
                autoComplete="off"
              />
              <Search size={14} className="absolute left-3 text-zinc-500 pointer-events-none" />
            </div>
            
            {loading ? (
              <div className="w-10 h-10 rounded-full bg-zinc-200 animate-pulse" />
            ) : user ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 p-1 pr-3 bg-white border border-zinc-200 rounded-full hover:bg-zinc-50 transition-colors"
                >
                  <img 
                    src={user.profileImage || user.avatar || '/placeholders/avatar.svg'} 
                    alt={user.name}
                    className="w-6 h-6 rounded-full object-cover border border-zinc-100"
                  />
                  <ChevronDown size={12} className={`text-zinc-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <div className="absolute left-0 mt-2 w-48 bg-white border border-zinc-200 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-[9999]">
                    <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/50">
                      <p className="text-xs font-bold text-zinc-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                    </div>
                    
                    {user.role === 'admin' && (
                      <button
                        onClick={() => {
                          navigate('/account');
                          setUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                      >
                        <User size={14} className="text-purple-500" />
                        <span>حسابي الشخصي</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        const path = user.role === 'admin' ? '/admin' : 
                                    user.role === 'tailor' ? '/tailor-dashboard' : 
                                    user.role === 'boutique' ? '/boutique-account' :
                                    user.role === 'shop' ? '/shop-account' : '/account';
                        navigate(path);
                        setUserMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-zinc-700 hover:bg-zinc-50 transition-colors flex items-center gap-2"
                    >
                      <LayoutDashboard size={14} className="text-blue-500" />
                      <span>{user.role === 'admin' ? 'لوحة تحكم المسؤول' : 'لوحة التحكم'}</span>
                    </button>

                    <button
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                        navigate('/');
                      }}
                      className="w-full px-4 py-2.5 text-[11px] font-bold text-left text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <LogOut size={14} />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => toggleAuthModal(true)}
                className="bg-[var(--theme-primary)] text-white px-6 py-2 rounded-full text-[10px] font-normal uppercase tracking-widest hover:bg-zinc-800 transition"
              >
                JOIN
              </button>
            )}

            <div className="relative p-2 bg-white rounded-full border border-zinc-200 shadow-sm cursor-pointer" onClick={() => navigate('/cart')}>
              <ShoppingBag size={18} className="text-black" />
              {(cartCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-theme-primary text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 top-[60px] z-[9990] bg-[#ededed] p-6 md:hidden animate-in slide-in-from-top-4 duration-200 overflow-y-auto">
            <div className="flex flex-col gap-6 text-xl font-normal uppercase tracking-widest text-black/80">
              <a href="/" className="border-b border-black/5 pb-4" onClick={() => setIsMobileMenuOpen(false)}>الرئيسية</a>
              <a href="#" className="border-b border-black/5 pb-4" onClick={() => setIsMobileMenuOpen(false)}>من نحن</a>
              <a href="#" className="border-b border-black/5 pb-4" onClick={() => setIsMobileMenuOpen(false)}>المتجر</a>
              <a href="#" className="border-b border-black/5 pb-4" onClick={() => setIsMobileMenuOpen(false)}>العروض</a>
            </div>

            <div className="mt-8 space-y-6">
               <div>
                 <h5 className="text-[10px] font-black uppercase text-zinc-400 mb-2">روابط سريعة</h5>
                 <div className="flex flex-col gap-2 text-sm font-normal text-zinc-600">
                    <a href="#" onClick={(e) => { e.preventDefault(); navigate('/cart'); setIsMobileMenuOpen(false); }}>السلة ({cartCount || 0})</a>
                    
                    {user ? (
                      <>
                        {user.role === 'admin' && (
                          <a href="#" onClick={(e) => { e.preventDefault(); navigate('/female'); setIsMobileMenuOpen(false); }}>تصفح المنتجات</a>
                        )}
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/orders'); setIsMobileMenuOpen(false); }}>طلباتي الشخصية</a>
                        <a href="#" onClick={(e) => { e.preventDefault(); navigate('/account'); setIsMobileMenuOpen(false); }}>حسابي الشخصي</a>
                        <a href="#" onClick={(e) => { 
                          e.preventDefault(); 
                          const path = user.role === 'admin' ? '/admin' : 
                                      user.role === 'tailor' ? '/tailor-dashboard' : '/account';
                          navigate(path); 
                          setIsMobileMenuOpen(false); 
                        }}>لوحة التحكم</a>
                        <a href="#" onClick={async (e) => { 
                          e.preventDefault(); 
                          await logout(); 
                          navigate('/'); 
                          setIsMobileMenuOpen(false); 
                        }} className="text-red-500">تسجيل الخروج</a>
                      </>
                    ) : (
                      <a href="#" onClick={(e) => { e.preventDefault(); toggleAuthModal(true); setIsMobileMenuOpen(false); }}>تسجيل الدخول / الانضمام</a>
                    )}
                 </div>
               </div>

               {user?.role === 'tailor' && (
                 <div>
                   <h5 className="text-[10px] font-black uppercase text-zinc-400 mb-2">إدارة الخياط</h5>
                   <div className="flex flex-col gap-2 text-sm font-normal text-zinc-600">
                      <a href="#" onClick={(e) => { e.preventDefault(); navigate('/tailor/collections'); setIsMobileMenuOpen(false); }}>منتجاتي</a>
                      <a href="#" onClick={(e) => { e.preventDefault(); navigate('/tailor/orders'); setIsMobileMenuOpen(false); }}>الطلبات الواردة</a>
                   </div>
                 </div>
               )}

               <div>
                 <h5 className="text-[10px] font-black uppercase text-zinc-400 mb-2">تابعنا</h5>
                 <div className="flex gap-4">
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black border border-zinc-200" title="انستجرام"><Instagram size={18} /></a>
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black border border-zinc-200" title="تويتر"><Twitter size={18} /></a>
                    <a href="#" className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-black border border-zinc-200" title="فيسبوك"><Facebook size={18} /></a>
                 </div>
               </div>
            </div>

            {user ? (
               <div className="mt-8 space-y-4">
                 <button 
                  onClick={() => {
                    const path = user.role === 'admin' ? '/admin' : 
                                user.role === 'tailor' ? '/tailor-dashboard' : '/account';
                    navigate(path);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full bg-black text-white py-3 rounded-full text-xs font-normal uppercase tracking-widest flex items-center justify-center gap-2"
                 >
                   <LayoutDashboard size={14} />
                   <span>{user.role === 'admin' ? 'لوحة تحكم المسؤول' : 'الذهاب إلى لوحة التحكم'}</span>
                 </button>
               </div>
            ) : (
              <div className="mt-8">
                 <button onClick={() => { toggleAuthModal(true); setIsMobileMenuOpen(false); }} className="w-full bg-[var(--theme-primary)] text-white py-3 rounded-full text-xs font-normal uppercase tracking-widest">Join Community</button>
              </div>
            )}
        </div>
      )}

      {/* Spacer for fixed header */}
      <div className="h-[72px]" />
    </>
  );
});
