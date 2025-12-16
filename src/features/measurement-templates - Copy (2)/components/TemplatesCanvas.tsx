import React, { useEffect, useRef } from 'react';
import {
  Upload, Wand2, MousePointer2, Plus, Eraser, ArrowRight,
  Eye, EyeOff, ZoomIn, ZoomOut, Trash2, Undo2, Redo2, Image as ImageIcon
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
  onPointMouseDown: (pointId: string, event: React.MouseEvent) => void;
  onArrowMouseDown: (arrowId: string, part: 'start' | 'end', event: React.MouseEvent) => void;
  onArrowDoubleClick: (arrowId: string) => void;
  onDeleteArrow: (arrowId: string) => void;
  onImageUpload: (file: File, key: 'baseImageUrl' | 'vectorUrl', callback?: (success: boolean) => void) => void;
  onSave: () => void;
  onDuplicatePoint: (pointId: string) => void;
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
  onCanvasClick, onPointClick, onPointMouseDown, onArrowMouseDown,
  onArrowDoubleClick, onDeleteArrow, onImageUpload, onUndo, onRedo,
  onDeleteTemplate, onPointColorChange, onDuplicatePoint,
  setToolMode, setPointSize, setPointOpacity, setShowLabels,
  setArrowDraft, setDraggingPointId, setDraggingArrowId, setDraggingArrowPart,
  setDraft, setArrows,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const deleteCursor = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='11' fill='%23f87171' stroke='white' stroke-width='2'/%3E%3Cline x1='7' y1='12' x2='17' y2='12' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 12 12, not-allowed";

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
          setDraft((prev) => prev ? { ...prev, points: prev.points.map((p) => (p.id === draggingPointId ? { ...p, x, y } : p)) } : prev);
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
  }, [draggingPointId, draggingArrowId, draggingArrowPart, setDraft, setArrows, setDraggingPointId, setDraggingArrowId, setDraggingArrowPart]);


  if (!draft) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
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
        ? 'bg-indigo-600 text-white shadow-md scale-105' 
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
    <div className="h-full flex flex-col relative">
      {/* Top Toolbar */}
      <div className="p-3 border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm sticky top-0 z-30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
           <button onClick={onUndo} disabled={!canUndo} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"><Undo2 size={18}/></button>
           <button onClick={onRedo} disabled={!canRedo} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition"><Redo2 size={18}/></button>
           <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1" />
           <label className="p-2 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-600" title="رفع صورة">
             <ImageIcon size={18} />
             <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'baseImageUrl', () => (e.target.value = ''))} />
           </label>
           <label className="p-2 rounded cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition text-slate-600" title="رفع ملف فيكتور">
             <Wand2 size={18} />
             <input type="file" accept=".svg,.ai,.pdf" className="hidden" onChange={(e) => e.target.files?.[0] && onImageUpload(e.target.files[0], 'vectorUrl', () => (e.target.value = ''))} />
           </label>
        </div>
        
        <div className="flex items-center gap-3">
           {/* Color Picker Compact */}
           <div className="relative group">
              <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm cursor-pointer" style={{ backgroundColor: pointColor }}></div>
              <input type="color" value={pointColor} onChange={(e) => onPointColorChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
           </div>

           {/* Delete Template */}
           <button 
             onClick={onDeleteTemplate} 
             disabled={!canDeleteTemplate}
             className="text-rose-500 hover:bg-rose-50 p-2 rounded transition disabled:opacity-30"
             title="حذف القالب بالكامل"
           >
             <Trash2 size={18} />
           </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="flex-1 overflow-auto flex justify-center p-8 bg-slate-50 dark:bg-slate-900/50">
        <div 
          ref={canvasRef} 
          onClick={onCanvasClick}
          className={`relative shadow-2xl bg-white transition-shadow duration-300 ${toolMode === 'add' ? 'cursor-crosshair' : 'cursor-default'}`}
          style={{
            width: `${appSettings.measurementTemplateWidth || 460}px`,
            height: `${appSettings.measurementTemplateHeight || 690}px`,
            minWidth: `${appSettings.measurementTemplateWidth || 460}px`,
            minHeight: `${appSettings.measurementTemplateHeight || 690}px`,
          }}
        >
          {draft.baseImageUrl ? (
            <img 
              src={draft.baseImageUrl} 
              className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none" 
              alt="template" 
            />
          ) : (
             <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 gap-2 border-2 border-dashed border-slate-200 m-4 rounded-xl">
               <Upload size={32} />
               <span className="text-sm">اضغط على أيقونة الصورة في الأعلى للبدء</span>
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
          {draft.points.map((point, idx) => (
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

      {/* Floating Controls Dock */}
      <div className="absolute left-4 top-20 flex flex-col gap-4 z-40">
        {/* Tools */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 flex flex-col gap-1">
          <ToolButton mode="select" icon={MousePointer2} label="تحديد ونقل" active={toolMode === 'select'} />
          <ToolButton mode="add" icon={Plus} label="إضافة نقطة" active={toolMode === 'add'} />
          <ToolButton mode="arrow" icon={ArrowRight} label="رسم سهم" active={toolMode === 'arrow'} />
          <ToolButton mode="delete" icon={Eraser} label="حذف عنصر" active={toolMode === 'delete'} />
          <div className="h-px bg-slate-200 dark:bg-slate-700 my-0.5" />
          <button onClick={() => setShowLabels(!showLabels)} className={`p-2.5 rounded-lg transition-all ${showLabels ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-100'}`} title="إظهار الأسماء">
             {showLabels ? <Eye size={20}/> : <EyeOff size={20}/>}
          </button>
        </div>

        {/* Sliders (Vertical) */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-col items-center gap-4">
           <div className="h-32 flex flex-col items-center gap-2 group relative">
             <ZoomIn size={14} className="text-slate-400"/>
             <input 
               type="range" min="28" max="64" value={pointSize} 
               onChange={(e) => setPointSize(Number(e.target.value))}
               className="h-24 w-1 bg-slate-200 rounded-lg appearance-none cursor-pointer vertical-slider"
               style={{ writingMode: 'vertical-lr', direction: 'ltr' }} 
             />
             <ZoomOut size={14} className="text-slate-400"/>
             <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">الحجم</span>
           </div>
           
           <div className="w-full h-px bg-slate-200 dark:bg-slate-700" />
           
           <div className="h-32 flex flex-col items-center gap-2 group relative">
             <div className="w-3 h-3 rounded-full bg-slate-400 opacity-100"/>
             <input 
               type="range" min="30" max="100" value={pointOpacity} 
               onChange={(e) => setPointOpacity(Number(e.target.value))}
               className="h-24 w-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
               style={{ writingMode: 'vertical-lr', direction: 'ltr' }}
             />
             <div className="w-3 h-3 rounded-full bg-slate-400 opacity-30"/>
             <span className="absolute right-full mr-2 top-1/2 -translate-y-1/2 text-xs bg-slate-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">الشفافية</span>
           </div>
        </div>
      </div>
    </div>
  );
};