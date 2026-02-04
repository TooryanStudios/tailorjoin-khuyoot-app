import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, FolderOpen, Settings } from 'lucide-react';

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
  <div className="group relative bg-[#252525] border border-white/5 rounded-lg p-3 hover:bg-[#2a2a2a] hover:border-[color:var(--theme-primary)]/40 hover:scale-[1.02] transition-all cursor-pointer" onClick={onClick}>
    <label className="text-[10px] font-semibold text-white/50 mb-1 block group-hover:text-[color:var(--theme-primary)]/70 transition-colors uppercase tracking-wider">{label}</label>
    <div className="flex items-center gap-2">
      <input
        type="number"
        className="w-full bg-transparent text-white placeholder-white/30 outline-none text-lg font-semibold"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0"
      />
      <span className="text-[10px] text-white/40 font-semibold group-hover:text-white/60 transition-colors">{unit}</span>
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
  onSaveClick?: () => void;
  onLoadClick?: () => void;
  canSave?: boolean;
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
  children,
  onSaveClick,
  onLoadClick,
  canSave = false
}) => {
  const { t, i18n } = useTranslation(['measurements', 'common']);
  const isAr = i18n.language === 'ar';
  const navigate = useNavigate();
  const [unit, setUnit] = useState<'CM' | 'IN'>('CM');
  const [values, setValues] = useState<Record<string, string>>(measurements);
  const inputsRef = useRef<Record<string, HTMLInputElement | null>>({});

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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top Navigation Bar */}
      <div className="flex-shrink-0 bg-[#1a1a1a] px-4 pt-4 pb-3 border-b border-white/5">
        <div className="flex items-center justify-between gap-3 mb-4">
          {/* Left: Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center hover:bg-[#323232] hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
            title={isAr ? 'العودة' : 'Go Back'}
          >
            <ArrowLeft size={20} className={`text-white/70 ${isAr ? 'rotate-180' : ''}`} />
          </button>

          {/* Center: Title */}
          <div className="flex-1 text-center">
            <h2 className="text-lg font-bold text-white">
              {t('measurements:enterYourMeasurements')}
            </h2>
            <p className="text-xs text-white/50">عباية</p>
          </div>
        </div>

        {/* Action Row: Save, Load, Unit Toggle */}
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={onSaveClick}
            disabled={!canSave}
            className="flex-shrink-0 w-11 h-9 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center hover:bg-[#323232] hover:border-white/20 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            title={t('measurements:saveMeasurements')}
          >
            <Save size={16} className="text-white/70" />
          </button>

          {/* Load Button */}
          <button
            onClick={onLoadClick}
            className="flex-shrink-0 w-11 h-9 rounded-xl bg-[#252525] border border-white/10 flex items-center justify-center hover:bg-[#323232] hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200"
            title={t('measurements:loadSavedMeasurements')}
          >
            <FolderOpen size={16} className="text-white/70" />
          </button>

          {/* Unit Toggle */}
          <div className="flex-1 flex gap-1 rounded-xl bg-[#252525] border border-white/5 p-1">
            <button
              onClick={() => setUnit('IN')}
              className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
                unit === 'IN'
                  ? 'bg-[#1a1a1a] text-white/50'
                  : 'bg-transparent text-white/50 hover:text-white'
              }`}
            >
              IN
            </button>
            <button
              onClick={() => setUnit('CM')}
              className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
                unit === 'CM'
                  ? 'bg-[#0a0a0a] text-white'
                  : 'bg-transparent text-white/50 hover:text-white'
              }`}
            >
              CM
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-4 space-y-4">
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
                      {t('measurements:howToTakeMeasurements')}
                    </p>
                    <p className="text-xs text-white/50">
                      {t('common:watchVideo')}
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
                      className="w-8 h-8 text-[color:var(--theme-primary)] relative z-10 translate-x-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ animation: 'play-pulse 2s infinite ease-in-out' }}
                    >
                      <path d="M7 5l12 7-12 7V5z" />
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
                      className="w-8 h-8 text-[color:var(--theme-primary)] relative z-10 translate-x-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 24 24"
                      style={{ animation: 'play-pulse 2s infinite ease-in-out' }}
                    >
                      <path d="M7 5l12 7-12 7V5z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {t('measurements:howToTakeMeasurements')}
                    </p>
                    <p className="text-xs text-white/50">
                      {t('common:watchVideo')}
                    </p>
                  </div>
                </>
              )}
            </button>
          </div>

          {coverImageUrl && (
            <div className="bg-[#252525] border border-white/5 rounded-lg overflow-hidden flex">
              <img
                src={coverImageUrl}
                alt="Product cover"
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />
            </div>
          )}
        </div>

        {children}

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

        {/* Generate Button */}
        <button
          disabled={!isComplete}
          onClick={() => isComplete && onGenerate?.(values)}
          className={`group relative overflow-hidden w-full border rounded-lg p-4 transition-all flex items-center justify-center gap-3 ${
            isComplete
              ? 'bg-[color:var(--theme-primary)] hover:bg-[color:var(--theme-primary)]/90 border-[color:var(--theme-primary)] cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
              : 'bg-[#1a1a1a] border-white/10 text-white/40 cursor-not-allowed'
          }`}
          aria-disabled={!isComplete}
          title={isComplete ? t('measurements:startStitching') : t('measurements:fillAllMeasurements')}
        >
          {isComplete && (
            <div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full opacity-0 group-hover:opacity-100 transition-opacity" 
              style={{ animation: 'shine-sweep 3s infinite ease-in-out' }} 
            />
          )}
          <span className={`text-sm font-bold relative z-10 ${isComplete ? 'text-white' : 'text-white/40'}`}>{t('measurements:startStitching')}</span>
          <span className={`text-lg relative z-10 ${isComplete ? '' : 'opacity-40'}`}>✨</span>
        </button>
      </div>
    </div>
  );
};

export default MeasurementStudioCanvas;
