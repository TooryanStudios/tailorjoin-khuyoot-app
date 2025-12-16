import React, { useEffect, useRef } from 'react';
import {
  Loader2,
  Save,
  Upload,
  Wand2,
  MousePointer2,
  Plus,
  Eraser,
  ArrowRight,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Trash2,
} from 'lucide-react';
import { MeasurementTemplate, MeasurementPoint, AppSettings } from '../../../../types';
import { Arrow, ToolMode } from '../types';

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
  draft,
  toolMode,
  pointSize,
  pointOpacity,
  arrows,
  arrowDraft,
  draggingPointId,
  draggingArrowId,
  draggingArrowPart,
  showLabels,
  isSaving,
  appSettings,
  pointColor,
  canUndo,
  canRedo,
  canDeleteTemplate,
  onCanvasClick,
  onPointClick,
  onPointMouseDown,
  onArrowMouseDown,
  onArrowDoubleClick,
  onDeleteArrow,
  onImageUpload,
  onSave,
  onDuplicatePoint,
  onUndo,
  onRedo,
  onDeleteTemplate,
  onPointColorChange,
  setToolMode,
  setPointSize,
  setPointOpacity,
  setShowLabels,
  setArrowDraft,
  setDraggingPointId,
  setDraggingArrowId,
  setDraggingArrowPart,
  setDraft,
  setArrows,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const deleteCursor =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='11' fill='%23f87171' stroke='white' stroke-width='2'/%3E%3Cline x1='7' y1='12' x2='17' y2='12' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 12 12, not-allowed";

  // Handle dragging points and arrows
  useEffect(() => {
    if (!draggingPointId && !draggingArrowId) return;

    let animationFrameId: number;
    const rectCache = canvasRef.current?.getBoundingClientRect();

    const handleMove = (event: MouseEvent) => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }

      animationFrameId = requestAnimationFrame(() => {
        if (!canvasRef.current || !rectCache) return;
        const x = Math.min(Math.max((event.clientX - rectCache.left) / rectCache.width, 0), 1);
        const y = Math.min(Math.max((event.clientY - rectCache.top) / rectCache.height, 0), 1);

        if (draggingPointId) {
          setDraft((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              points: prev.points.map((p) => (p.id === draggingPointId ? { ...p, x, y } : p)),
            };
          });
        } else if (draggingArrowId && draggingArrowPart) {
          setArrows((prev) =>
            prev.map((arrow) => {
              if (arrow.id !== draggingArrowId) return arrow;
              if (draggingArrowPart === 'start') {
                return { ...arrow, startX: x, startY: y };
              } else {
                return { ...arrow, endX: x, endY: y };
              }
            }),
          );
        }
      });
    };

    const handleUp = () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      setDraggingPointId(null);
      setDraggingArrowId(null);
      setDraggingArrowPart(null);
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
  }, [draggingPointId, draggingArrowId, draggingArrowPart, setDraft, setArrows, setDraggingPointId, setDraggingArrowId, setDraggingArrowPart]);

  if (!draft) {
    return (
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500">
        اختر قالباً من القائمة أو أنشئ قالباً جديداً للبدء.
      </div>
    );
  }

  const activeTemplateName = draft.name || 'اختر قالباً';
  const pointsCount = draft.points.length;
  const arrowsCount = arrows.length;
  const lastUpdatedText = draft.updatedAt
    ? new Date(draft.updatedAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })
    : 'غير محفوظ بعد';

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
      <div className="flex justify-end mb-3">
        <div className="inline-flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 px-4 py-2 shadow-sm">
          <div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">آخر تعديل</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white whitespace-nowrap">{lastUpdatedText}</p>
          </div>
          <div className="flex items-baseline gap-1">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">نقاط</p>
              <p className="text-lg font-bold text-indigo-600 dark:text-indigo-300 leading-none">{pointsCount}</p>
            </div>
            <span className="text-slate-400">/</span>
            <div className="text-left">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">أسهم</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-300 leading-none">{arrowsCount}</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">القالب الحالي</p>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
            {activeTemplateName}
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <button
            onClick={onDeleteTemplate}
            disabled={!canDeleteTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-colors"
            title="حذف القالب الحالي"
          >
            <Trash2 size={14} />
            <span>حذف</span>
          </button>
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-700/70 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className="px-2 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center"
              title="تراجع (Ctrl+Z)"
            >
              <span className="text-base">↶</span>
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className="px-2 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center"
              title="إعادة (Ctrl+Y)"
            >
              <span className="text-base">↷</span>
            </button>
          </div>
          <div className="flex items-center gap-1 bg-white dark:bg-slate-700/70 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-sm">
            <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">لون</span>
            <input
              type="color"
              value={pointColor}
              onChange={(e) => onPointColorChange(e.target.value)}
              className="w-7 h-7 rounded border-2 border-slate-300 cursor-pointer"
              title="اختر لون النقاط"
            />
          </div>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-medium bg-white/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-sm group relative">
            <Upload size={14} />
            <span>صورة</span>
            {!draft?.imageUrl && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2 bg-amber-500 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                <div className="font-bold mb-0.5">مقاس الصورة الموحد</div>
                <div>يجب أن تكون {appSettings.measurementTemplateWidth || 460}×{appSettings.measurementTemplateHeight || 690} بكسل</div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-amber-500"></div>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file, 'baseImageUrl', () => {
                    e.target.value = '';
                  });
                }
              }}
            />
          </label>
          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-medium bg-white/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-sm">
            <Wand2 size={14} />
            <span>فيكتور</span>
            <input
              type="file"
              accept=".svg,.ai,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  onImageUpload(file, 'vectorUrl', () => {
                    e.target.value = '';
                  });
                }
              }}
            />
          </label>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px]">
        {/* Canvas */}
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex-shrink-0">
            <button
              type="button"
              className="px-4 py-2 rounded-2xl text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 shadow-md hover:shadow-lg transition-all"
            >
              القوالب
            </button>
          </div>
          <div className="flex-1">
            <div className="overflow-auto border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/40 p-4 flex justify-center relative shadow-inner">
          <div
            ref={canvasRef}
            onClick={onCanvasClick}
            className={`relative flex-shrink-0 ${
              toolMode === 'add' ? 'cursor-crosshair' : 'cursor-default'
            }`}
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
                alt="template"
                className="absolute inset-0 w-full h-full select-none"
                style={{
                  imageRendering: 'crisp-edges',
                  userSelect: 'none',
                  WebkitUserDrag: 'none',
                  pointerEvents: 'none',
                }}
                draggable={false}
                onDragStart={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-center text-slate-500 text-sm">
                ارفع صورة أو ملف فيكتور ثم انقر على الصورة لإضافة النقاط.
              </div>
            )}

            {/* Draw arrows */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
              {arrows.map((arrow) => {
                const startX = arrow.startX * 100;
                const startY = arrow.startY * 100;
                const endX = arrow.endX * 100;
                const endY = arrow.endY * 100;

                return (
                  <g key={arrow.id}>
                    <line
                      x1={`${startX}%`}
                      y1={`${startY}%`}
                      x2={`${endX}%`}
                      y2={`${endY}%`}
                      stroke="#a855f7"
                      strokeWidth="3"
                      markerEnd="url(#arrowhead)"
                    />
                  </g>
                );
              })}

              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#a855f7" />
                </marker>
              </defs>
            </svg>

            {/* Arrow start/end points for dragging */}
            {arrows.map((arrow) => (
              <React.Fragment key={`arrow-points-${arrow.id}`}>
                <div
                  className="absolute w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-md cursor-move z-20"
                  style={{
                    left: `${arrow.startX * 100}%`,
                    top: `${arrow.startY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'auto',
                    cursor: toolMode === 'delete' ? deleteCursor : 'move',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (toolMode === 'select') {
                      onArrowMouseDown(arrow.id, 'start', e);
                    } else if (toolMode === 'delete') {
                      onDeleteArrow(arrow.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onArrowDoubleClick(arrow.id);
                  }}
                />
                <div
                  className="absolute w-3 h-3 rounded-full bg-purple-500 border-2 border-white shadow-md cursor-move z-20"
                  style={{
                    left: `${arrow.endX * 100}%`,
                    top: `${arrow.endY * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'auto',
                    cursor: toolMode === 'delete' ? deleteCursor : 'move',
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    if (toolMode === 'select') {
                      onArrowMouseDown(arrow.id, 'end', e);
                    } else if (toolMode === 'delete') {
                      onDeleteArrow(arrow.id);
                    }
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    onArrowDoubleClick(arrow.id);
                  }}
                />
              </React.Fragment>
            ))}

            {/* Temporary arrow start point */}
            {arrowDraft && (
              <div
                className="absolute w-3 h-3 rounded-full bg-purple-400 border-2 border-white shadow-lg animate-pulse z-20"
                style={{
                  left: `${arrowDraft.startX * 100}%`,
                  top: `${arrowDraft.startY * 100}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )}

            {/* Measurement points */}
            {draft.points.map((point, idx) => (
              <div
                key={point.id}
                className={`absolute group ${
                  point.id === draggingPointId ? 'z-50' : 'z-10 hover:z-40'
                }`}
                style={{
                  left: `${point.x * 100}%`,
                  top: `${point.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  cursor:
                    toolMode === 'delete'
                      ? deleteCursor
                      : toolMode === 'select'
                      ? 'move'
                      : toolMode === 'arrow'
                      ? 'crosshair'
                      : 'default',
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  if (toolMode === 'select') {
                    onPointMouseDown(point.id, e);
                  }
                }}
                onClick={(e) => onPointClick(point.id, e)}
                title={point.note || point.label}
              >
                <div
                  className={`relative rounded-full border-[3px] shadow-md flex items-center justify-center select-none transition-all duration-200 ${
                    point.id === draggingPointId
                      ? 'border-white shadow-xl scale-110 ring-4 ring-white/50'
                      : 'border-white group-hover:shadow-xl group-hover:scale-110'
                  }`}
                  style={{
                    width: `${pointSize}px`,
                    height: `${pointSize}px`,
                    opacity: pointOpacity / 100,
                    backgroundColor: pointColor,
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (toolMode === 'select') {
                      onDuplicatePoint(point.id);
                    }
                  }}
                >
                  <span className="text-xs font-bold text-white select-none pointer-events-none drop-shadow">
                    {point.order || idx + 1}
                  </span>
                </div>

                {showLabels && (
                  <div
                    className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md shadow-lg text-xs font-bold whitespace-nowrap select-none animate-fade-in ${
                      point.id === draggingPointId
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white opacity-100'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white opacity-100'
                    }`}
                  >
                    {point.label}
                  </div>
                )}
              </div>
            ))}
          </div>
            </div>
          </div>
        </div>

        {/* Tools & sliders */}
        <div className="flex flex-col gap-3">
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 text-center mb-2">
              الأدوات
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
              <button
                onClick={() => setToolMode('select')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold py-2 transition ${
                  toolMode === 'select'
                    ? 'bg-blue-500 text-white border-blue-500 shadow'
                    : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/40 hover:bg-white'
                }`}
                title="تحديد ونقل النقاط"
              >
                <MousePointer2 size={16} />
                <span>تحديد</span>
              </button>
              <button
                onClick={() => setToolMode('add')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold py-2 transition ${
                  toolMode === 'add'
                    ? 'bg-green-500 text-white border-green-500 shadow'
                    : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/40 hover:bg-white'
                }`}
                title="إضافة نقاط جديدة"
              >
                <Plus size={16} />
                <span>إضافة</span>
              </button>
              <button
                onClick={() => setToolMode('delete')}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold py-2 transition ${
                  toolMode === 'delete'
                    ? 'bg-red-500 text-white border-red-500 shadow'
                    : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/40 hover:bg-white'
                }`}
                title="حذف النقاط والأسهم"
              >
                <Eraser size={16} />
                <span>حذف</span>
              </button>
              <button
                onClick={() => {
                  setToolMode('arrow');
                  setArrowDraft(null);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold py-2 transition ${
                  toolMode === 'arrow'
                    ? 'bg-purple-500 text-white border-purple-500 shadow'
                    : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/40 hover:bg-white'
                }`}
                title="رسم أسهم مستقلة"
              >
                <ArrowRight size={16} />
                <span>سهم</span>
              </button>
              <button
                onClick={() => setShowLabels(!showLabels)}
                className={`flex flex-col items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold py-2 transition ${
                  showLabels
                    ? 'bg-blue-500 text-white border-blue-500 shadow'
                    : 'bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-white/40 hover:bg-white'
                }`}
                title={showLabels ? 'إخفاء أسماء النقاط' : 'إظهار أسماء النقاط'}
              >
                {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
                <span>{showLabels ? 'إخفاء' : 'إظهار'}</span>
              </button>
            </div>
            {arrowDraft && (
              <p className="mt-3 text-[11px] text-purple-600 dark:text-purple-300 text-center bg-purple-50/70 dark:bg-purple-900/30 rounded-lg py-1">
                انقر على اللوحة لتحديد نهاية السهم
              </p>
            )}
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-3 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                <span>حجم النقاط</span>
                <span className="font-mono">{pointSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPointSize(Math.max(28, pointSize - 4))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  title="تصغير"
                  disabled={pointSize <= 28}
                >
                  <ZoomOut size={14} />
                </button>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-green-500"
                    style={{ width: `${((pointSize - 28) / (64 - 28)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setPointSize(Math.min(64, pointSize + 4))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  title="تكبير"
                  disabled={pointSize >= 64}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                <span>وضوح النقاط</span>
                <span className="font-mono">{pointOpacity}%</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPointOpacity(Math.max(50, pointOpacity - 10))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  title="شفاف أكثر"
                  disabled={pointOpacity <= 50}
                >
                  <ZoomOut size={14} />
                </button>
                <div className="flex-1 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-full rounded-full bg-blue-500"
                    style={{ width: `${((pointOpacity - 50) / (100 - 50)) * 100}%` }}
                  />
                </div>
                <button
                  onClick={() => setPointOpacity(Math.min(100, pointOpacity + 10))}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-30"
                  title="واضح أكثر"
                  disabled={pointOpacity >= 100}
                >
                  <ZoomIn size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700 rounded-2xl p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
              معلومات سريعة
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              استخدم أداة الحذف لإزالة أي نقطة أو سهم مباشرة، وسيتم تحديث القائمة الجانبية
              فوراً.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
