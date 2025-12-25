import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import {
  Crop,
  Edit,
  Eye,
  Image as ImageIcon,
  ImageUp,
  LayoutGrid,
  Layers,
  List,
  Plus,
  RefreshCw,
  Rows3,
  Settings,
  Star,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from 'lucide-react';
import { TemplatePicker } from '../../designer/components/TemplatePicker';
import { firebaseService } from '../../../services/firebase';
import { showToast } from '../../../utils/notifications';

type TabSection = 'templates' | 'features' | 'settings';

type DisplayMode = 'grid' | 'list' | 'compact';

const ADMIN_TEMPLATES_PAGE_SIZE = 30;

type EditorMode = 'create' | 'edit';

type CreateUploadStage = 'queued' | 'uploadingOriginal' | 'uploadingThumb' | 'savingDoc' | 'done' | 'error';

type TryOnTemplate = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  enabled?: boolean;
  order?: number;
  isPremium?: boolean;
};

type CreateDraftItem = {
  key: string;
  file: File;
  previewUrl: string;
  id: string;
  name: string;
  order?: number;
  enabled: boolean;
  isPremium: boolean;
  saving: boolean;
  saved: boolean;
  stage?: CreateUploadStage;
  originalProgress?: number; // 0..100
  thumbProgress?: number; // 0..100
  error?: string;
};

type EditDraft = {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  enabled: boolean;
  isPremium: boolean;
  order?: number;
  replacementFile: File | null;
  replacementPreviewUrl: string | null;
  saving: boolean;
  uploadStage?: 'idle' | 'uploadingOriginal' | 'uploadingThumb' | 'savingDoc';
  originalProgress?: number;
  thumbProgress?: number;
  lastSavedAt?: number;
  error?: string;
};

type CropState = {
  open: boolean;
  file: File | null;
  zoom: number;
  cx: number; // 0..1
  cy: number; // 0..1
};

function slugFromFilename(filename: string): string {
  const base = String(filename || '')
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase();
  const slug = base
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || `template-${Date.now()}`;
}

function nameFromFilename(filename: string): string {
  return String(filename || '').replace(/\.[^.]+$/, '').trim() || 'Template';
}

function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

function getBaseRect(iw: number, ih: number, targetAspect: number): { w: number; h: number } {
  const imageAspect = iw / ih;
  if (imageAspect > targetAspect) {
    // image wider
    return { w: ih * targetAspect, h: ih };
  }
  // image taller
  return { w: iw, h: iw / targetAspect };
}

function clampCenterToRect(params: { cx: number; cy: number; iw: number; ih: number; rectW: number; rectH: number }): { cx: number; cy: number } {
  const { iw, ih, rectW, rectH } = params;
  const minCx = rectW / 2 / iw;
  const maxCx = 1 - minCx;
  const minCy = rectH / 2 / ih;
  const maxCy = 1 - minCy;
  return {
    cx: Math.max(minCx, Math.min(maxCx, params.cx)),
    cy: Math.max(minCy, Math.min(maxCy, params.cy)),
  };
}

function toFiles(value: FileList | readonly File[] | null | undefined): File[] {
  if (!value) return [];
  // FileList is iterable but TS sometimes widens to unknown[]; normalize explicitly.
  return Array.from(value as any) as File[];
}

async function createThumbnailJpegBlobFromFile(file: File, maxWidth = 256, quality = 0.82): Promise<Blob> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load image'));
      i.src = objectUrl;
    });

    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2d context not available');
    ctx.drawImage(img, 0, 0, w, h);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error('Failed to create thumbnail blob'));
          else resolve(b);
        },
        'image/jpeg',
        quality
      );
    });

    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function cropFileToAspectJpegBlob(params: { file: File; aspect: number; cx: number; cy: number; zoom: number; outWidth: number; quality?: number }): Promise<Blob> {
  const { file, aspect, outWidth } = params;
  const quality = typeof params.quality === 'number' ? params.quality : 0.9;
  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Failed to load image'));
      i.src = objectUrl;
    });

    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const base = getBaseRect(iw, ih, aspect);
    const zoom = Math.max(1, Number(params.zoom) || 1);
    const rectW = base.w / zoom;
    const rectH = base.h / zoom;
    const clamped = clampCenterToRect({ cx: clamp01(params.cx), cy: clamp01(params.cy), iw, ih, rectW, rectH });
    const sx = Math.round(clamped.cx * iw - rectW / 2);
    const sy = Math.round(clamped.cy * ih - rectH / 2);
    const sw = Math.round(rectW);
    const sh = Math.round(rectH);

    const outH = Math.max(1, Math.round(outWidth / aspect));
    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2d context not available');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outWidth, outH);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (!b) reject(new Error('Failed to create crop blob'));
          else resolve(b);
        },
        'image/jpeg',
        quality
      );
    });
    return blob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export const TryOnTemplates: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabSection>('templates');
  const [templates, setTemplates] = useState<TryOnTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const [updatingTemplateIds, setUpdatingTemplateIds] = useState<Record<string, boolean>>({});
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [displayMode, setDisplayMode] = useState<DisplayMode>('grid');
  const [templateFilterQuery, setTemplateFilterQuery] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [filterInactiveOnly, setFilterInactiveOnly] = useState(false);
  const [filterStarredOnly, setFilterStarredOnly] = useState(false);
  const [templatesPage, setTemplatesPage] = useState(1);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<EditorMode>('create');
  const [createItems, setCreateItems] = useState<CreateDraftItem[]>([]);
  const createItemsRef = useRef<CreateDraftItem[]>([]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [createDropActive, setCreateDropActive] = useState(false);
  const [editDropActive, setEditDropActive] = useState(false);

  const [fullImageViewer, setFullImageViewer] = useState<{ open: boolean; url: string; title: string }>(
    { open: false, url: '', title: '' }
  );

  const [templatePickerTestOpen, setTemplatePickerTestOpen] = useState(false);
  const [templatePickerTestSelectedId, setTemplatePickerTestSelectedId] = useState<string | null>(null);
  const [templatePickerTestPage, setTemplatePickerTestPage] = useState(1);
  const [templatePickerTestImageLoading, setTemplatePickerTestImageLoading] = useState(false);
  const templatePickerTestImageSrcRef = useRef<string | null>(null);
  const templatePickerTestWasOpenRef = useRef(false);

  const [cropState, setCropState] = useState<CropState>({ open: false, file: null, zoom: 1, cx: 0.5, cy: 0.5 });
  const cropCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cropImgRef = useRef<HTMLImageElement | null>(null);
  const cropObjectUrlRef = useRef<string | null>(null);
  const cropDragRef = useRef<{ active: boolean; startX: number; startY: number; startCx: number; startCy: number } | null>(null);

  const showDevPrefixes = useMemo(() => Boolean((import.meta as any)?.env?.DEV), []);

  useEffect(() => {
    if (activeTab === 'templates') {
      loadTemplates();
    }
  }, [activeTab]);

  const filteredTemplates = useMemo(() => {
    const q = String(templateFilterQuery || '').trim().toLowerCase();
    return templates.filter((t) => {
      if (filterActiveOnly && t.enabled === false) return false;
      if (filterInactiveOnly && t.enabled !== false) return false;
      if (filterStarredOnly && t.isPremium !== true) return false;
      const name = String(t.name || '').toLowerCase();
      const id = String(t.id || '').toLowerCase();
      if (!q) return true;
      return name.includes(q) || id.includes(q);
    });
  }, [templates, templateFilterQuery, filterActiveOnly, filterInactiveOnly, filterStarredOnly]);

  const totalTemplatesPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredTemplates.length / ADMIN_TEMPLATES_PAGE_SIZE));
  }, [filteredTemplates.length]);

  useEffect(() => {
    // Reset to page 1 whenever filters change.
    setTemplatesPage(1);
  }, [templateFilterQuery, filterActiveOnly, filterInactiveOnly, filterStarredOnly]);

  useEffect(() => {
    // Clamp page if data size changes (e.g., after reload).
    setTemplatesPage((p) => Math.min(Math.max(1, p), totalTemplatesPages));
  }, [totalTemplatesPages]);

  const pagedTemplates = useMemo(() => {
    const start = (templatesPage - 1) * ADMIN_TEMPLATES_PAGE_SIZE;
    return filteredTemplates.slice(start, start + ADMIN_TEMPLATES_PAGE_SIZE);
  }, [filteredTemplates, templatesPage]);

  useEffect(() => {
    createItemsRef.current = createItems;
  }, [createItems]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await firebaseService.getTryOnGarmentTemplates({ resolveStorageUrls: true });
      setTemplates(list);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditorMode('create');
    setCreateItems([]);
    setEditDraft(null);
    setEditorOpen(true);
  };

  const openTemplatePickerTest = () => {
    setTemplatePickerTestSelectedId((prev) => prev ?? (templates[0]?.id ?? null));
    setTemplatePickerTestOpen(true);
  };

  const templatePickerTestTotalPages = useMemo(() => {
    return Math.max(1, Math.ceil(templates.length / ADMIN_TEMPLATES_PAGE_SIZE));
  }, [templates.length]);

  useEffect(() => {
    // Clamp picker page if data size changes.
    setTemplatePickerTestPage((p) => Math.min(Math.max(1, p), templatePickerTestTotalPages));
  }, [templatePickerTestTotalPages]);

  const templatePickerTestPagedTemplates = useMemo(() => {
    const start = (templatePickerTestPage - 1) * ADMIN_TEMPLATES_PAGE_SIZE;
    return templates.slice(start, start + ADMIN_TEMPLATES_PAGE_SIZE);
  }, [templates, templatePickerTestPage]);

  useEffect(() => {
    // On open only: jump to the page containing the selected template (or first template).
    if (!templatePickerTestOpen) {
      templatePickerTestWasOpenRef.current = false;
      return;
    }
    if (templatePickerTestWasOpenRef.current) return;
    templatePickerTestWasOpenRef.current = true;

    const selectedId = templatePickerTestSelectedId ?? templates[0]?.id ?? null;
    if (!selectedId) {
      setTemplatePickerTestPage(1);
      return;
    }
    const idx = templates.findIndex((t) => t.id === selectedId);
    if (idx < 0) {
      setTemplatePickerTestPage(1);
      return;
    }
    const desiredPage = Math.floor(idx / ADMIN_TEMPLATES_PAGE_SIZE) + 1;
    setTemplatePickerTestPage(desiredPage);
  }, [templatePickerTestOpen, templatePickerTestSelectedId, templates]);

  useEffect(() => {
    if (!templatePickerTestOpen) {
      templatePickerTestImageSrcRef.current = null;
      setTemplatePickerTestImageLoading(false);
      return;
    }
    const selected = templates.find((t) => t.id === templatePickerTestSelectedId) || templates[0];
    if (!selected?.imageUrl) {
      templatePickerTestImageSrcRef.current = null;
      setTemplatePickerTestImageLoading(false);
      return;
    }
    templatePickerTestImageSrcRef.current = selected.imageUrl;
    setTemplatePickerTestImageLoading(true);
  }, [templatePickerTestOpen, templatePickerTestSelectedId, templates]);

  useEffect(() => {
    if (!editorOpen) return;
    if (!editingNameId) return;
    // Focus next tick after input appears.
    const t = window.setTimeout(() => {
      try { nameInputRef.current?.focus(); } catch {}
      try { nameInputRef.current?.select(); } catch {}
    }, 0);
    return () => window.clearTimeout(t);
  }, [editorOpen, editingNameId]);

  const beginInlineNameEdit = (template: TryOnTemplate) => {
    setEditingNameId(template.id);
    setEditingNameValue(template.name || '');
  };

  const cancelInlineNameEdit = () => {
    setEditingNameId(null);
    setEditingNameValue('');
  };

  const commitInlineNameEdit = async (templateId: string) => {
    const nextName = String(editingNameValue || '').trim();
    const current = templates.find((t) => t.id === templateId);
    if (!current) {
      cancelInlineNameEdit();
      return;
    }
    if (!nextName) {
      showToast('⚠️ الاسم مطلوب', 'رجاءً اكتب اسمًا للقالب', 'info');
      return;
    }
    if (nextName === current.name) {
      cancelInlineNameEdit();
      return;
    }

    const prevName = current.name;
    setUpdatingTemplateIds((prev) => ({ ...prev, [templateId]: true }));
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, name: nextName } : t)));
    try {
      await firebaseService.upsertTryOnGarmentTemplate({
        ...current,
        name: nextName,
      });
      cancelInlineNameEdit();
    } catch (error: any) {
      console.error('Error updating template name:', error);
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, name: prevName } : t)));
      showToast('❌ فشل تحديث الاسم', String(error?.message || 'حدث خطأ'), 'error');
    } finally {
      setUpdatingTemplateIds((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    }
  };

  const openEditModal = (template: TryOnTemplate) => {
    setEditorMode('edit');
    setCreateItems([]);
    setEditDraft({
      id: template.id,
      name: template.name,
      imageUrl: template.imageUrl,
      thumbnailUrl: template.thumbnailUrl,
      enabled: template.enabled !== false,
      isPremium: template.isPremium === true,
      order: typeof template.order === 'number' ? template.order : undefined,
      replacementFile: null,
      replacementPreviewUrl: null,
      saving: false,
      uploadStage: 'idle',
      originalProgress: 0,
      thumbProgress: 0,
    });
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
  };

  useEffect(() => {
    return () => {
      // cleanup create previews
      for (const item of createItems) {
        try { URL.revokeObjectURL(item.previewUrl); } catch {}
      }
      if (editDraft?.replacementPreviewUrl) {
        try { URL.revokeObjectURL(editDraft.replacementPreviewUrl); } catch {}
      }
      if (cropObjectUrlRef.current) {
        try { URL.revokeObjectURL(cropObjectUrlRef.current); } catch {}
        cropObjectUrlRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFilesToCreate = (files: File[]) => {
    const next = (files || []).filter((f) => f && f.type?.startsWith('image/'));
    if (next.length === 0) return;

    setCreateItems((prev) => {
      const usedIds = new Set(prev.map((p) => p.id));
      const items: CreateDraftItem[] = [];

      for (const file of next) {
        const previewUrl = URL.createObjectURL(file);
        let id = slugFromFilename(file.name);
        let n = 2;
        while (usedIds.has(id)) {
          id = `${slugFromFilename(file.name)}-${n++}`;
        }
        usedIds.add(id);
        items.push({
          key: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          file,
          previewUrl,
          id,
          name: nameFromFilename(file.name),
          enabled: true,
          isPremium: false,
          saving: false,
          saved: false,
          stage: 'queued',
          originalProgress: 0,
          thumbProgress: 0,
        });
      }

      return [...items, ...prev];
    });
  };

  const handleCreateDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCreateDropActive(false);
    addFilesToCreate(toFiles(e.dataTransfer?.files));
  };

  const handleCreateDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setCreateDropActive(true);
  };

  const handleCreateDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if the relatedTarget is outside the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setCreateDropActive(false);
    }
  };

  const handleSaveCreateItem = async (key: string): Promise<boolean> => {
    setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, saving: true, error: undefined, stage: 'uploadingOriginal', originalProgress: 0, thumbProgress: 0 } : it)));
    const item = createItemsRef.current.find((x) => x.key === key);
    if (!item) return false;

    const id = String(item.id || '').trim();
    const name = String(item.name || '').trim();
    if (!id || !name) {
      setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, saving: false, stage: 'error', error: 'ID/Name required' } : it)));
      return false;
    }

    try {
      const imageUrl = await firebaseService.uploadTryOnGarmentTemplateOriginal({
        templateId: id,
        file: item.file,
        onProgress: (p) => {
          setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, originalProgress: p, stage: 'uploadingOriginal' } : it)));
        },
      });
      // Generate thumbnail only at save time
      setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, stage: 'uploadingThumb', thumbProgress: 0 } : it)));
      const thumbBlob = await createThumbnailJpegBlobFromFile(item.file, 256, 0.82);
      const thumbnailUrl = await firebaseService.uploadTryOnGarmentTemplateThumbnail({
        templateId: id,
        blob: thumbBlob,
        onProgress: (p) => {
          setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, thumbProgress: p, stage: 'uploadingThumb' } : it)));
        },
      });

      setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, stage: 'savingDoc' } : it)));

      await firebaseService.upsertTryOnGarmentTemplate({
        id,
        name,
        imageUrl,
        thumbnailUrl,
        enabled: item.enabled,
        isPremium: item.isPremium,
        ...(typeof item.order === 'number' ? { order: item.order } : {}),
      });

      // Remove the card after success (queue behavior)
      setCreateItems((prev) => {
        const it = prev.find((x) => x.key === key);
        if (it?.previewUrl) {
          try { URL.revokeObjectURL(it.previewUrl); } catch {}
        }
        return prev.filter((x) => x.key !== key);
      });
      await loadTemplates();
      return true;
    } catch (error: any) {
      console.error('Error creating template:', error);
      setCreateItems((prev) => prev.map((it) => (it.key === key ? { ...it, saving: false, stage: 'error', error: String(error?.message || 'Failed') } : it)));
      return false;
    }
  };

  const handleSaveAllCreate = async () => {
    if (bulkSaving) return;
    setBulkSaving(true);
    const startKeys = createItemsRef.current.filter((x) => !x.saved && !x.saving).map((x) => x.key);
    let ok = 0;
    let failed = 0;
    for (const key of startKeys) {
      // sequential to avoid too many concurrent uploads
      // eslint-disable-next-line no-await-in-loop
      const didSave = await handleSaveCreateItem(key);
      if (didSave) ok += 1;
      else failed += 1;
    }
    setBulkSaving(false);

    const total = startKeys.length;
    if (total > 0) {
      if (failed === 0) {
        showToast('✅ اكتمل رفع القوالب', `تم رفع ${ok} من ${total}`, 'success');
      } else if (ok === 0) {
        showToast('❌ فشل رفع القوالب', `فشل ${failed} من ${total}`, 'error');
      } else {
        showToast('⚠️ اكتمل مع أخطاء', `تم رفع ${ok} وفشل ${failed} (الإجمالي ${total})`, 'info');
      }
    }
  };

  const createQueueStats = useMemo(() => {
    const total = createItems.length;
    const done = createItems.filter((x) => x.saved || x.stage === 'done').length;
    const errored = createItems.filter((x) => x.stage === 'error' || Boolean(x.error)).length;
    const uploading = createItems.filter((x) => x.stage === 'uploadingOriginal' || x.stage === 'uploadingThumb' || x.stage === 'savingDoc' || x.saving).length;
    const queued = Math.max(0, total - done - uploading - errored);

    const pct = total === 0
      ? 0
      : Math.round(
          createItems.reduce((sum, x) => {
            if (x.saved || x.stage === 'done') return sum + 100;
            if (x.stage === 'savingDoc') return sum + 98;
            const op = typeof x.originalProgress === 'number' ? x.originalProgress : 0;
            const tp = typeof x.thumbProgress === 'number' ? x.thumbProgress : 0;
            return sum + Math.round((op + tp) / 2);
          }, 0) / total
        );

    const current = createItems.find((x) => x.stage === 'uploadingOriginal' || x.stage === 'uploadingThumb' || x.stage === 'savingDoc');
    return { total, done, errored, uploading, queued, pct, currentName: current?.name || '' };
  }, [createItems]);

  const handleUpdateEditDraft = (patch: Partial<EditDraft>) => {
    setEditDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const handleSelectReplacementFile = (file: File | null) => {
    if (!file) return;
    if (!file.type?.startsWith('image/')) return;
    setEditDraft((prev) => {
      if (!prev) return prev;
      if (prev.replacementPreviewUrl) {
        try { URL.revokeObjectURL(prev.replacementPreviewUrl); } catch {}
      }
      return {
        ...prev,
        replacementFile: file,
        replacementPreviewUrl: URL.createObjectURL(file),
        lastSavedAt: undefined,
        error: undefined,
      };
    });
  };

  const handleEditDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDropActive(false);
    const files = toFiles(e.dataTransfer?.files);
    const first = files.find((f) => f && f.type?.startsWith('image/')) || null;
    if (first) handleSelectReplacementFile(first);
  };

  const handleEditDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setEditDropActive(true);
  };

  const handleEditDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if the relatedTarget is outside the drop zone
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setEditDropActive(false);
    }
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    const id = String(editDraft.id || '').trim();
    const name = String(editDraft.name || '').trim();
    if (!id || !name) {
      handleUpdateEditDraft({ error: 'ID/Name required' });
      return;
    }

    handleUpdateEditDraft({ saving: true, error: undefined, uploadStage: 'savingDoc' });
    try {
      let imageUrl = editDraft.imageUrl;
      let thumbnailUrl = editDraft.thumbnailUrl;

      if (editDraft.replacementFile) {
        handleUpdateEditDraft({ uploadStage: 'uploadingOriginal', originalProgress: 0, thumbProgress: 0 });
        imageUrl = await firebaseService.uploadTryOnGarmentTemplateOriginal({
          templateId: id,
          file: editDraft.replacementFile,
          onProgress: (p) => handleUpdateEditDraft({ uploadStage: 'uploadingOriginal', originalProgress: p }),
        });
        const thumbBlob = await createThumbnailJpegBlobFromFile(editDraft.replacementFile, 256, 0.82);
        handleUpdateEditDraft({ uploadStage: 'uploadingThumb', thumbProgress: 0 });
        thumbnailUrl = await firebaseService.uploadTryOnGarmentTemplateThumbnail({
          templateId: id,
          blob: thumbBlob,
          onProgress: (p) => handleUpdateEditDraft({ uploadStage: 'uploadingThumb', thumbProgress: p }),
        });
      }

      handleUpdateEditDraft({ uploadStage: 'savingDoc' });
      await firebaseService.upsertTryOnGarmentTemplate({
        id,
        name,
        imageUrl,
        thumbnailUrl,
        enabled: editDraft.enabled,
        isPremium: editDraft.isPremium,
        ...(typeof editDraft.order === 'number' ? { order: editDraft.order } : {}),
      });

      handleUpdateEditDraft({
        saving: false,
        imageUrl,
        thumbnailUrl,
        replacementFile: null,
        replacementPreviewUrl: null,
        uploadStage: 'idle',
        originalProgress: 100,
        thumbProgress: 100,
        lastSavedAt: Date.now(),
      });

      await loadTemplates();
      // Keep modal open (per requirement)
    } catch (error: any) {
      console.error('Error updating template:', error);
      handleUpdateEditDraft({ saving: false, error: String(error?.message || 'Failed') });
    }
  };

  const handleTogglePremium = async (e: React.MouseEvent, templateId: string, currentValue: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const nextValue = !currentValue;
    setUpdatingTemplateIds((prev) => ({ ...prev, [templateId]: true }));
    // Optimistic update to avoid a full list reload flicker
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, isPremium: nextValue } : t)));
    try {
      await firebaseService.upsertTryOnGarmentTemplate({
        ...template,
        isPremium: nextValue,
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      // revert
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, isPremium: currentValue } : t)));
      showToast('❌ فشل تحديث Premium', String(error?.message || 'حدث خطأ'), 'error');
    } finally {
      setUpdatingTemplateIds((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    }
  };

  const handleToggleEnabled = async (e: React.MouseEvent, templateId: string, currentValue: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const nextValue = !currentValue;
    setUpdatingTemplateIds((prev) => ({ ...prev, [templateId]: true }));
    // Optimistic update to avoid list refresh/flicker
    setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, enabled: nextValue } : t)));
    try {
      await firebaseService.upsertTryOnGarmentTemplate({
        ...template,
        enabled: nextValue,
      });
    } catch (error: any) {
      console.error('Error updating template:', error);
      // revert
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? { ...t, enabled: currentValue } : t)));
      showToast('❌ فشل تحديث الحالة', String(error?.message || 'حدث خطأ'), 'error');
    } finally {
      setUpdatingTemplateIds((prev) => {
        const next = { ...prev };
        delete next[templateId];
        return next;
      });
    }
  };

  const openCropModal = () => {
    if (!editDraft?.replacementFile) return;
    setCropState({ open: true, file: editDraft.replacementFile, zoom: 1, cx: 0.5, cy: 0.5 });
  };

  const closeCropModal = () => {
    setCropState((p) => ({ ...p, open: false }));
  };

  const drawCropPreview = useCallback(() => {
    const canvas = cropCanvasRef.current;
    const img = cropImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const aspect = 3 / 4;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const base = getBaseRect(iw, ih, aspect);
    const zoom = Math.max(1, Number(cropState.zoom) || 1);
    const rectW = base.w / zoom;
    const rectH = base.h / zoom;
    const clamped = clampCenterToRect({ cx: clamp01(cropState.cx), cy: clamp01(cropState.cy), iw, ih, rectW, rectH });
    const sx = clamped.cx * iw - rectW / 2;
    const sy = clamped.cy * ih - rectH / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, sx, sy, rectW, rectH, 0, 0, canvas.width, canvas.height);
  }, [cropState.cx, cropState.cy, cropState.zoom]);

  useEffect(() => {
    if (!cropState.open || !cropState.file) return;

    const canvas = cropCanvasRef.current;
    if (canvas) {
      canvas.width = 360;
      canvas.height = 480;
    }

    const objectUrl = URL.createObjectURL(cropState.file);
    cropObjectUrlRef.current = objectUrl;
    const img = new Image();
    img.onload = () => {
      cropImgRef.current = img;
      drawCropPreview();
    };
    img.onerror = () => {
      cropImgRef.current = null;
    };
    img.src = objectUrl;

    return () => {
      cropImgRef.current = null;
      if (cropObjectUrlRef.current) {
        try { URL.revokeObjectURL(cropObjectUrlRef.current); } catch {}
        cropObjectUrlRef.current = null;
      }
    };
  }, [cropState.open, cropState.file, drawCropPreview]);

  useEffect(() => {
    if (!cropState.open) return;
    drawCropPreview();
  }, [cropState.cx, cropState.cy, cropState.zoom, cropState.open, drawCropPreview]);

  const applyCropToReplacement = async () => {
    if (!cropState.file) return;
    try {
      const blob = await cropFileToAspectJpegBlob({
        file: cropState.file,
        aspect: 3 / 4,
        cx: cropState.cx,
        cy: cropState.cy,
        zoom: cropState.zoom,
        outWidth: 1024,
        quality: 0.9,
      });
      const croppedFile = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });
      handleSelectReplacementFile(croppedFile);
      closeCropModal();
    } catch (e) {
      console.error('Crop failed:', e);
      alert('فشل القص');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    setLoading(true);
    try {
      await firebaseService.deleteTryOnGarmentTemplate(templateId);
      await loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    } finally {
      setLoading(false);
    }
  };

  const TabButton = ({ id, label, icon: Icon }: { id: TabSection; label: string; icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors border-b-2 whitespace-nowrap ${
        activeTab === id
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
      }`}
    >
      <Icon size={16} />
      {showDevPrefixes ? `${id} · ${label}` : label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة Try-On Templates</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <TabButton id="templates" label="القوالب المتاحة" icon={ImageIcon} />
        <TabButton id="features" label="ميزات Premium" icon={Star} />
        <TabButton id="settings" label="إعدادات عامة" icon={Settings} />
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-sm text-slate-500">
                {filteredTemplates.length} قالب{templateFilterQuery.trim() ? ` (من ${templates.length})` : ''}
              </div>

              <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 justify-end">
                <div className="hidden md:block">
                  <input
                    value={templateFilterQuery}
                    onChange={(e) => setTemplateFilterQuery(e.target.value)}
                    placeholder="فلتر بالاسم أو المعرف..."
                    className="w-[260px] px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400"
                    aria-label="فلتر القوالب"
                  />
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFilterActiveOnly((v) => {
                      const next = !v;
                      if (next) setFilterInactiveOnly(false);
                      return next;
                    })
                  }
                  aria-pressed={filterActiveOnly}
                  className={
                    `px-3 py-2 rounded-xl border text-sm font-bold transition-colors ` +
                    (filterActiveOnly
                      ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')
                  }
                  title="عرض القوالب المفعلة فقط"
                >
                  مفعّل فقط
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setFilterInactiveOnly((v) => {
                      const next = !v;
                      if (next) setFilterActiveOnly(false);
                      return next;
                    })
                  }
                  aria-pressed={filterInactiveOnly}
                  className={
                    `px-3 py-2 rounded-xl border text-sm font-bold transition-colors ` +
                    (filterInactiveOnly
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')
                  }
                  title="عرض القوالب غير المفعلة فقط"
                >
                  غير مفعّل فقط
                </button>

                <button
                  type="button"
                  onClick={() => setFilterStarredOnly((v) => !v)}
                  aria-pressed={filterStarredOnly}
                  className={
                    `px-3 py-2 rounded-xl border text-sm font-bold transition-colors flex items-center gap-2 ` +
                    (filterStarredOnly
                      ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')
                  }
                  title="عرض قوالب Premium فقط"
                >
                  <Star size={16} className={filterStarredOnly ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'} fill={filterStarredOnly ? 'currentColor' : 'none'} />
                  Premium فقط
                </button>

                {(templateFilterQuery.trim() || filterActiveOnly || filterInactiveOnly || filterStarredOnly) && (
                  <button
                    type="button"
                    onClick={() => {
                      setTemplateFilterQuery('');
                      setFilterActiveOnly(false);
                      setFilterInactiveOnly(false);
                      setFilterStarredOnly(false);
                    }}
                    className="text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    title="مسح الفلاتر"
                  >
                    مسح
                  </button>
                )}

                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={loading}
                  title="إضافة"
                  aria-label="إضافة"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                >
                  <Plus size={18} />
                </button>
                <button
                  type="button"
                  onClick={openTemplatePickerTest}
                  disabled={loading || templates.length === 0}
                  title={templates.length === 0 ? 'لا توجد قوالب للاختبار' : 'اختبار القوالب (TRYON-TEMPLATE-PICKER)'}
                  aria-label="اختبار القوالب"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                >
                  <Eye size={18} />
                </button>
                <button
                  type="button"
                  onClick={loadTemplates}
                  disabled={loading}
                  title="تحديث"
                  aria-label="تحديث"
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                >
                  <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>

                <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDisplayMode('grid')}
                    title="عرض بطاقات"
                    aria-label="عرض بطاقات"
                    className={`p-2 ${displayMode === 'grid' ? 'bg-slate-100 dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('list')}
                    title="عرض قائمة"
                    aria-label="عرض قائمة"
                    className={`p-2 ${displayMode === 'list' ? 'bg-slate-100 dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                  >
                    <List size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDisplayMode('compact')}
                    title="عرض مضغوط"
                    aria-label="عرض مضغوط"
                    className={`p-2 ${displayMode === 'compact' ? 'bg-slate-100 dark:bg-slate-900' : 'hover:bg-slate-50 dark:hover:bg-slate-900'}`}
                  >
                    <Rows3 size={18} />
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500">جاري التحميل...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-12">
                <Layers size={48} className="mx-auto text-slate-300 mb-4" />
                <p className="text-slate-500 mb-4">لا توجد قوالب بعد.</p>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-500 mb-3">لا توجد نتائج مطابقة.</p>
                <button
                  type="button"
                  onClick={() => setTemplateFilterQuery('')}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  مسح الفلتر
                </button>
              </div>
            ) : (
              <>
                {displayMode === 'grid' && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-2">
                    {pagedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={
                          "group border rounded-lg overflow-hidden " +
                          (template.isPremium
                            ? 'border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-sm shadow-amber-100 dark:shadow-none'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800')
                        }
                      >
                        <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-900">
                          {template.thumbnailUrl ? (
                            <img
                              src={template.thumbnailUrl}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 hidden items-center justify-center text-[10px] text-slate-400"
                            style={{ display: template.thumbnailUrl ? 'none' : 'flex' }}
                          >
                            بدون مصغّر
                          </div>
                          <div className="absolute top-1.5 left-1.5 flex gap-1">
                            {template.enabled === false ? (
                              <span className="text-[8px] px-1 py-0.5 rounded-full bg-red-600 text-white">OFF</span>
                            ) : (
                              <span className="text-[8px] px-1 py-0.5 rounded-full bg-emerald-600 text-white">ON</span>
                            )}
                            {template.isPremium ? (
                              <span className="text-[8px] px-1 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1">
                                <Star size={9} />
                              </span>
                            ) : null}
                          </div>

                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => {
                                setFullImageViewer({ open: true, url: template.imageUrl, title: template.name });
                              }}
                              className="p-1 rounded-md bg-white/20 text-white border border-white/30"
                              title="عرض كامل"
                              aria-label="عرض كامل"
                            >
                              <Eye size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-2 space-y-1.5">
                          <div className="min-w-0">
                            {editingNameId === template.id ? (
                              <input
                                ref={nameInputRef}
                                value={editingNameValue}
                                onChange={(e) => setEditingNameValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    void commitInlineNameEdit(template.id);
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    cancelInlineNameEdit();
                                  }
                                }}
                                onBlur={() => {
                                  void commitInlineNameEdit(template.id);
                                }}
                                className="w-full px-2 py-1 text-xs font-bold border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                aria-label="تعديل اسم القالب"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  if (updatingTemplateIds[template.id]) return;
                                  beginInlineNameEdit(template);
                                }}
                                disabled={!!updatingTemplateIds[template.id]}
                                className="w-full text-right text-xs font-bold text-slate-900 dark:text-white truncate hover:underline disabled:opacity-60 disabled:cursor-not-allowed"
                                title="اضغط لتعديل الاسم"
                                aria-label="اضغط لتعديل الاسم"
                              >
                                {template.name}
                              </button>
                            )}
                            <div className="text-[11px] text-slate-500 truncate" title={template.id}>
                              {showDevPrefixes ? `ID: ${template.id}` : template.id}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <div className="text-[10px] text-slate-500">{typeof template.order === 'number' ? `#${template.order}` : '—'}</div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleToggleEnabled(e, template.id, template.enabled !== false)}
                                disabled={!!updatingTemplateIds[template.id]}
                                title={template.enabled === false ? 'تفعيل' : 'تعطيل'}
                                aria-label={template.enabled === false ? 'تفعيل' : 'تعطيل'}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                              >
                                {template.enabled === false ? (
                                  <ToggleLeft size={14} className="text-red-600 dark:text-red-400" />
                                ) : (
                                  <ToggleRight size={14} className="text-emerald-700 dark:text-emerald-400" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleTogglePremium(e, template.id, template.isPremium || false)}
                                disabled={loading || !!updatingTemplateIds[template.id]}
                                title={template.isPremium ? 'إلغاء Premium' : 'Premium'}
                                aria-label={template.isPremium ? 'إلغاء Premium' : 'Premium'}
                                aria-pressed={template.isPremium === true}
                                className={
                                  `p-1.5 rounded-lg border transition-colors disabled:opacity-50 ` +
                                  (template.isPremium
                                    ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900')
                                }
                              >
                                <Star
                                  size={14}
                                  className={
                                    (template.isPremium
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-500 dark:text-slate-400') +
                                    (updatingTemplateIds[template.id] ? ' opacity-60' : '')
                                  }
                                  fill={template.isPremium ? 'currentColor' : 'none'}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditModal(template)}
                                disabled={loading || !!updatingTemplateIds[template.id]}
                                title="تعديل"
                                aria-label="تعديل"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                              >
                                <Edit size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteTemplate(template.id)}
                                disabled={loading || !!updatingTemplateIds[template.id]}
                                title="حذف"
                                aria-label="حذف"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-50"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {displayMode !== 'grid' && (
                  <div className="space-y-2">
                    {pagedTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={
                          "flex items-center gap-2 border rounded-xl p-2 " +
                          (template.isPremium
                            ? 'border-amber-400 dark:border-amber-600 bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 shadow-sm shadow-amber-100 dark:shadow-none'
                            : 'border-slate-200 dark:border-slate-700')
                        }
                      >
                        <div className={`${displayMode === 'compact' ? 'w-5 h-6' : 'w-7 h-8'} rounded-md overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0 relative`}
                        >
                          {template.thumbnailUrl ? (
                            <img
                              src={template.thumbnailUrl}
                              alt={template.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              decoding="async"
                              fetchPriority="low"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            className="absolute inset-0 hidden items-center justify-center text-[8px] text-slate-400"
                            style={{ display: template.thumbnailUrl ? 'none' : 'flex' }}
                          >
                            —
                          </div>
                          {template.isPremium && (
                            <div className="absolute top-0.5 left-0.5 bg-amber-500 text-white px-1 py-0.5 rounded text-[8px] font-bold">
                              ⭐
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-bold text-slate-900 dark:text-white truncate">{template.name}</div>
                            {template.enabled === false ? (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-600 text-white shrink-0">OFF</span>
                            ) : (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-600 text-white shrink-0">ON</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate">{template.id}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setFullImageViewer({ open: true, url: template.imageUrl, title: template.name })}
                            disabled={loading}
                            title="عرض كامل"
                            aria-label="عرض كامل"
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleEnabled(e, template.id, template.enabled !== false)}
                            disabled={loading || !!updatingTemplateIds[template.id]}
                            title={template.enabled === false ? 'تفعيل' : 'تعطيل'}
                            aria-label={template.enabled === false ? 'تفعيل' : 'تعطيل'}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                          >
                            {template.enabled === false ? (
                              <ToggleLeft size={16} className="text-red-600 dark:text-red-400" />
                            ) : (
                              <ToggleRight size={16} className="text-emerald-700 dark:text-emerald-400" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleTogglePremium(e, template.id, template.isPremium || false)}
                            disabled={loading || !!updatingTemplateIds[template.id]}
                            title={template.isPremium ? 'إلغاء Premium' : 'Premium'}
                            aria-label={template.isPremium ? 'إلغاء Premium' : 'Premium'}
                            aria-pressed={template.isPremium === true}
                            className={
                              `p-2 rounded-lg border transition-colors disabled:opacity-50 ` +
                              (template.isPremium
                                ? 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900')
                            }
                          >
                            <Star
                              size={16}
                              className={
                                (template.isPremium
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500 dark:text-slate-400')
                              }
                              fill={template.isPremium ? 'currentColor' : 'none'}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(template)}
                            disabled={loading}
                            title="تعديل"
                            aria-label="تعديل"
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 disabled:opacity-50"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={loading}
                            title="حذف"
                            aria-label="حذف"
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 disabled:opacity-50"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {totalTemplatesPages > 1 ? (
                  <div className="pt-2 flex items-center justify-center">
                    <div className="flex items-center gap-1 overflow-x-auto max-w-full px-1 py-1">
                      {Array.from({ length: totalTemplatesPages }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isActive = pageNum === templatesPage;
                        return (
                          <button
                            key={`page-${pageNum}`}
                            type="button"
                            onClick={() => setTemplatesPage(pageNum)}
                            className={
                              `min-w-[36px] h-9 px-2 rounded-xl border text-sm font-bold transition-colors ` +
                              (isActive
                                ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')
                            }
                            aria-current={isActive ? 'page' : undefined}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </>
            )}
          </div>
        )}

        {activeTab === 'features' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">ميزات Premium المتاحة</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">قوالب Premium غير محدودة</p>
                    <p className="text-sm text-slate-500">المستخدمون المجانيون: 4 قوالب فقط</p>
                  </div>
                  <div className="text-green-600 font-bold">✓ مفعّل</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">حفظ غير محدود للملفات</p>
                    <p className="text-sm text-slate-500">المستخدمون المجانيون: 3 ملفات فقط</p>
                  </div>
                  <div className="text-green-600 font-bold">✓ مفعّل</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">حفظ التوليدات</p>
                    <p className="text-sm text-slate-500">المستخدمون المجانيون: 4 توليدات، Premium: 50</p>
                  </div>
                  <div className="text-green-600 font-bold">✓ مفعّل</div>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">إزالة العلامة المائية</p>
                    <p className="text-sm text-slate-500">حصري للمشتركين</p>
                  </div>
                  <div className="text-amber-600 font-bold">⚠ قيد التطوير</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">الإعدادات العامة</h3>
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white mb-2">حدود المستخدمين المجانيين</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">عدد القوالب Premium</label>
                      <input
                        type="number"
                        defaultValue={4}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">الملفات المحفوظة</label>
                      <input
                        type="number"
                        defaultValue={3}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">التوليدات المحفوظة</label>
                      <input
                        type="number"
                        defaultValue={4}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white mb-2">حدود المشتركين</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">عدد القوالب Premium</label>
                      <input
                        type="number"
                        defaultValue={999}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">الملفات المحفوظة</label>
                      <input
                        type="number"
                        defaultValue={9}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                    <div>
                      <label className="text-slate-600 dark:text-slate-400">التوليدات المحفوظة</label>
                      <input
                        type="number"
                        defaultValue={50}
                        className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                      />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button>
                    <Settings size={16} />
                    حفظ الإعدادات
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Modal
        isOpen={editorOpen}
        onClose={closeEditor}
        title={editorMode === 'create' ? 'إضافة قوالب' : 'تعديل قالب'}
        maxWidth="max-w-4xl"
        showFooter={false}
        debugId="TRYON-TEMPLATES-EDITOR"
      >
        {editorMode === 'create' && (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all duration-200 ${
                createDropActive
                  ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 scale-[1.02] shadow-lg'
                  : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDragEnter={handleCreateDragEnter}
              onDragLeave={handleCreateDragLeave}
              onDrop={handleCreateDrop}
            >
              <div className={`flex items-center justify-center gap-3 transition-colors ${
                createDropActive
                  ? 'text-blue-600 dark:text-blue-300'
                  : 'text-slate-700 dark:text-slate-200'
              }`}>
                <ImageUp size={createDropActive ? 24 : 18} className="transition-all" />
                <span className="text-sm font-bold">
                  {createDropActive ? '✓ أفلت الصور هنا' : 'اسحب الصور هنا أو اختر ملفات'}
                </span>
              </div>
              <div className="mt-3">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    addFilesToCreate(toFiles(e.target.files));
                    e.currentTarget.value = '';
                  }}
                  className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                />
              </div>
              <div className="mt-2 text-xs text-slate-500">سيتم إنشاء المصغّرات عند حفظ كل عنصر.</div>
            </div>

            {createItems.length > 0 && (
              <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500">{createItems.length} عنصر</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={handleSaveAllCreate} disabled={loading || bulkSaving}>
                    حفظ الكل
                  </Button>
                </div>
              </div>
            )}

            {createItems.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {createQueueStats.uploading > 0 || bulkSaving ? 'جاري الرفع…' : 'قائمة الرفع'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {createQueueStats.done}/{createQueueStats.total} مكتمل
                    {createQueueStats.queued > 0 ? ` • ${createQueueStats.queued} في الانتظار` : ''}
                    {createQueueStats.errored > 0 ? ` • ${createQueueStats.errored} أخطاء` : ''}
                  </div>
                </div>

                {createQueueStats.currentName ? (
                  <div className="mt-1 text-xs text-slate-600 dark:text-slate-300">يتم الآن: {createQueueStats.currentName}</div>
                ) : null}

                <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-slate-200 transition-[width]"
                    style={{ width: `${Math.max(0, Math.min(100, createQueueStats.pct))}%` }}
                  />
                </div>
                <div className="mt-1 text-[11px] text-slate-500">{createQueueStats.pct}%</div>
              </div>
            )}

            {createItems.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {createItems.map((item) => (
                  <div key={item.key} className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden">
                    <div className="flex gap-3 p-3">
                      <div className="w-24 aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0">
                        <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[11px] text-slate-500">ID</label>
                            <input
                              value={item.id}
                              onChange={(e) => setCreateItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, id: e.target.value } : x)))}
                              className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500">الاسم</label>
                            <input
                              value={item.name}
                              onChange={(e) => setCreateItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, name: e.target.value } : x)))}
                              className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-slate-500">order</label>
                            <input
                              type="number"
                              value={typeof item.order === 'number' ? item.order : ''}
                              onChange={(e) => {
                                const v = e.target.value;
                                setCreateItems((prev) =>
                                  prev.map((x) => {
                                    if (x.key !== item.key) return x;
                                    if (v === '') return { ...x, order: undefined };
                                    const n = Number(v);
                                    return { ...x, order: Number.isFinite(n) ? n : undefined };
                                  })
                                );
                              }}
                              className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div className="flex items-center gap-4 mt-6 md:mt-0">
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => setCreateItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, enabled: e.target.checked } : x)))}
                              />
                              ON
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                              <input
                                type="checkbox"
                                checked={item.isPremium}
                                onChange={(e) => setCreateItems((prev) => prev.map((x) => (x.key === item.key ? { ...x, isPremium: e.target.checked } : x)))}
                              />
                              Premium
                            </label>
                          </div>
                        </div>

                        {item.stage === 'uploadingOriginal' ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300">رفع الصورة الأصلية: {Math.round(item.originalProgress || 0)}%</div>
                        ) : null}
                        {item.stage === 'uploadingThumb' ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300">رفع المصغّر: {Math.round(item.thumbProgress || 0)}%</div>
                        ) : null}
                        {item.stage === 'savingDoc' ? (
                          <div className="text-xs text-slate-600 dark:text-slate-300">حفظ البيانات…</div>
                        ) : null}
                        {item.error ? <div className="text-xs text-red-600">{item.error}</div> : null}
                        {item.saved ? <div className="text-xs text-emerald-600">تم الحفظ</div> : null}

                        {(item.stage === 'uploadingOriginal' || item.stage === 'uploadingThumb' || item.stage === 'savingDoc') && (
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-slate-900 dark:bg-slate-200 transition-[width]"
                              style={{
                                width: `${Math.max(
                                  0,
                                  Math.min(
                                    100,
                                    item.stage === 'uploadingOriginal'
                                      ? (item.originalProgress || 0)
                                      : item.stage === 'uploadingThumb'
                                        ? (item.thumbProgress || 0)
                                        : 98
                                  )
                                )}%`,
                              }}
                            />
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setCreateItems((prev) => {
                                const it = prev.find((x) => x.key === item.key);
                                if (it) {
                                  try { URL.revokeObjectURL(it.previewUrl); } catch {}
                                }
                                return prev.filter((x) => x.key !== item.key);
                              });
                            }}
                            disabled={item.saving}
                          >
                            حذف
                          </Button>
                          <Button size="sm" onClick={() => handleSaveCreateItem(item.key)} disabled={item.saving}>
                            {item.saving ? '...' : 'حفظ'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-slate-500">أضف صورًا للبدء.</div>
            )}
          </div>
        )}

        {editorMode === 'edit' && editDraft && (
          <div className="space-y-4">
            {(editDraft.uploadStage && editDraft.uploadStage !== 'idle') && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-bold text-slate-800 dark:text-slate-100">جاري التحديث…</div>
                  <div className="text-xs text-slate-500">
                    {editDraft.uploadStage === 'uploadingOriginal' ? `رفع الأصل ${Math.round(editDraft.originalProgress || 0)}%` : ''}
                    {editDraft.uploadStage === 'uploadingThumb' ? `رفع المصغر ${Math.round(editDraft.thumbProgress || 0)}%` : ''}
                    {editDraft.uploadStage === 'savingDoc' ? 'حفظ البيانات…' : ''}
                  </div>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-slate-900 dark:bg-slate-200 transition-[width]"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(
                          100,
                          editDraft.uploadStage === 'uploadingOriginal'
                            ? (editDraft.originalProgress || 0)
                            : editDraft.uploadStage === 'uploadingThumb'
                              ? (editDraft.thumbProgress || 0)
                              : 98
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400">ID</label>
                  <input
                    value={editDraft.id}
                    onChange={(e) => handleUpdateEditDraft({ id: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                    disabled
                    title="ID ثابت (doc id)"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-600 dark:text-slate-400">الاسم</label>
                  <input
                    value={editDraft.name}
                    onChange={(e) => handleUpdateEditDraft({ name: e.target.value })}
                    className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-600 dark:text-slate-400">order</label>
                    <input
                      type="number"
                      value={typeof editDraft.order === 'number' ? editDraft.order : ''}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (v === '') handleUpdateEditDraft({ order: undefined });
                        else {
                          const n = Number(v);
                          handleUpdateEditDraft({ order: Number.isFinite(n) ? n : undefined });
                        }
                      }}
                      className="w-full mt-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div className="flex items-center gap-4 mt-6">
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input type="checkbox" checked={editDraft.enabled} onChange={(e) => handleUpdateEditDraft({ enabled: e.target.checked })} />
                      ON
                    </label>
                    <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                      <input type="checkbox" checked={editDraft.isPremium} onChange={(e) => handleUpdateEditDraft({ isPremium: e.target.checked })} />
                      Premium
                    </label>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-slate-900 dark:text-white">الصورة</div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                        onClick={() => setFullImageViewer({ open: true, url: editDraft.imageUrl, title: editDraft.name })}
                        title="عرض كامل"
                        aria-label="عرض كامل"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 ${editDraft.replacementFile ? 'hover:bg-slate-50 dark:hover:bg-slate-900' : 'opacity-50 cursor-not-allowed'}`}
                        onClick={openCropModal}
                        title="قص (يتطلب صورة بديلة محمّلة)"
                        aria-label="قص"
                        disabled={!editDraft.replacementFile}
                      >
                        <Crop size={16} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`mt-3 rounded-xl border-2 border-dashed p-4 transition-all duration-200 ${
                      editDropActive
                        ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-950 scale-[1.02] shadow-lg'
                        : 'border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900'
                    }`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragEnter={handleEditDragEnter}
                    onDragLeave={handleEditDragLeave}
                    onDrop={handleEditDrop}
                  >
                    <div className={`text-sm flex items-center gap-2 transition-colors ${
                      editDropActive
                        ? 'text-blue-600 dark:text-blue-300'
                        : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      <ImageUp size={editDropActive ? 20 : 16} className="transition-all" />
                      <span className="font-bold">
                        {editDropActive ? '✓ أفلت الصورة هنا' : 'اسحب صورة لاستبدالها أو اختر ملف'}
                      </span>
                    </div>
                    <div className="mt-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0] || null;
                          if (f) handleSelectReplacementFile(f);
                          e.currentTarget.value = '';
                        }}
                        className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
                      />
                    </div>
                    <div className="mt-2 text-xs text-slate-500">سيتم إنشاء المصغّر عند الحفظ.</div>
                  </div>
                </div>

                {editDraft.error ? <div className="text-sm text-red-600">{editDraft.error}</div> : null}
                {editDraft.lastSavedAt ? <div className="text-sm text-emerald-600">تم الحفظ</div> : null}

                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (!editDraft) return;
                      if (confirm('حذف هذا القالب؟')) {
                        void handleDeleteTemplate(editDraft.id);
                        // keep modal open; user can close
                      }
                    }}
                    disabled={editDraft.saving}
                  >
                    <Trash2 size={16} />
                  </Button>
                  <Button onClick={saveEdit} disabled={editDraft.saving}>
                    {editDraft.saving ? '...' : 'حفظ'}
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-bold text-slate-900 dark:text-white">المعاينة</div>
                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-900">
                  <div className="aspect-[3/4]">
                    <img
                      src={editDraft.replacementPreviewUrl || editDraft.thumbnailUrl || editDraft.imageUrl}
                      alt={editDraft.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500">يتم استخدام المصغّر للعرض السريع.</div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Template Picker (Test) */}
      <Modal
        isOpen={templatePickerTestOpen}
        onClose={() => setTemplatePickerTestOpen(false)}
        title="اختبار القوالب"
        maxWidth="max-w-6xl"
        showFooter={false}
        debugId="TRYON-TEMPLATE-PICKER"
      >
        {templates.length === 0 ? (
          <div className="text-center py-10 text-slate-500">لا توجد قوالب للاختبار.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 lg:h-[65vh] lg:min-h-0 lg:overflow-hidden">
            <div className="min-w-0 lg:min-h-0 lg:overflow-hidden flex flex-col">
              <div
                className="min-w-0 min-h-0 flex-1 overflow-y-scroll"
                style={{ scrollbarGutter: 'stable', touchAction: 'pan-y' }}
              >
                <TemplatePicker
                  items={templatePickerTestPagedTemplates.map((t) => {
                    const hasThumb = Boolean(t.thumbnailUrl);
                    return {
                      id: t.id,
                      name: t.name,
                      imageUrl: t.imageUrl,
                      thumbnailUrl: t.thumbnailUrl || null,
                      isPremium: t.isPremium === true,
                      metaLabel: hasThumb ? 'مصغّر' : 'بدون مصغّر',
                      metaTone: hasThumb ? 'ok' : 'warn',
                    };
                  })}
                  selectedId={templatePickerTestSelectedId}
                  onSelect={(item) => {
                    setTemplatePickerTestSelectedId(item.id);
                    setTemplatePickerTestImageLoading(true);
                  }}
                  aspect="portrait"
                  maxItemWidthPx={150}
                />
              </div>

              {templatePickerTestTotalPages > 1 ? (
                <div className="pt-2 flex items-center justify-center">
                  <div className="flex items-center gap-1 overflow-x-auto max-w-full px-1 py-1">
                    {Array.from({ length: templatePickerTestTotalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = pageNum === templatePickerTestPage;
                      return (
                        <button
                          key={`picker-page-${pageNum}`}
                          type="button"
                          onClick={() => setTemplatePickerTestPage(pageNum)}
                          className={
                            `min-w-[36px] h-9 px-2 rounded-xl border text-sm font-bold transition-colors ` +
                            (isActive
                              ? 'border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-200'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800')
                          }
                          aria-current={isActive ? 'page' : undefined}
                          aria-label={`Page ${pageNum}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="space-y-3">
              <div className="text-sm font-bold text-slate-900 dark:text-white">المعاينة</div>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
                <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800 flex items-center justify-center relative">
                  {(() => {
                    const selected = templates.find((t) => t.id === templatePickerTestSelectedId) || templates[0];
                    if (!selected) return <div className="text-sm text-slate-500">اختر قالبًا</div>;
                    return (
                      <>
                        <img
                          src={selected.imageUrl}
                          alt={selected.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onLoad={(e) => {
                            const current = e.currentTarget.src;
                            if (templatePickerTestImageSrcRef.current && current === templatePickerTestImageSrcRef.current) {
                              setTemplatePickerTestImageLoading(false);
                            }
                          }}
                          onError={() => setTemplatePickerTestImageLoading(false)}
                        />
                        {templatePickerTestImageLoading && (
                          <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const selected = templates.find((t) => t.id === templatePickerTestSelectedId) || templates[0];
                    if (!selected) return;
                    setFullImageViewer({ open: true, url: selected.imageUrl, title: selected.name });
                  }}
                >
                  <Eye size={16} />
                  عرض كامل
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Full Image Viewer */}
      <Modal
        isOpen={fullImageViewer.open}
        onClose={() => setFullImageViewer({ open: false, url: '', title: '' })}
        title={fullImageViewer.title || 'صورة'}
        maxWidth="max-w-6xl"
        showFooter={false}
        debugId="TRYON-TEMPLATE-FULLIMAGE"
      >
        <div className="w-full">
          <img src={fullImageViewer.url} alt={fullImageViewer.title} className="w-full h-auto rounded-xl" />
        </div>
      </Modal>

      {/* Crop Modal */}
      <Modal
        isOpen={cropState.open}
        onClose={closeCropModal}
        title="قص الصورة"
        maxWidth="max-w-2xl"
        showFooter={false}
        debugId="TRYON-TEMPLATE-CROP"
      >
        <div className="space-y-4">
          <div className="text-xs text-slate-500">اسحب داخل المعاينة لتغيير الموضع، واستخدم التكبير.</div>
          <div className="flex items-center justify-center">
            <canvas
              ref={cropCanvasRef}
              className="rounded-xl border border-slate-200 dark:border-slate-700 touch-none"
              onPointerDown={(e) => {
                const canvas = cropCanvasRef.current;
                const img = cropImgRef.current;
                if (!canvas || !img) return;
                cropDragRef.current = { active: true, startX: e.clientX, startY: e.clientY, startCx: cropState.cx, startCy: cropState.cy };
                (e.currentTarget as HTMLCanvasElement).setPointerCapture(e.pointerId);
              }}
              onPointerMove={(e) => {
                const drag = cropDragRef.current;
                const canvas = cropCanvasRef.current;
                const img = cropImgRef.current;
                if (!drag?.active || !canvas || !img) return;

                const aspect = 3 / 4;
                const iw = img.naturalWidth;
                const ih = img.naturalHeight;
                const base = getBaseRect(iw, ih, aspect);
                const zoom = Math.max(1, Number(cropState.zoom) || 1);
                const rectW = base.w / zoom;
                const rectH = base.h / zoom;
                const dx = e.clientX - drag.startX;
                const dy = e.clientY - drag.startY;

                const dcx = (dx / canvas.width) * (rectW / iw);
                const dcy = (dy / canvas.height) * (rectH / ih);
                const next = clampCenterToRect({ cx: drag.startCx + dcx, cy: drag.startCy + dcy, iw, ih, rectW, rectH });
                setCropState((p) => ({ ...p, cx: next.cx, cy: next.cy }));
              }}
              onPointerUp={(e) => {
                cropDragRef.current = null;
                try { (e.currentTarget as HTMLCanvasElement).releasePointerCapture(e.pointerId); } catch {}
              }}
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 dark:text-slate-400">Zoom</label>
            <input
              type="range"
              min={1}
              max={4}
              step={0.01}
              value={cropState.zoom}
              onChange={(e) => setCropState((p) => ({ ...p, zoom: Number(e.target.value) }))}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={closeCropModal}>
              إلغاء
            </Button>
            <Button onClick={applyCropToReplacement}>تطبيق</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
