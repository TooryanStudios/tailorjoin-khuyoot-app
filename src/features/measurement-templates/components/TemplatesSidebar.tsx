import React from 'react';
import { Loader2, Search, Scissors } from 'lucide-react';
import { MeasurementTemplate } from '../../../../types';

interface TemplatesSidebarProps {
  templates: MeasurementTemplate[];
  activeId: string | null;
  isLoading: boolean;
  onSelectTemplate: (templateId: string) => void;
  onDeleteTemplate?: (templateId: string) => void; // اختياري لأننا لن نستخدمه
}

export const TemplatesSidebar: React.FC<TemplatesSidebarProps> = ({
  templates, activeId, isLoading, onSelectTemplate,
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800">
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={16} />
          <input 
            placeholder="بحث في القوالب..." 
            className="w-full pl-3 pr-9 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-sm text-zinc-200 focus:ring-2 focus:ring-purple-500/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {isLoading && <div className="p-4 flex justify-center"><Loader2 className="animate-spin text-purple-500"/></div>}
        
        {!isLoading && templates.length === 0 && (
          <div className="text-center p-8 text-slate-400 flex flex-col items-center gap-2">
            <Scissors size={32} className="opacity-20"/>
            <p className="text-sm">لا توجد تصنيفات أزياء</p>
            <p className="text-xs">أضف تصنيف بنوع "أزياء وملابس" من إدارة المنتجات</p>
          </div>
        )}

        {templates.map((template) => {
          const isActive = activeId === template.id;
          return (
            <div
              key={template.id}
              onClick={() => onSelectTemplate(template.id)}
              className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${
                isActive 
                  ? 'bg-purple-500/20 ring-1 ring-purple-500 border-transparent' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${isActive ? 'bg-purple-500/30' : 'bg-zinc-800'}`}>
                  {getIconForType(template.productType)}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className={`text-sm font-semibold truncate ${isActive ? 'text-purple-300' : 'text-zinc-200'}`}>
                    {template.name}
                  </span>
                  <span className="text-[10px] text-slate-500 truncate">
                     {template.points?.length || 0} نقطة قياس
                  </span>
                </div>
              </div>
              
              {/* Indicator for active state */}
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getIconForType = (type: string) => {
  switch(type) {
    case 'dishdasha': return '👔';
    case 'thobe': return '🧥';
    case 'abaya': return '👘';
    case 'dress': return '👗';
    case 'shirt': return '👕';
    case 'suit': return '🤵';
    default: return '📏';
  }
};