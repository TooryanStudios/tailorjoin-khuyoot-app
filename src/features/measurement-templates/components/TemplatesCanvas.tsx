import React, { useEffect, useRef } from 'react';
import {
  Upload, Wand2, MousePointer2, Plus, Eraser, ArrowRight,
  Eye, EyeOff, ZoomIn, ZoomOut, Trash2, Undo2, Redo2, Image as ImageIcon, X
} from 'lucide-react';
import { MeasurementTemplate, AppSettings } from '../../../../types';
import { Arrow, ToolMode } from '../types';

// ... (Keep interface definition exactly the same) ...
interface TemplatesCanvasProps {
  draft: MeasurementTemplate | null;
  toolMode: ToolMode;
  pointSize: number;
  pointOpacity: number;
  arrows: Arrow[];
  arrowDraft: { startX: number; startY: number } | null;
  draggingPointId: string | null;
  draggingArrowId: string | null;
  draggingArrowPart: 'start' | 'end' | null;
  showLabels: boolean;
  isSaving: boolean;
  appSettings: AppSettings;
  pointColor: string;
  canUndo: boolean;
  canRedo: boolean;
  canDeleteTemplate: boolean;
  onCanvasClick: (event: React.MouseEvent) => void;
  onPointClick: (pointId: string, event: React.MouseEvent) => void;
  onPointDoubleClick: (pointId: string, event: React.MouseEvent) => void;
  onPointMouseDown: (pointId: string, event: React.MouseEvent) => void;
  onArrowMouseDown: (arrowId: string, part: 'start' | 'end', event: React.MouseEvent) => void;
  onArrowDoubleClick: (arrowId: string) => void;
  onDeleteArrow: (arrowId: string) => void;
  onImageUpload: (file: File, key: 'baseImageUrl' | 'vectorUrl' | 'variationImageUrl', callback?: (success: boolean) => void) => void;
  onSave: () => void;
  onDuplicatePoint: (pointId: string) => void;
  onRemoveVariationImage: (variationIndex: number) => void;
  onSetActiveVariation: (variationId: string | null) => void;
  onUndo: () => void;
  onRedo: () => void;
  onDeleteTemplate: () => void;
  onPointColorChange: (color: string) => void;
  setToolMode: (mode: ToolMode) => void;
  setPointSize: (size: number) => void;
  setPointOpacity: (opacity: number) => void;
  setShowLabels: (show: boolean) => void;
  setArrowDraft: (draft: { startX: number; startY: number } | null) => void;
  setDraggingPointId: (id: string | null) => void;
  setDraggingArrowId: (id: string | null) => void;
  setDraggingArrowPart: (part: 'start' | 'end' | null) => void;
  setDraft: React.Dispatch<React.SetStateAction<MeasurementTemplate | null>>;
  setArrows: React.Dispatch<React.SetStateAction<Arrow[]>>;
}

export const TemplatesCanvas: React.FC<TemplatesCanvasProps> = ({
  draft, toolMode, pointSize, pointOpacity, arrows, arrowDraft,
  draggingPointId, draggingArrowId, draggingArrowPart, showLabels,
  appSettings, pointColor, canUndo, canRedo, canDeleteTemplate,
  onCanvasClick, onPointClick, onPointDoubleClick, onPointMouseDown, onArrowMouseDown,
  onArrowDoubleClick, onDeleteArrow, onImageUpload, onUndo, onRedo,
  onDeleteTemplate, onPointColorChange, onDuplicatePoint, onRemoveVariationImage,
  onSetActiveVariation,
  setToolMode, setPointSize, setPointOpacity, setShowLabels,
  setArrowDraft, setDraggingPointId, setDraggingArrowId, setDraggingArrowPart,
  setDraft, setArrows,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeImageMode, setActiveImageMode] = React.useState<'base' | 'variation'>('base');
  const [activeVariationIndex, setActiveVariationIndex] = React.useState<number>(0);
  const deleteCursor = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='11' fill='%23f87171' stroke='white' stroke-width='2'/%3E%3Cline x1='7' y1='12' x2='17' y2='12' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 12 12, not-allowed";

  const variations = React.useMemo(
    () => (Array.isArray(draft?.variations) ? draft.variations : []),
    [draft?.variations]
  );

  const activeVariation = React.useMemo(
    () => (activeImageMode === 'variation' ? variations[activeVariationIndex] || null : null),
    [activeImageMode, variations, activeVariationIndex],
  );

  const displayedImageUrl = React.useMemo(() => {
    if (activeImageMode === 'variation' && activeVariation?.imageUrl) {
      return activeVariation.imageUrl;
    }
    return draft?.baseImageUrl || '';
  }, [activeImageMode, activeVariation, draft?.baseImageUrl]);

  const activePoints = React.useMemo(
    () => (activeVariation ? activeVariation.points || [] : draft?.points || []),
    [activeVariation, draft?.points],
  );

  useEffect(() => {
    if (activeImageMode !== 'variation') return;
    if (variations.length === 0) {
      setActiveImageMode('base');
      setActiveVariationIndex(0);
      onSetActiveVariation(null);
      return;
    }
    if (activeVariationIndex >= variations.length) {
      setActiveVariationIndex(Math.max(0, variations.length - 1));
    }
  }, [activeImageMode, activeVariationIndex, variations.length, onSetActiveVariation]);

  useEffect(() => {
    if (activeImageMode !== 'variation') return;
    onSetActiveVariation(activeVariation?.id || null);
  }, [activeImageMode, activeVariation?.id, onSetActiveVariation]);

  useEffect(() => {
    if (activeImageMode === 'base') {
      onSetActiveVariation(null);
    }
  }, [activeImageMode, onSetActiveVariation]);

  // ... (Keep useEffect for dragging logic exactly the same) ...
  useEffect(() => {
    if (!draggingPointId && !draggingArrowId) return;
    let animationFrameId: number;
    const rectCache = canvasRef.current?.getBoundingClientRect();

    const handleMove = (event: MouseEvent) => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(() => {
        if (!canvasRef.current || !rectCache) return;
        const x = Math.min(Math.max((event.clientX - rectCache.left) / rectCache.width, 0), 1);
        const y = Math.min(Math.max((event.clientY - rectCache.top) / rectCache.height, 0), 1);
        if (draggingPointId) {
          setDraft((prev) => {
            if (!prev) return prev;
            if (activeVariation) {
              return {
                ...prev,
                variations: (prev.variations || []).map((variation) =>
                  variation.id === activeVariation.id
                    ? {
                        ...variation,
                        points: (variation.points || []).map((p) => (p.id === draggingPointId ? { ...p, x, y } : p)),
                      }
                    : variation,
                ),
              };
            }

            return {
              ...prev,
              points: prev.points.map((p) => (p.id === draggingPointId ? { ...p, x, y } : p)),
            };
          });
        } else if (draggingArrowId && draggingArrowPart) {
          setArrows((prev) => prev.map((arrow) => arrow.id !== draggingArrowId ? arrow : draggingArrowPart === 'start' ? { ...arrow, startX: x, startY: y } : { ...arrow, endX: x, endY: y }));
        }
      });
    };

    const handleUp = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      setDraggingPointId(null);
      setDraggingArrowId(null);
      setDraggingArrowPart(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [draggingPointId, draggingArrowId, draggingArrowPart, activeVariation, setDraft, setArrows, setDraggingPointId, setDraggingArrowId, setDraggingArrowPart]);


  if (!draft) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 gap-4">
        <MousePointer2 size={48} className="opacity-20" />
        <p>اختر قالباً للبدء</p>
      </div>
    );
  }

  const ToolButton = ({ mode, icon: Icon, label, active }: any) => (
    <button
      onClick={() => setToolMode(mode)}
      className={`p-2.5 rounded-lg transition-all duration-200 group relative ${
        active 
        ? 'bg-purple-600 text-white shadow-md scale-105' 
        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
      }`}
      title={label}
    >
      <Icon size={20} />
      {/* Tooltip */}
      <span className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
        {label}
      </span>
    </button>
  );

  return (
    <div className="h-full flex relative bg-white dark:bg-zinc-900">
      {/* Left Vertical Toolbar */}
      <div className="p-2 border-l border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 backdrop-blur-sm z-30 flex flex-col gap-3">
        {/* Top Section: Undo/Redo/Upload */}
        <div className="flex flex-col gap-1">
           <button onClick={onUndo} disabled={!canUndo} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 transition text-zinc-500 dark:text-zinc-400"><Undo2 size={16}/></button>
           <button onClick={onRedo} disabled={!canRedo} className="p-1.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-30 transition text-zinc-500 dark:text-zinc-400"><Redo2 size={16}/></button>
           <div className="h-px w-5 bg-zinc-300 dark:bg-zinc-700 my-1 mx-auto" />
           <label className="p-1.5 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition text-zinc-500 dark:text-zinc-400" title="رفع صورة">
             <ImageIcon size={16} />
             <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'baseImageUrl', () => (e.target.value = ''))} />
           </label>
           <label className="p-1.5 rounded cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700 transition text-zinc-500 dark:text-zinc-400" title="رفع ملف فيكتور">
             <Wand2 size={16} />
             <input type="file" accept=".svg,.ai,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'vectorUrl', () => (e.target.value = ''))} />
           </label>
        </div>
        
        {/* Tools Section */}
        <div className="flex flex-col gap-1 border-t border-zinc-300 dark:border-zinc-700 pt-2">
          <button 
            onClick={() => setToolMode('select')}
            className={`p-1.5 rounded-lg transition-all ${toolMode === 'select' ? 'bg-theme-primary text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}
            title="تحديد ونقل"
          >
            <MousePointer2 size={16} />
          </button>
          <button 
            onClick={() => setToolMode('add')}
            disabled={!draft?.baseImageUrl}
            className={`p-1.5 rounded-lg transition-all ${toolMode === 'add' ? 'bg-theme-primary text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400'} disabled:opacity-30 disabled:cursor-not-allowed`}
            title={draft?.baseImageUrl ? "إضافة نقطة" : "ارفع صورة أولاً"}
          >
            <Plus size={16} />
          </button>
          <button 
            onClick={() => setToolMode('arrow')}
            disabled={!draft?.baseImageUrl}
            className={`p-1.5 rounded-lg transition-all ${toolMode === 'arrow' ? 'bg-theme-primary text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400'} disabled:opacity-30 disabled:cursor-not-allowed`}
            title={draft?.baseImageUrl ? "رسم سهم" : "ارفع صورة أولاً"}
          >
            <ArrowRight size={16} />
          </button>
          <button 
            onClick={() => setToolMode('delete')}
            className={`p-1.5 rounded-lg transition-all ${toolMode === 'delete' ? 'bg-theme-primary text-white' : 'hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400'}`}
            title="حذف عنصر"
          >
            <Eraser size={16} />
          </button>
          <button 
            onClick={() => setShowLabels(!showLabels)}
            className={`p-1.5 rounded-lg transition-all ${showLabels ? 'text-theme-primary bg-theme-primary/10' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'}`}
            title="إظهار الأسماء"
          >
            {showLabels ? <Eye size={16}/> : <EyeOff size={16}/>}
          </button>
        </div>

        {/* Sliders Section */}
        <div className="flex flex-col gap-2 border-t border-zinc-300 dark:border-zinc-700 pt-2">
          {/* Size Slider - Vertical */}
          <div className="flex flex-col items-center gap-1">
            <ZoomIn size={12} className="text-zinc-500 dark:text-zinc-500"/>
            <input 
              type="range" min="28" max="64" value={pointSize} 
              onChange={(e) => setPointSize(Number(e.target.value))}
              className="w-1 h-12 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{ writingMode: 'vertical-lr' }}
              title="حجم النقاط"
            />
            <ZoomOut size={12} className="text-zinc-500 dark:text-zinc-500"/>
          </div>
          
          {/* Opacity Slider - Vertical */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 opacity-100"/>
            <input 
              type="range" min="30" max="100" value={pointOpacity} 
              onChange={(e) => setPointOpacity(Number(e.target.value))}
              className="w-1 h-12 bg-zinc-300 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{ writingMode: 'vertical-lr' }}
              title="شفافية النقاط"
            />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-400 opacity-30"/>
          </div>
        </div>

        {/* Color Picker */}
          <div className="relative group border-t border-zinc-300 dark:border-zinc-700 pt-2 flex justify-center">
            <div className="w-5 h-5 rounded-full border-2 border-zinc-400 dark:border-zinc-600 shadow-sm cursor-pointer" style={{ backgroundColor: pointColor }}></div>
           <input type="color" value={pointColor} onChange={(e) => onPointColorChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>

        {/* Delete Template */}
        <button 
          onClick={onDeleteTemplate} 
          disabled={!canDeleteTemplate}
          className="text-rose-400 hover:bg-rose-500/20 p-1.5 rounded transition disabled:opacity-30 mt-auto"
          title="حذف القالب بالكامل"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Main Canvas Area */}
        <div className="flex-1 overflow-auto flex flex-col justify-center items-center p-6 bg-zinc-100 dark:bg-zinc-950 gap-4">
        <div className="w-full max-w-5xl flex flex-wrap items-center gap-2">
          <div
            className={`group relative rounded-xl border p-1 transition-colors ${
              activeImageMode === 'base'
                ? 'border-theme-primary ring-2 ring-theme-primary/30'
                : 'border-zinc-200 dark:border-zinc-700'
            }`}
          >
            <button
              type="button"
              onClick={() => {
                setActiveImageMode('base');
                onSetActiveVariation(null);
              }}
              className="block"
              title="الصورة الأساسية"
            >
              {draft.baseImageUrl ? (
                <img src={draft.baseImageUrl} alt="الصورة الأساسية" className="w-12 h-12 rounded-lg object-cover" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-500 dark:text-zinc-400">
                  Base
                </div>
              )}
            </button>

            {draft.baseImageUrl && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  const confirmed = window.confirm('هل تريد حذف الصورة الأساسية؟');
                  if (!confirmed) return;
                  setDraft((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      baseImageUrl: '',
                      baseImageName: 'الصورة الأساسية',
                    };
                  });
                }}
                className="absolute -top-2 -right-2 z-20 bg-rose-500 text-white rounded-full p-0.5 opacity-95 hover:opacity-100 shadow"
                title="حذف الصورة الأساسية"
              >
                <X size={10} />
              </button>
            )}
          </div>

          {variations.map((variation, index) => {
            const isActive = activeImageMode === 'variation' && activeVariationIndex === index;
            return (
              <div
                key={variation.id}
                className={`group relative rounded-xl border overflow-visible p-1 ${
                  isActive ? 'border-theme-primary ring-2 ring-theme-primary/30' : 'border-zinc-200 dark:border-zinc-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveImageMode('variation');
                    setActiveVariationIndex(index);
                    onSetActiveVariation(variation.id);
                  }}
                  className="block"
                  title={variation.name || `متغيّر ${index + 1}`}
                >
                  <img src={variation.imageUrl} alt={variation.name || `متغيّر ${index + 1}`} className={`w-12 h-12 rounded-lg object-cover ${variation.enabled ? '' : 'grayscale opacity-60'}`} />
                </button>
              </div>
            );
          })}

          <label className="px-3 py-1.5 rounded-xl text-xs border border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 cursor-pointer hover:border-theme-primary transition-colors">
            + إضافة متغيّر
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'variationImageUrl', () => (e.target.value = ''))} />
          </label>
        </div>

        <div 
          ref={canvasRef} 
          onClick={onCanvasClick}
            className={`relative shadow-2xl bg-white dark:bg-[#1a1a1a] border border-zinc-200 dark:border-zinc-700 transition-shadow duration-300 ${toolMode === 'add' ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{
            maxHeight: '800px',
            maxWidth: '100%',
            width: 'fit-content',
            height: 'fit-content',
          }}
        >
          {displayedImageUrl ? (
            <img 
              src={displayedImageUrl} 
              className="w-full h-full object-contain pointer-events-none select-none" 
              style={{ maxHeight: '800px', userSelect: 'none' }}
              alt="template"
              draggable={false}
            />
          ) : (
             <div className="flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400 gap-2 border-2 border-dashed border-zinc-300 dark:border-zinc-700 p-12 rounded-lg min-w-[350px] min-h-[350px] bg-zinc-50 dark:bg-zinc-900/40">
               <Upload size={28} />
               <span className="text-xs">اضغط على أيقونة الصورة في الأعلى للبدء</span>
             </div>
          )}

          {/* SVG Layer for Arrows */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            <defs>
              <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto">
                <polygon points="0 0, 8 3, 0 6" fill="#a855f7" />
              </marker>
            </defs>
            {arrows.map((arrow) => (
              <line 
                key={arrow.id}
                x1={`${arrow.startX * 100}%`} y1={`${arrow.startY * 100}%`}
                x2={`${arrow.endX * 100}%`} y2={`${arrow.endY * 100}%`}
                stroke="#a855f7" strokeWidth="3" markerEnd="url(#arrowhead)"
              />
            ))}
          </svg>

          {/* Points Rendering */}
          {activePoints.map((point, idx) => (
            <div
              key={point.id}
              className={`absolute group transition-transform ${point.id === draggingPointId ? 'z-50 scale-110' : 'z-20 hover:scale-110'}`}
              style={{
                left: `${point.x * 100}%`, top: `${point.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                cursor: toolMode === 'delete' ? deleteCursor : toolMode === 'select' ? 'move' : 'default',
              }}
              onMouseDown={(e) => { e.stopPropagation(); toolMode === 'select' && onPointMouseDown(point.id, e); }}
              onClick={(e) => onPointClick(point.id, e)}
              onDoubleClick={(e) => onPointDoubleClick(point.id, e)}
              onContextMenu={(e) => { e.preventDefault(); toolMode === 'select' && onDuplicatePoint(point.id); }}
            >
              <div 
                className="rounded-full shadow-lg border-[3px] border-white flex items-center justify-center"
                style={{ width: `${pointSize}px`, height: `${pointSize}px`, backgroundColor: pointColor, opacity: pointOpacity / 100 }}
              >
                <span className="text-white font-bold drop-shadow-md text-sm select-none">{point.order || idx + 1}</span>
              </div>
              {showLabels && (
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm whitespace-nowrap">
                  {point.label}
                </div>
              )}
            </div>
          ))}

          {/* Arrow Handles (Start/End) */}
          {arrows.map((arrow) => (
             <React.Fragment key={`h-${arrow.id}`}>
               {/* Start Handle */}
               <div 
                 className="absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-md z-30 cursor-move"
                 style={{ left: `${arrow.startX * 100}%`, top: `${arrow.startY * 100}%`, transform: 'translate(-50%, -50%)', cursor: toolMode === 'delete' ? deleteCursor : 'move' }}
                 onMouseDown={(e) => { e.stopPropagation(); toolMode === 'select' ? onArrowMouseDown(arrow.id, 'start', e) : toolMode === 'delete' && onDeleteArrow(arrow.id); }}
                 onDoubleClick={() => onArrowDoubleClick(arrow.id)}
               />
               {/* End Handle */}
               <div 
                 className="absolute w-4 h-4 bg-purple-500 border-2 border-white rounded-full shadow-md z-30 cursor-move"
                 style={{ left: `${arrow.endX * 100}%`, top: `${arrow.endY * 100}%`, transform: 'translate(-50%, -50%)', cursor: toolMode === 'delete' ? deleteCursor : 'move' }}
                 onMouseDown={(e) => { e.stopPropagation(); toolMode === 'select' ? onArrowMouseDown(arrow.id, 'end', e) : toolMode === 'delete' && onDeleteArrow(arrow.id); }}
                 onDoubleClick={() => onArrowDoubleClick(arrow.id)}
               />
             </React.Fragment>
          ))}
          
           {/* Temporary Arrow Draft */}
           {arrowDraft && (
              <div className="absolute w-3 h-3 bg-purple-400 rounded-full animate-pulse z-30" style={{ left: `${arrowDraft.startX * 100}%`, top: `${arrowDraft.startY * 100}%`, transform: 'translate(-50%, -50%)' }} />
           )}
        </div>
      </div>
    </div>
  );
};