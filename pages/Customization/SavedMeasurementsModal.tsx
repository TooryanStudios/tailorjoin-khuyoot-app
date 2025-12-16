import React from 'react';
import { Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MeasurementProfile } from '../../types';

interface SavedMeasurementsModalProps {
  savedMeasurements: MeasurementProfile[];
  onClose: () => void;
  onSelect: (profile: MeasurementProfile) => void;
}

export const SavedMeasurementsModal: React.FC<SavedMeasurementsModalProps> = ({
  savedMeasurements,
  onClose,
  onSelect,
}) => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ruler size={22} className="text-blue-600" />
            المقاسات المحفوظة
          </h3>
          <button
            onClick={onClose}
            className="p-2.5 sm:p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors active:scale-95"
          >
            <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto flex-1">
          {savedMeasurements.length === 0 ? (
            <div className="text-center py-16 sm:py-12">
              <Ruler className="w-24 h-24 sm:w-20 sm:h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-base sm:text-sm text-slate-600 dark:text-slate-400 mb-6 sm:mb-4">لا توجد مقاسات محفوظة</p>
              <button
                onClick={() => {
                  onClose();
                  navigate('/measurements');
                }}
                className="px-8 py-4 sm:px-6 sm:py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white font-bold rounded-xl hover:shadow-lg transition-all active:scale-95 text-base sm:text-sm"
              >
                ➕ إضافة مقاسات جديدة
              </button>
            </div>
          ) : (
            savedMeasurements.map((profile) => (
              <button
                key={profile.id}
                className="w-full border-2 border-slate-200 dark:border-slate-600 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-4 sm:p-4 transition-all text-right group active:scale-[0.98] shadow-sm hover:shadow-md"
                onClick={() => onSelect(profile)}
              >
                <div className="flex items-start justify-between mb-4 sm:mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-base sm:text-sm text-slate-900 dark:text-white">{profile.name}</h4>
                    <p className="text-sm sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5">{profile.type}</p>
                  </div>
                  <div className="px-4 py-2 sm:px-3 sm:py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-sm sm:text-xs font-bold rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                    ✓ اختيار
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2.5 sm:gap-2">
                  {Object.entries(profile.metrics).slice(0, 6).map(([key, value]) => (
                    <div key={key} className="bg-slate-50 dark:bg-slate-700/50 rounded-lg px-2 py-2 sm:py-1.5 text-center border border-slate-100 dark:border-slate-600">
                      <p className="text-xs sm:text-[10px] text-slate-500 dark:text-slate-400 capitalize mb-0.5">{key}</p>
                      <p className="text-base sm:text-sm font-black text-slate-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </div>

                {profile.notes && (
                  <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 italic border-t border-slate-100 dark:border-slate-700 pt-3 sm:pt-2 text-right">
                    💬 {profile.notes}
                  </p>
                )}
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
