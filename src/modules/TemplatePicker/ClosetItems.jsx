import React from 'react';
import { TemplateCard } from './TemplateCard.jsx';
import { UploadSection } from './UploadSection.jsx';

export const ClosetItems = React.memo(function ClosetItems({
  items,
  onSelect,
  currentId,
  onUploadToCloset,
  onHover,
  extra = null,
  loadingTemplateId = null,
}) {
  return (
    <>
      <UploadSection onSelect={onSelect} currentId={currentId} onUploadToCloset={onUploadToCloset} />

      {extra ? (
        <div className="col-span-2 mt-2">{extra}</div>
      ) : null}

      {items?.length ? (
        items.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isActive={Boolean(currentId && template.id === currentId)}
            onSelect={onSelect}
            onHover={onHover}
            isLoading={loadingTemplateId === template.id}
          />
        ))
      ) : (
        <div className="col-span-2 rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-400">
          No saved templates yet.
        </div>
      )}
    </>
  );
});
