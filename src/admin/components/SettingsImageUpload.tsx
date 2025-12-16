import React, { useState, useRef } from 'react';
import { Upload, Loader, X } from 'lucide-react';
import { storageService } from '../../../services/storageService';

interface SettingsImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label: string;
  placeholder?: string;
  helpText?: string;
  aspectRatio?: string;
  storagePath: string; // e.g., 'banners/hero', 'seo/og-image'
}

export const SettingsImageUpload: React.FC<SettingsImageUploadProps> = ({
  value,
  onChange,
  label,
  placeholder,
  helpText,
  aspectRatio,
  storagePath,
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // التحقق من نوع الملف
    const validation = storageService.validateImageFile(file);
    if (!validation.valid) {
      setError(validation.error || 'ملف غير صالح');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setUploading(true);
    setError('');

    try {
      // رفع الصورة إلى Firebase Storage
      const urls = await storageService.uploadSettingsImage(file, storagePath);
      
      // استخدام الصورة الكاملة للإعدادات
      onChange(urls.full);
    } catch (err: any) {
      console.error('Error uploading settings image:', err);
      setError(err.message || 'حدث خطأ أثناء رفع الصورة');
      setTimeout(() => setError(''), 3000);
    } finally {
      setUploading(false);
      // إعادة تعيين input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearImage = () => {
    onChange('');
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        {label}
      </label>
      
      <div className="space-y-3">
        {/* حقل الإدخال اليدوي */}
        <div className="flex gap-2">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-white"
            placeholder={placeholder || "https://example.com/image.jpg"}
            disabled={uploading}
          />
          
          {/* زر رفع الصورة */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed whitespace-nowrap"
          >
            {uploading ? (
              <>
                <Loader size={18} className="animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload size={18} />
                رفع صورة
              </>
            )}
          </button>

          {/* زر حذف الصورة */}
          {value && !uploading && (
            <button
              type="button"
              onClick={handleClearImage}
              className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg"
              title="حذف الصورة"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* رسالة خطأ */}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">
            ❌ {error}
          </p>
        )}

        {/* نص المساعدة */}
        {helpText && (
          <p className="text-xs text-slate-500">
            {helpText}
          </p>
        )}

        {/* معاينة الصورة */}
        {value && (
          <div className="relative">
            <img
              src={value}
              alt={label}
              className={`w-full h-32 object-cover rounded-lg border border-slate-200 dark:border-slate-700 ${aspectRatio || ''}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=خطأ+في+تحميل+الصورة';
              }}
            />
          </div>
        )}
      </div>

      {/* Input مخفي للملفات */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
