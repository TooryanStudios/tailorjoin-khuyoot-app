import React, { useState, useEffect } from 'react';
import { FolderPlus, X } from 'lucide-react';
import { ImageLibraryCategory } from '../../../../types';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; nameEn: string; order: number; parentId: string | null }) => Promise<void>;
  rootParents: ImageLibraryCategory[];
  loading: boolean;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  rootParents,
  loading
}) => {
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [order, setOrder] = useState(1);
  const [parentId, setParentId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setNameEn('');
      setOrder(1);
      setParentId(null);
    }
  }, [isOpen]);

  const handleSubmit = () => {
    onSubmit({ name, nameEn, order, parentId });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 shadow-2xl animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <FolderPlus size={20} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">إضافة قسم جديد</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
          >
            <X size={20} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              اسم القسم (عربي) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: دشداشات"
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              اسم القسم (إنجليزي) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder="مثال: dishdasha"
              className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                ترتيب العرض
              </label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">الأب (اختياري)</label>
              <select
                value={parentId ?? ''}
                onChange={(e) => setParentId(e.target.value || null)}
                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              >
                <option value="">بدون أب — مستوى 0</option>
                {rootParents
                  .filter(r => !r.isImmutable && !/(الأزياء|Fashion)/i.test(r.nameAr || r.name || ''))
                  .map(r => (
                    <option key={r.id} value={r.id}>{r.nameAr || r.name}</option>
                  ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={loading || !name.trim() || !nameEn.trim()}
              className="w-full py-3 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  جاري الإضافة...
                </span>
              ) : 'إضافة القسم'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
