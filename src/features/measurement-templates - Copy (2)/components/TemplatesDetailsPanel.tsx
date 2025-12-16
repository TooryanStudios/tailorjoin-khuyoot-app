import React from 'react';
import { PenTool, Tag, AlignLeft, Layers, Hash } from 'lucide-react';
import { MeasurementTemplate, MeasurementPoint, GarmentType } from '../../../../types';

const productTypes: { value: GarmentType; label: string }[] = [
  { value: 'dishdasha', label: 'دشداشة' },
  { value: 'thobe', label: 'ثوب' },
  { value: 'abaya', label: 'عباية' },
  { value: 'dress', label: 'فستان' },
  { value: 'shirt', label: 'قميص' },
  { value: 'suit', label: 'بدلة' },
  { value: 'other', label: 'منتج آخر' },
];

interface TemplatesDetailsPanelProps {
  draft: MeasurementTemplate | null;
  orderedPoints: MeasurementPoint[];
  onUpdateDraft: (updates: Partial<MeasurementTemplate>) => void;
  onUpdatePoint: (pointId: string, updates: Partial<MeasurementPoint>) => void;
}

export const TemplatesDetailsPanel: React.FC<TemplatesDetailsPanelProps> = ({
  draft, orderedPoints, onUpdateDraft, onUpdatePoint,
}) => {
  if (!draft) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Template Metadata Section */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-700 space-y-4">
         <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 mb-2">
            <Tag size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">خصائص القالب</span>
         </div>
         
         <div className="space-y-3">
            <div>
               <label className="block text-[10px] text-slate-400 mb-1">اسم القالب</label>
               <input
                 value={draft.name}
                 onChange={(e) => onUpdateDraft({ name: e.target.value })}
                 className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-indigo-500"
               />
            </div>
            <div className="grid grid-cols-2 gap-2">
               <div>
                 <label className="block text-[10px] text-slate-400 mb-1">النوع</label>
                 <select
                   value={draft.productType}
                   onChange={(e) => onUpdateDraft({ productType: e.target.value as GarmentType })}
                   className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-2 py-2 text-sm text-slate-700 dark:text-slate-200"
                 >
                   {productTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                 </select>
               </div>
               <div>
                  <label className="block text-[10px] text-slate-400 mb-1">ملاحظات</label>
                  <input
                    value={draft.description || ''}
                    onChange={(e) => onUpdateDraft({ description: e.target.value })}
                    placeholder="وصف..."
                    className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
                  />
               </div>
            </div>
         </div>
      </div>

      {/* Points List Section */}
      <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-900/20">
        <div className="p-4 flex items-center gap-2 text-slate-500 border-b border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
           <Layers size={16} />
           <span className="text-xs font-bold uppercase tracking-wider">نقاط القياس ({orderedPoints.length})</span>
        </div>
        
        <div className="overflow-y-auto p-3 space-y-2 flex-1">
           {orderedPoints.map((point) => (
             <div key={point.id} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3 shadow-sm flex gap-3">
                <div className="flex flex-col items-center justify-center w-8 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold text-slate-500">
                   <Hash size={10} className="mb-0.5 opacity-50"/>
                   {point.order}
                </div>
                <div className="flex-1 space-y-2">
                   <input
                     value={point.label}
                     onChange={(e) => onUpdatePoint(point.id, { label: e.target.value })}
                     className="w-full text-sm font-medium border-0 border-b border-slate-100 dark:border-slate-700 p-0 pb-1 focus:ring-0 bg-transparent placeholder:text-slate-300"
                     placeholder="اسم القياس"
                   />
                   <div className="flex items-center gap-2">
                     <AlignLeft size={12} className="text-slate-400"/>
                     <input
                       value={point.note || ''}
                       onChange={(e) => onUpdatePoint(point.id, { note: e.target.value })}
                       className="w-full text-xs text-slate-500 border-none p-0 focus:ring-0 bg-transparent placeholder:text-slate-300"
                       placeholder="ملاحظة توضيحية..."
                     />
                   </div>
                </div>
             </div>
           ))}
           
           {orderedPoints.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs">
                 اضغط على الصورة لإضافة نقاط
              </div>
           )}
        </div>
      </div>
    </div>
  );
};