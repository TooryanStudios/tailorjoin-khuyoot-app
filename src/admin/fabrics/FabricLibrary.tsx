
import React from 'react';
import { Button } from '../../../components/Button';
import { Fabric } from '../../../types';

interface FabricLibraryProps {
  fabrics: Fabric[];
}

export const FabricLibrary: React.FC<FabricLibraryProps> = ({ fabrics }) => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h2 className="text-xl font-bold text-slate-800 dark:text-white">مكتبة الأقمشة (Fabric Library)</h2>
         <Button size="sm">إضافة قماش</Button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fabrics.map(fabric => (
             <div key={fabric.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
                <div className="pl-4">
                   <div className="flex justify-between items-start">
                      <h3 className="font-bold text-slate-800 dark:text-white">{fabric.name}</h3>
                      <span className="text-xs font-mono bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded">{fabric.code}</span>
                   </div>
                   <p className="text-sm text-slate-500 mt-1">{fabric.type} • {fabric.color}</p>
                   <div className="mt-4 flex items-center justify-between">
                      <div className="text-center">
                         <p className="text-xs text-slate-400">المخزون</p>
                         <p className="font-bold text-blue-600">{fabric.stock}م</p>
                      </div>
                      <div className="text-center">
                         <p className="text-xs text-slate-400">سعر المتر</p>
                         <p className="font-bold text-green-600">{fabric.pricePerMeter} ر.ع</p>
                      </div>
                   </div>
                </div>
             </div>
          ))}
       </div>
    </div>
  );
};
