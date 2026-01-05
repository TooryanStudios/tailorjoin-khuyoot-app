import * as React from 'react';
import { Settings, X } from 'lucide-react';

export type AdvancedSettingsProps = {
  selectedModel: 'NanoBana' | 'Pro';
  onChangeSelectedModel: (next: 'NanoBana' | 'Pro') => void;
  upscaleEngine: 'standard' | 'creative';
  onChangeUpscaleEngine: (next: 'standard' | 'creative') => void;
  outputFit: 'contain' | 'cover';
  onChangeOutputFit: (next: 'contain' | 'cover') => void;
  disabled?: boolean;
};

export const AdvancedSettings = React.memo(function AdvancedSettings(props: AdvancedSettingsProps) {
  const {
    selectedModel,
    onChangeSelectedModel,
    upscaleEngine,
    onChangeUpscaleEngine,
    outputFit,
    onChangeOutputFit,
    disabled,
  } = props;

  const [open, setOpen] = React.useState(false);

  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
      >
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-zinc-800 bg-zinc-900/50">
          <Settings className="h-3.5 w-3.5" />
        </span>
        إعدادات متقدمة
      </button>

      {open && (
        <div className="fixed inset-0 z-[999]">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="absolute left-0 right-0 bottom-0 rounded-t-[2rem] bg-zinc-950 border-t border-zinc-800 shadow-2xl p-6 pb-10">
            <div className="flex items-center justify-between mb-6">
              <div className="text-xs font-black uppercase tracking-widest text-white">إعدادات متقدمة</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="h-9 w-9 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Output Quality (Model) */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
                <div className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-3">جودة المخرجات</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['NanoBana', 'Pro'] as const).map((m) => {
                    const active = selectedModel === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => onChangeSelectedModel(m)}
                        className={
                          'h-11 rounded-lg border text-[11px] font-bold transition-all ' +
                          (active
                            ? 'bg-zinc-800 border-zinc-600 text-white'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700')
                        }
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

            {/* Standard Sharp (Upscale Engine) */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-3">محرك التحسين</div>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'standard', label: 'Standard' }, { id: 'creative', label: 'Creative' }].map((o) => {
                  const active = upscaleEngine === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onChangeUpscaleEngine(o.id as 'standard' | 'creative')}
                      className={
                        'h-11 rounded-lg border text-[11px] font-bold transition-all ' +
                        (active
                          ? 'bg-zinc-800 border-zinc-600 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700')
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Output Fit */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4">
              <div className="text-[10px] font-black tracking-widest text-zinc-500 uppercase mb-3">تنسيق الصورة</div>
              <div className="grid grid-cols-2 gap-2">
                {[{ id: 'contain', label: 'Fit (No Crop)' }, { id: 'cover', label: 'Fill (Crop)' }].map((o) => {
                  const active = outputFit === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => onChangeOutputFit(o.id as 'contain' | 'cover')}
                      className={
                        'h-11 rounded-lg border text-[11px] font-bold transition-all ' +
                        (active
                          ? 'bg-zinc-800 border-zinc-600 text-white'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700')
                      }
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 h-[env(safe-area-inset-bottom)]" />
          </div>
        </div>
      </div>
      )}
    </div>
  );
});
