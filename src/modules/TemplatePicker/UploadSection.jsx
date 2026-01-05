import React, { useEffect, useMemo, useRef, useState } from 'react';

const safeId = () => {
  try {
    return `upload-${crypto.randomUUID()}`;
  } catch {
    return `upload-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  }
};

export const UploadSection = React.memo(function UploadSection({ onSelect, currentId, onUploadToCloset }) {
  const inputRef = useRef(null);
  const [lastUpload, setLastUpload] = useState(null);

  const lastPreviewUrl = useMemo(
    () => lastUpload?.previewUrl ?? lastUpload?.thumbnailUrl ?? lastUpload?.imageUrl ?? null,
    [lastUpload]
  );

  useEffect(() => {
    return () => {
      if (lastPreviewUrl && String(lastPreviewUrl).startsWith('blob:')) {
        URL.revokeObjectURL(lastPreviewUrl);
      }
    };
  }, [lastPreviewUrl]);

  return (
    <div className="col-span-2 grid grid-cols-2 gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-3 py-6 text-center hover:border-zinc-600 transition-colors"
      >
        <div className="text-sm font-semibold text-zinc-200">Add to Closet</div>
        <div className="mt-1 text-[11px] text-zinc-500">Upload a template image</div>
      </button>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="relative w-full aspect-[3/4] bg-zinc-900">
          {lastPreviewUrl ? (
            <img
              src={lastPreviewUrl}
              alt={lastUpload?.name || 'Uploaded template'}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500">
              No upload yet
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="text-xs font-semibold text-zinc-200 truncate">Last upload</div>
          <div className="text-[10px] text-zinc-500 truncate">{lastUpload?.name || '—'}</div>
          {currentId && lastUpload?.id === currentId && (
            <div className="mt-1 text-[10px] font-semibold text-purple-300">Active</div>
          )}
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;

          const previewUrl = URL.createObjectURL(file);
          const draftTemplate = {
            id: safeId(),
            name: file.name,
            imageUrl: previewUrl,
            thumbnailUrl: previewUrl,
            meta: { source: 'closet', label: 'upload' },
            file,
            previewUrl,
          };

          const template = onUploadToCloset
            ? await onUploadToCloset(file, file.name).catch(() => draftTemplate)
            : draftTemplate;

          // If persistence succeeded, we might no longer be using the preview URL.
          // Keep lastUpload for UX, but revoke the preview if it's no longer used.
          if (template !== draftTemplate && previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          setLastUpload(template);
          onSelect(template);
          e.currentTarget.value = '';
        }}
      />
    </div>
  );
});
