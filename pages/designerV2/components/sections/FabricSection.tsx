import React from 'react';
import { ChevronDown, Palette } from 'lucide-react';
import { Button } from '../../../../components/Button';
import { FabricScaleControl } from '../../../../components/FabricScaleControl';
import { FabricPatternSettings } from '../../../../types';
import { AdminAnchor } from '../AdminAnchor';
import { StableImage } from '../../../../components/StableImage';

interface FabricSectionProps {
  anchorId?: string;
  showAdminLabels?: boolean;
  sectionRef: React.RefObject<HTMLDivElement | null>;
  isCollapsed: boolean;
  onToggle: () => void;
  fabricImage: string | null;
  fabricLabel?: string | null;
  onPickFabric: () => void;
  onOpenTiling: () => void;
  fabricUploadInputRef: React.RefObject<HTMLInputElement | null>;
  onFabricUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fabricSettings: FabricPatternSettings;
  onFabricSettingsChange: (settings: FabricPatternSettings) => void;
  fabricUnitPriceOMR: number;
  fabricMeters: number;
  onFabricMetersChange: (meters: number) => void;
  fabricCostValue?: number;
  showTilingControls?: boolean;
}

export const FabricSection: React.FC<FabricSectionProps> = ({
  anchorId,
  showAdminLabels,
  sectionRef,
  isCollapsed,
  onToggle,
  fabricImage,
  fabricLabel,
  onPickFabric,
  onOpenTiling,
  fabricUploadInputRef,
  onFabricUpload,
  fabricSettings,
  onFabricSettingsChange,
  fabricUnitPriceOMR,
  fabricMeters,
  onFabricMetersChange,
  fabricCostValue,
  showTilingControls = true,
}) => {
  const computedFabricCost = typeof fabricCostValue === 'number' ? fabricCostValue : fabricUnitPriceOMR * fabricMeters;

  return (
    <AdminAnchor
      anchorId={anchorId}
      visible={showAdminLabels}
      label="section-fabric"
      className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all bg-slate-50/50 dark:bg-slate-800/30 max-w-[360px] w-full mx-auto"
      ref={sectionRef}
    > anchorId_section-fabric
      <button onClick={onToggle} className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 transition-colors">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center">2</span>
          <div className="text-right">
            <div className="font-bold text-sm">القماش</div>
            <div className="text-[10px] text-slate-500">{fabricImage ? 'تم الاختيار' : 'لم يتم الاختيار'}</div>
          </div>
        </div>
        <ChevronDown size={16} className={`transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`} />
      </button>

      <div className={`transition-all duration-300 ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[800px] opacity-100'}`}>
        <div className="p-4 pt-0 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3 mb-3">
            <div
              onClick={onPickFabric}
              className="w-20 h-20 rounded-lg border-2 border-slate-200 overflow-hidden cursor-pointer hover:border-emerald-500 transition-colors flex-none"
            >
              {fabricImage ? (
                <StableImage
                  src={fabricImage}
                  alt={fabricLabel || 'صورة القماش'}
                  aspectClass="h-full"
                  className="w-full h-full"
                  imgClassName="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Palette size={20} className="text-slate-400" />
                </div>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Button size="sm" variant="outline" onClick={onPickFabric} className="w-full text-xs justify-center">
                {fabricImage ? 'تغيير القماش' : 'اختر القماش'}
              </Button>
              <Button size="sm" variant="outline" onClick={onOpenTiling} className="w-full text-xs justify-center">
                تكرار القماش (تجريبي)
              </Button>
              {fabricImage && <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{fabricLabel || 'قماش مخصص'}</div>}
            </div>
            <input ref={fabricUploadInputRef} type="file" accept="image/*" onChange={onFabricUpload} className="hidden" />
          </div>

          {fabricImage && showTilingControls ? (
            <div className="mt-3">
              <FabricScaleControl imageUrl={fabricImage} settings={fabricSettings} onSettingsChange={onFabricSettingsChange} onPreview={() => {}} />
            </div>
          ) : null}

          {fabricImage && fabricUnitPriceOMR > 0 && (
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span>الكمية (متر)</span>
                <input
                  type="number"
                  step={0.1}
                  value={fabricMeters}
                  onChange={(e) => onFabricMetersChange(Number(e.target.value))}
                  className="w-16 p-1 text-center rounded border border-slate-300"
                />
              </div>
              <div className="flex justify-between items-center font-bold pt-2 border-t border-slate-200">
                <span>التكلفة التقديرية للقماش</span>
                <span>{computedFabricCost.toFixed(2)} OMR</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminAnchor>
  );
};
