import React from 'react';
import { useProductForm } from '../context/ProductFormContext';
import { ChevronLeft, ChevronRight, ImageIcon, X, Star } from 'lucide-react';

export const ImageWorkspace: React.FC = () => {
  const { allProductImages, coverImageIndex, setCoverImage, removeImage, addImages } = useProductForm();
  const stripRef = React.useRef<HTMLDivElement | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      addImages(files);
    }
  };

  const mainImage = allProductImages[coverImageIndex] || null;

  const scrollStrip = (direction: 'left' | 'right') => {
    const el = stripRef.current;
    if (!el) return;
    const delta = Math.max(240, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({ left: direction === 'left' ? -delta : delta, behavior: 'smooth' });
  };

  return (
    <div className="space-y-2">
      {/* Slot 1: Main Product Image */}
      <div className="relative aspect-video rounded-lg overflow-hidden border border-white/5 bg-white/[0.02]">
        {mainImage ? (
          <>
            <img
              src={mainImage}
              alt="Product preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute top-4 right-4 flex gap-2">
              <div className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1">
                <Star size={12} className="fill-yellow-400 text-yellow-400" />
                صورة الغلاف
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <ImageIcon size={40} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-300 mb-2">
              لا توجد صور بعد
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs">
              ارفع صور المنتج من قسم رفع الصور بالأعلى
            </p>
          </div>
        )}
      </div>

      {/* Slot 9: Thumbnail Reel */}
      {allProductImages.length > 0 && (
        <div className="relative">
          <button
            type="button"
            onClick={() => scrollStrip('left')}
            className="absolute -left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
            aria-label="Scroll thumbnails left"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            type="button"
            onClick={() => scrollStrip('right')}
            className="absolute -right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/10 bg-black/40 p-2 text-white hover:bg-black/60 transition-colors"
            aria-label="Scroll thumbnails right"
          >
            <ChevronRight size={18} />
          </button>

          <div
            ref={stripRef}
            className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent scroll-smooth"
          >
            {allProductImages.map((img, index) => (
              <div
                key={`${img}-${index}`}
                className={`relative group flex-shrink-0 w-14 h-14 rounded-md overflow-hidden cursor-pointer transition-all ${
                  index === coverImageIndex
                    ? 'ring-2 ring-theme-primary shadow-lg shadow-theme-primary/20'
                    : 'ring-1 ring-white/10 hover:ring-white/20'
                }`}
                onClick={() => setCoverImage(index)}
              >
                <img
                  src={img}
                  alt={`Product ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                />

                {index === coverImageIndex && (
                  <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-theme-primary text-white text-[10px] font-bold">
                    غلاف
                  </div>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white opacity-100 transition-all flex items-center justify-center shadow-lg z-10"
                  aria-label={`Delete image ${index + 1}`}
                  title="حذف الصورة"
                >
                  <X size={14} strokeWidth={2.5} />
                </button>

                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] font-medium">
                  {index + 1}
                </div>
              </div>
            ))}

            {allProductImages.length < 10 && (
              <label className="flex-shrink-0 w-14 h-14 rounded-md border border-dashed border-white/10 hover:border-white/20 flex items-center justify-center cursor-pointer transition-colors hover:bg-white/[0.02]">
                <input
                  type="file"
                  multiple
                  accept="image/*,image/avif"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="text-center">
                  <ImageIcon size={20} className="text-slate-400 mx-auto mb-1" />
                  <span className="text-[10px] text-slate-400">إضافة</span>
                </div>
              </label>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

