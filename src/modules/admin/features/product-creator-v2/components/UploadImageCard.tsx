import React from 'react';
import { ImageIcon } from 'lucide-react';
import { useProductForm } from '../context/ProductFormContext';
import { ImageWorkspace } from './ImageWorkspace';

export const UploadImageCard: React.FC = () => {
  const { addImages, allProductImages } = useProductForm();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) addImages(files);
    e.currentTarget.value = '';
  };

  return (
    <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between">
        <div className="text-right">
          <div className="text-xs font-medium text-slate-300">رفع الصور</div>
          <div className="text-[10px] text-slate-500">PNG, JPG, AVIF حتى 10 صور</div>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5">
          <ImageIcon size={14} className="text-slate-400" />
        </div>
      </div>

      <div className="mt-2">
        <label className="block cursor-pointer">
          <input
            type="file"
            multiple
            accept="image/*,image/avif"
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="rounded-lg border border-dashed border-white/10 hover:border-white/20 bg-white/[0.02] px-3 py-2 text-center transition-colors">
            <div className="text-xs font-medium text-slate-200">Upload Image</div>
            <div className="text-[10px] text-slate-500">أو اسحب الملفات وأفلتها</div>
            {allProductImages.length > 0 && (
              <div className="mt-1 text-[10px] text-slate-600">{allProductImages.length}/10</div>
            )}
          </div>
        </label>
      </div>

      <div className="mt-2">
        <ImageWorkspace />
      </div>
    </div>
  );
};
