import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader } from 'lucide-react';
import { storageService } from '../services/storageService';

interface ImageUploadProps {
  onUploadComplete: (urls: { thumbnail: string; medium: string; full: string }) => void;
  onError?: (error: string) => void;
  onImageRemove?: (index: number) => void; // Callback when image is removed
  productId: string;
  tailorId: string;
  existingImage?: string;
  existingImages?: string[]; // For multiple images
  disabled?: boolean;
  multiple?: boolean; // Enable multiple image upload
  maxImages?: number; // Maximum number of images (default 10)
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onUploadComplete,
  onError,
  onImageRemove,
  productId,
  tailorId,
  existingImage,
  existingImages = [],
  disabled = false,
  multiple = false,
  maxImages = 10
}) => {
  const [previews, setPreviews] = useState<string[]>(existingImages.length > 0 ? existingImages : existingImage ? [existingImage] : []);
  const [preview, setPreview] = useState<string | null>(existingImage || null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<Array<{ thumbnail: string; medium: string; full: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // التحقق من نوع الملف
    const validation = storageService.validateImageFile(file);
    if (!validation.valid) {
      onError?.(validation.error || 'ملف غير صالح');
      return;
    }

    try {
      // معاينة الصورة
      const previewUrl = await storageService.previewImage(file);
      
      if (multiple) {
        setPreviews(prev => [...prev, previewUrl]);
      } else {
        setPreview(previewUrl);
      }

      // رفع الصورة
      if (!multiple) {
        setUploading(true);
      }
      
      const urls = await storageService.uploadProductImage(file, productId, tailorId);
      
      if (multiple) {
        setUploadedUrls(prev => [...prev, urls]);
      }
      
      onUploadComplete(urls);
      
      if (!multiple) {
        setUploading(false);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      onError?.(error.message || 'حدث خطأ أثناء رفع الصورة');
      if (!multiple) {
        setUploading(false);
      }
    }
  };

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (multiple) {
      const fileArray = Array.from(files) as File[];
      const remainingSlots = maxImages - previews.length;
      
      if (fileArray.length > remainingSlots) {
        onError?.(`يمكنك رفع ${remainingSlots} صور فقط (الحد الأقصى ${maxImages} صورة)`);
        return;
      }

      console.log(`🔄 بدء رفع ${fileArray.length} صورة...`);
      setUploading(true);
      let uploadedCount = 0;
      for (const file of fileArray.slice(0, remainingSlots)) {
        await handleFileSelect(file);
        uploadedCount++;
        console.log(`✅ تم رفع الصورة ${uploadedCount} من ${fileArray.length}`);
      }
      setUploading(false);
      console.log(`🎉 اكتمل رفع جميع الصور (${uploadedCount})`);
    } else {
      const file = files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (!files) return;

    if (multiple) {
      const fileArray = Array.from(files) as File[];
      const remainingSlots = maxImages - previews.length;
      
      if (fileArray.length > remainingSlots) {
        onError?.(`يمكنك رفع ${remainingSlots} صور فقط (الحد الأقصى ${maxImages} صورة)`);
        return;
      }

      setUploading(true);
      for (const file of fileArray.slice(0, remainingSlots)) {
        await handleFileSelect(file);
      }
      setUploading(false);
    } else {
      const file = files[0];
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const handleRemove = (index?: number) => {
    if (multiple && index !== undefined) {
      setPreviews(prev => prev.filter((_, i) => i !== index));
      setUploadedUrls(prev => prev.filter((_, i) => i !== index));
      onImageRemove?.(index); // Notify parent component
    } else {
      setPreview(null);
      setPreviews([]);
      setUploadedUrls([]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || uploading}
        multiple={multiple}
      />

      {/* Multiple Images Grid */}
      {multiple && previews.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              الصور ({previews.length}/{maxImages})
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {previews.map((url, index) => (
              <div key={index} className="relative group rounded-lg overflow-hidden border-2 border-slate-200 dark:border-slate-700 aspect-square">
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled || uploading}
                  className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 disabled:opacity-50"
                >
                  <X size={14} />
                </button>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(!multiple && !preview) || (multiple && previews.length < maxImages) ? (
        <div
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
            transition-all duration-200
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105' 
              : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader className="w-12 h-12 text-blue-500 animate-spin" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  جاري رفع الصورة...
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  يتم ضغط الصورة وتحسينها تلقائياً
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {multiple 
                    ? `اضغط أو اسحب الصور هنا (${previews.length}/${maxImages})`
                    : 'اضغط أو اسحب الصورة هنا'
                  }
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG أو WebP (حد أقصى 10MB){multiple && ` - يمكنك رفع حتى ${maxImages} صور`}
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="relative group rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover"
            loading="lazy"
          />
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-white">
                <Loader className="w-8 h-8 animate-spin" />
                <p className="text-sm font-medium">جاري الرفع...</p>
              </div>
            </div>
          )}

          {!disabled && !uploading && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-200">
              <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleRemove}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  title="إزالة الصورة"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  title="تغيير الصورة"
                >
                  <ImageIcon size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 space-y-1">
        <p>✨ سيتم تحسين الصورة تلقائياً لتحسين الأداء</p>
        <p>📦 ستُحفظ 3 نسخ: معاينة صغيرة، متوسطة، وكاملة</p>
      </div>
    </div>
  );
};
