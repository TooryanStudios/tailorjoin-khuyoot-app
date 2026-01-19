import React from 'react';
import { Image as ImageIcon, ExternalLink } from 'lucide-react';

export const GallerySection: React.FC = () => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ImageIcon size={16} className="text-blue-500" />
          معرض التصاميم
        </h3>
        <button className="text-xs text-blue-600 dark:text-blue-400 font-medium flex items-center gap-1">
          عرض الكل
          <ExternalLink size={12} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div 
            key={`gallery-placeholder-${i}`}
            className="aspect-[3/4] rounded-lg bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center"
          >
            <ImageIcon size={20} className="text-slate-300 dark:text-slate-600" />
          </div>
        ))}
      </div>
      
      <p className="text-[10px] text-center text-slate-400 dark:text-slate-500">
        اكتشف تصاميم من مجتمع خيوط
      </p>
    </div>
  );
};
