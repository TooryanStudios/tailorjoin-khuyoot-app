import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePrepModal } from '../../components/image/ImagePrepModal';
import { traceEnd, traceSetActive, traceStart, traceStep } from '../../utils/trace';

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
  const [prepOpen, setPrepOpen] = useState(false);
  const [prepFile, setPrepFile] = useState(null);
  const traceIdRef = useRef('');

  const lastPreviewUrl = useMemo(
    () => lastUpload?.previewUrl ?? lastUpload?.thumbnailUrl ?? lastUpload?.imageUrl ?? null,
    [lastUpload]
  );

  useEffect(() => {
    return () => {
      if (lastPreviewUrl && String(lastPreviewUrl).startsWith('blob:')) {
        const revokeDelayMs = import.meta.env && import.meta.env.DEV ? 2500 : 0;
        setTimeout(() => {
          try {
            URL.revokeObjectURL(lastPreviewUrl);
          } catch {
            // ignore
          }
        }, revokeDelayMs);
      }
    };
  }, [lastPreviewUrl]);

  return (
    <div className="col-span-2 grid grid-cols-2 gap-3">
      <ImagePrepModal
        mode="template"
        isOpen={prepOpen}
        file={prepFile}
        onReplaceFile={(nextFile) => {
          setPrepFile(nextFile);
        }}
        onCancel={() => {
          traceSetActive(traceIdRef.current);
          traceStep('ImagePrepModal CANCEL');
          setPrepOpen(false);
          setPrepFile(null);
          // Allow selecting the same file again
          if (inputRef.current) inputRef.current.value = '';
          traceEnd(traceIdRef.current, { cancelled: true });
        }}
        onApply={async (processedFile, meta) => {
          traceSetActive(traceIdRef.current);
          traceStep('ImagePrepModal APPLY', {
            name: processedFile?.name,
            size: processedFile?.size,
            type: processedFile?.type,
            privacyApplied: Boolean(meta?.privacyApplied),
          });
          try {

            const previewUrl = URL.createObjectURL(processedFile);
            // Pass trace through to Designer so it can log comparison update timings.
            const traceId = traceIdRef.current;
            const draftTemplate = {
              id: safeId(),
              name: processedFile.name,
              imageUrl: previewUrl,
              thumbnailUrl: previewUrl,
              meta: { source: 'closet', label: 'upload' },
              file: processedFile,
              previewUrl,
              privacyApplied: Boolean(meta?.privacyApplied),
              __traceId: traceId,
              __fromImagePrepModal: true,
            };

            // Show in drawer + comparison immediately (don’t block on upload).
            setLastUpload(draftTemplate);
            onSelect(draftTemplate);
            traceStep('Draft template selected (immediate)');

            if (inputRef.current) inputRef.current.value = '';
          } finally {
            setPrepOpen(false);
            setPrepFile(null);
            traceStep('ImagePrepModal CLOSED');
            // Intentionally do NOT end trace here. Designer will end it after comparison updates.
          }
        }}
      />

      <button
        type="button"
        onClick={() => {
          traceIdRef.current = traceStart('Template upload (closet)');
          traceStep('Click: Add to closet');
          inputRef.current?.click();
        }}
        className="rounded-xl border border-dashed border-zinc-700 bg-zinc-950 px-3 py-6 text-center hover:border-zinc-600 transition-colors"
      >
        <div className="text-sm font-semibold text-zinc-200">رفع صورة القالب</div>
        <div className="mt-1 text-[11px] text-zinc-500">لن يتم حفظها قبل الضغط على توليد</div>
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
              لا يوجد رفع بعد
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="text-xs font-semibold text-zinc-200 truncate">آخر رفع</div>
          <div className="text-[10px] text-zinc-500 truncate">{lastUpload?.name || '—'}</div>
          {currentId && lastUpload?.id === currentId && (
            <div className="mt-1 text-[10px] font-semibold text-purple-300">نشط</div>
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

          traceSetActive(traceIdRef.current);
          traceStep('File selected', { name: file.name, size: file.size, type: file.type });

          setPrepFile(file);
          setPrepOpen(true);
          traceStep('Open ImagePrepModal');
        }}
      />
    </div>
  );
});
