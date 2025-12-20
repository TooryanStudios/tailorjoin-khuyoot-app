import React from 'react';

export function FabricUploader(props: {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string | null;
}) {
  const { value, onChange, error } = props;
  const inputId = React.useId();

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-bold text-slate-700 dark:text-slate-300 block">قماش (لقطة قريبة فقط)</label>
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="block w-full text-sm text-slate-700 dark:text-slate-200 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-xs file:font-bold file:text-slate-700 hover:file:bg-slate-200 dark:file:bg-slate-800 dark:file:text-slate-100 dark:hover:file:bg-slate-700"
      />
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        ممنوع الصور الشخصية. ارفع صورة قماش/نقشة فقط، ويفضل قصّها لمربع.
      </p>
      {value ? (
        <p className="text-[11px] text-slate-600 dark:text-slate-300">{value.name}</p>
      ) : null}
      {error ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
