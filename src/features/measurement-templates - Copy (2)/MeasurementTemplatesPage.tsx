import React from 'react';
import { Save, Loader2, LayoutGrid } from 'lucide-react';
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

  // ... (Keep existing handler functions logic exactly as is) ...
  // [Re-paste the handler functions from your original file here if not using the hook directly]
  // Since the logic is inside the hook, we just use the returns.

  // Re-implementing the handlers that were defined in the Page component in your original code:
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!draft) return;
    const canvasElement = event.currentTarget as HTMLDivElement;
    const rect = canvasElement.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

    if (toolMode === 'add') {
      const nextOrder = (draft.points.length ? Math.max(...draft.points.map((p) => p.order || 0)) : 0) + 1;
      const newPoint = {
        id: `point-${Date.now()}`,
        label: `نقطة ${nextOrder}`,
        x, y, direction: 0, order: nextOrder,
      };
      setDraft({ ...draft, points: [...draft.points, newPoint] });
      saveToHistory();
    } else if (toolMode === 'arrow') {
      if (!arrowDraft) {
        setArrowDraft({ startX: x, startY: y });
      } else {
        const newArrow = {
          id: `arrow-${Date.now()}`,
          startX: arrowDraft.startX, startY: arrowDraft.startY,
          endX: x, endY: y,
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

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] gap-4" dir="rtl">
      {/* Header Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 space-y-4">
        {/* العنوان والأزرار */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <LayoutGrid size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">قوالب القياسات</h1>
              <p className="text-xs text-slate-500">القوالب مرتبطة بتصنيفات الأزياء - حدد النقاط على كل قالب</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleSave}
              disabled={!draft || isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
            >
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              <span className="hidden sm:inline mr-1">حفظ التغييرات</span>
            </Button>
          </div>
        </div>

        {/* القائمة المنسدلة لاختيار التصنيف */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap flex items-center gap-2">
            <span className="text-lg">👔</span>
            اختر تصنيف الملابس:
          </label>
          <select
            value={activeId || ''}
            onChange={(e) => handleSelectTemplate(e.target.value)}
            disabled={isLoading || templates.length === 0}
            className="flex-1 min-w-[250px] px-4 py-2.5 rounded-lg border-2 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isLoading && <option>⏳ جاري التحميل...</option>}
            {!isLoading && templates.length === 0 && <option>⚠️ لا توجد تصنيفات أزياء - أضف تصنيفات بنوع "أزياء وملابس" من إدارة المنتجات</option>}
            {!isLoading && (() => {
              // تجميع القوالب حسب parentId
              type TemplateWithParent = typeof templates[0] & { parentId?: string | null; parentName?: string };
              type GroupedTemplates = Record<string, { parentName: string; items: TemplateWithParent[] }>;
              
              const groupedTemplates = templates.reduce((acc, template) => {
                const templateWithParent = template as TemplateWithParent;
                const parentId = templateWithParent.parentId || 'unknown';
                const parentName = templateWithParent.parentName || 'بدون تصنيف';
                if (!acc[parentId]) {
                  acc[parentId] = { parentName, items: [] };
                }
                acc[parentId].items.push(templateWithParent);
                return acc;
              }, {} as GroupedTemplates);

              // عرض القوالب بشكل شجري باستخدام optgroup
              return Object.entries(groupedTemplates).map(([parentId, group]: [string, { parentName: string; items: TemplateWithParent[] }]) => (
                <optgroup key={parentId} label={`👔 ${group.parentName}`}>
                  {group.items.map((template) => (
                    <option key={template.id} value={template.id}>
                      {'  '}└─ {template.name} • {template.points?.length || 0} نقطة
                    </option>
                  ))}
                </optgroup>
              ));
            })()}
          </select>
          {draft && (
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
              <span className="text-sm text-indigo-700 dark:text-indigo-300 font-bold">
                ✨ {draft.points?.length || 0}
              </span>
              <span className="text-xs text-indigo-600 dark:text-indigo-400">
                نقاط محددة
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid Layout - Without Sidebar */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-0 overflow-hidden">
        
        {/* Center Canvas - Scrollable */}
        <div className="flex flex-col min-h-0 overflow-hidden bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 relative">
          <div className="absolute inset-0 overflow-auto">
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

        {/* Right Panel - Scrollable */}
        <div className="hidden lg:flex flex-col min-h-0 overflow-hidden bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
          <TemplatesDetailsPanel
            draft={draft}
            orderedPoints={orderedPoints}
            onUpdateDraft={handleUpdateDraft}
            onUpdatePoint={handleUpdatePoint}
          />
        </div>
      </div>
    </div>
  );
};