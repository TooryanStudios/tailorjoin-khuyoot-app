import React, { useMemo } from 'react';
import { Save, Loader2, LayoutGrid, RefreshCcw } from 'lucide-react';
import { Button } from '../../../components/Button';
import { useMeasurementTemplates } from './useMeasurementTemplates';
import { TemplatesCanvas } from './components/TemplatesCanvas';
import { TemplatesDetailsPanel } from './components/TemplatesDetailsPanel';

export const MeasurementTemplatesPage: React.FC = () => {
  const {
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
    historyIndex,
    pointColor,
    history,
    activeRootId,
    activeVariationId,
    reloadTemplates,
    handleSelectRoot,
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
    handleRemoveVariationImage,
    handleRemoveVariation,
    handleRenameVariation,
    handleToggleVariationEnabled,
    handleSetActiveVariation,
    handleAddPointAt,
    handleAddArrow,
    saveToHistory,
  } = useMeasurementTemplates();

  const [isDebugPanelOpen, setIsDebugPanelOpen] = React.useState(false);

  const rootOptions = useMemo(() => {
    const seen = new Set<string>();
    const result: Array<{ id: string; name: string; image?: string }> = [];

    templates.forEach((template) => {
      if ((template.level ?? 0) !== 1) return;
      const rootId = template.id;
      if (!rootId || seen.has(rootId)) return;
      seen.add(rootId);
      result.push({ id: rootId, name: template.name, image: template.categoryImageUrl });
    });

    return result;
  }, [templates]);

  const branchTemplates = useMemo(() => {
    if (!activeRootId) return [] as typeof templates;
    return templates.filter((template) => template.parentId === activeRootId);
  }, [templates, activeRootId]);

  React.useEffect(() => {
    if (!activeRootId && !isLoading && rootOptions.length > 0) {
      handleSelectRoot(rootOptions[0].id);
    }
  }, [activeRootId, handleSelectRoot, isLoading, rootOptions]);

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!draft) return;
    if (!draft.baseImageUrl) return; // Don't allow adding points/arrows without image
    const canvasElement = event.currentTarget as HTMLDivElement;
    const rect = canvasElement.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

    if (toolMode === 'add') {
      handleAddPointAt(x, y);
      saveToHistory();
    } else if (toolMode === 'arrow') {
      if (!arrowDraft) {
        setArrowDraft({ startX: x, startY: y });
      } else {
        handleAddArrow(arrowDraft.startX, arrowDraft.startY, x, y);
        setArrowDraft(null);
        saveToHistory();
      }
    }
  };

  const handlePointClick = (pointId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (toolMode === 'delete') handleDeletePoint(pointId);
  };

  const handlePointDoubleClick = (pointId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!draft) return;
    const activeVariation = activeVariationId
      ? (draft.variations || []).find((variation) => variation.id === activeVariationId)
      : null;
    const sourcePoints = activeVariation ? activeVariation.points || [] : draft.points;
    const point = sourcePoints.find((p) => p.id === pointId);
    if (!point) return;
    const newLabel = window.prompt('أدخل اسم النقطة:', point.label);
    if (newLabel !== null && newLabel.trim() !== '') {
      handleUpdatePoint(pointId, { label: newLabel.trim() });
      saveToHistory();
    }
  };

  const handlePointMouseDown = (pointId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (toolMode === 'select') setDraggingPointId(pointId);
  };

  const handleArrowMouseDown = (arrowId: string, part: 'start' | 'end', event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    if (toolMode === 'select') {
      setDraggingArrowId(arrowId);
      setDraggingArrowPart(part);
    }
  };

  const handleArrowDoubleClick = (arrowId: string) => {
    if (window.confirm('حذف السهم؟')) handleDeleteArrow(arrowId);
  };

  const handleUpdateDraft = (updates: Partial<typeof draft>) => {
    if (!draft) return;
    setDraft({ ...draft, ...updates });
  };

  const selectedVariation = useMemo(() => {
    if (!draft || !activeVariationId) return null;
    return (draft.variations || []).find((variation) => variation.id === activeVariationId) || null;
  }, [draft, activeVariationId]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canDeleteCurrentTemplate = Boolean(activeId && !activeId.startsWith('temp-'));

  if (isLoading && templates.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 max-w-[1600px] mx-auto p-4 md:p-6 min-h-[85vh] font-['Cairo'] bg-[#ededed] dark:bg-zinc-950" dir="rtl">
      {/* Header Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm p-6 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
          <div className="flex items-end gap-3">
            <div className="w-12 h-12 rounded-2xl bg-theme-primary/10 flex items-center justify-center">
              <LayoutGrid size={24} className="text-theme-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-normal text-zinc-900 dark:text-white tracking-tight">قوالب القياسات</h1>
              <p className="text-xs text-zinc-500 font-normal uppercase tracking-widest mt-0.5">القوالب مرتبطة بتصنيفات الأزياء - حدد النقاط على كل قالب</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={activeRootId || ''}
                  onChange={(e) => handleSelectRoot(e.target.value)}
                  disabled={isLoading || rootOptions.length === 0}
                  className="w-44 min-w-[10rem] px-3 py-2 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  aria-label="اختر التصنيف الرئيسي"
                >
                  {isLoading && <option>⏳ جاري التحميل...</option>}
                  {!isLoading && rootOptions.length === 0 && <option>⚠️ لا توجد تصنيفات</option>}
                  {!isLoading && rootOptions.length > 0 && (
                    <>
                      {!activeRootId && <option value="">اختر التصنيف</option>}
                      {rootOptions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <select
                value={activeId || ''}
                onChange={(e) => {
                  const selectedValue = e.target.value;
                  console.log('[Template Select] Selected value:', selectedValue);
                  const selectedTemplate = branchTemplates.find((t) => t.id === selectedValue);
                  console.log('[Template Select] Found template:', selectedTemplate?.name, 'Level:', selectedTemplate?.level, 'ParentId:', selectedTemplate?.parentId);
                  if (selectedValue) {
                    handleSelectTemplate(selectedValue);
                  }
                }}
                disabled={isLoading || branchTemplates.length === 0}
                  className="w-44 min-w-[10rem] px-3 py-2 text-sm rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium focus:ring-2 focus:ring-theme-primary/30 focus:border-theme-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                aria-label="اختر التفرع"
              >
                  {isLoading && <option value="">⏳ جاري التحميل...</option>}
                  {!isLoading && branchTemplates.length === 0 && <option value="">⚠️ اختر تصنيفاً</option>}
                {!isLoading && branchTemplates.length > 0 && (
                  <>
                    {!activeId && <option value="">اختر النوع</option>}
                    {branchTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </>
                )}
              </select>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void reloadTemplates()}
                disabled={isLoading}
                className="h-9 px-3 rounded-2xl border-zinc-200 dark:border-zinc-700 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                title="تحديث قائمة التصنيفات"
                aria-label="تحديث التصنيفات"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              </Button>
            </div>

            <Button onClick={handleSave} disabled={!draft || isSaving} className="bg-emerald-500 hover:bg-emerald-600 text-white border border-emerald-500/40 px-4 py-2 text-sm rounded-2xl" title="حفظ التغييرات">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout - Without Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[65vh]">
        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
          <div>
            <TemplatesCanvas
              draft={draft}
              toolMode={toolMode}
              pointSize={pointSize}
              pointOpacity={pointOpacity}
              arrows={arrows}
              arrowDraft={arrowDraft}
              draggingPointId={draggingPointId}
              draggingArrowId={draggingArrowId}
              draggingArrowPart={draggingArrowPart}
              showLabels={showLabels}
              isSaving={isSaving}
              appSettings={appSettings}
              pointColor={pointColor}
              canUndo={canUndo}
              canRedo={canRedo}
              canDeleteTemplate={canDeleteCurrentTemplate}
              onDeleteTemplate={() => activeId && handleDeleteTemplate(activeId)}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onPointColorChange={setPointColor}
              onCanvasClick={handleCanvasClick}
              onPointClick={handlePointClick}
              onPointDoubleClick={handlePointDoubleClick}
              onPointMouseDown={handlePointMouseDown}
              onArrowMouseDown={handleArrowMouseDown}
              onArrowDoubleClick={handleArrowDoubleClick}
              onDeleteArrow={handleDeleteArrow}
              onImageUpload={handleImageUpload}
              onSave={handleSave}
              onDuplicatePoint={handleDuplicatePoint}
              onRemoveVariationImage={handleRemoveVariationImage}
              onSetActiveVariation={handleSetActiveVariation}
              setToolMode={setToolMode}
              setPointSize={setPointSize}
              setPointOpacity={setPointOpacity}
              setShowLabels={setShowLabels}
              setArrowDraft={setArrowDraft}
              setDraggingPointId={setDraggingPointId}
              setDraggingArrowId={setDraggingArrowId}
              setDraggingArrowPart={setDraggingArrowPart}
              setDraft={setDraft}
              setArrows={setArrows}
            />
          </div>
        </div>

        <div className="flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm overflow-hidden">
          <TemplatesDetailsPanel
            draft={draft}
            activeVariation={selectedVariation}
            orderedPoints={orderedPoints}
            onUpdateDraft={handleUpdateDraft}
            onUpdatePoint={handleUpdatePoint}
            onRenameVariation={handleRenameVariation}
            onToggleVariationEnabled={handleToggleVariationEnabled}
            onDeleteVariation={handleRemoveVariation}
          />
        </div>
      </div>

      {/* Collapsible Debug Panel at Bottom */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl border-[1.5px] border-black/10 dark:border-white/10 shadow-sm shrink-0 overflow-hidden">
        <button onClick={() => setIsDebugPanelOpen(!isDebugPanelOpen)} className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
          <span className="font-semibold text-zinc-700 dark:text-zinc-200 text-sm">🐛 معلومات الربط بين القوالب والتصنيفات</span>
          <span className={`transform transition-transform ${isDebugPanelOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {isDebugPanelOpen && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="space-y-2 text-yellow-700 dark:text-yellow-400">
              <div className="border-b border-yellow-300 dark:border-yellow-600 pb-2">
                <div className="font-semibold mb-1">📊 نظرة عامة:</div>
                <div className="mr-3">
                  <div>📦 إجمالي القوالب: {templates.length}</div>
                  <div>📁 التصنيفات الرئيسية (Level 1): {rootOptions.length}</div>
                  <div>🌿 القوالب الفرعية المتاحة: {branchTemplates.length}</div>
                </div>
              </div>

              <div className="border-b border-yellow-300 dark:border-yellow-600 pb-2">
                <div className="font-semibold mb-1">✅ القالب النشط حالياً:</div>
                <div className="mr-3">
                  <div>🆔 <strong>Template ID:</strong> {activeId || 'لم يتم الاختيار'}</div>
                  <div>📝 <strong>اسم القالب:</strong> {draft?.name || 'لا يوجد'}</div>
                  <div>🔗 <strong>categoryId (معرف التصنيف):</strong> <span className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded font-mono">{draft?.categoryId || draft?.id || 'None'}</span></div>
                  <div>📍 <strong>عدد النقاط:</strong> {draft?.points?.length || 0}</div>
                </div>
              </div>

              <div className="border-b border-yellow-300 dark:border-yellow-600 pb-2">
                <div className="font-semibold mb-1">🔗 كيف يتم الربط؟</div>
                <div className="mr-3 space-y-1">
                  <div>✓ كل <strong>قالب قياسات</strong> له <strong>id</strong> فريد</div>
                  <div>✓ هذا الـ <strong>id</strong> يساوي <strong>categoryId</strong> من جدول التصنيفات</div>
                  <div>✓ عند إضافة منتج، يحفظ الخياط <strong>categoryId</strong> في المنتج</div>
                  <div>✓ في صفحة التفصيل، يتم البحث عن قالب بـ <strong>id === product.categoryId</strong></div>
                  <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-800/40 rounded">
                    📌 <strong>مثال:</strong>
                    <div className="mr-2 mt-1 font-mono text-[10px]">
                      Product.categoryId = "cat_dishdasha_001"<br />
                      Template.id = "cat_dishdasha_001"<br />
                      ✅ Template matches Product!
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold mb-1">🎯 الحالة الحالية:</div>
                <div className="mr-3">
                  <div>🏷️ <strong>التصنيف الرئيسي النشط:</strong> {activeRootId || 'لم يتم الاختيار'}</div>
                  <div>📂 <strong>التصنيف الفرعي النشط:</strong> {activeId || 'لم يتم الاختيار'}</div>
                  {draft && (
                    <div className="mt-2 p-2 bg-green-100 dark:bg-green-900/30 rounded border border-green-300 dark:border-green-700">
                      ✅ هذا القالب <strong>مرتبط</strong> بتصنيف معرفه: <span className="font-mono">{draft.categoryId || draft.id}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};