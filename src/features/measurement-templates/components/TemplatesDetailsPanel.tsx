import React from 'react';
import { PenTool, Tag, AlignLeft, Layers, Hash } from 'lucide-react';
import { MeasurementTemplate, MeasurementPoint, MeasurementTemplateVariation } from '../../../../types';

interface TemplatesDetailsPanelProps {
  draft: MeasurementTemplate | null;
  activeVariation: MeasurementTemplateVariation | null;
  orderedPoints: MeasurementPoint[];
  onUpdateDraft: (updates: Partial<MeasurementTemplate>) => void;
  onUpdatePoint: (pointId: string, updates: Partial<MeasurementPoint>) => void;
  onRenameVariation: (variationId: string, name: string) => void;
  onToggleVariationEnabled: (variationId: string, enabled: boolean) => void;
  onDeleteVariation: (variationId: string) => void;
}

export const TemplatesDetailsPanel: React.FC<TemplatesDetailsPanelProps> = ({
  draft, activeVariation, orderedPoints, onUpdateDraft, onUpdatePoint,
  onRenameVariation, onToggleVariationEnabled, onDeleteVariation,
}) => {
  if (!draft) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Template Metadata Section */}
      <div className="p-5 border-b border-zinc-200 dark:border-zinc-700 space-y-4 bg-white dark:bg-zinc-900">
        <div className="flex items-center gap-2 text-theme-primary mb-2">
            <Tag size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">خصائص القالب</span>
         </div>
         
         <div className="space-y-3">
            <div>
               <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">اسم القالب</label>
               <input
                 value={draft.name}
                 onChange={(e) => onUpdateDraft({ name: e.target.value })}
                 title="اسم القالب"
                 className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-theme-primary/40"
               />
            </div>
            <div>
                  <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">ملاحظات</label>
                  <input
                    value={draft.description || ''}
                    onChange={(e) => onUpdateDraft({ description: e.target.value })}
                    placeholder="وصف..."
                    className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-theme-primary/40"
                  />
            </div>

            <div>
              <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">اسم الصورة الأساسية</label>
              <input
                value={draft.baseImageName || ''}
                onChange={(e) => onUpdateDraft({ baseImageName: e.target.value })}
                placeholder="اسم الصورة الأساسية"
                className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-theme-primary/40"
              />
            </div>

            {activeVariation && (
              <div className="space-y-2 pt-1">
                <label className="block text-[10px] text-zinc-500 dark:text-zinc-400 mb-1">خصائص المتغيّر</label>

                <input
                  value={activeVariation.name}
                  onChange={(e) => onRenameVariation(activeVariation.id, e.target.value)}
                  placeholder="اسم المتغيّر"
                  className="w-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm font-medium text-zinc-800 dark:text-zinc-200 focus:ring-1 focus:ring-theme-primary/40"
                />

                <label className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-800 dark:text-zinc-200">
                  <span>مفعّل</span>
                  <input
                    type="checkbox"
                    checked={activeVariation.enabled !== false}
                    onChange={(e) => onToggleVariationEnabled(activeVariation.id, e.target.checked)}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    const confirmed = window.confirm(`هل تريد حذف ${activeVariation.name || 'هذا المتغيّر'}؟`);
                    if (!confirmed) return;
                    onDeleteVariation(activeVariation.id);
                  }}
                  className="w-full border border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl px-3 py-2 text-sm"
                >
                  حذف المتغيّر
                </button>
              </div>
            )}
         </div>
      </div>

      {/* Points List Section */}
      <div className="flex-1 flex flex-col min-h-0 bg-zinc-50/60 dark:bg-zinc-950/20">
        <div className="p-3 flex items-center gap-2 text-zinc-600 dark:text-zinc-300 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 sticky top-0 z-10">
           <Layers size={16} />
           <span className="text-xs font-bold uppercase tracking-wider">نقاط القياس ({orderedPoints.length})</span>
        </div>
        
        <div className="overflow-y-auto p-3 space-y-2 flex-1">
           {orderedPoints.map((point) => (
             <div key={point.id} className="bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700 p-2.5 shadow-sm flex gap-2">
                <div className="flex flex-col items-center justify-center w-8 bg-zinc-100 dark:bg-zinc-700 rounded text-xs font-bold text-zinc-500 dark:text-zinc-400">
                   <Hash size={10} className="mb-0.5 opacity-50"/>
                   {point.order}
                </div>
                <div className="flex-1 space-y-2">
                   <input
                     value={point.label}
                     onChange={(e) => onUpdatePoint(point.id, { label: e.target.value })}
                     className="w-full text-sm font-medium text-zinc-800 dark:text-zinc-200 border-0 border-b border-zinc-200 dark:border-zinc-700 p-0 pb-1 focus:ring-0 bg-transparent placeholder:text-zinc-400"
                     placeholder="اسم القياس"
                   />
                   <div className="flex items-center gap-2">
                     <AlignLeft size={12} className="text-zinc-400"/>
                     <input
                       value={point.note || ''}
                       onChange={(e) => onUpdatePoint(point.id, { note: e.target.value })}
                       className="w-full text-xs text-zinc-500 dark:text-zinc-400 border-none p-0 focus:ring-0 bg-transparent placeholder:text-zinc-400"
                       placeholder="ملاحظة توضيحية..."
                     />
                   </div>
                </div>
             </div>
           ))}
           
           {orderedPoints.length === 0 && (
              <div className="text-center py-10 text-zinc-500 dark:text-zinc-400 text-xs">
                 اضغط على الصورة لإضافة نقاط
              </div>
           )}
        </div>
      </div>
    </div>
  );
};