import * as React from 'react';
import { Upload } from 'lucide-react';

export type FabricThumb = {
  id: string;
  url: string;
  label?: string;
};

export type FabricPickerProps = {
  fabricPreviewUrl?: string;
  onUpload: (file: File) => void;
  onSelectFromUrl?: (url: string) => void;
  thumbs?: FabricThumb[];
  disabled?: boolean;
};

export const FabricPicker = React.memo(function FabricPicker(props: FabricPickerProps) {
  const { fabricPreviewUrl, onUpload, onSelectFromUrl, thumbs, disabled } = props;

  const onPick = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onUpload(file);
      e.currentTarget.value = '';
    },
    [onUpload]
  );

  const canShowPalette = Boolean(onSelectFromUrl && thumbs && thumbs.length > 0);

  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-black tracking-widest text-zinc-600 uppercase">الخامة (Fabric)</div>
      </div>

      {/* Upload / Selected */}
      <label className="block mt-2">
        <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="relative w-full aspect-video">
            {fabricPreviewUrl ? (
              <img
                src={fabricPreviewUrl}
                alt="Selected fabric"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-zinc-500 text-[11px] font-bold">
                <Upload className="h-4 w-4 text-zinc-500" />
                اضغط لرفع صورة الخامة
              </div>
            )}
          </div>
        </div>
        <input type="file" accept="image/*" className="hidden" onChange={onPick} />
      </label>

      {/* Pre-made fabric cards */}
      {canShowPalette && (
        <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
          <div className="grid grid-cols-4 gap-2">
            {thumbs!.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectFromUrl?.(t.url)}
                className="relative overflow-hidden rounded-lg border border-zinc-200 hover:border-purple-300 bg-white transition-colors"
                title={t.label}
              >
                <div className="relative w-full aspect-square">
                  <img
                    src={t.url}
                    alt={t.label || 'Fabric'}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});
