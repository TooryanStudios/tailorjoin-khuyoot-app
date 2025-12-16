import React from 'react';
import { Info } from 'lucide-react';
import type { MeasurementTemplate } from '../../types';
import type { Category as ProductCategory } from '../../src/admin/products/types';

interface Product {
  id: string;
  categoryId?: string;
  category?: string;
}

interface TemplatesDisplayProps {
  loadingTemplates: boolean;
  filteredTemplates: MeasurementTemplate[];
  product: Product | null;
  allCategories: ProductCategory[];
  measurementTemplates: MeasurementTemplate[];
}

export const TemplatesDisplay: React.FC<TemplatesDisplayProps> = ({
  loadingTemplates,
  filteredTemplates,
  product,
  allCategories,
  measurementTemplates,
}) => {
  return (
    <div className="sticky top-6">
      {/* Debug Info */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <p className="text-xs font-bold text-blue-800 dark:text-blue-300 mb-1">
          🔗 نظام ربط القوالب بالتصنيفات
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-400">
          {loadingTemplates ? '⏳ جاري تحميل القوالب...' : `✓ تم العثور على ${filteredTemplates.length} قالب مرتبط بتصنيف المنتج`}
        </p>
        {!loadingTemplates && filteredTemplates.length > 0 && (
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            القوالب المتاحة: {filteredTemplates.map(t => t.name).join(' • ')}
          </p>
        )}
        {!loadingTemplates && filteredTemplates.length === 0 && product?.categoryId && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            💡 لا توجد قوالب مرتبطة بتصنيف "{product?.category}" - يمكن إضافة قوالب من لوحة الإدارة
          </p>
        )}
      </div>

      {/* Templates Display */}
      {loadingTemplates ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm text-slate-600 dark:text-slate-400">جاري تحميل القوالب...</p>
          </div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center max-w-md">
            <Info className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-2">
              لا يوجد قالب مقاسات مرتبط بتصنيف هذا المنتج
            </p>
            {product?.categoryId ? (
              <p className="text-xs text-slate-500 dark:text-slate-500 mb-4">
                يمكن إضافة قالب مخصص لتصنيف "{product?.category}" من لوحة الإدارة
              </p>
            ) : (
              <p className="text-xs text-red-500 dark:text-red-400 mb-4">
                ⚠️ هذا المنتج لا يحتوي على معرف تصنيف (categoryId)
              </p>
            )}
            {measurementTemplates.length > 0 && (
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 يوجد {measurementTemplates.length} قالب متاح لتصنيفات أخرى
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template, index) => (
            <div
              key={template.id}
              className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{template.name}</h4>
                {template.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{template.description}</p>
                )}
                <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded">
                  {template.points.length} نقطة قياس
                </span>
              </div>
              
              <div className="overflow-auto bg-white dark:bg-slate-800 flex justify-center p-4">
                <div 
                  className="relative"
                  style={{
                    width: '460px',
                    height: '690px'
                  }}
                >
                  {/* Template Image */}
                  {template.baseImageUrl && (
                    <img
                      src={template.baseImageUrl}
                      alt={template.name}
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  )}
                  
                  {/* خطوط الربط بين النقاط */}
                  {template.points.length > 1 && (
                    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%">
                      {template.points.sort((a, b) => (a.order || 0) - (b.order || 0)).map((point, index, sortedPoints) => {
                        const next = sortedPoints[index + 1];
                        if (!next) return null;
                        const x1 = point.x < 1 ? point.x * 100 : point.x;
                        const y1 = point.y < 1 ? point.y * 100 : point.y;
                        const x2 = next.x < 1 ? next.x * 100 : next.x;
                        const y2 = next.y < 1 ? next.y * 100 : next.y;
                        return (
                          <line
                            key={`${point.id}-${next.id}`}
                            x1={`${x1}%`}
                            y1={`${y1}%`}
                            x2={`${x2}%`}
                            y2={`${y2}%`}
                            stroke="#10b981"
                            strokeWidth={2}
                            strokeDasharray="5,5"
                            opacity={0.5}
                          />
                        );
                      })}
                    </svg>
                  )}

                  {/* Measurement Points */}
                  {template.points.map((point, idx) => {
                    // Convert coordinates: if value is < 1, it's a decimal (0-1), multiply by 100
                    // if value is >= 1, it's already a percentage
                    const xPercent = point.x < 1 ? point.x * 100 : point.x;
                    const yPercent = point.y < 1 ? point.y * 100 : point.y;
                    
                    const pointColor = point.label.includes('طول') || point.label.includes('عرض') 
                      ? 'emerald' 
                      : point.label.includes('محيط') || point.label.includes('دائرة')
                      ? 'blue'
                      : point.label.includes('كتف') || point.label.includes('ذراع')
                      ? 'purple'
                      : 'orange';
                    
                    return (
                      <div
                        key={point.id}
                        className="absolute group"
                        style={{
                          left: `${xPercent}%`,
                          top: `${yPercent}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                        title={point.note || point.label}
                      >
                        {/* السهم */}
                        {point.direction !== undefined && (
                          <div
                            className={`absolute left-1/2 top-1/2 h-1 w-10 bg-${pointColor}-400 origin-left transition-opacity`}
                            style={{ 
                              transform: `rotate(${point.direction}deg)`,
                              opacity: 0.7
                            }}
                          >
                            <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-l-[6px] border-l-${pointColor}-400 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent`} />
                          </div>
                        )}
                        
                        {/* Point marker */}
                        <div className={`relative w-8 h-8 rounded-full bg-${pointColor}-500 border-2 border-white shadow-lg flex items-center justify-center transition-transform group-hover:scale-110`}>
                          <span className="text-xs font-bold text-white">{point.order || idx + 1}</span>
                        </div>
                        
                        {/* Label */}
                        <div className={`absolute top-10 left-1/2 -translate-x-1/2 whitespace-nowrap transition-opacity group-hover:opacity-100 ${point.note ? 'opacity-100' : 'opacity-0'}`}>
                          <div className={`px-2 py-1 bg-${pointColor}-600 text-white text-xs font-bold rounded shadow-lg`}>
                            {point.label}
                            {point.note && (
                              <div className="text-[10px] opacity-90 mt-0.5">{point.note}</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
