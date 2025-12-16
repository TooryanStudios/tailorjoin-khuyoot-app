import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCw, Move, Sparkles } from 'lucide-react';
import { FabricPatternSettings } from '../types';
import { calculateAutoScale } from '../services/recommendationService';

interface FabricScaleControlProps {
  imageUrl: string;
  imageWidth?: number;
  imageHeight?: number;
  settings: FabricPatternSettings;
  onSettingsChange: (settings: FabricPatternSettings) => void;
  onPreview?: (settings: FabricPatternSettings) => void;
}

export const FabricScaleControl: React.FC<FabricScaleControlProps> = ({
  imageUrl,
  imageWidth = 800,
  imageHeight = 600,
  settings,
  onSettingsChange,
  onPreview
}) => {
  const [localSettings, setLocalSettings] = useState<FabricPatternSettings>(settings);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleScaleChange = (value: number) => {
    const newSettings = { ...localSettings, patternScale: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    onPreview?.(newSettings);
  };

  const handleOffsetChange = (axis: 'x' | 'y', value: number) => {
    const newSettings = {
      ...localSettings,
      ...(axis === 'x' ? { patternOffsetX: value } : { patternOffsetY: value })
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    onPreview?.(newSettings);
  };

  const handleRotationChange = (value: number) => {
    const newSettings = { ...localSettings, patternRotation: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    onPreview?.(newSettings);
  };

  const handleRepeatModeChange = (mode: 'repeat' | 'mirror' | 'no-repeat') => {
    const newSettings = { ...localSettings, patternRepeatMode: mode };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    onPreview?.(newSettings);
  };

  const handleAutoScale = () => {
    const suggestedScale = calculateAutoScale(imageWidth, imageHeight);
    const newSettings = { ...localSettings, patternScale: suggestedScale };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    onPreview?.(newSettings);
  };

  const resetSettings = () => {
    const defaultSettings: FabricPatternSettings = {
      patternScale: 1.0,
      patternOffsetX: 0,
      patternOffsetY: 0,
      patternRotation: 0,
      patternRepeatMode: 'repeat'
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
    onPreview?.(defaultSettings);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Maximize2 size={18} />
          ضبط مقياس النمط
        </h3>
        <button
          onClick={handleAutoScale}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-xs font-bold rounded-lg hover:from-purple-600 hover:to-indigo-600 transition-all"
        >
          <Sparkles size={14} />
          تلقائي
        </button>
      </div>

      {/* Main Scale Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <label className="text-slate-600 dark:text-slate-400">المقياس</label>
          <span className="font-mono font-bold text-slate-900 dark:text-white">
            {(localSettings.patternScale * 100).toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Minimize2 size={16} className="text-slate-400" />
          <input
            type="range"
            min="25"
            max="200"
            step="5"
            value={localSettings.patternScale * 100}
            onChange={(e) => handleScaleChange(parseInt(e.target.value) / 100)}
            className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-indigo-600 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
          />
          <Maximize2 size={16} className="text-slate-400" />
        </div>
        <div className="flex gap-2 mt-2">
          {[25, 50, 75, 100, 150, 200].map((preset) => (
            <button
              key={preset}
              onClick={() => handleScaleChange(preset / 100)}
              className={`px-2 py-1 text-xs rounded-md transition-all ${
                Math.abs(localSettings.patternScale * 100 - preset) < 1
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {preset}%
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Controls Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
      >
        {showAdvanced ? '▲ إخفاء الإعدادات المتقدمة' : '▼ إظهار الإعدادات المتقدمة'}
      </button>

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          
          {/* Offset X */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Move size={14} />
                الإزاحة الأفقية
              </label>
              <span className="font-mono text-xs text-slate-900 dark:text-white">
                {localSettings.patternOffsetX || 0}px
              </span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="10"
              value={localSettings.patternOffsetX || 0}
              onChange={(e) => handleOffsetChange('x', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          {/* Offset Y */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <Move size={14} />
                الإزاحة العمودية
              </label>
              <span className="font-mono text-xs text-slate-900 dark:text-white">
                {localSettings.patternOffsetY || 0}px
              </span>
            </div>
            <input
              type="range"
              min="-200"
              max="200"
              step="10"
              value={localSettings.patternOffsetY || 0}
              onChange={(e) => handleOffsetChange('y', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-blue-600 [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          {/* Rotation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <label className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                <RotateCw size={14} />
                الدوران
              </label>
              <span className="font-mono text-xs text-slate-900 dark:text-white">
                {localSettings.patternRotation || 0}°
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={localSettings.patternRotation || 0}
              onChange={(e) => handleRotationChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-600 [&::-webkit-slider-thumb]:rounded-full"
            />
          </div>

          {/* Repeat Mode */}
          <div className="space-y-2">
            <label className="text-sm text-slate-600 dark:text-slate-400">نمط التكرار</label>
            <div className="flex gap-2">
              {[
                { value: 'repeat', label: 'تكرار' },
                { value: 'mirror', label: 'انعكاس' },
                { value: 'no-repeat', label: 'بدون تكرار' }
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => handleRepeatModeChange(mode.value as any)}
                  className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                    localSettings.patternRepeatMode === mode.value
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetSettings}
            className="w-full py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
          >
            إعادة تعيين الإعدادات
          </button>
        </div>
      )}
    </div>
  );
};
