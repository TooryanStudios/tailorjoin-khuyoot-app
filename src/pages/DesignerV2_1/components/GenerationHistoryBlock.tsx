import React from "react";
import { apiJson } from "../../../api/apiFetch";
import { useAuth } from '../../../auth/useAuth';

interface GenerationHistoryBlockProps {
  className?: string;
}

export const GenerationHistoryBlock: React.FC<GenerationHistoryBlockProps> = ({ className = "" }) => {
  const { status } = useAuth();
  const [generationHistory, setGenerationHistory] = React.useState<any[]>(() => {
    try {
      const cached = sessionStorage.getItem("designer_history_full_cache");
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [historyLoading, setHistoryLoading] = React.useState(false);
  const [historyError, setHistoryError] = React.useState("");

  const fetchHistory = async () => {
    if (status !== 'authenticated') return;
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await apiJson<any>("/api/designer-v2-1/history?limit=20", { retryOnUnauthorized: false });
      const historyData = data.generations || data || [];
      setGenerationHistory(historyData);
      sessionStorage.setItem("designer_history_full_cache", JSON.stringify(historyData));
    } catch (err: any) {
      console.error("Failed to fetch generation history:", err);
      setHistoryError(err.message || "Failed to fetch generation history");
      setGenerationHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  React.useEffect(() => {
    if (status === 'authenticated') {
      fetchHistory();
    }
    const handleRefresh = () => {
      if (status !== 'authenticated') return;
      fetchHistory();
    };
    window.addEventListener("khuyoot:refresh-user-data", handleRefresh);
    return () => window.removeEventListener("khuyoot:refresh-user-data", handleRefresh);
  }, [status]);

  return (
    <div className={"bg-slate-900/60 border border-slate-800 p-4 rounded-lg shadow-lg " + className} style={{ minHeight: "100px", display: "block", visibility: "visible", opacity: 1 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-cyan-400 font-bold uppercase tracking-wider text-xs">Generation History TEST</h2>
        <button
          onClick={fetchHistory}
          disabled={historyLoading}
          className="px-3 py-1 bg-cyan-600/80 text-white text-[10px] font-bold rounded hover:bg-cyan-500 disabled:opacity-50 transition-colors uppercase"
        >
          {historyLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {historyError && (
        <div className="bg-red-900/20 border border-red-500/30 p-3 rounded mb-3">
          <p className="text-red-400 text-xs">{historyError}</p>
        </div>
      )}

      {historyLoading ? (
        <div className="flex items-center justify-center h-24">
          <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : generationHistory.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-slate-500 text-sm">No generations found</p>
          <p className="text-slate-600 text-xs mt-1">Generate some images in Designer V2.1 to see them here</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {generationHistory.map((gen: any, idx: number) => (
            <div key={gen.id || gen.jobId || idx} className="bg-black/40 p-3 rounded border border-slate-800/50">
              <div className="flex gap-3">
                {(gen.thumbnailUrl || gen.fullImageUrl) && (
                  <img
                    src={gen.thumbnailUrl || gen.fullImageUrl}
                    alt="Generation"
                    className="w-20 h-20 object-cover rounded border border-slate-700 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-cyan-300 font-mono text-[10px]">
                      {gen.jobId || gen.id || "N/A"}
                    </span>
                    <span
                      className={"px-1.5 py-0.5 rounded text-[9px] font-bold uppercase " + (
                        gen.status === "completed"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : gen.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-400"
                          : gen.status === "failed"
                          ? "bg-red-500/20 text-red-400"
                          : "bg-slate-500/20 text-slate-400"
                      )}
                    >
                      {gen.status || "unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};