import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MeasurementPoint, MeasurementTemplate, GarmentType } from '../../../types';
import { firebaseService } from '../../../services/firebase';
import { useApp } from '../../../context/AppContext';
import { Arrow, ToolMode } from './types';
import { getAllCategories } from '../../admin/products/services';

type MeasurementTemplateWithMeta = MeasurementTemplate & {
  parentId?: string | null;
  parentName?: string;
  rootId?: string;
  rootName?: string;
  level?: number;
  categoryImageUrl?: string;
  parentLevel?: number | null;
};

const createEmptyTemplate = (): MeasurementTemplateWithMeta => {
  const now = new Date().toISOString();
  return {
    id: `temp-${Date.now()}`,
    name: 'قالب جديد',
    productType: 'dishdasha',
    baseImageUrl: '',
    categoryImageUrl: '',
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
  const [templates, setTemplates] = useState<MeasurementTemplateWithMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeRootId, setActiveRootId] = useState<string | null>(null);
  const [draft, setDraft] = useState<MeasurementTemplateWithMeta | null>(null);
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
  const [history, setHistory] = useState<Array<{ draft: MeasurementTemplateWithMeta; arrows: Arrow[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [pointColor, setPointColor] = useState<string>('#10b981');

  const activeIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);

  const activeRootIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeRootIdRef.current = activeRootId;
  }, [activeRootId]);

  const loadTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const allCategories = await getAllCategories();
      const categoriesMap = new Map(allCategories.map((cat) => [cat.id, cat]));

      const getRootCategory = (category: typeof allCategories[number]) => {
        let current: typeof allCategories[number] | null = category;
        while (current?.parentId) {
          const parent = categoriesMap.get(current.parentId) || null;
          if (!parent) break;
          current = parent;
        }
        return current || category;
      };

      const fashionRootIds = new Set(
        allCategories
          .filter((cat) => cat.level === 0 && cat.categoryType === 'fashion')
          .map((cat) => cat.id)
      );

      const isFashionBranch = (category: typeof allCategories[number]) => {
        const root = getRootCategory(category);
        if (!root) return false;
        if (fashionRootIds.size > 0) {
          return fashionRootIds.has(root.id);
        }
        const rootSlug = root.slug?.toLowerCase?.() || '';
        const rootNameEn = root.nameEn?.toLowerCase?.() || '';
        return (
          root.categoryType === 'fashion' ||
          rootSlug === 'fashion' ||
          rootNameEn === 'fashion' ||
          root.nameAr?.includes('الأزياء')
        );
      };

      const resolveHierarchy = (category: typeof allCategories[number]) => {
        const directParent = category.parentId ? categoriesMap.get(category.parentId) || null : null;

        let levelOneAncestor: typeof category | null = null;

        if (category.level === 1) {
          levelOneAncestor = category;
        } else if (directParent) {
          let currentAncestor: typeof category | null = directParent;
          while (currentAncestor) {
            if (currentAncestor.level === 1) {
              levelOneAncestor = currentAncestor;
              break;
            }
            currentAncestor = currentAncestor.parentId
              ? categoriesMap.get(currentAncestor.parentId) || null
              : null;
          }
        }

        const rootCategory = getRootCategory(category);
        const fallbackRoot =
          levelOneAncestor ||
          (directParent && directParent.level === 0 ? directParent : rootCategory || category);

        return {
          parentId: category.parentId,
          parentName: directParent ? directParent.nameAr : undefined,
          parentLevel: directParent ? directParent.level : null,
          rootId: fallbackRoot.id,
          rootName: fallbackRoot.nameAr,
        };
      };

      const fashionCategories = allCategories.filter((cat) => isFashionBranch(cat));

      const savedTemplates = await firebaseService.getMeasurementTemplates();

      const categoriesWithHierarchy = fashionCategories.map((cat) => ({
        category: cat,
        hierarchy: resolveHierarchy(cat),
      }));

      categoriesWithHierarchy.sort((a, b) => {
        if ((a.hierarchy.rootName || '') !== (b.hierarchy.rootName || '')) {
          return (a.hierarchy.rootName || '').localeCompare(b.hierarchy.rootName || '');
        }
        if ((a.category.level || 0) !== (b.category.level || 0)) {
          return (a.category.level || 0) - (b.category.level || 0);
        }
        if ((a.category.parentId || '') !== (b.category.parentId || '')) {
          return (a.category.parentId || '').localeCompare(b.category.parentId || '');
        }
        return a.category.order - b.category.order;
      });

      const templatesFromCategories: MeasurementTemplateWithMeta[] = categoriesWithHierarchy.map(
        ({ category: cat, hierarchy }) => {
          const savedTemplate = savedTemplates.find((t) => t.id === cat.id);
          const categoryImageUrl = savedTemplate?.categoryImageUrl || cat.image || '';
          const normalizedBaseImageUrl = savedTemplate && savedTemplate.baseImageUrl
            ? (savedTemplate.baseImageUrl === categoryImageUrl ? '' : savedTemplate.baseImageUrl)
            : '';

          const baseTemplate: MeasurementTemplate = savedTemplate
            ? {
                ...savedTemplate,
                baseImageUrl: normalizedBaseImageUrl,
                categoryImageUrl,
              }
            : {
                id: cat.id,
                name: cat.nameAr,
                productType: 'dishdasha' as GarmentType,
                baseImageUrl: '',
                categoryImageUrl,
                vectorUrl: '',
                points: [],
                arrows: [],
                pointSize: 44,
                pointOpacity: 90,
                description: cat.descriptionAr || `قالب قياسات ${cat.nameAr}`,
                createdAt: cat.createdAt,
                updatedAt: cat.updatedAt,
              };

          return {
            ...baseTemplate,
            parentId: hierarchy.parentId,
            parentName: hierarchy.parentName,
            parentLevel: hierarchy.parentLevel,
            rootId: hierarchy.rootId,
            rootName: hierarchy.rootName,
            level: cat.level,
            categoryImageUrl,
          };
        }
      );

      const previousActiveId = activeIdRef.current;
      const previousRootId = activeRootIdRef.current;

      let nextTemplate: MeasurementTemplateWithMeta | undefined;

      if (previousActiveId) {
        nextTemplate = templatesFromCategories.find((t) => t.id === previousActiveId);
      }

      if (!nextTemplate && previousRootId) {
        // البحث عن قالب من نفس المجموعة (له نفس الأب Level 1)
        nextTemplate = templatesFromCategories.find(
          (t) => t.parentId === previousRootId
        );
      }

      if (!nextTemplate) {
        // اختيار أول قالب من Level 2
        nextTemplate = templatesFromCategories.find((t) => (t.level ?? 0) === 2);
      }

      if (!nextTemplate) {
        // إذا لم يوجد Level 2، اختر أي قالب
        nextTemplate = templatesFromCategories[0];
      }

      setTemplates(templatesFromCategories);
      setActiveId(nextTemplate?.id || null);
      setDraft(nextTemplate || null);

      // تحديد الجذر (Level 1)
      let nextRootId: string | null = null;
      if (nextTemplate) {
        if ((nextTemplate.level ?? 0) === 2 && nextTemplate.parentId) {
          nextRootId = nextTemplate.parentId; // الأب (Level 1)
        } else if ((nextTemplate.level ?? 0) === 1) {
          nextRootId = nextTemplate.id; // هو نفسه Level 1
        }
      }
      setActiveRootId(nextRootId);

      if (nextTemplate) {
        setPointSize(nextTemplate.pointSize || 44);
        setPointOpacity(nextTemplate.pointOpacity || 90);
        setArrows(nextTemplate.arrows || []);
      } else {
        setPointSize(44);
        setPointOpacity(90);
        setArrows([]);
        setActiveRootId(null);
      }
    } catch (error) {
      console.error('Error loading measurement templates:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load templates from Fashion Categories
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

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
    setActiveId(selected ? selected.id : templateId);
    setDraft(selected ? { ...selected } : null);

    if (selected) {
      // تحديد الجذر (Level 1): إذا كان القالب من Level 2، نستخدم parentId، وإلا نستخدم id نفسه
      let rootId: string | null = null;
      if ((selected.level ?? 0) === 2 && selected.parentId) {
        rootId = selected.parentId; // الأب (Level 1)
      } else if ((selected.level ?? 0) === 1) {
        rootId = selected.id; // هو نفسه Level 1
      }
      setActiveRootId(rootId);
      setPointSize(selected.pointSize || 44);
      setPointOpacity(selected.pointOpacity || 90);
      setArrows(selected.arrows || []);
    } else {
      setActiveRootId(null);
      setPointSize(44);
      setPointOpacity(90);
      setArrows([]);
    }
  };

  const handleSelectRoot = (rootId: string) => {
    const normalizedRootId = rootId || null;
    setActiveRootId(normalizedRootId);

    if (!normalizedRootId) {
      setActiveId(null);
      setDraft(null);
      setPointSize(44);
      setPointOpacity(90);
      setArrows([]);
      return;
    }

    // البحث عن الأبناء المباشرين فقط (parentId === rootId)
    const branchTemplatesForRoot = templates.filter(
      (template) => template.parentId === normalizedRootId
    );

    if (branchTemplatesForRoot.length === 0) {
      setActiveId(null);
      setDraft(null);
      setPointSize(44);
      setPointOpacity(90);
      setArrows([]);
      return;
    }

    const preferActive = activeIdRef.current
      ? branchTemplatesForRoot.find((template) => template.id === activeIdRef.current)
      : null;

    const nextTemplate = preferActive || branchTemplatesForRoot[0];
    handleSelectTemplate(nextTemplate.id);
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
    const existingTemplate = templates.find((t) => t.id === saved.id);
    const enrichedTemplate: MeasurementTemplateWithMeta = existingTemplate
      ? { ...existingTemplate, ...saved }
      : { ...saved };

    setTemplates((prev) => {
      if (existingTemplate) {
        return prev.map((t) => (t.id === saved.id ? enrichedTemplate : t));
      }
      return [...prev, enrichedTemplate];
    });
    setDraft(enrichedTemplate);
    setActiveId(enrichedTemplate.id);
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
    activeRootId,
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
    reloadTemplates: loadTemplates,
    handleSelectRoot,
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
