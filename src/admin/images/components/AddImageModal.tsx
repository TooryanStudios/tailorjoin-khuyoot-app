import React, { useState, useEffect } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface AddImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryName: string;
  onUpload: (files: File[], label: string) => Promise<void>;
  uploadProgress: boolean;
  uploadCounter: { done: number; total: number } | null;
}

export const AddImageModal: React.FC<AddImageModalProps> = ({
  isOpen,
  onClose,
  categoryName,
  onUpload,
  uploadProgress,
  uploadCounter
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [label, setLabel] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFiles([]);
      setLabel('');
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const handleFileSelect = (selectedFiles: File[]) => {
    const imageFiles = selectedFiles.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      setFiles(prev => [...prev, ...imageFiles]);
      if (!previewUrl && imageFiles[0]) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result as string);
        reader.readAsDataURL(imageFiles[0]);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(Array.from(e.dataTransfer.files));
  };

  const handleUpload = () => {
    onUpload(files, label);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate flex-1">
            إضافة صور إلى {categoryName}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition">
            <X size={20} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
          </button>
        </div>

        <div className="space-y-5">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              isDragging 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleFileSelect(Array.from(e.target.files));
                  e.target.value = '';
                }
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="flex flex-col items-center gap-3 pointer-events-none">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                <Upload size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  اضغط للاختيار أو اسحب الصور هنا
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  PNG, JPG, WEBP (الحد الأقصى 5MB)
                </p>
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  الملفات المختارة ({files.length})
                </span>
                <button 
                  onClick={() => { setFiles([]); setPreviewUrl(null); }}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  حذف الكل
                </button>
              </div>
              <div className="max-h-40 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                {files.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center gap-3 p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-700 rounded flex items-center justify-center shrink-0">
                      <ImageIcon size={14} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                      <p className="text-[10px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    <button
                      onClick={() => {
                        const newFiles = files.filter((_, i) => i !== idx);
                        setFiles(newFiles);
                        if (newFiles.length === 0) setPreviewUrl(null);
                      }}
                      className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded transition"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              وصف الصور (مشترك) *
            </label>
            <textarea
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="مثال: دشداشة بيضاء كلاسيكية"
              rows={2}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
            />
          </div>

          {uploadProgress && uploadCounter && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>جاري الرفع...</span>
                <span>{Math.round((uploadCounter.done / uploadCounter.total) * 100)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 ease-out"
                  style={{ width: `${(uploadCounter.done / uploadCounter.total) * 100}%` }}
                />
              </div>
              <p className="text-center text-[10px] text-slate-500">
                تم رفع {uploadCounter.done} من {uploadCounter.total} صورة
              </p>
            </div>
          )}

          <button
            onClick={handleUpload}
            disabled={uploadProgress || files.length === 0 || !label.trim()}
            className="w-full py-2.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow active:scale-[0.98]"
          >
            {uploadProgress ? 'جاري المعالجة...' : `إضافة ${files.length > 0 ? files.length : ''} صور`}
          </button>
        </div>
      </div>
    </div>
  );
};
