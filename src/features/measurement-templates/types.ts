import { MeasurementPoint, MeasurementTemplate } from '@/types';

export type ToolMode = 'select' | 'add' | 'delete' | 'arrow' | 'connect';

export interface Arrow {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface HistoryState {
  draft: MeasurementTemplate;
  arrows: Arrow[];
}

export interface MeasurementTemplatesState {
  templates: MeasurementTemplate[];
  activeId: string | null;
  draft: MeasurementTemplate | null;
  isSaving: boolean;
  isLoading: boolean;
  draggingPointId: string | null;
  toolMode: ToolMode;
  pointSize: number;
  pointOpacity: number;
  arrows: Arrow[];
  arrowDraft: { startX: number; startY: number } | null;
  draggingArrowId: string | null;
  draggingArrowPart: 'start' | 'end' | null;
  showLabels: boolean;
  history: HistoryState[];
  historyIndex: number;
  pointColor: string;
}
