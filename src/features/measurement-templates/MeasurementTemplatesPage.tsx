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
      const nextOrder = (draft.points.length ? Math.max(...draft.points.map((p) => p.order || 0)) : 0) + 1;
      const newPoint = {
        id: `point-${Date.now()}`,
        label: `نقطة ${nextOrder}`,
        x,
        y,
        direction: 0,
        order: nextOrder,
      };
      setDraft({ ...draft, points: [...draft.points, newPoint] });
      saveToHistory();
    } else if (toolMode === 'arrow') {
      if (!arrowDraft) {
        setArrowDraft({ startX: x, startY: y });
      } else {
        const newArrow = {
          id: `arrow-${Date.now()}`,
          startX: arrowDraft.startX,
          startY: arrowDraft.startY,
          endX: x,
          endY: y,
        };
        setArrows([...arrows, newArrow]);
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
    const point = draft.points.find((p) => p.id === pointId);
    if (!point) return;
    const newLabel = window.prompt('أدخل اسم النقطة:', point.label);
    if (newLabel !== null && newLabel.trim() !== '') {
      const updatedPoints = draft.points.map((p) => (p.id === pointId ? { ...p, label: newLabel.trim() } : p));
      setDraft({ ...draft, points: updatedPoints });
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

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canDeleteCurrentTemplate = Boolean(activeId && !activeId.startsWith('temp-'));

  if (isLoading && templates.length === 0) {
    return (
      <div
        style={{
          backgroundColor: '#121212',   // dark background
          color: '#fff',                // light text
          minHeight: '100vh',           // full screen height
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-3 bg-zinc-950" dir="rtl">
      {/* Header Bar */}
      <div className="bg-zinc-900 p-3 rounded-lg border border-zinc-700 shrink-0 space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-500/20 rounded-lg text-purple-400 border border-purple-500/30">
              <LayoutGrid size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight">قوالب القياسات</h1>
              <p className="text-[11px] text-zinc-500">القوالب مرتبطة بتصنيفات الأزياء - حدد النقاط على كل قالب</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <select
                  value={activeRootId || ''}
                  onChange={(e) => handleSelectRoot(e.target.value)}
                  disabled={isLoading || rootOptions.length === 0}
                  className="w-40 min-w-[10rem] pl-10 pr-3 py-1.5 text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 font-medium focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all [&>option]:bg-zinc-800 [&>option]:text-zinc-200"
                  aria-label="اختر التصنيف الرئيسي"
                >
                  {isLoading && <option className="bg-zinc-800 text-zinc-200">⏳ جاري التحميل...</option>}
                  {!isLoading && rootOptions.length === 0 && <option className="bg-zinc-800 text-zinc-200">⚠️ لا توجد تصنيفات</option>}
                  {!isLoading && rootOptions.length > 0 && (
                    <>
                      {!activeRootId && <option value="" className="bg-zinc-800 text-zinc-200">اختر التصنيف</option>}
                      {rootOptions.map((option) => (
                        <option key={option.id} value={option.id} className="bg-zinc-800 text-zinc-200">
                          {option.name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
                {(() => {
                  if (isLoading) return null;
                  const active = rootOptions.find((option) => option.id === activeRootId) || rootOptions[0];
                  const imageUrl = active?.image;
                  if (!imageUrl) return null;
                  return (
                    <img
                      src={imageUrl}
                      alt={active?.name || 'تصنيف'}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded object-cover border border-slate-200 dark:border-slate-600"
                    />
                  );
                })()}
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
                className="w-40 min-w-[10rem] px-3 py-1.5 text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-200 font-medium focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all [&>option]:bg-zinc-800 [&>option]:text-zinc-200"
                aria-label="اختر التفرع"
              >
                {isLoading && <option value="" className="bg-zinc-800 text-zinc-200">⏳ جاري التحميل...</option>}
                {!isLoading && branchTemplates.length === 0 && <option value="" className="bg-zinc-800 text-zinc-200">⚠️ اختر تصنيفاً</option>}
                {!isLoading && branchTemplates.length > 0 && (
                  <>
                    {!activeId && <option value="" className="bg-zinc-800 text-zinc-200">اختر النوع</option>}
                    {branchTemplates.map((template) => (
                      <option key={template.id} value={template.id} className="bg-zinc-800 text-zinc-200">
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
                className="h-9 px-2"
                title="تحديث قائمة التصنيفات"
                aria-label="تحديث التصنيفات"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              </Button>
            </div>

            <Button onClick={handleSave} disabled={!draft || isSaving} className="bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/40 px-3 py-1.5 text-sm" title="حفظ التغييرات">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid Layout - Without Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-3">
        <div className="flex flex-col bg-zinc-900 rounded-lg border border-zinc-700">
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

        <div className="flex flex-col bg-zinc-900 rounded-lg border border-zinc-700">
          <TemplatesDetailsPanel draft={draft} orderedPoints={orderedPoints} onUpdateDraft={handleUpdateDraft} onUpdatePoint={handleUpdatePoint} />
        </div>
      </div>

      {/* Collapsible Debug Panel at Bottom */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 shrink-0">
        <button onClick={() => setIsDebugPanelOpen(!isDebugPanelOpen)} className="w-full flex items-center justify-between p-3 hover:bg-zinc-800/50 transition-colors">
          <span className="font-semibold text-zinc-300 text-sm">🐛 معلومات الربط بين القوالب والتصنيفات</span>
          <span className={`transform transition-transform ${isDebugPanelOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>

        {isDebugPanelOpen && (
          <div className="p-3 bg-zinc-950 border-t border-zinc-800 text-xs">
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