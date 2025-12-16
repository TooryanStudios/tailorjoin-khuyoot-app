
import React from 'react';
import { Button } from '../../../components/Button';
import { AIModelConfig } from '../../../types';
import { Cpu } from 'lucide-react';

interface AIModelsProps {
  aiModels: AIModelConfig[];
}

export const AIModels: React.FC<AIModelsProps> = ({ aiModels }) => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">نماذج الذكاء الاصطناعي (AI Models)</h2>
         <Button size="sm">تحديث النماذج</Button>
       </div>
       <div className="grid grid-cols-1 gap-4">
          {aiModels.map(model => (
             <div key={model.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-lg ${model.status === 'active' ? 'bg-green-100 text-green-600' : model.status === 'training' ? 'bg-yellow-100 text-yellow-600' : 'bg-slate-100 text-slate-500'}`}>
                      <Cpu size={24} />
                   </div>
                   <div>
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {model.name}
                        <span className="text-xs font-normal text-slate-400 px-2 py-0.5 border border-slate-200 dark:border-slate-600 rounded-full">{model.version}</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">آخر تحديث: {model.lastUpdated}</p>
                   </div>
                </div>
                <div className="flex items-center gap-8 text-right">
                   <div>
                      <p className="text-xs text-slate-400">الحالة</p>
                      <p className={`font-bold text-sm ${model.status === 'active' ? 'text-green-500' : model.status === 'training' ? 'text-yellow-500' : 'text-slate-500'}`}>
                         {model.status.toUpperCase()}
                      </p>
                   </div>
                   <div>
                      <p className="text-xs text-slate-400">الدقة (Accuracy)</p>
                      <p className="font-bold text-blue-500">{model.accuracy}%</p>
                   </div>
                   <Button variant="outline" size="sm">Configure</Button>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
