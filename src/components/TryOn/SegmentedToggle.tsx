import React from 'react';

type OptionConfig = {
  label: string;
  badge?: string;
  description?: string;
};

type SegmentedToggleProps = {
  options: string[] | OptionConfig[];
  active: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  showDescription?: boolean;
};

function isOptionConfig(opt: unknown): opt is OptionConfig {
  return typeof opt === 'object' && opt !== null && 'label' in opt;
}

const SegmentedToggle: React.FC<SegmentedToggleProps> = ({
  options,
  active,
  onChange,
  disabled = false,
  showDescription = false,
}) => {
  const optionConfigs = options.map((opt) => (isOptionConfig(opt) ? opt : { label: opt }));

  return (
    <div>
      <div className={`flex p-1 bg-zinc-100 border border-zinc-200 rounded-lg ${disabled ? 'opacity-60' : ''}`}>
        {optionConfigs.map((config) => {
          const isActive = active === config.label;
          return (
            <button
              key={config.label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(config.label)}
              className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1 ${
                isActive
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 hover:bg-white/50'
              } ${disabled ? 'cursor-not-allowed hover:text-zinc-500' : ''}`}
            >
              {config.badge && <span className="text-sm">{config.badge}</span>}
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>
      {showDescription && (
        <div className="mt-2 text-xs text-zinc-500 italic">
          {optionConfigs.find((c) => c.label === active)?.description || ''}
        </div>
      )}
    </div>
  );
};

export default SegmentedToggle;
