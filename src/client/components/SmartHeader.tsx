import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../../context/AppContext';
import { requestLoginPrompt } from '../../auth/authEvents';
import { User, Menu, X, LogIn, UserPlus } from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const SmartHeader: React.FC = () => {
  const { user, loading, logout } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('common');
  const isTryOnRoute = location.pathname.startsWith('/tryon');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const handleLogin = () => {
    requestLoginPrompt('user_action');
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getDashboardPath = () => {
    if (!user) return '/account';
    switch (user.role) {
      case 'tailor': return '/tailor-account';
      case 'boutique': return '/boutique-account';
      case 'shop': return '/shop-account';
      case 'admin': return '/admin';
      default: return '/account';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 py-3 transition-all duration-300">
      <div className="mx-auto max-w-7xl">
        <div className="relative flex items-center justify-between rounded-2xl bg-white/80 dark:bg-slate-900/80 px-4 py-2 shadow-lg backdrop-blur-md border border-white/20 dark:border-white/5">
          
          {/* Logo / Brand */}
          <div 
            className="flex cursor-pointer items-center gap-2" 
            onClick={() => navigate('/')}
          >
            <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-tr from-emerald-400 to-teal-500 shadow-md flex items-center justify-center text-white font-bold text-lg">
              خ
            </div>
            <span className="hidden text-lg font-bold text-slate-800 dark:text-white sm:block">
              Khuyoot
            </span>
          </div>

          {/* Desktop Navigation - Center */}
          <nav className="hidden items-center gap-6 md:flex">
            <button 
              onClick={() => navigate('/')}
              className={`text-sm font-medium transition-colors hover:text-emerald-500 ${
                location.pathname === '/' ? 'text-emerald-500 font-bold' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              {t('navHome') || 'Home'}
            </button>
            <button 
               onClick={() => navigate('/tryon')}
               className={`text-sm font-medium transition-colors hover:text-emerald-500 ${
                isTryOnRoute ? 'text-emerald-500 font-bold' : 'text-slate-600 dark:text-slate-300'
               }`}
            >
              {t('navDesigner') || 'Try On'}
            </button>
          </nav>

          {/* User Actions - Right */}
          <div className="flex items-center gap-3">
            {loading ? (
              // Loading Skeleton
              <div className="h-9 w-24 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
            ) : user ? (
              // Signed In State
              <div className="flex items-center gap-3">
                <div 
                   onClick={() => navigate(getDashboardPath())}
                   className="group relative flex cursor-pointer items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 py-1 pl-1 pr-4 transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  <div className="relative">
                      <Avatar 
                        src={user.profileImage} 
                        name={user.name} 
                        size="sm"
                        className="border border-emerald-500/50"
                      />
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 dark:border-slate-900"></span>
                    </div>
                  <div className="flex flex-col items-start">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[100px] truncate">
                      {user.name}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 capitalize">
                      {user.role}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              // Guest State
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-1.5 rounded-full bg-emerald-500 px-4 py-1.5 text-sm font-semibold text-white transition-all hover:bg-emerald-600 shadow-md hover:shadow-lg active:scale-95"
                >
                  <LogIn size={16} />
                  <span>{t('signIn') || 'Sign In'}</span>
                </button>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 md:hidden hover:bg-slate-200 dark:hover:bg-slate-700"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-20 left-4 right-4 z-40 rounded-2xl bg-white/95 dark:bg-slate-900/95 p-4 shadow-xl backdrop-blur-xl border border-white/20 md:hidden animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => navigate('/')}
              className="flex items-center gap-3 rounded-xl p-3 text-left font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                <span className="text-xs">H</span>
              </div>
              {t('navHome') || 'Home'}
            </button>
             <button 
              onClick={() => navigate('/tryon')}
              className="flex items-center gap-3 rounded-xl p-3 text-left font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-theme-primary/10 text-theme-primary dark:bg-theme-primary/20 dark:text-theme-primary">
                <span className="text-xs">D</span>
              </div>
              {t('navDesigner') || 'Designer'}
            </button>
            {user && (
              <button 
                onClick={handleLogout}
                className="mt-2 flex items-center gap-3 rounded-xl bg-red-50 p-3 text-left font-medium text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
              >
                Sign Out
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
