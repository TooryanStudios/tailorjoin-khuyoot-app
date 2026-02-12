import React, { useMemo, useState } from 'react';

type DebugPanelProps = {
  data: any;
  showFloatingButton?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const DebugPanel = ({ data, showFloatingButton = true, isOpen, onOpenChange }: DebugPanelProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (process.env.NODE_ENV === 'production') return null;

  const open = typeof isOpen === 'boolean' ? isOpen : internalOpen;

  const setOpen = useMemo(
    () => (next: boolean) => {
      try {
        onOpenChange?.(next);
      } finally {
        if (typeof isOpen !== 'boolean') setInternalOpen(next);
      }
    },
    [isOpen, onOpenChange]
  );

  const handleCopy = () => {
    try {
      const text = JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy info:', err);
    }
  };

  if (!open) {
    if (!showFloatingButton) return null;
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed top-20 right-4 z-[9999] bg-red-600/80 hover:bg-red-600 text-white px-3 py-1.5 text-xs font-bold rounded shadow-lg backdrop-blur-sm transition-all"
        style={{ marginTop: '4rem' }}
      >
        🐞 Debug State
      </button>
    );
  }

  return (
    <div 
      className="fixed top-20 right-4 z-[9999] w-[500px] bg-zinc-950/95 text-green-400 p-4 rounded-xl shadow-2xl border border-green-500/30 overflow-y-auto font-mono text-[11px]"
      style={{ maxHeight: 'calc(100vh - 120px)', marginTop: '4rem' }}
    >
      <div className="flex justify-between items-center mb-4 border-b border-green-500/30 pb-2 sticky top-0 bg-zinc-950/95 pt-1">
        <div className="flex items-center gap-2">
            <span className="text-xl">🐞</span>
            <h3 className="font-bold text-sm tracking-wider text-green-400">DIAGNOSTIC PANEL</h3>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={handleCopy} 
                className={`px-2 py-1 rounded transition-colors ${copied ? 'bg-emerald-900/50 text-emerald-200' : 'bg-blue-900/30 hover:bg-blue-900/50 text-blue-200'}`}
                title="Copy state JSON to clipboard"
            >
                {copied ? 'Copied!' : 'Copy JSON'}
            </button>
            <button 
                onClick={() => console.log(JSON.parse(JSON.stringify(data)))} 
                className="px-2 py-1 bg-green-900/30 hover:bg-green-900/50 rounded text-green-200"
                title="Log full state to console"
            >
                Log Info
            </button>
            <button onClick={() => setOpen(false)} className="px-2 py-1 bg-red-900/30 hover:bg-red-900/50 text-red-200 rounded">
                Close
            </button>
        </div>
      </div>
      
      <div className="space-y-6">
        {Object.entries(data).map(([section, content]: [string, any]) => (
          <div key={section} className="border border-white/5 rounded p-2 bg-white/5 relative group">
            <h4 className="text-white font-bold bg-black/50 inline-block px-2 py-0.5 rounded text-[10px] top-[-10px] left-2 absolute border border-white/10 uppercase tracking-widest">
                {section}
            </h4>
            <div className="mt-2 text-zinc-300">
                {typeof content === 'object' && content !== null ? (
                     <table className="w-full text-left border-collapse">
                        <tbody>
                            {Object.entries(content).map(([k, v]) => (
                                <tr key={k} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="py-1 pr-2 text-zinc-500 w-1/3 align-top break-all">{k}</td>
                                    <td className="py-1 text-zinc-300 break-all font-semibold">
                                        {(() => {
                                            if (v === null) return <span className="text-zinc-600">null</span>;
                                            if (v === undefined) return <span className="text-zinc-600">undefined</span>;
                                            if (typeof v === 'boolean') return <span className={v ? 'text-emerald-400' : 'text-red-400'}>{String(v)}</span>;
                                            if (typeof v === 'string') {
                                                if (v.startsWith('data:image')) {
                                                    return (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-4 h-4 rounded bg-zinc-700 overflow-hidden border border-zinc-600">
                                                                <img src={v} className="w-full h-full object-cover" />
                                                            </div>
                                                            <span className="text-zinc-500">
                                                                Base64 Image ({Math.round(v.length / 1024)}KB)
                                                            </span>
                                                        </div>
                                                    )
                                                }
                                                if (v.startsWith('blob:')) {
                                                    return <a href={v} target="_blank" className="text-blue-400 hover:underline">{v}</a>
                                                }
                                                return <span className="text-yellow-100/90">{v}</span>;
                                            }
                                            return JSON.stringify(v);
                                        })()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                     </table>
                ) : (
                    String(content)
                )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
