import React from 'react';
import { PenTool, Target } from 'lucide-react';
import { MeasurementTemplate, MeasurementPoint, GarmentType } from '../../../../types';

const productTypes: { value: GarmentType; label: string }[] = [
  { value: 'dishdasha', label: 'دشداشة' },
  { value: 'thobe', label: 'ثوب' },
  { value: 'abaya', label: 'عباية' },
  { value: 'dress', label: 'فستان' },
  { value: 'omani', label: 'زي عماني' },
  { value: 'dhofari', label: 'زي ظفاري' },
  { value: 'suri', label: 'زي سوري' },
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
  draft,
  orderedPoints,
  onUpdateDraft,
  onUpdatePoint,
}) => {
  if (!draft) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
        اختر قالباً من القائمة لعرض خصائصه.
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-slate-900 border border-blue-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
          <Target size={18} className="text-blue-500 animate-pulse" />
          <span className="font-bold">تفاصيل القالب</span>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">اسم القالب</label>
          <input
            value={draft.name}
            onChange={(e) => onUpdateDraft({ name: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">نوع المنتج</label>
          <select
            value={draft.productType}
            onChange={(e) => onUpdateDraft({ productType: e.target.value as GarmentType })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            {productTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs text-slate-500">وصف مختصر</label>
          <textarea
            value={draft.description || ''}
            onChange={(e) => onUpdateDraft({ description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            rows={3}
          />
        </div>
      </div>

      <div className="bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-slate-900 border border-purple-200 dark:border-slate-700 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center gap-2 mb-3">
          <PenTool size={16} className="text-purple-500 animate-pulse" />
          <p className="font-bold text-slate-800 dark:text-white">
            النقاط واتجاه الأسهم
          </p>
        </div>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {orderedPoints.map((point) => (
            <div
              key={point.id}
              className="flex flex-col gap-3 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700"
            >
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  اسم القياس
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  value={point.label}
                  onChange={(e) => onUpdatePoint(point.id, { label: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                  ملاحظة
                </label>
                <input
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                  value={point.note || ''}
                  onChange={(e) => onUpdatePoint(point.id, { note: e.target.value })}
                  placeholder="توضيح للعميل"
                />
              </div>
            </div>
          ))}

          {orderedPoints.length === 0 && (
            <div className="text-sm text-slate-500 p-3 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
              انقر على الصورة لإضافة أول نقطة قياس.
            </div>
          )}
        </div>
      </div>
    </>
  );
};
