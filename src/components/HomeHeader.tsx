import React from 'react';
import { Bell, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';

export const HomeHeader = React.memo(function HomeHeader() {
  const { user } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const userName = user?.name || user?.email?.split('@')[0] || 'Guest';

  return (
    <div className="space-y-4 mb-6 px-4">
      {/* User Greeting */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* User Avatar */}
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-700">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={userName}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-slate-700 flex items-center justify-center text-slate-300 font-semibold text-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Greeting Text */}
          <div>
            <p className="text-sm text-slate-400">Good to see you,</p>
            <h1 className="text-lg font-semibold text-white">{userName}</h1>
          </div>
        </div>

        {/* Notification Bell */}
        <button
          onClick={() => navigate('/notifications')}
          className="relative p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={24} className="text-slate-300" />
          {/* Notification Badge */}
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
        </button>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Find your next adventure"
            className="w-full h-12 pl-4 pr-12 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
          />
          <button
            type="submit"
            className="absolute right-2 h-8 w-8 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            aria-label="Search"
          >
            <Search size={18} className="text-slate-300" />
          </button>
        </div>
      </form>
    </div>
  );
});
