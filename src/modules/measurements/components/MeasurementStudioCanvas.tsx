import React, { useMemo, useRef, useState, useEffect } from 'react';

type Field = { key: string; label: string };

const defaultFields: Field[] = [
  { key: 'shoulder', label: 'الكتف' },
  { key: 'chest', label: 'الصدر' },
  { key: 'waist', label: 'الخصر' },
  { key: 'sleeve', label: 'طول الكم' },
  { key: 'length', label: 'الطول' },
];

export const BoutiqueInput: React.FC<{
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  unit?: 'CM' | 'IN';
  onClick?: () => void;
}> = ({ label, value, onChange, unit = 'CM', onClick }) => (
  <div className="group relative bg-[#252525] border border-white/5 rounded-lg p-3 hover:border-[color:var(--theme-primary)]/30 transition-all" onClick={onClick}>
    <label className="text-[10px] font-semibold text-white/50 mb-1 block">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="w-full bg-transparent text-white placeholder-white/30 outline-none text-lg font-semibold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
      <span className="text-[10px] text-white/40 font-semibold">{unit}</span>
    </div>
  </div>
);

interface MeasurementStudioCanvasProps {
  template?: any;
  measurements?: Record<string, string>;
  onMeasurementsChange?: (measurements: Record<string, string>) => void;
  onGenerate?: (measurements: Record<string, string>) => void;
  coverImageUrl?: string;
  onVideoClick?: () => void;
  lineThickness?: number;
  onLineThicknessChange?: (value: number) => void;
  pointScale?: number;
  onPointScaleChange?: (value: number) => void;
  onSaveTemplate?: () => void;
  onLoadTemplate?: () => void;
}

export const MeasurementStudioCanvas: React.FC<MeasurementStudioCanvasProps> = ({
  template,
  measurements = {},
  onMeasurementsChange,
  onGenerate,
  coverImageUrl,
  onVideoClick,
  lineThickness = 0.7,
  onLineThicknessChange,
  pointScale = 0.8,
  onPointScaleChange,
  onSaveTemplate,
  onLoadTemplate,
}) => {
  const [unit, setUnit] = useState<'CM' | 'IN'>('CM');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [values, setValues] = useState<Record<string, string>>(measurements);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});
  const [isClearing, setIsClearing] = useState(false);

  // Sync measurements from parent (points)
  useEffect(() => {
    setValues(measurements);
  }, [measurements]);

  const handleFocus = (key: string) => {
    inputsRef.current[key]?.focus();
  };

  const handleValueChange = (key: string, value: string) => {
    const newValues = { ...values, [key]: value };
    setValues(newValues);
    onMeasurementsChange?.(newValues);
  };

  // Generate fields from template points or use defaults
  const mappedFields = useMemo(() => {
    if (template?.points && template.points.length > 0) {
      return template.points.map((point: any, idx: number) => ({
        key: point.id,
        label: point.label || point.name || `نقطة ${idx + 1}`
      }));
    }
    return defaultFields;
  }, [template]);

  const isComplete = useMemo(() => {
    return mappedFields.every((f) => {
      const v = (values[f.key] || '').toString().trim();
      return v.length > 0 && !Number.isNaN(Number(v));
    });
  }, [mappedFields, values]);

  const handleClearAll = () => {
    setIsClearing(true);
    const cleared: Record<string, string> = {};
    mappedFields.forEach((f) => { cleared[f.key] = ''; });
    setValues(cleared);
    onMeasurementsChange?.(cleared);
    setTimeout(() => setIsClearing(false), 150);
  };

  return (
    <div className="space-y-3">
      {/* Row: Help Card + Product Thumbnail (separate blocks) */}
      <div className="grid grid-cols-[77%_23%] gap-2">
        <div className="bg-[#252525] border border-white/5 rounded-lg p-4">
          <button
            type="button"
            onClick={onVideoClick}
            className="w-full flex items-center gap-4 text-left hover:opacity-80 transition-all group"
          >
            <div className="w-16 h-16 rounded-xl bg-[color:var(--theme-primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[color:var(--theme-primary)]/20 transition-all">
              <svg className="w-8 h-8 text-[color:var(--theme-primary)]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">How to Take Measurements</p>
              <p className="text-xs text-white/50">Watch video guide</p>
            </div>
            <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {coverImageUrl && (
          <div className="bg-[#252525] border border-white/5 rounded-lg p-2 flex items-center justify-center">
            <div className="w-full aspect-square rounded-md overflow-hidden border border-white/10">
              <img
                src={coverImageUrl}
                alt="Product cover"
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <div className="space-y-0.5">
        <h2 className="text-base font-bold text-white">Enter Your Measurements</h2>
        <p className="text-[10px] text-white/50">الأبعاد الخمسة الرئيسية</p>
      </div>

      {/* Unit & Gender Toggles */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-white/50 mb-1.5 block">Unit</label>
          <div className="flex gap-1 rounded-lg bg-[#252525] border border-white/5 p-0.5">
            {['CM', 'IN'].map((u) => (
              <button
                key={u}
                onClick={() => setUnit(u as 'CM' | 'IN')}
                className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  unit === u
                    ? 'bg-[color:var(--theme-primary)] text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {u}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-white/50 mb-1.5 block">Gender</label>
          <div className="flex gap-1 rounded-lg bg-[#252525] border border-white/5 p-0.5">
            {[
              { key: 'male', label: 'ذكر' },
              { key: 'female', label: 'أنثى' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setGender(key as 'male' | 'female')}
                className={`flex-1 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
                  gender === key
                    ? 'bg-[color:var(--theme-primary)] text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Line Thickness & Point Scale Sliders */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] font-semibold text-white/50 mb-1.5 block">
            Line Thickness: {lineThickness}
          </label>
          <div className="rounded-lg bg-[#252525] border border-white/5 p-2">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={lineThickness}
              onChange={(e) => onLineThicknessChange?.(parseFloat(e.target.value))}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              dir="ltr"
              style={{
                background: `linear-gradient(to right, var(--theme-primary) ${((lineThickness - 0.5) / 1.0) * 100}%, rgba(255,255,255,0.1) ${((lineThickness - 0.5) / 1.0) * 100}%)`
              }}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-semibold text-white/50 mb-1.5 block">
            Point Scale: {pointScale.toFixed(1)}
          </label>
          <div className="rounded-lg bg-[#252525] border border-white/5 p-2">
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={pointScale}
              onChange={(e) => onPointScaleChange?.(parseFloat(e.target.value))}
              className="w-full h-1 rounded-lg appearance-none cursor-pointer"
              dir="ltr"
              style={{
                background: `linear-gradient(to right, var(--theme-primary) ${((pointScale - 0.5) / 1.0) * 100}%, rgba(255,255,255,0.1) ${((pointScale - 0.5) / 1.0) * 100}%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Input Fields Grid - Compact Cards */}
      <div className="grid grid-cols-2 gap-2">
        {mappedFields.map((field) => (
          <BoutiqueInput
            key={field.key}
            label={field.label}
            value={values[field.key] || ''}
            onChange={(v) => handleValueChange(field.key, v)}
            unit={unit}
            onClick={() => handleFocus(field.key)}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
        <button onClick={onLoadTemplate} className="py-1.5 px-3 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] text-white text-[10px] font-semibold transition-all">
          Load
        </button>
        <button onClick={onSaveTemplate} className="py-1.5 px-3 rounded-lg bg-[#252525] hover:bg-[#2f2f2f] text-white text-[10px] font-semibold transition-all">
          Save
        </button>
        <button onClick={handleClearAll} className={`py-1.5 px-3 rounded-lg bg-[#252525] text-white text-[10px] font-semibold transition-all ${isClearing ? 'opacity-70' : 'hover:bg-[#2f2f2f]' }`}>
          Clear
        </button>
      </div>

      {/* Generate Button */}
      <button
        disabled={!isComplete}
        onClick={() => isComplete && onGenerate?.(values)}
        className={`w-full border rounded-lg p-4 transition-all flex items-center justify-center gap-3 ${
          isComplete
            ? 'bg-[#252525] border-white/5 hover:bg-[#2f2f2f] cursor-pointer'
            : 'bg-[#1a1a1a] border-white/10 text-white/40 cursor-not-allowed'
        }`}
        aria-disabled={!isComplete}
        title={isComplete ? 'Start stitching' : 'Fill all measurements to enable'}
      >
        <span className={`text-sm font-bold ${isComplete ? 'text-[color:var(--theme-primary)]' : 'text-white/40'}`}>Start Stitching</span>
        <span className={`text-lg ${isComplete ? '' : 'opacity-40'}`}>✨</span>
      </button>
    </div>
  );
};

export default MeasurementStudioCanvas;
