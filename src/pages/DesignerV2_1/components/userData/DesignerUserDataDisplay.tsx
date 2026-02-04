import React from 'react';
import { useDesignerUserData } from './useDesignerUserData';
import { useAuth } from '../../../../auth/useAuth';

export const DesignerUserDataDisplay: React.FC = () => {
  const { status } = useAuth();
  const {
    serverUser,
    loading,
    generationHistory,
    historyLoading,
    closetItems,
    closetLoading
  } = useDesignerUserData();

  if (status !== 'authenticated') {
    return (
      <div className="p-4 text-center text-gray-400 bg-gray-900/50 rounded-lg border border-gray-800">
        <p>Please log in to view history and profile details.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-sm">
      {/* User Profile Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-emerald-400">User Profile</h3>
          {loading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        
        {serverUser ? (
          <div className="p-4 grid grid-cols-2 gap-4">
             <div className="col-span-2 flex items-center gap-3 pb-3 border-b border-slate-800/50">
                {serverUser.photoURL && (
                    <img src={serverUser.photoURL} alt="User" className="w-10 h-10 rounded-full border border-slate-700" />
                )}
                <div>
                    <div className="font-bold text-white">{serverUser.displayName || 'No Name'}</div>
                    <div className="text-xs text-slate-400">{serverUser.email}</div>
                </div>
             </div>
             
             <DetailItem 
                label="Credits" 
                value={serverUser.billing?.credits !== undefined ? serverUser.billing.credits : ((serverUser as any).credits ?? (serverUser as any).credit_balance ?? 0)} 
                highlight 
             />
             <DetailItem label="Role" value={serverUser.role} />
             <DetailItem label="Region" value={(serverUser as any).region} />
             <DetailItem 
                label="Tier" 
                value={serverUser.billing?.tier || (serverUser as any).tier || (serverUser as any).subscription?.tier || (serverUser as any).subscriptionTier || 'Free'} 
             />
             <DetailItem label="Created" value={(serverUser as any).createdAt ? new Date((serverUser as any).createdAt._seconds ? (serverUser as any).createdAt._seconds * 1000 : (serverUser as any).createdAt).toLocaleDateString() : 'N/A'} />
             <DetailItem label="Last Login" value={(serverUser as any).lastLoginAt ? new Date((serverUser as any).lastLoginAt._seconds ? (serverUser as any).lastLoginAt._seconds * 1000 : (serverUser as any).lastLoginAt).toLocaleDateString() : 'N/A'} />
          </div>
        ) : (
          <div className="p-4 text-slate-500 italic">No user data available</div>
        )}
      </div>

      {/* Generation History Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
          <h3 className="font-semibold text-indigo-400">Recent Generations ({generationHistory.length})</h3>
          {historyLoading && <span className="text-xs text-gray-400">Syncing...</span>}
        </div>

        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2 space-y-2">
            {generationHistory.length > 0 ? (
                generationHistory.map((gen, idx) => (
                    <div key={idx} className="flex gap-3 bg-slate-950/50 p-2 rounded border border-slate-800/50 hover:border-indigo-500/30 transition-colors">
                        <div className="w-16 h-16 bg-slate-800 rounded flex-shrink-0 overflow-hidden">
                            {/* Check both thumbnailUrl and fullImageUrl, fallback to url/imageUrl */}
                            {gen.thumbnailUrl || gen.fullImageUrl || gen.imageUrl || gen.url ? (
                                <img 
                                    src={gen.thumbnailUrl || gen.fullImageUrl || gen.imageUrl || gen.url} 
                                    alt={`Gen ${idx}`} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-600">No img</div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-medium text-slate-300 truncate block max-w-[120px]">
                                    {gen.prompt || 'No Prompt'}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${gen.status === 'succeeded' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'}`}>
                                    {gen.status || 'unknown'}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-500 mt-1">
                                {gen.createdAt ? new Date(gen.createdAt).toLocaleString() : 'Date unknown'}
                            </div>
                            <div className="text-[10px] text-slate-600 mt-0.5">
                                Model: {gen.modelId || 'Default'}
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="p-4 text-center text-slate-500 text-xs">No generations found</div>
            )}
        </div>
      </div>
      
       {/* Closet Section */}
       <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-semibold text-pink-400">Closet / Saved ({closetItems.length})</h3>
            {closetLoading && <span className="text-xs text-gray-400">Loading...</span>}
        </div>
        <div className="p-2 text-xs text-slate-400">
            {closetItems.length === 0 ? "No saved items found" : `${closetItems.length} items available`}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value, highlight = false }: { label: string, value: any, highlight?: boolean }) => (
    <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</span>
        <span className={`font-mono text-sm truncate ${highlight ? 'text-emerald-400 font-bold' : 'text-slate-300'}`}>
            {value !== undefined && value !== null ? String(value) : '-'}
        </span>
    </div>
);
