import * as React from 'react';

export type LightingPreset = 'studio' | 'golden_hour' | 'cinematic' | 'day' | 'night';

export type LightingPresetsProps = {
  value: LightingPreset;
  onChange: (next: LightingPreset) => void;
};

const options: Array<{ id: LightingPreset; label: string; descriptor: string }> = [
  { id: 'studio', label: 'Studio', descriptor: 'studio lighting, clean and even' },
  { id: 'golden_hour', label: 'Golden Hour', descriptor: 'golden hour lighting, warm tones' },
  { id: 'cinematic', label: 'Cinematic', descriptor: 'dramatic lighting, 8k resolution, high contrast' },
  { id: 'day', label: 'Day', descriptor: 'bright natural sunlight, clear sky' },
  { id: 'night', label: 'Night', descriptor: 'atmospheric moonlight, street lamps, soft shadows' },
];

export function getLightingDescriptor(preset: LightingPreset) {
  return options.find((o) => o.id === preset)?.descriptor ?? '';
}

export const LightingPresets = React.memo(function LightingPresets(props: LightingPresetsProps) {
  const { value, onChange } = props;

  return (
    <div className="flex items-center justify-center gap-1 h-12 px-2 rounded-xl border border-zinc-800 bg-zinc-900/60">
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => onChange(o.id)}
            className={
              'h-8 px-3 rounded-full border text-xs font-semibold transition-colors ' +
              (active
                ? 'bg-zinc-900 border-purple-500/60 text-white'
                : 'bg-zinc-950/40 border-zinc-800 text-zinc-300 hover:border-purple-500/40')
            }
            title={o.descriptor}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
});
