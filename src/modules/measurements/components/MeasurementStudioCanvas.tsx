import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
  children?: React.ReactNode;
}

export const MeasurementStudioCanvas: React.FC<MeasurementStudioCanvasProps> = ({
  template,
  measurements = {},
  onMeasurementsChange,
  onGenerate,
  coverImageUrl,
  onVideoClick,
  lineThickness = 5,
  onLineThicknessChange,
  pointScale = 1,
  onPointScaleChange,
  children
}) => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [unit, setUnit] = useState<'CM' | 'IN'>('CM');
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
      <style>{`
        @keyframes shine-sweep {
          0% { transform: translateX(-150%) skewX(-45deg); }
          20% { transform: translateX(150%) skewX(-45deg); }
          100% { transform: translateX(150%) skewX(-45deg); }
        }
        @keyframes play-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
      {/* Row: Help Card + Product Thumbnail (separate blocks) - Desktop Only */}
      <div className="hidden sm:grid grid-cols-[77%_23%] gap-2">
        <div className="bg-[#252525] border border-white/5 rounded-lg p-4">
          <button
            type="button"
            onClick={onVideoClick}
            className="w-full flex items-center gap-4 text-left hover:opacity-80 transition-all group"
          >
            {isAr ? (
              <>
                <div className="flex-1 text-right">
                  <p className="text-sm font-semibold text-white">
                    {t('measurements.howToTakeMeasurements')}
                  </p>
                  <p className="text-xs text-white/50">
                    {t('common.watchVideo')}
                  </p>
                </div>
                <div className="relative w-16 h-16 rounded-full bg-[color:var(--theme-primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[color:var(--theme-primary)]/20 transition-all border-2 border-[color:var(--theme-primary)]/20 overflow-hidden">
                  {/* Shine Effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full" 
                    style={{ animation: 'shine-sweep 3s infinite ease-in-out' }} 
                  />
                  
                  {/* Play Arrow */}
                  <svg 
                    className="w-8 h-8 text-[color:var(--theme-primary)] relative z-10" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ animation: 'play-pulse 2s infinite ease-in-out' }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </>
            ) : (
              <>
                <div className="relative w-16 h-16 rounded-full bg-[color:var(--theme-primary)]/10 flex items-center justify-center flex-shrink-0 group-hover:bg-[color:var(--theme-primary)]/20 transition-all border-2 border-[color:var(--theme-primary)]/20 overflow-hidden">
                  {/* Shine Effect */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full" 
                    style={{ animation: 'shine-sweep 3s infinite ease-in-out' }} 
                  />
                  
                  {/* Play Arrow */}
                  <svg 
                    className="w-8 h-8 text-[color:var(--theme-primary)] relative z-10" 
                    fill="currentColor" 
                    viewBox="0 0 24 24"
                    style={{ animation: 'play-pulse 2s infinite ease-in-out' }}
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-white">
                    {t('measurements.howToTakeMeasurements')}
                  </p>
                  <p className="text-xs text-white/50">
                    {t('common.watchVideo')}
                  </p>
                </div>
              </>
            )}
            <svg className="w-5 h-5 text-white/30 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isAr ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"} />
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

      {children}

      {/* Header */}
      <div className="space-y-0.5">
        <h2 className="text-base font-bold text-white">
          {t('measurements.enterYourMeasurements')}
        </h2>
      </div>

      {/* Unit Toggle */}
      <div>
        <label className="text-[10px] font-semibold text-white/50 mb-1.5 block">
          {t('common.unit')}
        </label>
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
      <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
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

      {/* Generate Button */}
      <button
        disabled={!isComplete}
        onClick={() => isComplete && onGenerate?.(values)}
        className={`w-full border rounded-lg p-4 transition-all flex items-center justify-center gap-3 ${
          isComplete
            ? 'bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-primary)]/90 border-[color:var(--theme-primary)] cursor-pointer'
            : 'bg-[#1a1a1a] border-white/10 text-white/40 cursor-not-allowed'
        }`}
        aria-disabled={!isComplete}
        title={isComplete ? t('measurements.startStitching') : t('measurements.fillAllMeasurements')}
      >
        <span className={`text-sm font-bold ${isComplete ? 'text-white' : 'text-white/40'}`}>{t('measurements.startStitching')}</span>
        <span className={`text-lg ${isComplete ? '' : 'opacity-40'}`}>✨</span>
      </button>
    </div>
  );
};

export default MeasurementStudioCanvas;
