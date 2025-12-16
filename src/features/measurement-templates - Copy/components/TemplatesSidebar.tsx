import React from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { MeasurementTemplate, GarmentType } from '../../../../types';

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

interface TemplatesSidebarProps {
  templates: MeasurementTemplate[];
  activeId: string | null;
  isLoading: boolean;
  onSelectTemplate: (templateId: string) => void;
  onDeleteTemplate: (templateId: string) => void;
}

export const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({
  templates,
  activeId,
  isLoading,
  onSelectTemplate,
  onDeleteTemplate,
}) => {
  return (
    <div className="w-64">
      <div className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs text-slate-500">القوالب المرتبطة بالمنتجات</p>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
              كل القوالب ({templates.length})
            </h3>
          </div>
          {isLoading && <Loader2 className="animate-spin text-blue-500" size={18} />}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`relative group p-2 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105 ${
                activeId === template.id
                  ? 'border-blue-500 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/50 dark:to-indigo-900/50 shadow-md'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:shadow-sm bg-white dark:bg-slate-800'
              }`}
              title={`${template.name}\n${productTypes.find((p) => p.value === template.productType)?.label || 'غير محدد'}`}
            >
              <div className="flex flex-col items-center gap-1">
                <div className="text-2xl leading-none">
                  {template.productType === 'dishdasha' && '👔'}
                  {template.productType === 'thobe' && '🧥'}
                  {template.productType === 'abaya' && '👗'}
                  {template.productType === 'dress' && '👗'}
                  {template.productType === 'omani' && '🎽'}
                  {template.productType === 'dhofari' && '🥻'}
                  {template.productType === 'suri' && '👘'}
                  {template.productType === 'shirt' && '👕'}
                  {template.productType === 'suit' && '🤵'}
                  {!['dishdasha', 'thobe', 'abaya', 'dress', 'omani', 'dhofari', 'suri', 'shirt', 'suit'].includes(template.productType) && '📐'}
                </div>
                <p className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 text-center leading-tight line-clamp-2 h-7">
                  {template.name}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteTemplate(template.id);
                }}
                className="absolute -top-1 -left-1 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                title="حذف"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}

          {templates.length === 0 && !isLoading && (
            <div className="text-sm text-slate-500 bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-xl">
              لا توجد قوالب بعد. أنشئ قالباً جديداً أو استخدم القالب الافتراضي.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
