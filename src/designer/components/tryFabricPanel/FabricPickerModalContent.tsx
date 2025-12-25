import React from 'react';
import { TemplatePicker, type TemplatePickerItem } from '../TemplatePicker';
import type {
  FabricCategory as KhuyootFabricCategory,
  FabricItem as KhuyootFabricItem,
} from '../../../../services/fabricLibraryService';

export function FabricPickerModalContent(props: {
  onClose: () => void;
  onGoToPortfolio: () => void;
  onFabricChangeAndClose: (file: File | null) => void;

  khuyootFabricCategories: KhuyootFabricCategory[];
  khuyootSelectedCategoryId: string | null;
  setKhuyootSelectedCategoryId: (id: string | null) => void;

  khuyootFabricsError: string | null;
  khuyootFabricsLoading: boolean;
  khuyootFabrics: KhuyootFabricItem[];

  onRefreshCategories: () => Promise<void>;

  getFabricCoverUrl: (fabric: Partial<KhuyootFabricItem> | null | undefined) => string;
  getFabricCoverThumbnailUrl: (fabric: Partial<KhuyootFabricItem> | null | undefined) => string;

  onSelectFabricItem: (payload: { imageUrl: string; previewUrl?: string | null }) => void;
}) {
  const {
    onClose,
    onGoToPortfolio,
    onFabricChangeAndClose,
    khuyootFabricCategories,
    khuyootSelectedCategoryId,
    setKhuyootSelectedCategoryId,
    khuyootFabricsError,
    khuyootFabricsLoading,
    khuyootFabrics,
    onRefreshCategories,
    getFabricCoverUrl,
    getFabricCoverThumbnailUrl,
    onSelectFabricItem,
  } = props;

  return (
    <>
      <div className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] bg-cyan-600 text-white px-3 py-1.5 z-[9999] rounded-full font-black shadow-2xl ring-2 ring-white/80 select-text cursor-text">
        MODAL: TRYON-FABRIC-PICKER
      </div>

      <div className="flex items-center justify-between p-6 pb-4 shrink-0">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">اختر القماش</h3>
          <button
            type="button"
            onClick={onGoToPortfolio}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-black text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            من مجموعتي
          </button>
        </div>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700">✕</button>
      </div>

      <div
        className="flex-1 overflow-y-auto px-6"
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div className="pt-1">
          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-2">ارفع صورة قماش</label>
          <div className="mb-3 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/20 p-3 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="font-black mb-1">تنبيه</div>
            <div>
              ارفع صورة قماش/نقشة فقط (لقطة قريبة). ممنوع الصور الشخصية أو أي صور خاصة. برفعك للصورة أنت تؤكد أن لديك حق استخدامها وتتحمل المسؤولية الكاملة عن المحتوى المرفوع.
            </div>
          </div>
          <button
            type="button"
            onClick={() => document.getElementById('tryon-fabric-upload')?.click()}
            className="w-full rounded-3xl border-2 border-dashed border-amber-300 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600 transition-all text-right bg-gradient-to-br from-amber-50 to-white dark:from-amber-900/20 dark:to-slate-900 p-4 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-right">
                <div className="font-black text-sm text-slate-900 dark:text-white">رفع صورة</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">اضغط لاختيار ملف (JPG / PNG / WEBP)</div>
              </div>
              <div className="shrink-0 w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </div>
          </button>
          <input
            id="tryon-fabric-upload"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => onFabricChangeAndClose(e.target.files?.[0] || null)}
            className="hidden"
          />
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="text-sm font-bold text-slate-700 dark:text-slate-300">اختر من مكتبة خيوط</div>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              onClick={onRefreshCategories}
            >
              تحديث
            </button>
          </div>

          <div className="flex items-center gap-2 mb-3">
            <select
              value={khuyootSelectedCategoryId || ''}
              onChange={(e) => setKhuyootSelectedCategoryId(e.target.value || null)}
              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              <option value="">اختر القسم</option>
              {khuyootFabricCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.nameAr || c.name || 'قسم').toString()}
                </option>
              ))}
            </select>
          </div>

          {khuyootFabricsError ? (
            <div className="text-sm text-red-600 dark:text-red-400 mb-2">{khuyootFabricsError}</div>
          ) : null}

          {khuyootFabricsLoading ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">جارِ تحميل الأقمشة...</div>
          ) : khuyootFabrics.length === 0 ? (
            <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">لا يوجد أقمشة في هذا القسم</div>
          ) : (
            <TemplatePicker
              aspect="square"
              selectedId={null}
              items={khuyootFabrics.map((f): TemplatePickerItem => {
                const fullUrl = getFabricCoverUrl(f) || '';
                const thumbUrl = getFabricCoverThumbnailUrl(f) || '';
                const title = (f.nameAr || f.name || f.code || 'قماش').toString();
                return {
                  id: f.id,
                  name: title,
                  imageUrl: fullUrl,
                  thumbnailUrl: thumbUrl || fullUrl,
                  disabled: !fullUrl,
                  title: !fullUrl ? 'لا توجد صورة لهذا القماش' : title,
                };
              })}
              onSelect={(item) => {
                if (!item.imageUrl) return;
                onSelectFabricItem({ imageUrl: item.imageUrl, previewUrl: item.thumbnailUrl || null });
              }}
            />
          )}
        </div>
      </div>

      <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          إغلاق
        </button>
      </div>
    </>
  );
}
