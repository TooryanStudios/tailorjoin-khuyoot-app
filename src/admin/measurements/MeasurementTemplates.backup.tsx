import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Loader2,
  PenTool,
  Plus,
  Save,
  Target,
  Trash2,
  Upload,
  Wand2,
  MousePointer2,
  ArrowRight,
  Eraser,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '../../../components/Button';
import { MeasurementPoint, MeasurementTemplate, GarmentType } from '../../../types';
import { firebaseService } from '../../../services/firebase';
import { useApp } from '../../../context/AppContext';

type ToolMode = 'select' | 'add' | 'delete' | 'arrow' | 'connect';

interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

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

const createEmptyTemplate = (): MeasurementTemplate => {
  const now = new Date().toISOString();
  return {
    id: `temp-${Date.now()}`,
    name: 'قالب جديد',
    productType: 'dishdasha',
    baseImageUrl: '',
    vectorUrl: '',
    points: [],
    arrows: [],
    pointSize: 44,
    pointOpacity: 90,
    description: 'أضف صورة وحدد النقاط لتحصل على قالب جاهز',
    createdAt: now,
    updatedAt: now,
  };
};

export const MeasurementTemplates: React.FC = () => {
  const { appSettings } = useApp();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeasurementTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [arrowStart] = useState<string | null>(null);
  const [pointSize, setPointSize] = useState<number>(44);
  const [pointOpacity, setPointOpacity] = useState<number>(90);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [arrowDraft, setArrowDraft] = useState<{ startX: number; startY: number } | null>(null);
  const [draggingArrowId, setDraggingArrowId] = useState<string | null>(null);
  const [draggingArrowPart, setDraggingArrowPart] = useState<'start' | 'end' | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(false);

  const deleteCursor =
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='12' cy='12' r='11' fill='%23f87171' stroke='white' stroke-width='2'/%3E%3Cline x1='7' y1='12' x2='17' y2='12' stroke='white' stroke-width='2'/%3E%3C/svg%3E\") 12 12, not-allowed";

  // إلغاء السهم المؤقت إذا غادرنا أداة الأسهم
  useEffect(() => {
    if (toolMode !== 'arrow' && arrowDraft) {
      setArrowDraft(null);
    }
  }, [toolMode, arrowDraft]);

  // تحميل القوالب من Firebase
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await firebaseService.getMeasurementTemplates();
      setTemplates(data);
      setActiveId(data[0]?.id || null);
      setDraft(data[0] || null);

      if (data[0]) {
        setPointSize(data[0].pointSize || 44);
        setPointOpacity(data[0].pointOpacity || 90);
        setArrows(data[0].arrows || []);
      }

      setIsLoading(false);
    };
    load();
  }, []);

  // سحب النقاط والأسهم
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
  }, [draggingPointId, draggingArrowId, draggingArrowPart]);

  const orderedPoints = useMemo(() => {
    if (!draft) return [] as MeasurementPoint[];
    return [...draft.points].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [draft]);

  const handleSelectTemplate = (templateId: string) => {
    const selected = templates.find((t) => t.id === templateId);
    setActiveId(templateId);
    setDraft(selected ? { ...selected } : null);

    if (selected) {
      setPointSize(selected.pointSize || 44);
      setPointOpacity(selected.pointOpacity || 90);
      setArrows(selected.arrows || []);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!draft || !canvasRef.current) return;

    if (toolMode === 'add') {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
      const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);
      const nextOrder =
        (draft.points.length ? Math.max(...draft.points.map((p) => p.order || 0)) : 0) + 1;

      const newPoint: MeasurementPoint = {
        id: `point-${Date.now()}`,
        label: `نقطة ${nextOrder}`,
        x,
        y,
        direction: 0,
        order: nextOrder,
      };

      setDraft({ ...draft, points: [...draft.points, newPoint] });
    } else if (toolMode === 'arrow') {
      handleArrowClick(event);
    }
  };

  const handlePointClick = (pointId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (toolMode === 'delete') {
      handleDeletePoint(pointId);
    }
  };

  const handleArrowClick = (event: React.MouseEvent) => {
    if (toolMode !== 'arrow' || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    if (!arrowDraft) {
      setArrowDraft({ startX: x, startY: y });
    } else {
      const newArrow: Arrow = {
        id: `arrow-${Date.now()}`,
        startX: arrowDraft.startX,
        startY: arrowDraft.startY,
        endX: x,
        endY: y,
      };
      setArrows([...arrows, newArrow]);
      setArrowDraft(null);
    }
  };

  const handleDeleteArrow = (arrowId: string) => {
    setArrows(arrows.filter((a) => a.id !== arrowId));
  };

  const handleUpdatePoint = (pointId: string, updates: Partial<MeasurementPoint>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        points: prev.points.map((p) => (p.id === pointId ? { ...p, ...updates } : p)),
      };
    });
  };

  const handleDeletePoint = (pointId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return { ...prev, points: prev.points.filter((p) => p.id !== pointId) };
    });
  };

  const handleImageUpload = (
    file: File,
    key: 'baseImageUrl' | 'vectorUrl',
    callback?: (success: boolean) => void,
  ) => {
    if (!draft) {
      alert('❌ الرجاء إنشاء قالب جديد أولاً قبل رفع الصور.');
      callback?.(false);
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('❌ الملف المرفوع ليس صورة. الرجاء اختيار ملف صورة.');
      callback?.(false);
      return;
    }

    console.log('🔄 بدء رفع الصورة...', { fileName: file.name, fileSize: file.size, fileType: file.type });

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        console.error('❌ فشل في قراءة الملف');
        alert('❌ خطأ في قراءة الملف. الرجاء المحاولة مرة أخرى.');
        callback?.(false);
        return;
      }

      console.log('✅ تم قراءة الملف، جاري التحقق من الأبعاد...');

      const img = new Image();

      img.onload = () => {
        const REQUIRED_WIDTH = appSettings.measurementTemplateWidth || 460;
        const REQUIRED_HEIGHT = appSettings.measurementTemplateHeight || 690;

        console.log('📏 أبعاد الصورة:', {
          width: img.width,
          height: img.height,
          required: `${REQUIRED_WIDTH}×${REQUIRED_HEIGHT}`,
          appSettings,
        });

        if (img.width !== REQUIRED_WIDTH || img.height !== REQUIRED_HEIGHT) {
          alert(
            `⚠️ مقاس الصورة غير صحيح!\n\nالمقاس المطلوب: ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} بكسل\nمقاس الصورة المرفوعة: ${img.width}×${img.height} بكسل\n\nالرجاء تعديل مقاس الصورة والمحاولة مرة أخرى.\n\nيمكنك تغيير المقاس الموحد من الإعدادات العامة.`,
          );
          callback?.(false);
          return;
        }

        console.log('✅ أبعاد الصورة صحيحة، جاري التحديث...');

        setDraft((prev) => {
          if (!prev) {
            console.error('❌ القالب غير موجود أثناء التحديث');
            return prev;
          }
          const updated = { ...prev, [key]: dataUrl };
          console.log('✅ تم تحديث القالب بنجاح');
          return updated;
        });
        callback?.(true);
      };

      img.onerror = () => {
        console.error('❌ خطأ في تحميل الصورة');
        alert('❌ خطأ في تحميل الصورة. تأكد من أن الملف صورة صالحة.');
        callback?.(false);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
      console.error('❌ خطأ في FileReader:', reader.error);
      alert('❌ خطأ في قراءة محتوى الصورة. الرجاء المحاولة مرة أخرى.');
      callback?.(false);
    };

    reader.readAsDataURL(file);
  };

  const handleCreateNew = () => {
    const newTemplate = createEmptyTemplate();
    setDraft(newTemplate);
    setActiveId(newTemplate.id);
    setPointSize(44);
    setPointOpacity(90);
    setArrows([]);
  };

  const handleSave = async () => {
    if (!draft) return;
    setIsSaving(true);

    const updatedDraft = {
      ...draft,
      pointSize,
      pointOpacity,
      arrows,
    };

    const saved = await firebaseService.saveMeasurementTemplate(updatedDraft);
    setTemplates((prev) => {
      const exists = prev.find((t) => t.id === saved.id);
      if (exists) {
        return prev.map((t) => (t.id === saved.id ? saved : t));
      }
      return [...prev, saved];
    });
    setDraft(saved);
    setActiveId(saved.id);
    setIsSaving(false);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!templateId) return;

    const template = templates.find((t) => t.id === templateId);
    const confirmed = confirm(
      `هل أنت متأكد من حذف القالب "${template?.name || 'غير معروف'}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`,
    );

    if (!confirmed) return;

    await firebaseService.deleteMeasurementTemplate(templateId);
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
    if (activeId === templateId) {
      const next = templates.find((t) => t.id !== templateId);
      setActiveId(next ? next.id : null);
      setDraft(next || null);
    }
  };

  const activeTemplateName = draft?.name || 'اختر قالباً';

  const renderRightColumnContent = () => {
    if (!draft) {
      return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center text-slate-500 shadow-sm">
          اختر قالباً من القائمة لعرض خصائصه.
        </div>
      );
    }

    return (
      <>
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
            <ListChecksIcon />
            <span className="font-semibold">تفاصيل القالب</span>
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500">اسم القالب</label>
            <input
              value={draft.name}
              onChange={(e) =>
                setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs text-slate-500">نوع المنتج</label>
            <select
              value={draft.productType}
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, productType: e.target.value as GarmentType } : prev,
                )
              }
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
              onChange={(e) =>
                setDraft((prev) =>
                  prev ? { ...prev, description: e.target.value } : prev,
                )
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
              rows={3}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <PenTool size={16} className="text-blue-500" />
            <p className="font-semibold text-slate-800 dark:text-white">
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
                    onChange={(e) =>
                      handleUpdatePoint(point.id, { label: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block">
                    ملاحظة
                  </label>
                  <input
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
                    value={point.note || ''}
                    onChange={(e) =>
                      handleUpdatePoint(point.id, { note: e.target.value })
                    }
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

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col items-center gap-3">
        <div className="text-center">
          <p className="text-slate-500 text-sm">مكتبة القوالب</p>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            إدارة قوالب القياسات
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleCreateNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2 text-sm px-4 py-2"
          >
            <Plus size={16} /> قالب جديد
          </Button>
          <Button
            onClick={handleSave}
            disabled={!draft || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 disabled:opacity-60 text-sm px-4 py-2"
          >
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}{' '}
            حفظ القالب
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)320px]">
        {/* Left column: templates list + tips */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-slate-500">القوالب المرتبطة بالمنتجات</p>
                <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                  كل القوالب ({templates.length})
                </h3>
              </div>
              {isLoading && <Loader2 className="animate-spin text-blue-500" size={18} />}
            </div>
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {templates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    activeId === template.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-blue-200'
                  }`}
                >
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {template.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      نوع المنتج:{' '}
                      {productTypes.find((p) => p.value === template.productType)?.label ||
                        'غير محدد'}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                    className="text-rose-500 hover:text-rose-600"
                    title="حذف القالب"
                  >
                    <Trash2 size={16} />
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

          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-2xl p-4 shadow-lg">
            <p className="text-sm font-semibold mb-1">تلميحات سريعة</p>
            <ul className="text-xs text-white/90 space-y-1 list-disc list-inside">
              <li>استخدم أداة التحديد لتحريك النقاط بدقة.</li>
              <li>زر الحفظ العائم يعمل من أي مكان داخل اللوحة.</li>
              <li>يمكنك حذف أي سهم من خلال أداة الحذف أو النقر المزدوج.</li>
            </ul>
          </div>
        </div>

        {/* Center column: canvas & tools */}
        <div className="space-y-4">
          {draft && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    القالب الحالي
                  </p>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">
                    {activeTemplateName}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 border rounded-lg cursor-pointer text-sm font-medium bg-white/60 dark:bg-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700 shadow-sm">
                    <Upload size={14} />
                    <span>صورة</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleImageUpload(file, 'baseImageUrl', () => {
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
                          handleImageUpload(file, 'vectorUrl', () => {
                            e.target.value = '';
                          });
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* تنبيه المقاسات المطلوبة */}
              <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
                    !
                  </div>
                  <div className="text-sm">
                    <p className="font-bold text-amber-800 dark:text-amber-200 mb-1">
                      مقاس الصورة الموحد
                    </p>
                    <p className="text-amber-700 dark:text-amber-300">
                      يجب أن تكون أبعاد الصورة{' '}
                      <span className="font-bold">
                        {appSettings.measurementTemplateWidth || 460}×
                        {appSettings.measurementTemplateHeight || 690} بكسل
                      </span>{' '}
                      بالضبط.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_150px]">
                {/* Canvas */}
                <div className="overflow-auto border border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/40 p-4 flex justify-center relative shadow-inner">
                  {/* زر الحفظ العائم */}
                  <button
                    onClick={handleSave}
                    disabled={!draft || isSaving}
                    className="absolute top-6 right-6 z-50 bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-600 hover:from-purple-600 hover:via-indigo-600 hover:to-blue-700 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed w-14 h-14 rounded-full shadow-[0_15px_35px_rgba(79,70,229,0.45)] hover:shadow-[0_20px_40px_rgba(59,130,246,0.55)] hover:scale-110 active:scale-95 transition-all duration-300 backdrop-blur-sm border-2 border-white"
                    title="حفظ القالب"
                  >
                    {isSaving ? (
                      <Loader2 size={22} className="animate-spin drop-shadow-md" />
                    ) : (
                      <Save size={22} className="drop-shadow-md" />
                    )}
                  </button>

                  <div
                    ref={canvasRef}
                    onClick={handleCanvasClick}
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

                    {/* رسم الأسهم */}
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

                    {/* نقاط بداية ونهاية الأسهم للسحب */}
                    {arrows.map((arrow) => (
                      <React.Fragment key={`arrow-points-${arrow.id}`}>
                        {/* start */}
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
                              setDraggingArrowId(arrow.id);
                              setDraggingArrowPart('start');
                            } else if (toolMode === 'delete') {
                              handleDeleteArrow(arrow.id);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('حذف السهم؟')) {
                              handleDeleteArrow(arrow.id);
                            }
                          }}
                        />
                        {/* end */}
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
                              setDraggingArrowId(arrow.id);
                              setDraggingArrowPart('end');
                            } else if (toolMode === 'delete') {
                              handleDeleteArrow(arrow.id);
                            }
                          }}
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('حذف السهم؟')) {
                              handleDeleteArrow(arrow.id);
                            }
                          }}
                        />
                      </React.Fragment>
                    ))}

                    {/* نقطة بداية السهم المؤقت */}
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

                    {/* النقاط */}
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
                            setDraggingPointId(point.id);
                          }
                        }}
                        onClick={(e) => handlePointClick(point.id, e)}
                        title={point.note || point.label}
                      >
                        <div
                          className={`relative rounded-full border-[3px] shadow-md flex items-center justify-center select-none ${
                            point.id === draggingPointId
                              ? 'border-white bg-green-500 shadow-lg'
                              : arrowStart === point.id
                              ? 'border-white bg-purple-500 shadow-lg'
                              : 'border-white bg-green-500 group-hover:bg-green-600 group-hover:shadow-lg'
                          }`}
                          style={{
                            width: `${pointSize}px`,
                            height: `${pointSize}px`,
                            opacity: pointOpacity / 100,
                          }}
                        >
                          <span className="text-xs font-bold text-white select-none pointer-events-none">
                            {point.order || idx + 1}
                          </span>
                        </div>

                        {showLabels && (
                          <div
                            className={`absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded-md shadow-lg text-xs font-bold whitespace-nowrap select-none ${
                              point.id === draggingPointId
                                ? 'bg-green-600 text-white opacity-100'
                                : 'bg-green-500 text-white opacity-100'
                            }`}
                          >
                            {point.label}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tools + sliders */}
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
                          onClick={() => setPointSize((prev) => Math.max(28, prev - 4))}
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
                          onClick={() => setPointSize((prev) => Math.min(64, prev + 4))}
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
                          onClick={() => setPointOpacity((prev) => Math.max(50, prev - 10))}
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
                          onClick={() => setPointOpacity((prev) => Math.min(100, prev + 10))}
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
                      استخدم أداة الحذف لإزالة أي نقطة أو سهم مباشرة، وسيتم تحديث القائمة
                      الجانبية فوراً.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!draft && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500">
              اختر قالباً من القائمة أو أنشئ قالباً جديداً للبدء.
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-6">{renderRightColumnContent()}</div>
      </div>
    </div>
  );
};

const ListChecksIcon = () => <Target size={18} className="text-blue-500" />;
