import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, Save, ArrowLeft, Ruler } from 'lucide-react';
import { Measurements } from './types';
import { MeasurementProfile } from '../../types';
import { MEASUREMENT_FIELDS } from './constants';

interface Step2MeasurementsProps {
  measurements: Measurements;
  savedMeasurements: MeasurementProfile[];
  measurementRefs: React.MutableRefObject<Record<keyof Measurements, HTMLInputElement | null>>;
  onMeasurementChange: (field: keyof Measurements, value: string) => void;
  onUseSavedMeasurements: (profile: MeasurementProfile) => void;
  setActiveMeasurement: (key: keyof Measurements | null) => void;
  setShowMeasurementsModal: (show: boolean) => void;
  onNextStep: () => void;
  onSaveDraft: () => void;
  currentStepColor: string;
}

export const Step2Measurements: React.FC<Step2MeasurementsProps> = ({
  measurements,
  savedMeasurements,
  measurementRefs,
  onMeasurementChange,
  onUseSavedMeasurements,
  setActiveMeasurement,
  setShowMeasurementsModal,
  onNextStep,
  onSaveDraft,
  currentStepColor
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      {/* Video Tutorial */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl p-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center flex-shrink-0">
            <PlayCircle size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white mb-0.5">💡 نصيحة: شاهد دليل القياس</p>
            <p className="text-xs text-white/80">للحصول على مقاسات دقيقة</p>
          </div>
          <button className="px-3 py-1.5 bg-white/20 hover:bg-white/30 backdrop-blur text-white text-xs font-bold rounded-lg transition-all">
            شاهد
          </button>
        </div>
      </div>

      {/* Saved Measurements */}
      {savedMeasurements.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Save size={18} className="text-emerald-600" />
              <h3 className="font-bold text-slate-900 dark:text-white">مقاساتي المحفوظة</h3>
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-full">
                {savedMeasurements.length}
              </span>
            </div>
            <button 
              onClick={() => setShowMeasurementsModal(true)}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              عرض الكل
            </button>
          </div>
          <div className="grid gap-2">
            {savedMeasurements.slice(0, 2).map((profile) => (
              <button
                key={profile.id}
                onClick={() => onUseSavedMeasurements(profile)}
                className="flex items-center justify-between p-3 border-2 border-slate-200 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl transition-all group"
              >
                <div className="text-right">
                  <p className="font-medium text-slate-900 dark:text-white">{profile.name}</p>
                  <p className="text-xs text-slate-500">{profile.type}</p>
                </div>
                <ArrowLeft size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Measurements Input */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg border border-slate-200/50 dark:border-slate-700/50">
        <h3 className="font-bold text-base sm:text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Ruler size={20} className="text-blue-600" />
          أدخل المقاسات (سم)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {MEASUREMENT_FIELDS.map(({ key, label, icon }) => (
            <div key={key}>
              <label className="block text-xs sm:text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <span className="text-base sm:text-sm">{icon}</span>
                <span className="font-bold">{label}</span>
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="0.0"
                value={measurements[key as keyof Measurements]}
                onChange={(e) => onMeasurementChange(key as keyof Measurements, e.target.value)}
                onFocus={() => setActiveMeasurement(key as keyof Measurements)}
                onBlur={() => setActiveMeasurement(null)}
                className="w-full px-4 py-4 sm:py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-700/50 text-slate-900 dark:text-white text-center text-lg sm:text-base font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all touch-manipulation"
                ref={(el) => { measurementRefs.current[key as keyof Measurements] = el; }}
              />
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 text-center flex items-center justify-center gap-1">
          <span>ℹ️</span>
          المقاسات مطلوبة للحصول على أفضل نتيجة
        </p>
      </div>

      {/* Action Buttons */}
      <div className="sticky bottom-4 mt-6 flex flex-col-reverse sm:flex-row-reverse items-center gap-3 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl">
        <button
          onClick={onNextStep}
          className={`w-full sm:flex-[2] px-6 py-4 sm:py-3 rounded-xl font-bold shadow-lg bg-gradient-to-r ${currentStepColor} text-white active:scale-95 transition-transform text-base sm:text-sm`}
        >
          التالي ← المراجعة
        </button>
        <button
          onClick={onSaveDraft}
          className="w-full sm:flex-1 px-4 py-3.5 sm:py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-xl font-bold active:scale-95 transition-all text-sm"
        >
          💾 حفظ لاحقاً
        </button>
      </div>
    </div>
  );
};
