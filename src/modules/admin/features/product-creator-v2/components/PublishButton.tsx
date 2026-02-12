import React from 'react';
import { useProductForm } from '../context/ProductFormContext';
import { Sparkles, Loader2 } from 'lucide-react';

export const PublishButton: React.FC = () => {
  const { loading, publishProduct, saveDraft, pendingImageFiles } = useProductForm();

  return (
    <div className="space-y-3">
      {pendingImageFiles.length > 0 && (
        <p className="text-xs text-blue-400 text-center">
          {pendingImageFiles.length} صورة جاهزة للرفع عند الحفظ
        </p>
      )}

      <div className="px-3 pt-2">
        <div className="space-y-1.5">
        <button
          onClick={publishProduct}
          disabled={loading}
          className="w-full rounded-lg bg-theme-primary px-4 py-2 text-white font-semibold text-xs transition-colors hover:bg-theme-primary/90 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>جاري النشر…</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>نشر</span>
            </>
          )}
        </button>

        <button
          onClick={saveDraft}
          disabled={loading}
          className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-4 py-1.5 text-slate-300 font-medium text-xs transition-colors hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          حفظ كمسودة
        </button>
        </div>
      </div>
    </div>
  );
};

