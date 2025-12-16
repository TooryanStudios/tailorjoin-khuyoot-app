import React from 'react';
import { Check } from 'lucide-react';
import type { CustomizationModel } from '../../types/customization';

interface ModelSelectorProps {
  models: CustomizationModel[];
  selectedModelId?: string;
  onModelSelect: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModelId,
  onModelSelect
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          اختاري نموذج التصميم
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          اختاري نوع اللبس الذي تريدين تفصيله
        </p>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {models.map((model) => {
          const isSelected = selectedModelId === model.id;
          
          return (
            <button
              key={model.id}
              onClick={() => onModelSelect(model.id)}
              className={`
                relative rounded-xl overflow-hidden transition-all duration-300
                ${isSelected 
                  ? 'ring-4 ring-indigo-500 shadow-xl scale-105' 
                  : 'ring-1 ring-slate-200 dark:ring-slate-700 hover:ring-2 hover:ring-indigo-300 hover:shadow-lg'
                }
              `}
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-slate-100 dark:bg-slate-800">
                <img
                  src={model.thumbnailUrl}
                  alt={model.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Label */}
              <div className={`
                p-2 text-center transition-colors
                ${isSelected 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white'
                }
              `}>
                <p className="font-semibold text-xs">{model.name}</p>
                {model.description && (
                  <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                    {model.description}
                  </p>
                )}
              </div>

              {/* Selected Badge */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Check size={14} className="text-indigo-600" />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
