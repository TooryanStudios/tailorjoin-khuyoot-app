// Extracted from Account.tsx - shared MeasurementEditorDialog component
import React, { useEffect, useState, useRef } from 'react';
import { Ruler, RefreshCw, X, Save, ChevronDown, FolderOpen, ChevronRight } from 'lucide-react';
import { GarmentType, Gender } from '../../types';
import { useMeasurementTemplate, MeasurementTemplateContent } from '@/src/hooks/useMeasurementTemplate';
import { PointMarker } from '@/src/components/Measurements/PointMarker';
import { measurementService, MeasurementTemplate } from '@/src/modules/measurements/services/measurementService';
import { firebaseService } from '@/src/services/firebase';
import { useApp } from '../../context/AppContext';

const measurementTemplates: Record<GarmentType, { label: string }> = {
  dishdasha: { label: 'دشداشة / ثوب' },
  thobe: { label: 'ثوب' },
  abaya: { label: 'عباية' },
  dress: { label: 'فستان' },
  omani: { label: 'لباس عماني' },
  dhofari: { label: 'لباس ظفاري' },
  suri: { label: 'لباس صوري' },
  shirt: { label: 'قميص' },
  suit: { label: 'بدلة' },
  other: { label: 'أخرى' },
};

const normalizeGarmentType = (type: string): GarmentType => {
  if (measurementTemplates[type as GarmentType]) return type as GarmentType;
  const arabicToEnglish: Record<string, GarmentType> = {
    'دشداشة / ثوب': 'dishdasha', 'دشداشة': 'dishdasha', 'ثوب': 'thobe',
    'عباية': 'abaya', 'فستان': 'dress', 'لباس عماني': 'omani',
    'لباس ظفاري': 'dhofari', 'لباس صوري': 'suri', 'قميص': 'shirt',
    'بدلة': 'suit', 'أخرى': 'other',
  };
  return arabicToEnglish[type] || 'dishdasha';
};

export interface MeasurementEditorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    name?: string;
    type?: string;
    metrics?: Record<string, number>;
    notes?: string;
    templateId?: string;
    templateName?: string;
    selectedVariationId?: string;
    selectedVariationName?: string;
  };
  onSave: (data: {
    name: string;
    type: string;
    metrics: Record<string, number>;
    notes: string;
    templateId?: string;
    templateName?: string;
    templateUrl?: string;
    selectedVariationId?: string;
    selectedVariationName?: string;
    selectedVariationImageUrl?: string;
  }) => Promise<void>;
  userGender?: Gender;
}

export const MeasurementEditorDialog = ({
  isOpen,
  onClose,
  initialData,
  onSave,
  userGender,
}: MeasurementEditorDialogProps) => {
  const { user } = useApp();
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  const [isTypePickerOpen, setIsTypePickerOpen] = useState(false);
  const [typePickerTab, setTypePickerTab] = useState<'female' | 'male'>('female');
  const [name, setName] = useState('');
  const [nameTouched, setNameTouched] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);
  const [isMeasurementListExpanded, setIsMeasurementListExpanded] = useState(false);
  const lastAutoNameRef = useRef<string>('');

  // Saved measurements (load/pick feature)
  const [savedMeasurementsList, setSavedMeasurementsList] = useState<any[]>([]);
  const [showSavedPicker, setShowSavedPicker] = useState(false);
  const [isLoadingMeasurements, setIsLoadingMeasurements] = useState(false);;

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  const selectedVariation = selectedTemplate?.variations?.find(v => v.id === selectedVariationId) || null;
  const femaleTemplates = templates.filter(t => t.genderGroup === 'female');
  const maleTemplates = templates.filter(t => t.genderGroup === 'male');
  const visibleTemplates = typePickerTab === 'female' ? femaleTemplates : maleTemplates;
  const defaultTabFromUser = userGender === 'male' ? 'male' : 'female';
  const measurementHook = useMeasurementTemplate({
    template: selectedTemplate,
    initialMeasurements: initialData?.metrics,
  });

  const hasRenderablePoints = (template?: MeasurementTemplate | null) => {
    if (!template) return false;
    if (Array.isArray(template.points) && template.points.length > 0) return true;
    return Boolean((template.variations || []).some((v) => Array.isArray(v.points) && v.points.length > 0));
  };

  const pickPreferredTemplate = (sourceTemplates: MeasurementTemplate[]) => {
    if (sourceTemplates.length === 0) return null;
    return sourceTemplates.find((t) => hasRenderablePoints(t)) || sourceTemplates[0];
  };

  useEffect(() => {
    if (!selectedVariationId || !selectedTemplate) return;
    const exists = Boolean(selectedTemplate?.variations?.some((v) => v.id === selectedVariationId));
    if (!exists) setSelectedVariationId(null);
  }, [selectedTemplate, selectedVariationId]);

  useEffect(() => {
    if (isTypePickerOpen) {
      const initialTab = selectedTemplate?.genderGroup || defaultTabFromUser;
      setTypePickerTab(initialTab as 'female' | 'male');
    }
  }, [isTypePickerOpen, selectedTemplate?.genderGroup, defaultTabFromUser]);

  useEffect(() => {
    if (!isOpen) return;

    const applyInitialState = (
      sourceTemplates: MeasurementTemplate[],
      preferredTemplateId?: string,
      options?: { strictTemplateId?: string }
    ) => {
      const strictTemplateId = options?.strictTemplateId;
      if (initialData) {
        setName(initialData.name || '');
        setNotes(initialData.notes || '');
        if (initialData.metrics) measurementHook.setMeasurements(initialData.metrics);

        const match =
          (preferredTemplateId ? sourceTemplates.find((t) => t.id === preferredTemplateId) : null) ||
          sourceTemplates.find((t) => t.id === initialData.templateId) ||
          (!strictTemplateId
            ? sourceTemplates.find((t) => t.productType === initialData.type || t.name === initialData.type || t.id === initialData.type)
            : null);

        if (match) {
          setSelectedTemplateId(match.id);
          const variationExists = Boolean(
            initialData.selectedVariationId &&
            (match.variations || []).some((v) => v.id === initialData.selectedVariationId)
          );
          setSelectedVariationId(variationExists ? initialData.selectedVariationId! : null);
        } else {
          if (strictTemplateId) {
            setSelectedTemplateId('');
            setSelectedVariationId(null);
            setNameTouched(false);
            lastAutoNameRef.current = '';
            return;
          }
          const norm = normalizeGarmentType(initialData.type || '');
          const normalizedMatch = sourceTemplates.find((t) => t.productType === norm && hasRenderablePoints(t));
          if (normalizedMatch) {
            setSelectedTemplateId(normalizedMatch.id);
          } else {
            const fallback = pickPreferredTemplate(sourceTemplates);
            if (fallback) setSelectedTemplateId(fallback.id);
          }
          setSelectedVariationId(null);
        }
      } else {
        setName('');
        setNotes('');
        setSelectedVariationId(null);
        measurementHook.setMeasurements({});
        if (sourceTemplates.length > 0 && !selectedTemplateId) {
          const fallback = pickPreferredTemplate(sourceTemplates);
          if (fallback) setSelectedTemplateId(fallback.id);
        }
      }
      setNameTouched(false);
      lastAutoNameRef.current = '';
    };

    if (initialData?.templateId && templates.some((t) => t.id === initialData.templateId)) {
      applyInitialState(templates, initialData.templateId, { strictTemplateId: initialData.templateId });
      return;
    }
    if (!initialData?.templateId && templates.length > 0) {
      applyInitialState(templates);
      return;
    }

    let cancelled = false;
    const openWithExactTemplate = async (templateId: string) => {
      setIsLoadingTemplates(true);
      try {
        const exactTemplate = await measurementService.getTemplateById(templateId);
        if (cancelled) return;
        if (exactTemplate) {
          setTemplates([exactTemplate]);
          applyInitialState([exactTemplate], exactTemplate.id, { strictTemplateId: templateId });
        }
        const fullTemplates = await measurementService.getTemplates();
        if (cancelled) return;
        setTemplates(fullTemplates);
        applyInitialState(fullTemplates, exactTemplate?.id || templateId, { strictTemplateId: templateId });
      } catch (error) {
        if (cancelled) return;
        console.error('[MeasurementEditorDialog] Failed exact template flow:', error);
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    };

    const openWithTemplateList = async () => {
      if (templates.length > 0) { applyInitialState(templates); return; }
      setIsLoadingTemplates(true);
      try {
        const data = await measurementService.getTemplates();
        if (cancelled) return;
        setTemplates(data);
        applyInitialState(data);
      } catch (error) {
        if (cancelled) return;
        console.error('[MeasurementEditorDialog] Failed to load templates:', error);
      } finally {
        if (!cancelled) setIsLoadingTemplates(false);
      }
    };

    if (initialData?.templateId) {
      openWithExactTemplate(initialData.templateId);
    } else {
      openWithTemplateList();
    }
    return () => { cancelled = true; };
  }, [isOpen, initialData, templates]);

  useEffect(() => {
    if (!selectedTemplate || selectedVariationId) return;
    if (Array.isArray(selectedTemplate.points) && selectedTemplate.points.length > 0) return;
    const firstRenderable = (selectedTemplate.variations || []).find(
      (v) => v.enabled !== false && Array.isArray(v.points) && v.points.length > 0
    );
    if (firstRenderable?.id) setSelectedVariationId(firstRenderable.id);
  }, [selectedTemplate, selectedVariationId]);

  useEffect(() => {
    if (!selectedTemplate || initialData?.name) return;
    const nextAutoName = `مقاس ${selectedTemplate.name}`;
    if (!name.trim() || (!nameTouched && name === lastAutoNameRef.current)) setName(nextAutoName);
    lastAutoNameRef.current = nextAutoName;
  }, [selectedTemplate?.id, selectedTemplate?.name]);

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    setIsLoadingMeasurements(true);
    firebaseService.getMeasurements(user.id)
      .then((data) => setSavedMeasurementsList(data || []))
      .catch(() => setSavedMeasurementsList([]))
      .finally(() => setIsLoadingMeasurements(false));
  }, [isOpen, user?.id]);

  const loadFromSaved = (saved: any) => {
    if (saved.name) { setName(saved.name); setNameTouched(true); }
    if (saved.notes) setNotes(saved.notes);
    if (saved.metrics) measurementHook.setMeasurements(saved.metrics);
    if (saved.templateId && templates.some((t) => t.id === saved.templateId)) {
      setSelectedTemplateId(saved.templateId);
    }
    if (saved.selectedVariationId) setSelectedVariationId(saved.selectedVariationId);
    setShowSavedPicker(false);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        name,
        type: selectedTemplate?.name || selectedTemplate?.productType || 'dishdasha',
        metrics: measurementHook.measurements,
        notes,
        templateId: selectedTemplate?.id,
        templateName: selectedTemplate?.name,
        templateUrl: selectedVariation?.imageUrl || selectedTemplate?.baseImageUrl,
        selectedVariationId: selectedVariation?.id ?? undefined,
        selectedVariationName: selectedVariation?.name ?? undefined,
        selectedVariationImageUrl: selectedVariation?.imageUrl ?? undefined,
      });
      onClose();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[10001]" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-xl w-full my-8 max-h-[90vh] shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()} dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-200 bg-gradient-to-l from-[var(--theme-primary)]/5 via-white to-white">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {initialData ? 'تعديل القياسات' : 'إضافة قياس جديد'}
            </h3>
            <p className="text-[11px] text-[var(--theme-primary)]/70 mt-0.5">إدخل مقاساتك بدقة للحصول على أفضل ملابس</p>
          </div>
          <div className="flex items-center gap-2">
            {user?.id && (
              <button
                type="button"
                onClick={() => setShowSavedPicker((v) => !v)}
                title="تحميل مقاس محفوظ"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showSavedPicker
                    ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]'
                    : 'text-[var(--theme-primary)] border-[var(--theme-primary)]/30 hover:bg-[var(--theme-primary)]/8'
                }`}
              >
                <FolderOpen size={13} />
                محفوظة
                {savedMeasurementsList.length > 0 && (
                  <span className={`text-[10px] font-bold px-1 rounded-full ${
                    showSavedPicker ? 'bg-white/25 text-white' : 'bg-[var(--theme-primary)]/15 text-[var(--theme-primary)]'
                  }`}>{savedMeasurementsList.length}</span>
                )}
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all" aria-label="إغلاق">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Saved Measurements Picker */}
        {showSavedPicker && (
          <div className="border-b border-slate-200 bg-[var(--theme-primary)]/3">
            <div className="px-5 py-3">
              <p className="text-xs font-bold text-[var(--theme-primary)] mb-2">القياسات المحفوظة — اختر مقاساً لتحميله</p>
              {isLoadingMeasurements ? (
                <div className="flex items-center gap-2 py-2 text-xs text-slate-400">
                  <RefreshCw size={12} className="animate-spin" />جاري التحميل...
                </div>
              ) : savedMeasurementsList.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">لا توجد قياسات محفوظة بعد</p>
              ) : (
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto">
                  {savedMeasurementsList.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => loadFromSaved(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[var(--theme-primary)]/25 rounded-xl text-xs font-medium text-slate-700 hover:bg-[var(--theme-primary)]/8 hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)] transition-all shadow-sm"
                    >
                      <ChevronRight size={11} className="text-[var(--theme-primary)]" />
                      <span className="truncate max-w-[120px]">{m.name}</span>
                      {m.templateName && <span className="text-[10px] text-slate-400">({m.templateName})</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Template picker button */}
              {isLoadingTemplates ? (
                <div className="py-10 text-center"><RefreshCw className="animate-spin mx-auto text-slate-400" /></div>
              ) : (
                <div className="mb-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">نوع الملبس</label>
                  <button
                    type="button"
                    onClick={() => setIsTypePickerOpen(true)}
                    className="w-full p-3 border-2 border-dashed border-slate-200 rounded-xl hover:border-[var(--theme-primary)]/50 transition-all text-right"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-[var(--theme-primary)]/10 flex items-center justify-center">
                        <Ruler size={16} className="text-[var(--theme-primary)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-500">اختيار نوع الملبس</p>
                        <p className={selectedTemplate ? 'text-sm font-semibold text-slate-900' : 'text-sm text-slate-400'}>
                          {selectedTemplate?.name || 'اضغط للاختيار'}
                        </p>
                      </div>
                      {selectedTemplate && (
                        <span className="px-2 py-1 rounded-full text-[10px] font-medium bg-[var(--theme-primary)]/10 text-[var(--theme-primary)]">تم الاختيار</span>
                      )}
                    </div>
                  </button>
                </div>
              )}

              {/* Measurement Name */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">اسم القياس</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setNameTouched(true); setName(e.target.value); }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all text-sm"
                  placeholder="مثال: قياسي الشخصي"
                />
              </div>
            </div>

            {/* Visual Editor */}
            {selectedTemplate && (
              <div className="w-full bg-white rounded-xl border border-slate-200 p-4">
                {(() => {
                  const displayTemplate = selectedVariation
                    ? { ...selectedTemplate, baseImageUrl: selectedVariation.imageUrl, points: selectedVariation.points || selectedTemplate.points, arrows: selectedVariation.arrows || selectedTemplate.arrows }
                    : selectedTemplate;

                  return displayTemplate?.points && displayTemplate.points.length > 0 ? (
                    <MeasurementTemplateContent
                      template={displayTemplate}
                      measurements={measurementHook.measurements}
                      onMeasurementChange={measurementHook.handleMeasurementChange}
                      onShowVideo={() => measurementHook.setShowVideoDialog(true)}
                      PointMarkerComponent={PointMarker}
                      toolbar={selectedTemplate?.variations && selectedTemplate.variations.length > 0 ? (
                        <select
                          value={selectedVariationId || ''}
                          onChange={(e) => setSelectedVariationId(e.target.value || null)}
                          className="w-[4.5rem] px-2 py-1 border border-slate-200 rounded-md focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all text-[11px] bg-white/95 shadow-sm"
                          title={selectedVariation?.name || selectedTemplate.baseImageName || selectedTemplate.name || 'اختر نمط الملبس'}
                        >
                          <option value="">{selectedTemplate.baseImageName || selectedTemplate.name || 'الصورة الأساسية'}</option>
                          {selectedTemplate.variations.map((variation, index) => (
                            <option key={variation.id} value={variation.id} disabled={!variation.enabled}>
                              {variation.name || `متغيّر ${index + 1}`}
                            </option>
                          ))}
                        </select>
                      ) : undefined}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                      <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center">
                        <Ruler size={32} className="text-slate-400" />
                      </div>
                      <p className="text-sm font-medium text-slate-600">يتم تحميل القالب...</p>
                      <p className="text-xs text-slate-400">إذا استمرت هذه الحالة، تحقق من نوع الملبس المختار</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">ملاحظات (اختياري)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[var(--theme-primary)] focus:border-transparent transition-all resize-none text-sm"
                rows={3}
                placeholder="أي ملاحظات إضافية..."
              />
            </div>

            {/* Collapsible measurement list */}
            <div className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
              <button
                type="button"
                onClick={() => setIsMeasurementListExpanded(!isMeasurementListExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-100 transition-colors"
              >
                <h4 className="text-xs font-bold text-slate-700">قائمة القياسات</h4>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isMeasurementListExpanded ? 'rotate-180' : ''}`} />
              </button>
              {isMeasurementListExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 space-y-2 max-h-40 overflow-y-auto">
                  {selectedTemplate ? (
                    <div className="space-y-2">
                      {selectedTemplate.points.map(p => (
                        <div key={p.id} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600">{p.label || p.name}</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={measurementHook.measurements[p.id] || ''}
                              onChange={(e) => measurementHook.handleMeasurementChange(p.id, e.target.value)}
                              className="w-16 px-2 py-1 rounded border border-slate-200 text-center"
                              placeholder="0"
                            />
                            <span className="text-slate-400 w-6">سم</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic text-center py-4">اختر نوع الملبس لعرض القياسات</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-gray-50/50 flex gap-2">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-all"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 h-10 bg-[var(--theme-primary)] text-white rounded-lg text-sm font-semibold hover:bg-[var(--theme-primary-dark)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
          >
            {isSaving ? (
              <><RefreshCw size={14} className="animate-spin" />جاري الحفظ...</>
            ) : (
              <><Save size={14} />حفظ القياسات</>
            )}
          </button>
        </div>
      </div>

      {/* Type Picker Sub-dialog */}
      {isTypePickerOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[10002]" onClick={() => setIsTypePickerOpen(false)}>
          <div className="bg-white rounded-xl p-5 max-w-2xl w-full shadow-2xl" onClick={(e) => e.stopPropagation()} dir="rtl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
              <h4 className="text-sm font-bold text-slate-900">اختيار نوع الملبس</h4>
              <button onClick={() => setIsTypePickerOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-all" aria-label="إغلاق">
                <X size={16} />
              </button>
            </div>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => setTypePickerTab('female')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${typePickerTab === 'female' ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                نسائي
              </button>
              <button
                type="button"
                onClick={() => setTypePickerTab('male')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${typePickerTab === 'male' ? 'bg-[var(--theme-primary)] text-white border-[var(--theme-primary)]' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}
              >
                رجالي
              </button>
            </div>
            {visibleTemplates.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 bg-slate-50 rounded-lg">لا توجد أنواع متاحة لهذا القسم</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {visibleTemplates.map(t => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setSelectedTemplateId(t.id); setSelectedVariationId(null); setIsTypePickerOpen(false); }}
                    className={`text-right p-3 rounded-xl border transition-all ${selectedTemplateId === t.id ? 'bg-[var(--theme-primary)]/10 border-[var(--theme-primary)]' : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'}`}
                  >
                    <div className={`text-sm font-semibold ${selectedTemplateId === t.id ? 'text-[var(--theme-primary)]' : 'text-slate-900'}`}>{t.name}</div>
                    <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">{t.description || 'تفاصيل المقاسات الخاصة بهذا النوع'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video Dialog */}
      <div className="z-[10002]">
        {measurementHook.showVideoDialog && (
          <div
            className="fixed inset-0 z-[11000] bg-black/80 flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); measurementHook.setShowVideoDialog(false); }}
          >
            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => { e.stopPropagation(); measurementHook.setShowVideoDialog(false); }}
                className="absolute top-4 right-4 text-white p-2 bg-black/50 hover:bg-black/70 rounded-full z-10 transition-all"
                title="Close Video"
                aria-label="Close Video"
              >
                <X size={20} />
              </button>
              <iframe
                src={measurementHook.videoUrl}
                title="Tutorial Video"
                className="w-full h-full"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeasurementEditorDialog;
