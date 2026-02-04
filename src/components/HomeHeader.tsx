import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const HomeHeader = React.memo(function HomeHeader() {
  const { user, loading: authLoading } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  // Debug logging
  React.useEffect(() => {
    console.log('[HomeHeader] User state:', { 
      hasUser: !!user, 
      userId: user?.id, 
      userName: user?.name,
      authLoading 
    });
  }, [user, authLoading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Wait for auth to settle before making assumptions
  if (authLoading) {
    return (
      <div className="space-y-4 mb-6 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-slate-700" />
            <div className="space-y-2">
              <div className="h-3 w-24 bg-slate-700 rounded" />
              <div className="h-4 w-32 bg-slate-700 rounded" />
            </div>
          </div>
          <div className="h-10 w-10 rounded-lg bg-slate-700" />
        </div>
        <div className="h-12 bg-slate-800/60 rounded-xl" />
      </div>
    );
  }

  // Use a safer fallback while user data might be partially loaded
  const isGuest = !user && !authLoading;
  const userName = user?.name || user?.email?.split('@')[0] || (isGuest ? 'Guest' : '');

  return (
    <div className="flex flex-col gap-8 py-6">
      {/* Top Bar: Logo/Title and User Actions */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-1 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span className="text-xl font-bold tracking-tight text-[var(--studio-text)] uppercase italic">Khuyoot <span className="text-blue-500">Studio</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/notifications')}
            className="p-2.5 rounded-xl bg-[var(--studio-card)] border border-[var(--studio-card-border)] text-[var(--studio-text-muted)] hover:text-[var(--studio-text)] hover:shadow-lg transition-all"
          >
            <Bell size={18} />
          </button>
          
          <div 
            onClick={() => navigate('/account')}
            className="h-10 w-10 rounded-full overflow-hidden border border-[var(--studio-card-border)] cursor-pointer hover:border-blue-500 transition-colors shadow-sm"
          >
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-[var(--studio-card)] flex items-center justify-center text-[var(--studio-text-muted)] font-medium text-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero / Search Section */}
      <div className="relative group max-w-2xl">
        <form onSubmit={handleSearch} className="relative z-10">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-[var(--studio-text-muted)]">
               <Search size={20} />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates, designers, or materials..."
              className="w-full h-14 pl-12 pr-4 bg-[var(--studio-card)] border border-[var(--studio-card-border)] rounded-2xl text-[var(--studio-text)] placeholder:text-[var(--studio-text-muted)] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all duration-300 shadow-sm"
            />
            <div className="absolute right-4 hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--studio-bg)] border border-[var(--studio-card-border)] text-[10px] font-normal text-[var(--studio-text-muted)] uppercase tracking-tight">
               <span>⌘</span>
               <span>K</span>
            </div>
          </div>
        </form>
        {/* Decorative Glow */}
        <div className="absolute -inset-1 bg-blue-500/5 blur-2xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </div>
  );
});
