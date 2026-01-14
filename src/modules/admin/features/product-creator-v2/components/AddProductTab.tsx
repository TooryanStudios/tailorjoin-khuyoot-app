import React from 'react';
import { FabricPresetSelector } from './FabricPresetSelector';
import { UploadImageCard } from './UploadImageCard';

export const AddProductTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row-reverse">
        {/* Right Sidebar (RTL) */}
        <aside className="w-full md:flex-1 min-w-0" dir="rtl">
          <header className="mb-3">
            <h2 className="text-lg font-semibold">إضافة منتج جديد</h2>
            <p className="mt-0.5 text-xs text-slate-400">أدخل تفاصيل المنتج والصور الخاصة بك</p>
          </header>

          <FabricPresetSelector />
        </aside>

        {/* Media column: Upload (includes Preview + Thumbnails) */}
        <main className="flex-1 min-w-0">
          <UploadImageCard />
        </main>
      </div>
    </div>
  );
};

export default AddProductTab;
