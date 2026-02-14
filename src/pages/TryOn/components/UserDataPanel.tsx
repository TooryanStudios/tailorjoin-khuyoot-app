import React from 'react';
import { apiJson } from '../../../api/apiFetch';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useCredits } from '../../../modules/CreditManager/CreditProvider';
import { useAuth } from '../../../auth/useAuth';

interface UserDataPanelProps {
  className?: string;
}

export const UserDataPanel: React.FC<UserDataPanelProps> = ({ className = '' }) => {
  const { status } = useAuth();
  const { currentBalance, refresh: refreshCredits } = useCredits();
    const [serverUser, setServerUser] = React.useState<any>(() => { try { const cached = sessionStorage.getItem("designer_user_cache"); return cached ? JSON.parse(cached) : null; } catch (e) { return null; } }); const [generationHistory, setGenerationHistory] = React.useState<any[]>(() => { try { const cached = sessionStorage.getItem("designer_history_cache"); return cached ? JSON.parse(cached) : []; } catch (e) { return []; } }); const [closetItems, setClosetItems] = React.useState<any[]>(() => { try { const cached = sessionStorage.getItem("designer_closet_cache"); return cached ? JSON.parse(cached) : []; } catch (e) { return []; } }); const [historyLoading, setHistoryLoading] = React.useState(false); const [closetLoading, setClosetLoading] = React.useState(false);
  const [userLoading, setUserLoading] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  const [showHistory, setShowHistory] = React.useState(false);
  const [showCloset, setShowCloset] = React.useState(false);
  const [showCredits, setShowCredits] = React.useState(true);

  const fetchUserData = async () => {
    if (status !== 'authenticated') return;
    setUserLoading(true);
    try {
      const data = await apiJson<any>('/api/auth/me', { retryOnUnauthorized: false });
      setServerUser(data); sessionStorage.setItem("designer_user_cache", JSON.stringify(data));
    } catch (err: any) {
      console.error('Failed to fetch user data:', err);
    } finally {
      setUserLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (status !== 'authenticated') return;
    if (generationHistory.length === 0) setHistoryLoading(true);
    try {
      const data = await apiJson<any>('/api/designer-v2-1/history?limit=20', { retryOnUnauthorized: false });
      const historyData = data.generations || data || []; setGenerationHistory(historyData); sessionStorage.setItem("designer_history_cache", JSON.stringify(historyData));
    } catch (err: any) {
      console.error('Failed to fetch generation history:', err);
      setGenerationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchClosetItems = async () => {
    if (closetItems.length === 0) setClosetLoading(true);
    try {
      if (serverUser?.closet || serverUser?.savedItems) {
        const closetData = serverUser.closet || serverUser.savedItems || []; setClosetItems(closetData); sessionStorage.setItem("designer_closet_cache", JSON.stringify(closetData));
      } else {
        setClosetItems([]);
      }
    } catch (err: any) {
      console.error('Failed to fetch closet:', err);
      setClosetItems([]);
    } finally {
      setClosetLoading(false);
    }
  };

  React.useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
    
    // Global event listener to allow other components to trigger a silent refresh
    const handleRefresh = () => {
      if (status !== 'authenticated') return;
      fetchUserData();
      refreshCredits();
    };
    window.addEventListener('khuyoot:refresh-user-data', handleRefresh);
    return () => window.removeEventListener('khuyoot:refresh-user-data', handleRefresh);
  }, [status, refreshCredits]);

  React.useEffect(() => {
    if (serverUser) {
      fetchHistory();
      fetchClosetItems();
    }
  }, [serverUser]);

  const tier = serverUser?.billing?.tier ?? serverUser?.tier ?? 'free';

  return (
    <div className={`flex flex-col gap-2 ${className} transition-all duration-300`}>
      {/* Collapsible Widget Header */}
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-2 bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/50 rounded-xl transition-colors group"
      >
        <div className="flex items-center gap-2">
          {/* Profile Image (Small in collapsed state) */}
          <div className="relative">
            {serverUser?.photoURL ? (
              <img
                src={serverUser.photoURL}
                alt="Profile"
                className="w-8 h-8 rounded-full border border-purple-500/50 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff'; }}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-xs font-bold text-purple-300">
                {serverUser?.displayName?.charAt(0) || 'U'}
              </div>
            )}
            {userLoading && (
              <div className="absolute -top-1 -right-1">
                <RefreshCw size={10} className="animate-spin text-amber-500" />
              </div>
            )}
          </div>

          {/* Credit Summary (Always Visible) */}
          <div className="flex flex-col items-start leading-tight">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Credits</span>
            <span className="text-sm font-black text-amber-400 font-mono">
              {currentBalance}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isExpanded && (
            <span className="text-[10px] text-slate-500 font-medium px-1.5 py-0.5 bg-slate-800 rounded">{tier}</span>
          )}
          <div className="text-slate-500 group-hover:text-slate-300 transition-colors">
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </div>
      </button>

      {/* Expanded Details Section */}
      {isExpanded && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Detailed User Info */}
          {serverUser && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
              <div className="text-white font-bold text-sm truncate">{serverUser.displayName || 'User'}</div>
              <div className="text-slate-400 text-xs truncate">{serverUser.email}</div>
              {serverUser.role && (
                <div className="mt-1">
                  <span className="px-1.5 py-0.5 bg-yellow-500/20 border border-yellow-500/30 rounded text-yellow-300 text-[9px] font-semibold uppercase">
                    {serverUser.role}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Credits Detail Sub-panel */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
             <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-black/40 p-2 rounded border border-slate-800/50">
                  <div className="text-slate-500 text-[10px]">Tier</div>
                  <div className="text-slate-200 font-mono">{tier}</div>
                </div>
                <div className="bg-black/40 p-2 rounded border border-slate-800/50">
                  <div className="text-slate-500 text-[10px]">Status</div>
                  <div className="text-slate-200 font-mono text-[10px] truncate">
                    {serverUser?.billing?.subscriptionStatus || 'active'}
                  </div>
                </div>
             </div>
          </div>

          {/* Generation History */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <div className="text-cyan-400 font-bold text-xs uppercase tracking-wider">History</div>
                <div className="text-slate-500 text-[10px]">({generationHistory.length})</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); fetchHistory(); }}
                  disabled={historyLoading}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <RefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
                </button>
                {showHistory ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {showHistory && (
              <div className="mt-2 space-y-2 max-h-64 overflow-y-auto pr-1">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : generationHistory.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-[10px]">No generations yet</div>
                ) : (
                  generationHistory.map((gen: any, idx: number) => (
                    <div key={gen.id || gen.jobId || idx} className="bg-black/40 p-1.5 rounded border border-slate-800/50">
                      <div className="flex gap-2">
                        {(gen.thumbnailUrl || gen.fullImageUrl) && (
                          <img
                            src={gen.thumbnailUrl || gen.fullImageUrl}
                            alt="Gen"
                            className="w-10 h-10 object-cover rounded border border-slate-700 flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 min-w-0 text-[9px]">
                          <div className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase inline-block ${gen.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : gen.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : gen.status === 'failed' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'}`}>
                            {gen.status || 'unknown'}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            {gen.settings?.garmentType || 'Gen'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Closet Items */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-lg p-3">
            <button
              onClick={() => setShowCloset(!showCloset)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <div className="text-purple-400 font-bold text-xs uppercase tracking-wider">Closet</div>
                <div className="text-slate-500 text-[10px]">({closetItems.length})</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); fetchClosetItems(); }}
                  disabled={closetLoading}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <RefreshCw size={12} className={closetLoading ? 'animate-spin' : ''} />
                </button>
                {showCloset ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {showCloset && (
              <div className="mt-2">
                {closetLoading ? (
                  <div className="flex items-center justify-center py-4 text-purple-500">
                    <RefreshCw size={16} className="animate-spin" />
                  </div>
                ) : closetItems.length === 0 ? (
                  <div className="text-center py-4 text-slate-500 text-[10px]">Empty</div>
                ) : (
                  <div className="grid grid-cols-3 gap-1">
                    {closetItems.slice(0, 6).map((item, idx) => (
                      <div key={idx} className="aspect-square bg-black/40 rounded border border-slate-800/50 overflow-hidden">
                        {item.thumbnailUrl && (
                          <img
                            src={item.thumbnailUrl}
                            alt="Item"
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


