import React from 'react';
import type { GarmentTemplate } from '../templates/garmentTemplates';

export function TemplatePicker(props: {
  templates: GarmentTemplate[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { templates, selectedId, onSelect } = props;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {templates.map((t) => {
        const isSelected = t.id === selectedId;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onSelect(t.id)}
            className={
              `rounded-xl border p-2 text-right transition-all ` +
              (isSelected
                ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600')
            }
          >
            <div className="aspect-[3/4] w-full overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-800">
              <img src={t.imageUrl} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
            </div>
            <div className="mt-2 text-xs font-bold text-slate-800 dark:text-white">{t.name}</div>
          </button>
        );
      })}
    </div>
  );
}
