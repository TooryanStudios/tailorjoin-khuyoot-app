import React, { useRef, useState } from 'react';
import { Upload, Image, AlertCircle, ImageIcon } from 'lucide-react';
import { ImageLibraryPicker } from '../../../components/ImageLibraryPicker';

interface FabricUploaderProps {
  onFabricSelected: (file: File) => void;
  currentFabric?: { preview: string; file: File };
  onRemove?: () => void;
}

export const FabricUploader: React.FC<FabricUploaderProps> = ({
  onFabricSelected,
  currentFabric,
  onRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string>();
  const [showImageLibrary, setShowImageLibrary] = useState(false);

  const handleFileSelect = (file: File) => {
    setError(undefined);

    // Validate file
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(file.type)) {
      setError('يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP');
      return;
    }

    if (file.size > maxSize) {
      setError('حجم الصورة يجب أن لا يتجاوز 10 ميجابايت');
      return;
    }

    console.log('File selected:', file.name, file.type, file.size);
    onFabricSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleImageFromLibrary = async (imageUrl: string) => {
    try {
      // تحويل URL إلى File object
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const fileName = imageUrl.split('/').pop() || 'fabric.jpg';
      const file = new File([blob], fileName, { type: blob.type });
      
      console.log('✅ تم تحميل الصورة من المكتبة:', fileName);
      onFabricSelected(file);
    } catch (error) {
      console.error('❌ خطأ في تحميل الصورة من المكتبة:', error);
      setError('فشل تحميل الصورة من المكتبة');
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          ارفعي صورة القماش
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          حاولي تصوير القماش في إضاءة جيدة ومن الأعلى قدر الإمكان
        </p>
      </div>

      {currentFabric ? (
        // Show uploaded fabric - click to replace
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="relative rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 max-w-sm mx-auto cursor-pointer group hover:border-indigo-400 transition-all"
        >
          <div className="aspect-square">
            <img
              src={currentFabric.preview}
              alt="القماش المختار"
              className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
            />
          </div>
          
          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
              <Upload size={32} className="mx-auto mb-2" />
              <p className="font-semibold">اضغطي لتغيير الصورة</p>
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <p className="text-white text-sm font-medium truncate">
              {currentFabric.file.name}
            </p>
            <p className="text-white/80 text-xs">
              {(currentFabric.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </div>
      ) : (
        // Upload options
        <div className="space-y-3 max-w-sm mx-auto">
          {/* رفع من الجهاز */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              relative rounded-2xl border-2 border-dashed cursor-pointer
              transition-all duration-300 overflow-hidden
              ${isDragging
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 scale-105'
                : 'border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }
            `}
          >
            <div className="aspect-square flex flex-col items-center justify-center p-8 text-center">
              <div className={`
                w-20 h-20 rounded-full flex items-center justify-center mb-4
                ${isDragging 
                  ? 'bg-indigo-100 dark:bg-indigo-900/30' 
                  : 'bg-slate-100 dark:bg-slate-800'
                }
              `}>
                {isDragging ? (
                  <Upload size={32} className="text-indigo-600 dark:text-indigo-400" />
                ) : (
                  <Image size={32} className="text-slate-400" />
                )}
              </div>

              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                {isDragging ? 'أفلتي الصورة هنا' : 'اضغطي لرفع صورة القماش'}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                أو اسحبي الصورة وأفلتيها هنا
              </p>

              <div className="text-xs text-slate-400 space-y-1">
                <p>الصيغ المدعومة: JPG, PNG, WEBP</p>
                <p>الحجم الأقصى: 10 ميجابايت</p>
              </div>
            </div>
          </div>

          {/* اختيار من المكتبة */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowImageLibrary(true);
            }}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-3 transition-all shadow-md hover:shadow-lg"
          >
            <ImageIcon size={20} />
            <span>اختر من مكتبة الصور</span>
          </button>
        </div>
      )}

      {/* Image Library Picker Modal */}
      {showImageLibrary && (
        <ImageLibraryPicker 
          onSelect={handleImageFromLibrary}
          onClose={() => setShowImageLibrary(false)}
        />
      )}

      {/* Hidden File Input - Always present */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
            // Reset input to allow selecting same file again
            e.target.value = '';
          }
        }}
        className="hidden"
      />

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}
    </div>
  );
};
