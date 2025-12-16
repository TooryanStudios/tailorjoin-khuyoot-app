import { useEffect, useMemo, useState } from 'react';
import { MeasurementPoint, MeasurementTemplate, GarmentType } from '../../../types';
import { firebaseService } from '../../../services/firebase';
import { useApp } from '../../../context/AppContext';
import { Arrow, ToolMode, MeasurementTemplatesState } from './types';
import { getFashionCategories } from '../../admin/products/services';

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

export const useMeasurementTemplates = () => {
  const { appSettings } = useApp();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeasurementTemplate | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [pointSize, setPointSize] = useState<number>(44);
  const [pointOpacity, setPointOpacity] = useState<number>(90);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [arrowDraft, setArrowDraft] = useState<{ startX: number; startY: number } | null>(null);
  const [draggingArrowId, setDraggingArrowId] = useState<string | null>(null);
  const [draggingArrowPart, setDraggingArrowPart] = useState<'start' | 'end' | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(false);
  const [history, setHistory] = useState<Array<{ draft: MeasurementTemplate; arrows: Arrow[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [pointColor, setPointColor] = useState<string>('#10b981');

  // Load templates from Fashion Categories
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        // جلب تصنيفات الأزياء من productCategories
        const allFashionCategories = await getFashionCategories();
        
        // إنشاء خريطة للتصنيفات الرئيسية (level = 0) للرجوع إليها
        const parentCategoriesMap = new Map(
          allFashionCategories.filter(cat => cat.level === 0).map(cat => [cat.id, cat])
        );
        
        // تصفية: فقط التصنيفات الفرعية (level > 0)
        const fashionCategories = allFashionCategories.filter(cat => cat.level > 0);
        
        // ترتيب حسب parentId ثم order لعرض شجري
        const sortedCategories = fashionCategories.sort((a, b) => {
          if (a.parentId !== b.parentId) {
            return (a.parentId || '').localeCompare(b.parentId || '');
          }
          return a.order - b.order;
        });
        
        // جلب القوالب المحفوظة من Firebase
        const savedTemplates = await firebaseService.getMeasurementTemplates();
        
        // تحويل التصنيفات إلى قوالب قياسات مع إضافة معلومات الأب
        const templatesFromCategories: (MeasurementTemplate & { parentId?: string | null; parentName?: string })[] = sortedCategories.map(cat => {
          // البحث عن قالب محفوظ بنفس ID التصنيف
          const savedTemplate = savedTemplates.find(t => t.id === cat.id);
          
          // إيجاد اسم التصنيف الأب
          const parentCategory = cat.parentId ? parentCategoriesMap.get(cat.parentId) : null;
          const parentName = parentCategory ? parentCategory.nameAr : '';
          
          if (savedTemplate) {
            // استخدام القالب المحفوظ إذا كان موجوداً مع إضافة معلومات الأب
            return {
              ...savedTemplate,
              parentId: cat.parentId,
              parentName
            };
          } else {
            // إنشاء قالب جديد من التصنيف
            return {
              id: cat.id,
              name: cat.nameAr,
              productType: 'dishdasha' as GarmentType, // نوع افتراضي
              baseImageUrl: cat.image || '',
              vectorUrl: '',
              points: [],
              arrows: [],
              pointSize: 44,
              pointOpacity: 90,
              description: cat.descriptionAr || `قالب قياسات ${cat.nameAr}`,
              createdAt: cat.createdAt,
              updatedAt: cat.updatedAt,
              parentId: cat.parentId,
              parentName
            };
          }
        });
        
        setTemplates(templatesFromCategories);
        setActiveId(templatesFromCategories[0]?.id || null);
        setDraft(templatesFromCategories[0] || null);

        if (templatesFromCategories[0]) {
          setPointSize(templatesFromCategories[0].pointSize || 44);
          setPointOpacity(templatesFromCategories[0].pointOpacity || 90);
          setArrows(templatesFromCategories[0].arrows || []);
        }
      } catch (error) {
        console.error('Error loading measurement templates:', error);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Cancel arrow draft if we leave arrow tool
  useEffect(() => {
    if (toolMode !== 'arrow' && arrowDraft) {
      setArrowDraft(null);
    }
  }, [toolMode, arrowDraft]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y
      if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
        e.preventDefault();
        handleRedo();
      }
      // Tool shortcuts
      if (!e.ctrlKey && !e.altKey && !e.metaKey) {
        if (e.key === 'v') setToolMode('select');
        if (e.key === 'a') setToolMode('add');
        if (e.key === 'd') setToolMode('delete');
        if (e.key === 'r') setToolMode('arrow');
        if (e.key === 'l') setShowLabels((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

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

  const handleDeleteArrow = (arrowId: string) => {
    setArrows(arrows.filter((a) => a.id !== arrowId));
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

    const reader = new FileReader();

    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (!dataUrl) {
        alert('❌ خطأ في قراءة الملف. الرجاء المحاولة مرة أخرى.');
        callback?.(false);
        return;
      }

      const img = new Image();

      img.onload = () => {
        const REQUIRED_WIDTH = appSettings.measurementTemplateWidth || 460;
        const REQUIRED_HEIGHT = appSettings.measurementTemplateHeight || 690;

        if (img.width !== REQUIRED_WIDTH || img.height !== REQUIRED_HEIGHT) {
          alert(
            `❌ مقاس الصورة غير صحيح!\n\n` +
            `📏 المقاس المطلوب: ${REQUIRED_WIDTH} × ${REQUIRED_HEIGHT} بكسل\n` +
            `📐 مقاس الصورة المرفوعة: ${img.width} × ${img.height} بكسل\n\n` +
            `⚠️ يجب أن تكون أبعاد الصورة ${REQUIRED_WIDTH}×${REQUIRED_HEIGHT} بكسل بالضبط.\n\n` +
            `الرجاء تعديل مقاس الصورة باستخدام أي برنامج تحرير صور والمحاولة مرة أخرى.`
          );
          callback?.(false);
          return;
        }

        setDraft((prev) => {
          if (!prev) return prev;
          return { ...prev, [key]: dataUrl };
        });
        callback?.(true);
      };

      img.onerror = () => {
        alert('❌ خطأ في تحميل الصورة. تأكد من أن الملف صورة صالحة.');
        callback?.(false);
      };

      img.src = dataUrl;
    };

    reader.onerror = () => {
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

  const saveToHistory = () => {
    if (!draft) return;
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ draft: { ...draft }, arrows: [...arrows] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setDraft(prevState.draft);
      setArrows(prevState.arrows);
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setDraft(nextState.draft);
      setArrows(nextState.arrows);
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleDuplicatePoint = (pointId: string) => {
    if (!draft) return;
    const point = draft.points.find((p) => p.id === pointId);
    if (!point) return;

    const newPoint = {
      ...point,
      id: `point-${Date.now()}`,
      x: Math.min(point.x + 0.05, 1),
      y: Math.min(point.y + 0.05, 1),
      order: (draft.points.length ? Math.max(...draft.points.map((p) => p.order || 0)) : 0) + 1,
    };

    setDraft({ ...draft, points: [...draft.points, newPoint] });
    saveToHistory();
  };

  return {
    // State
    templates,
    activeId,
    draft,
    isSaving,
    isLoading,
    draggingPointId,
    toolMode,
    pointSize,
    pointOpacity,
    arrows,
    arrowDraft,
    draggingArrowId,
    draggingArrowPart,
    showLabels,
    orderedPoints,
    appSettings,
    history,
    historyIndex,
    pointColor,
    // Setters
    setDraft,
    setDraggingPointId,
    setToolMode,
    setPointSize,
    setPointOpacity,
    setArrows,
    setArrowDraft,
    setDraggingArrowId,
    setDraggingArrowPart,
    setShowLabels,
    setPointColor,
    // Handlers
    handleSelectTemplate,
    handleUpdatePoint,
    handleDeletePoint,
    handleDeleteArrow,
    handleImageUpload,
    handleCreateNew,
    handleSave,
    handleDeleteTemplate,
    handleUndo,
    handleRedo,
    handleDuplicatePoint,
    saveToHistory,
  };
};
