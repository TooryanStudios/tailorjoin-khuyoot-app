import React from 'react';
import { Shirt } from 'lucide-react';
import { ProductDetailsPanel } from './ProductDetailsPanel';
import { PublishButton } from './PublishButton';

export const FabricPresetSelector: React.FC = () => {
  const presets = [
    { id: 'classic-white', name: 'أبيض كلاسيكي', swatchClassName: 'bg-white' },
    { id: 'royal-navy', name: 'كحلي ملكي', swatchClassName: 'bg-blue-900' },
    { id: 'sand-beige', name: 'بيج رملي', swatchClassName: 'bg-amber-100' },
    { id: 'emerald', name: 'أخضر زمردي', swatchClassName: 'bg-emerald-600' }
  ];

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 w-full">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <div className="text-xs font-medium text-slate-300">اختيار النمط</div>
          <div className="text-[10px] text-slate-500">Select Style</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          <Shirt size={14} className="text-slate-400" />
        </div>
      </div>

      <div className="mt-2 flex gap-1">
        {presets.map((preset) => (
          <button
            key={preset.id}
            className="group relative w-16 h-16 rounded-lg overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:scale-105"
            title={preset.name}
            type="button"
          >
            <div className={`h-full w-full ${preset.swatchClassName}`} />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <span className="px-1 text-center text-[9px] text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {preset.name}
              </span>
            </div>
          </button>
        ))}
      </div>

      <p className="mt-1.5 text-center text-[10px] text-slate-600">اختر نمط القماش (قريباً)</p>

      {/* All form fields + actions inside the same block */}
      <div className="mt-2 -mx-3">
        <ProductDetailsPanel />
      </div>

      <div className="mt-2">
        <PublishButton />
      </div>
    </div>
  );
};
