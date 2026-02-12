import React, { useState } from 'react';
import { Play, Ruler } from 'lucide-react';

interface MeasurementTemplateHookProps {
  template: any;
  initialMeasurements?: Record<string, number>;
}

export const useMeasurementTemplate = ({ template, initialMeasurements = {} }: MeasurementTemplateHookProps) => {
  const [measurements, setMeasurements] = useState<Record<string, number>>(initialMeasurements);
  const [showVideoDialog, setShowVideoDialog] = useState(false);

  const handleMeasurementChange = (pointId: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0) {
      setMeasurements(prev => ({ ...prev, [pointId]: numValue }));
    } else if (value === '') {
      const newMeasurements = { ...measurements };
      delete newMeasurements[pointId];
      setMeasurements(newMeasurements);
    }
  };

  const videoUrl = template?.videoUrl || template?.tutorialVideoUrl || 'https://www.youtube.com/watch?v=6eZtn5Du8O4';
  const ordered = template?.points ? [...template.points].sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
  const showFallbackBg = !template?.baseImageUrl;

  return {
    measurements,
    setMeasurements,
    handleMeasurementChange,
    showVideoDialog,
    setShowVideoDialog,
    videoUrl,
    ordered,
    showFallbackBg,
    hasTemplate: !!(template && template.points?.length)
  };
};

interface MeasurementTemplateContentProps {
  template: any;
  measurements: Record<string, number>;
  onMeasurementChange: (pointId: string, value: string) => void;
  onShowVideo: () => void;
  PointMarkerComponent: React.ComponentType<any>;
}

export const MeasurementTemplateContent: React.FC<MeasurementTemplateContentProps> = ({
  template,
  measurements,
  onMeasurementChange,
  onShowVideo,
  PointMarkerComponent
}) => {
  if (!template || !template.points?.length) return null;

  const ordered = [...template.points].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const showFallbackBg = !template.baseImageUrl;

  return (
    <div className="space-y-4">
      {/* Instructions Block */}
      <div className="p-4 bg-[#ededed] rounded-2xl border border-gray-200/50 space-y-3">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-gray-900">تعليمات القياس:</p>
          <p className="text-[11px] text-gray-600 leading-relaxed font-normal">
            يرجى إدخال القياسات الصحيحة (بالسنتيمتر) في الخانات الموضحة على الرسم أدناه. يمكنك النقر مباشرة على الخانة وتعديل الرقم.
          </p>
        </div>

        <button 
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium text-xs shadow-sm"
          onClick={onShowVideo}
        >
          <Play size={14} className="text-emerald-500 fill-emerald-500" />
          <span>مشاهدة فيديو توضيحي لطريقة أخذ القياس</span>
        </button>
      </div>

      {/* Interactive Measurement Diagram */}
      <div className="relative w-full aspect-[3/4] bg-[#fdfdfd] rounded-2xl border border-gray-200 overflow-visible">
        {template.baseImageUrl ? (
          <img 
            src={template.baseImageUrl} 
            alt={template.name}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90 rounded-2xl"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-5">
            <img src="/logo_big.png?v=4" alt="" className="w-20 h-auto grayscale" />
          </div>
        )}

        {/* Arrows from template or default sequential */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id="arrowhead-measurement-template" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
              <path d="M0,0 L0,6 L6,3 z" fill="#10b981" />
            </marker>
          </defs>
          {template.arrows && template.arrows.length > 0 ? (
            template.arrows.map((arrow: any) => (
              <line
                key={arrow.id}
                x1={arrow.startX * 100}
                y1={arrow.startY * 100}
                x2={arrow.endX * 100}
                y2={arrow.endY * 100}
                stroke="#10b981"
                strokeWidth={0.45}
                markerEnd="url(#arrowhead-measurement-template)"
                opacity={0.7}
              />
            ))
          ) : ordered.length > 1 && (
            ordered.map((point: any, idx: number) => {
              const next = ordered[idx + 1];
              if (!next) return null;
              return (
                <line
                  key={`${point.id}-${next.id}`}
                  x1={point.x * 100}
                  y1={point.y * 100}
                  x2={next.x * 100}
                  y2={next.y * 100}
                  stroke="#10b981"
                  strokeWidth={showFallbackBg ? 0.35 : 0.45}
                  markerEnd="url(#arrowhead-measurement-template)"
                  opacity={showFallbackBg ? 0.35 : 0.7}
                />
              );
            })
          )}
        </svg>
        
        {/* Clickable point markers with inline inputs */}
        {template.points.map((point: any, idx: number) => {
          const order = point.order || idx + 1;
          return (
            <PointMarkerComponent
              key={point.id} 
              point={point} 
              order={order} 
              value={measurements[point.id]}
              onChange={(val: string) => onMeasurementChange(point.id, val)}
            />
          );
        })}
      </div>
    </div>
  );
};
