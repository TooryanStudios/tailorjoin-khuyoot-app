import React from 'react';
import { Modal } from '../../../components/Modal';
import { ImageLibraryPicker } from '../../../components/ImageLibraryPicker';
import { FabricScaleControl, FabricScaleApplyPayload } from '../../../components/FabricScaleControl';
import { DesignOption, FabricPatternSettings } from '../../../types';
import { PersistedDesign } from '../../../services/designService';

interface ModalsSectionProps {
  // Start Modal
  startModalOpen: boolean;
  onCloseStartModal: () => void;
  appSettings: any;
  startMode: 'new' | 'edit';
  onSetStartMode: (mode: 'new' | 'edit') => void;
  myDesigns: PersistedDesign[];
  onStartNewDesign: () => void;
  onOpenExistingDesign: (design: PersistedDesign) => void;
  formatRelativeTime: (timestamp: number) => string;
  dontShowStart: boolean;
  onToggleDontShowStart: (value: boolean) => void;
  onPersistDontShowStart: () => Promise<void>;

  // Design Options Modal
  modalOpen: boolean;
  onCloseModal: () => void;
  onConfirmSelection: () => void;
  activeCategory: string | null;
  designOptions: DesignOption[];
  pendingSelection: DesignOption | null;
  onOptionSelect: (option: DesignOption) => void;
  onOpenLibraryForOption: (optionId: string) => void;

  // Fabric Modals
  fabricModalOpen: boolean;
  onCloseFabricModal: () => void;
  khuyootFabrics: Array<{ id: string; name: string; imageUrl: string; price: number }>;
  onKhuyootFabricSelect: (fabric: any) => void;
  
  shopsModalOpen: boolean;
  onCloseShopsModal: () => void;
  shopsFabrics: Array<{ shopId: string; shopName?: string; fabricId: string; name: string; imageUrl: string; price: number }>;
  onShopsFabricSelect: (fabric: any) => void;

  // Fabric Scale Modal
  showFabricScale: boolean;
  onCloseFabricScale: () => void;
  fabricImage: string | null;
  fabricSettings: FabricPatternSettings;
  fabricSettingsDraft: FabricPatternSettings | null;
  onFabricSettingsChange: (settings: FabricPatternSettings) => void;
  onFabricScaleApply: (payload: FabricScaleApplyPayload) => void;
  onFabricScaleCancel: () => void;

  // Image Library Picker
  imagePickerOpen: { open: boolean; rootParentId?: string | null; preselectParentId?: string | null; preselectChildId?: string | null };
  onCloseImagePicker: () => void;
  onImageSelect: (imageUrl: string) => void;

  // Template Image Library
  showTemplateImageLibrary: boolean;
  onCloseTemplateImageLibrary: () => void;
  womenRootId: string | null;
  onTemplateImageSelect: (url: string) => void;
  selectedTemplate: string;

  // My Designs Modal
  showMyDesigns: boolean;
  onCloseMyDesigns: () => void;
  onLoadDesign: (design: PersistedDesign) => void;
}

export const ModalsSection: React.FC<ModalsSectionProps> = ({
  startModalOpen,
  onCloseStartModal,
  appSettings,
  startMode,
  onSetStartMode,
  myDesigns,
  onStartNewDesign,
  onOpenExistingDesign,
  formatRelativeTime,
  dontShowStart,
  onToggleDontShowStart,
  onPersistDontShowStart,
  modalOpen,
  onCloseModal,
  onConfirmSelection,
  activeCategory,
  designOptions,
  pendingSelection,
  onOptionSelect,
  onOpenLibraryForOption,
  fabricModalOpen,
  onCloseFabricModal,
  khuyootFabrics,
  onKhuyootFabricSelect,
  shopsModalOpen,
  onCloseShopsModal,
  shopsFabrics,
  onShopsFabricSelect,
  showFabricScale,
  onCloseFabricScale,
  fabricImage,
  fabricSettings,
  fabricSettingsDraft,
  onFabricSettingsChange,
  onFabricScaleApply,
  onFabricScaleCancel,
  imagePickerOpen,
  onCloseImagePicker,
  onImageSelect,
  showTemplateImageLibrary,
  onCloseTemplateImageLibrary,
  womenRootId,
  onTemplateImageSelect,
  selectedTemplate,
  showMyDesigns,
  onCloseMyDesigns,
  onLoadDesign,
}) => {
  return (
    <>
      {/* Start Modal */}
      <Modal 
        isOpen={startModalOpen} 
        onClose={onCloseStartModal} 
        title="ابدأ التصميم" 
        showFooter={true} 
        maxWidth="max-w-2xl" 
        onConfirm={async () => { 
          await onPersistDontShowStart(); 
          onCloseStartModal(); 
        }} 
        keepMounted
      >
        <div className="space-y-2">
          {/* Help video at the top */}
          {appSettings?.helpVideo?.enabled && appSettings?.helpVideo?.url && (
            <div className="w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black">
              {(() => {
                const raw = appSettings.helpVideo.url;
                let embedSrc = raw;
                try {
                  const u = new URL(raw);
                  let id = '';
                  if (u.hostname.includes('youtu.be')) {
                    id = u.pathname.replace('/','');
                  } else if (u.hostname.includes('youtube.com')) {
                    id = u.searchParams.get('v') || '';
                  }
                  if (id) {
                    embedSrc = `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&controls=0&iv_load_policy=3`;
                  } else {
                    embedSrc = `${raw.replace('watch?v=', 'embed/')}?rel=0&modestbranding=1&controls=0&iv_load_policy=3`;
                  }
                } catch {}
                return (
                  <iframe
                    className="w-full h-full"
                    src={embedSrc}
                    title="كيفية التصميم"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                );
              })()}
            </div>
          )}
          {/* Video importance note */}
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            هذا الفيديو مهم لمعرفة طريقة التفصيل خطوة بخطوة.
          </div>

          {/* Two options in one row */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={onStartNewDesign} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-colors text-right">
              <div className="text-right">
                <div className="font-bold">تصميم جديد</div>
                <div className="text-xs text-slate-500">ابدأ من الصفر</div>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">✨</div>
            </button>
            <button onClick={() => onSetStartMode('edit')} className="w-full p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-between transition-colors text-right">
              <div className="text-right">
                <div className="font-bold">مشاريعي</div>
                <div className="text-xs text-slate-500">استكمل تصاميم سابقة</div>
              </div>
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm text-2xl">📂</div>
            </button>
          </div>

          {/* Designs list when edit mode */}
          {startMode === 'edit' && myDesigns.map(d => (
            <button key={d.id} onClick={() => onOpenExistingDesign(d)} className="w-full flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg">
              <img src={d.fabricImage || d.generatedImage || ''} className="w-10 h-10 rounded bg-slate-200 object-cover" alt="" />
              <span className="text-sm font-bold flex-1 text-right">{d.selectedTemplate}</span>
              <span className="text-[10px] text-slate-400">{formatRelativeTime(d.updatedAt)}</span>
            </button>
          ))}

          {/* Do not show again toggle button */}
          <button
            type="button"
            onClick={() => onToggleDontShowStart(!dontShowStart)}
            className={`mt-2 text-xs sm:text-sm px-3 py-2 rounded-xl border transition-all ${dontShowStart ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'}`}
          >
            {dontShowStart ? 'سيتم إخفاء هذه النافذة لاحقاً' : 'لا تعرض هذه النافذة مرة أخرى'}
          </button>
        </div>
      </Modal>

      {/* Design Options Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={onCloseModal} 
        onConfirm={onConfirmSelection}
        title="اختر" 
        showFooter={true}
        keepMounted
      >
        <div className="grid grid-cols-2 gap-3">
          {activeCategory && designOptions.filter(o => o.category === activeCategory).map(op => (
            <div 
              key={op.id} 
              onClick={() => onOptionSelect(op)} 
              role="button"
              tabIndex={0}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${pendingSelection?.id === op.id ? 'border-slate-900 ring-1 ring-slate-900 bg-slate-50' : 'border-slate-200 hover:border-slate-400'}`}
            >
              <img src={(pendingSelection?.id === op.id && pendingSelection?.thumbnailUrl) ? pendingSelection.thumbnailUrl : op.thumbnailUrl} className="w-full h-24 object-cover rounded-xl mb-2" alt={op.name} />
              <div className="font-bold text-sm">{op.name}</div>
              {op.price > 0 && <div className="text-xs text-slate-500">+{op.price} ر.ع</div>}
              {(op.id === 'emb-chest' || op.id === 'emb-collar' || op.id === 'emb-full' || op.id.startsWith('neck-') || op.id.startsWith('sleeve-')) && (
                <div onClick={(e) => { e.stopPropagation(); onOpenLibraryForOption(op.id); }} className="mt-2 w-full text-[11px] px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 rounded">
                  اختر من مكتبة الصور
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      {/* Khuyoot Fabrics Modal */}
      <Modal isOpen={fabricModalOpen} onClose={onCloseFabricModal} title="أقمشة خيوط" showFooter={false} keepMounted>
        <div className="grid grid-cols-2 gap-3">
          {khuyootFabrics.map(f => (
            <button key={f.id} onClick={() => onKhuyootFabricSelect(f)} className="group relative aspect-square rounded-2xl overflow-hidden">
              <img src={f.imageUrl} className="w-full h-full object-cover" alt={f.name} />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="font-bold text-sm">{f.name}</div>
                <div className="text-xs">{f.price} ر.ع</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Shops Fabrics Modal */}
      <Modal isOpen={shopsModalOpen} onClose={onCloseShopsModal} title="من المتاجر" showFooter={false} keepMounted>
        <div className="grid grid-cols-2 gap-3">
          {shopsFabrics.map(f => (
            <button key={f.fabricId} onClick={() => onShopsFabricSelect(f)} className="group relative aspect-square rounded-2xl overflow-hidden">
              <img src={f.imageUrl} className="w-full h-full object-cover" alt={f.name} />
              <div className="absolute inset-0 bg-black/40 flex flex-col justify-end p-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="font-bold text-sm">{f.name}</div>
                <div className="text-[10px]">{f.shopName}</div>
              </div>
            </button>
          ))}
        </div>
      </Modal>

      {/* Fabric Scale Control Modal */}
      <Modal
        isOpen={showFabricScale}
        onClose={onCloseFabricScale}
        title="تكرار القماش (تجريبي)"
        maxWidth="max-w-xl"
        keepMounted
      >
        {fabricImage ? (
          <FabricScaleControl
            imageUrl={fabricImage}
            settings={fabricSettingsDraft ?? fabricSettings}
            onSettingsChange={onFabricSettingsChange}
            onPreview={() => {}}
            onApply={onFabricScaleApply}
            onCancel={onFabricScaleCancel}
          />
        ) : (
          <div className="text-sm text-slate-600 dark:text-slate-300">
            اختر قماشاً أولاً لعرض أدوات التكرار.
          </div>
        )}
      </Modal>

      {/* Image Library Picker */}
      {imagePickerOpen.open && (
        <ImageLibraryPicker
          onSelect={onImageSelect}
          onClose={onCloseImagePicker}
          preselectParentId={imagePickerOpen.preselectParentId}
          preselectChildId={imagePickerOpen.preselectChildId}
          rootParentId={imagePickerOpen.rootParentId}
          hideLevel0={false}
        />
      )}

      {/* Template Image Library */}
      {showTemplateImageLibrary && (
        <ImageLibraryPicker 
          rootParentId={womenRootId || undefined} 
          hideLevel0={true} 
          onSelect={onTemplateImageSelect} 
          onClose={onCloseTemplateImageLibrary} 
        />
      )}

      {/* My Designs Modal */}
      {showMyDesigns && (
        <Modal isOpen={showMyDesigns} onClose={onCloseMyDesigns} title="مشاريعي" keepMounted>
          {myDesigns.map(d => (
            <button 
              key={d.id} 
              onClick={() => { 
                onLoadDesign(d); 
                onCloseMyDesigns(); 
              }} 
              className="block w-full text-right p-3 hover:bg-slate-50 border-b"
            >
              {d.selectedTemplate}
            </button>
          ))}
        </Modal>
      )}
    </>
  );
};
