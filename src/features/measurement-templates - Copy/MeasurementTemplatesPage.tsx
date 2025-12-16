import React from 'react';
import { Plus, Save, Loader2 } from 'lucide-react';
import { Button } from '../../../components/Button';
import { MeasurementPoint } from '../../../types';
import { useMeasurementTemplates } from './useMeasurementTemplates';
import { TemplatesSidebar } from './components/TemplatesSidebar';
import { TemplatesCanvas } from './components/TemplatesCanvas';
import { TemplatesDetailsPanel } from './components/TemplatesDetailsPanel';
import { Arrow } from './types';

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
    history,
    historyIndex,
    pointColor,
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

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (!draft) return;

    const canvasElement = event.currentTarget as HTMLDivElement;
    const rect = canvasElement.getBoundingClientRect();
    const x = Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1);
    const y = Math.min(Math.max((event.clientY - rect.top) / rect.height, 0), 1);

    if (toolMode === 'add') {
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
      saveToHistory();
    } else if (toolMode === 'arrow') {
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
        saveToHistory();
      }
    }
  };

  const handlePointClick = (pointId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (toolMode === 'delete') {
      handleDeletePoint(pointId);
    }
  };

  const handlePointMouseDown = (pointId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (toolMode === 'select') {
      setDraggingPointId(pointId);
    }
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
    if (window.confirm('حذف السهم؟')) {
      handleDeleteArrow(arrowId);
    }
  };

  const handleUpdateDraft = (updates: Partial<typeof draft>) => {
    if (!draft) return;
    setDraft({ ...draft, ...updates });
  };

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const canDeleteCurrentTemplate = Boolean(activeId && !activeId.startsWith('temp-'));

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col items-center gap-4 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 rounded-2xl p-6 shadow-lg overflow-visible">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">مكتبة القوالب</p>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            إدارة قوالب القياسات
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-1.5 overflow-visible">
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white flex items-center gap-1 text-xs px-2 py-1.5 shadow-md hover:shadow-lg transition-all flex-shrink-0"
          >
            <Plus size={14} /> جديد
          </Button>
          <Button
            onClick={handleSave}
            disabled={!draft || isSaving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center gap-1 disabled:opacity-60 text-xs px-2 py-1.5 shadow-md hover:shadow-lg transition-all flex-shrink-0"
          >
            {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{' '}
            حفظ
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_320px]">
        {/* Left column */}
        <TemplatesSidebar
          templates={templates}
          activeId={activeId}
          isLoading={isLoading}
          onSelectTemplate={handleSelectTemplate}
          onDeleteTemplate={handleDeleteTemplate}
        />

        {/* Center column */}
        <div className="space-y-4">
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
            onUndo={handleUndo}
            onRedo={handleRedo}
            canDeleteTemplate={canDeleteCurrentTemplate}
            onDeleteTemplate={() => {
              if (activeId) {
                handleDeleteTemplate(activeId);
              }
            }}
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

        {/* Right column */}
        <div className="space-y-6">
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
