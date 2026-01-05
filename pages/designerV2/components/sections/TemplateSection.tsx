import React from 'react';
import { ChevronDown, Shirt } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { AdminAnchor } from '../AdminAnchor';
import { StableImage } from '../../../../src/components/StableImage';

interface TemplateSectionProps {
  anchorId?: string;
  showAdminLabels?: boolean;
  sectionRef: React.RefObject<HTMLDivElement | null>;
  isCollapsed: boolean;
  onToggle: () => void;
  templatePreviewUrl: string | null;
  selectedTemplateName?: string;
  onOpenTemplateLibrary: () => void;
  onOpenTemplateImageLibrary?: () => void;
  onSetBefore?: (url: string) => void;
  onSetAfter?: (url: string) => void;
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({
  anchorId,
  showAdminLabels,
  sectionRef,
  isCollapsed,
  onToggle,
  templatePreviewUrl,
  selectedTemplateName,
  onOpenTemplateLibrary,
  onOpenTemplateImageLibrary,
  onSetBefore,
  onSetAfter,
}) => {
  return (
    <AdminAnchor
      anchorId={anchorId}
      visible={showAdminLabels}
      label="section-template"
      className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all bg-slate-50/50 dark:bg-slate-800/30 max-w-[360px] w-full mx-auto"
      ref={sectionRef}
    > 
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-bold flex items-center justify-center">1</span>
          <div className="text-right">
            <div className="font-bold text-sm">الموديل section-template </div>
            <div className="text-[10px] text-slate-500">{selectedTemplateName || 'الافتراضي'}</div>
            
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
        <div className="p-4 pt-0 bg-white dark:bg-slate-900">
          <div
            onClick={onOpenTemplateLibrary}
            className="cursor-pointer group relative aspect-[3/4] max-w-[260px] mx-auto rounded-lg overflow-hidden border-2 border-dashed border-slate-200 hover:border-violet-500 transition-colors bg-slate-50"
          >
            {templatePreviewUrl ? (
              <StableImage
                src={templatePreviewUrl}
                alt={selectedTemplateName || 'نموذج التصميم'}
                aspectClass="h-full"
                className="h-full w-full"
                imgClassName="object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                <Shirt size={32} className="mb-2" />
                <span className="text-xs">اضغط لاختيار الموديل</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <span className="bg-white text-slate-900 px-5 py-1 rounded-full text-xs font-bold">تغيير الموديل</span>
            </div>
          </div>


          {templatePreviewUrl && (onSetBefore || onSetAfter) ? (
            <div className="mt-2 max-w-[260px] mx-auto grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!onSetBefore}
                onClick={() => {
                  if (!templatePreviewUrl) return;
                  onSetBefore?.(templatePreviewUrl);
                }}
                className="w-full text-xs justify-center"
              >
                تعيين كـ قبل
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!onSetAfter}
                onClick={() => {
                  if (!templatePreviewUrl) return;
                  onSetAfter?.(templatePreviewUrl);
                }}
                className="w-full text-xs justify-center"
              >
                تعيين كـ بعد
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </AdminAnchor>
  );
};
