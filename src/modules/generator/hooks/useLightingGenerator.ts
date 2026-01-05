import * as React from 'react';

export type LightingPreset = 'studio' | 'golden_hour' | 'cinematic' | 'day' | 'night';

export type UseLightingGeneratorArgs = {
  value: LightingPreset;
  setValue: (next: LightingPreset) => void;
  canTrigger: boolean;
  triggerGeneration: (preset: LightingPreset) => void | Promise<void>;
};

export function useLightingGenerator(args: UseLightingGeneratorArgs) {
  const { value, setValue, canTrigger, triggerGeneration } = args;

  const lastUserTriggeredRef = React.useRef<LightingPreset | null>(null);

  const onSelectPreset = React.useCallback(
    (next: LightingPreset) => {
      setValue(next);
      lastUserTriggeredRef.current = next;
      if (!canTrigger) return;
      void triggerGeneration(next);
    },
    [canTrigger, setValue, triggerGeneration]
  );

  return {
    value,
    onSelectPreset,
  };
}
