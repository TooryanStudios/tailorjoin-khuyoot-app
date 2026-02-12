import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight, 
  Heart, 
  Share2, 
  MapPin, 
  Clock, 
  User, 
  CheckCircle2, 
  Ruler, 
  X,
  Play,
  Palette,
  Check,
  AlertCircle,
  MessageSquare,
  Save,
  FolderOpen,
  ArrowLeft,
  History,
  Home as HomeIcon,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product, Tailor, ProductPageConfig } from '../types';
import { getProductById, getTailorById } from '../services/mockService';
import { useApp } from '../context/AppContext';
import { useAuth } from '../src/auth/useAuth';
import { useQuery } from '@tanstack/react-query';
import { StableImage } from '../components/StableImage';
import { MobileProductDetails } from '@/src/components/product-details/MobileProductDetails';
import { measurementService } from '@/src/modules/measurements/services/measurementService';
import { firebaseService } from '@/src/services/firebase';
import { MontHeader } from '@/src/components/MontHeader';
import { useMeasurementTemplate, MeasurementTemplateContent } from '@/src/hooks/useMeasurementTemplate';

// --- Sub-components ---

const ImageGallery = React.memo(({ 
  images, 
  currentIndex, 
  onIndexChange,
  productName
}: { 
  images: string[]; 
  currentIndex: number; 
  onIndexChange: (idx: number) => void;
  productName: string;
}) => {
  const nextImage = () => onIndexChange((currentIndex + 1) % images.length);
  const prevImage = () => onIndexChange((currentIndex - 1 + images.length) % images.length);

  return (
    <section className="relative w-full md:w-[40%] min-h-[50vh] md:h-full bg-white flex flex-col items-center justify-start flex-shrink-0 border border-black/5 rounded-3xl shadow-sm overflow-hidden">
        {images.length > 0 ? (
           <>
              <div className="w-full flex-1 relative flex items-center justify-center min-h-0 bg-[#fbfbfb]">
                  <div className="relative h-full flex items-center justify-center group/image-scroll">
                    <StableImage 
                      src={images[currentIndex]} 
                      alt={productName}
                      aspectClass="h-full"
                      className="!w-auto h-full bg-transparent p-4 md:p-8"
                      imgClassName="!relative !inset-auto h-full w-auto object-contain drop-shadow-2xl rounded-3xl"
                    />

                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20 pointer-events-none opacity-0 group-hover/image-scroll:opacity-100 transition-opacity">
                      {images.map((_, idx) => (
                        <div 
                          key={idx}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            currentIndex === idx ? 'w-8 bg-theme-primary' : 'w-2 bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        title="الصورة السابقة"
                        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 transition-all text-gray-700 border border-gray-200 shadow-lg opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                      >
                        <ChevronRight size={24} />
                      </button>
                      <button
                        onClick={nextImage}
                        title="الصورة التالية"
                        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 hover:bg-white backdrop-blur-sm rounded-2xl flex items-center justify-center z-10 transition-all text-gray-700 border border-gray-200 shadow-lg opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                      >
                        <ChevronLeft size={24} />
                      </button>
                    </>
                  )}
              </div>

              <div className="w-full px-4 pb-4 pt-2 flex justify-center gap-3 overflow-x-auto no-scrollbar z-20 h-auto flex-shrink-0">
                {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => onIndexChange(idx)}
                      title={`عرض الصورة ${idx + 1}`}
                      className={`relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                          currentIndex === idx 
                          ? 'border-theme-primary ring-2 ring-theme-primary/20 scale-110 shadow-lg' 
                          : 'border-transparent opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                ))}
              </div>
           </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
             <div className="text-center">
                <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                <p>لا توجد صور</p>
             </div>
          </div>
        )}
    </section>
  );
});

const MeasurementInstructionsCollapsible = React.memo(({ 
  template,
  measurementHook,
  forceOpen = false,
  onToggle,
  onSaveToProfile,
  onApplyProfile
}: { 
  template: any, 
  measurementHook: any,
  forceOpen?: boolean,
  onToggle?: (isOpen: boolean) => void,
  onSaveToProfile: () => void,
  onApplyProfile: () => void
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const prevForceOpenRef = React.useRef(forceOpen);

  React.useEffect(() => {
    // Only toggle when forceOpen changes from false to true
    if (forceOpen && !prevForceOpenRef.current) {
      setIsOpen(true);
      onToggle?.(true);
    }
    prevForceOpenRef.current = forceOpen;
  }, [forceOpen]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    onToggle?.(next);
  };

  if (!measurementHook.hasTemplate) return null;

  return (
    <div>
      <div className="flex items-center justify-between py-2">
        <button
          onClick={toggle}
          className="flex items-center gap-2 text-xs font-black text-gray-500 uppercase tracking-widest hover:text-gray-900 transition-colors"
        >
          <span>توجيهات القياس</span>
          <Ruler size={14} className="text-emerald-500" />
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pb-3 border-b border-gray-100">
          {/* Instructions Block - Desktop */}
          <div className="mb-4 p-5 bg-[#fbfbfb] rounded-2xl border border-gray-100 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-gray-900 mb-1">تعليمات القياس</h4>
                  <p className="text-[11px] text-gray-500 font-bold max-w-md leading-relaxed">
                    يرجى اتباع الرسم التوضيحي أدناه لإدخال مقاساتك بدقة. جميع المقاسات يفضل أن تكون بالسنتيمتر.
                  </p>
                </div>
                <button 
                  onClick={() => measurementHook.setShowVideoDialog(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
                >
                  <Play size={14} className="fill-emerald-500 text-emerald-500" />
                  <span>فيديو توضيحي</span>
                </button>
              </div>
          </div>

          {/* Action Toolbar - Below Instructions */}
          <div className="flex items-center justify-end gap-2 mb-6">
             <button 
                onClick={onApplyProfile}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#f5f5f5] border border-gray-100 rounded-xl text-[10px] font-bold text-gray-600 hover:text-theme-primary transition-all active:scale-95 shadow-sm"
             >
                <FolderOpen size={14} className="text-theme-primary" />
                <span>تحميل مقاس محفوظ</span>
             </button>
             <button 
                onClick={onSaveToProfile}
                className="flex items-center gap-1.5 px-3 py-2 bg-theme-primary/10 text-theme-primary border border-theme-primary/10 rounded-xl text-[10px] font-bold hover:bg-theme-primary hover:text-white transition-all active:scale-95 shadow-sm"
             >
                <Save size={14} />
                <span>حفظ هذه المقاسات</span>
             </button>
          </div>

          <MeasurementTemplateContent
            template={template}
            measurements={measurementHook.measurements}
            onMeasurementChange={measurementHook.handleMeasurementChange}
            onShowVideo={() => measurementHook.setShowVideoDialog(true)}
            PointMarkerComponent={PointMarker}
          />
        </div>
      )}

      <VideoDialog 
        isOpen={measurementHook.showVideoDialog} 
        onClose={() => measurementHook.setShowVideoDialog(false)} 
        videoUrl={measurementHook.videoUrl} 
      />
    </div>
  );
});

// --- Saved Measurements Modal ---
const SavedMeasurementsSheet = React.memo(({ 
    isOpen, 
    onClose, 
    profiles, 
    onSelect 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    profiles: any[]; 
    onSelect: (p: any) => void;
}) => {
    if (!isOpen) return null;

    return createPortal(
        <div 
            className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[70vh]"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                            <FolderOpen size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900">المقاسات المحفوظة</h3>
                            <p className="text-[9px] font-bold text-gray-400">اختر ملفاً لتحميل القياسات</p>
                        </div>
                    </div>
                    <button onClick={onClose} title="إغلاق" className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={18} className="text-gray-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {profiles.length === 0 ? (
                        <div className="py-10 flex flex-col items-center text-center opacity-30">
                             <Ruler size={32} className="mb-3" />
                             <p className="text-xs font-bold uppercase tracking-wider">لا توجد مقاسات محفوظة</p>
                        </div>
                    ) : (
                        profiles.map((profile) => (
                            <button
                                key={profile.id}
                                onClick={() => onSelect(profile)}
                                className="w-full p-3 rounded-xl border border-gray-100 hover:border-theme-primary hover:bg-theme-primary/5 transition-all text-right group flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-bold text-gray-900 text-xs mb-0.5">{profile.name}</div>
                                    <div className="flex items-center gap-2 text-[9px] text-gray-400 font-bold uppercase">
                                        <span>{profile.type}</span>
                                        <span>•</span>
                                        <span>{Object.keys(profile.metrics || {}).length} مقاسات</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-theme-primary group-hover:text-white transition-all">
                                    <ChevronLeft size={16} className="rotate-180" />
                                </div>
                            </button>
                        ))
                    )}
                </div>
                
                <div className="p-4 bg-gray-50 text-center">
                    <p className="text-[9px] text-gray-400 font-bold">يمكنك إدارة مقاساتك من "ملفات القياس" في حسابك</p>
                </div>
            </div>
        </div>,
        document.body
    );
});

const MeasurementTemplatePreview = React.memo(({ 
  template, 
  measurements, 
  handleMeasurementChange,
  onSaveToProfile,
  onApplyProfile
}: { 
  template: any;
  measurements: Record<string, number>;
  handleMeasurementChange: (id: string, val: string) => void;
  onSaveToProfile: () => void;
  onApplyProfile: () => void;
}) => {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  
  if (!template || !template.points?.length) return null;

  const ordered = [...template.points].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
  const showFallbackBg = !template.baseImageUrl;

  const videoUrl = template.videoUrl || template.tutorialVideoUrl || 'https://www.youtube.com/watch?v=6eZtn5Du8O4';

  return (
    <div className="mt-8 pt-8 border-t border-gray-200">
       <div className="flex items-center justify-between mb-6">
          <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">توجيهات القياس</h3>
          <div className="flex items-center gap-2">
             <Ruler size={14} className="text-emerald-500" />
             <span className="text-xs font-bold text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">{template.name}</span>
          </div>
       </div>

       {/* Instructions Block - Above Diagram */}
       <div className="mb-6 p-5 bg-[#ededed] rounded-3xl border border-gray-200/50 space-y-4">
          <div className="flex flex-col gap-1.5">
             <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-black text-gray-900">تعليمات القياس:</p>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={onApplyProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-[10px] font-bold text-gray-600 hover:text-theme-primary hover:border-theme-primary/30 transition-all shadow-sm active:scale-95"
                      title="تحميل مقاس محفوظ"
                   >
                      <FolderOpen size={14} className="text-theme-primary" />
                      <span>تحميل</span>
                   </button>
                   <button 
                      onClick={onSaveToProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-theme-primary text-white rounded-xl text-[10px] font-bold hover:bg-emerald-600 transition-all shadow-sm active:scale-95"
                      title="حفظ هذه المقاسات"
                   >
                      <Save size={14} />
                      <span>حفظ</span>
                   </button>
                </div>
             </div>
             <p className="text-xs text-gray-600 leading-relaxed font-normal">
                يرجى إدخال القياسات الصحيحة (بالسنتيمتر) في الخانات الموضحة على الرسم أدناه. يمكنك النقر مباشرة على الخانة وتعديل الرقم.
             </p>
          </div>

          <button 
             className="w-full flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 rounded-2xl text-gray-700 hover:bg-gray-50 transition-all font-medium text-sm shadow-sm"
             onClick={() => setShowVideoDialog(true)}
          >
             <Play size={18} className="text-emerald-500 fill-emerald-500" />
             <span>مشاهدة فيديو توضيحي لطريقة أخذ القياس</span>
          </button>
       </div>
       
       <div className="relative w-full aspect-[3/4] bg-[#fdfdfd] rounded-2xl border border-gray-200 shadow-sm overflow-visible">
          {template.baseImageUrl ? (
             <img 
                src={template.baseImageUrl} 
                alt={template.name}
                className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90 rounded-2xl"
                loading="lazy"
             />
          ) : (
             <div className="absolute inset-0 flex items-center justify-center opacity-5">
                <img src="/logo_big.png?v=4" alt="" className="w-32 h-auto grayscale" />
             </div>
          )}

          {/* Arrows from template or default sequential */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <marker id="arrowhead-preview-v3" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L0,6 L6,3 z" fill="#10b981" />
              </marker>
            </defs>
            {template.arrows && template.arrows.length > 0 ? (
              template.arrows.map((arrow: any) => (
                <line
                  key={arrow.id}
                  x1={arrow.startX * 100}
                  y1={arrow.startY * 100}
                  x2={arrow.endX * 100}
                  y2={arrow.endY * 100}
                  stroke="#10b981"
                  strokeWidth={0.45}
                  markerEnd="url(#arrowhead-preview-v3)"
                  opacity={0.7}
                />
              ))
            ) : ordered.length > 1 && (
              ordered.map((point: any, idx: number) => {
                const next = ordered[idx + 1];
                if (!next) return null;
                return (
                  <line
                    key={`${point.id}-${next.id}`}
                    x1={point.x * 100}
                    y1={point.y * 100}
                    x2={next.x * 100}
                    y2={next.y * 100}
                    stroke="#10b981"
                    strokeWidth={showFallbackBg ? 0.35 : 0.45}
                    markerEnd="url(#arrowhead-preview-v3)"
                    opacity={showFallbackBg ? 0.35 : 0.7}
                  />
                );
              })
            )}
          </svg>
          
          {template.points.map((point: any, idx: number) => {
             const order = point.order || idx + 1;
             return (
                <PointMarker 
                  key={point.id} 
                  point={point} 
                  order={order} 
                  value={measurements[point.id]}
                  onChange={(val) => handleMeasurementChange(point.id, val)}
                />
             );
          })}
       </div>

       <VideoDialog 
        isOpen={showVideoDialog} 
        onClose={() => setShowVideoDialog(false)} 
        videoUrl={videoUrl} 
      />
    </div>
  );
});

const ProductSummaryDialog = React.memo(({ 
    isOpen, 
    onClose, 
    product, 
    tailor, 
    measurements, 
    template,
    onConfirm,
    isSubmitting,
    isSuccess,
    comments,
    showDuplicateWarning,
    onConfirmDuplicate,
    onCancelDuplicate
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    product: any; 
    tailor: any; 
    measurements: Record<string, number>; 
    template: any;
    onConfirm: (ignoreDuplicate?: boolean) => void;
    isSubmitting: boolean;
    isSuccess?: boolean;
    comments?: string;
    showDuplicateWarning?: boolean;
    onConfirmDuplicate?: () => void;
    onCancelDuplicate?: () => void;
}) => {
    if (!isOpen) return null;

    const formatOmr = (price: number | string | undefined): string => {
        if (!price) return '0.000';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(3);
    };

    const measurementItems = template?.points?.map((p: any) => ({
        label: p.label || p.name,
        value: measurements[p.id] || '—'
    })) || [];

    const navigate = useNavigate();

    return createPortal(
        <div 
            className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
                dir="rtl"
            >
                {/* Duplicate Order Warning Overlay */}
                {showDuplicateWarning && (
                    <div className="absolute inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center p-8 animate-in fade-in duration-300">
                        <div className="flex flex-col items-center text-center space-y-6">
                            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-amber-500 shadow-inner">
                                <AlertCircle size={40} strokeWidth={2.5} />
                            </div>
                            
                            <div className="space-y-2">
                                <h4 className="text-xl font-black text-gray-900">هذا الطلب مرسل مسبقاً!</h4>
                                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                                    لقد قمت بإرسال طلب لهذا المنتج بنفس المقاسات بالضبط سابقاً. 
                                    هل ترغب في إرسال طلب جديد متطابق أم ترغب في تعديل المقاسات؟
                                </p>
                            </div>

                            <div className="w-full flex flex-col gap-3">
                                <button 
                                    onClick={onConfirmDuplicate}
                                    className="w-full h-14 bg-theme-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
                                >
                                    نعم، أريد الإرسال مرة أخرى
                                </button>
                                
                                <button 
                                    onClick={onCancelDuplicate}
                                    className="w-full h-14 bg-white border-2 border-theme-primary text-theme-primary rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all"
                                >
                                    سأقوم بتغيير المقاسات
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Header */}
                <div className="p-4 px-6 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-black text-gray-900">{isSuccess ? "تم إرسال الطلب" : "ملخص الطلب"}</h3>
                    <button 
                        onClick={onClose}
                        title="إغلاق"
                        aria-label="إغلاق"
                        className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {isSuccess ? (
                    <div className="p-8 flex flex-col items-center text-center animate-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-inner mb-6">
                            <CheckCircle2 size={56} strokeWidth={2.5} />
                        </div>
                        
                        <div className="space-y-2 mb-8">
                            <h4 className="text-2xl font-black text-gray-900">شكراً لك! تم إرسال الطلب</h4>
                            <p className="text-sm text-gray-500 leading-relaxed font-medium max-w-[280px]">
                                تم إرسال طلب التفصيل الخاص بك إلى الخياط <span className="text-theme-primary font-bold">{tailor?.name}</span>. 
                                يمكنك متابعة حالة الطلب من ملفك الشخصي.
                            </p>
                        </div>

                        {/* Navigation Actions */}
                        <div className="w-full grid gap-3">
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => navigate(`/tailor/${tailor?.id}`)}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-[#fbfbfb] border border-gray-100 rounded-2xl hover:bg-theme-primary/5 hover:border-theme-primary/20 transition-all font-bold text-gray-900 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-theme-primary/10 flex items-center justify-center text-theme-primary group-hover:bg-theme-primary group-hover:text-white transition-colors">
                                        <User size={20} />
                                    </div>
                                    <span className="text-[11px]">زيارة صفحة الخياط</span>
                                </button>
                                
                                <button 
                                    onClick={() => navigate('/account?tab=orders')}
                                    className="flex flex-col items-center justify-center gap-2 p-4 bg-[#fbfbfb] border border-gray-100 rounded-2xl hover:bg-emerald-50 hover:border-emerald-200 transition-all font-bold text-gray-900 group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <History size={20} />
                                    </div>
                                    <span className="text-[11px]">متابعة طلباتي</span>
                                </button>
                            </div>

                            <button 
                                onClick={() => navigate('/')}
                                className="w-full h-14 bg-gray-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
                            >
                                <HomeIcon size={18} />
                                <span>العودة للرئيسية</span>
                            </button>

                            <button 
                                onClick={onClose}
                                className="w-full py-4 text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-2 border border-transparent hover:border-gray-100 rounded-2xl"
                            >
                                <ArrowLeft size={14} className="rotate-180" />
                                <span>البقاء في صفحة المنتج</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                            {/* Product Info */}
                            <div className="flex gap-4 items-start">
                                <div className="w-20 h-24 bg-[#fbfbfb] rounded-xl border border-gray-100 p-2 shrink-0">
                                    <img 
                                        src={product.image || (product.images && product.images[0])} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain drop-shadow-md"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <h4 className="text-sm font-black text-gray-900 uppercase tracking-tight truncate">{product.name}</h4>
                                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{product.category || 'تفصيل'}</p>
                                    
                                    <div className="mt-3 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-100 shrink-0">
                                            <img src={tailor?.image} alt={tailor?.name} className="w-full h-full object-cover" />
                                        </div>
                                        <span className="text-xs font-bold text-theme-primary">{tailor?.name}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Measurements Summary */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <Ruler size={14} />
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">المقاسات المسجلة</h5>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {measurementItems.length > 0 ? measurementItems.map((item: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-100 flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-500">{item.label}</span>
                                            <span className="text-xs font-black text-gray-900">{item.value} <span className="text-[8px] font-medium text-gray-400">سم</span></span>
                                        </div>
                                    )) : (
                                        <div className="col-span-2 text-center py-4 text-xs text-gray-400 italic">
                                            لم يتم إدخال مقاسات
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Comments Summary if exists */}
                            {comments && (
                                <div className="space-y-2">
                                    <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">ملاحظات إضافية</h5>
                                    <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-xs text-gray-700 leading-relaxed italic">
                                        "{comments}"
                                    </div>
                                </div>
                            )}

                            {/* Price Summary */}
                            <div className="bg-[#fbfbfb] rounded-2xl p-5 border border-gray-100 space-y-3">
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>سعر الخياطة</span>
                                    <span className="text-gray-900">{formatOmr(product.price)} ر.ع</span>
                                </div>
                                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                    <span>رسوم الخدمة</span>
                                    <span className="text-gray-900">0.000 ر.ع</span>
                                </div>
                                <div className="h-px bg-gray-200 my-1" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-black uppercase tracking-widest text-theme-primary">المجموع الكلي</span>
                                    <span className="text-xl font-black text-gray-900">{formatOmr(product.price)} ر.ع</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 bg-white border-t border-gray-100">
                            <button 
                                onClick={onConfirm}
                                disabled={isSubmitting}
                                className="w-full h-14 bg-theme-primary hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl font-black text-sm uppercase tracking-widest shadow-xl shadow-theme-primary/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Check size={20} strokeWidth={3} />
                                        إرسال طلب التفصيل للخياط
                                    </>
                                )}
                            </button>
                            <p className="mt-4 text-center text-[10px] text-gray-400 font-medium">
                                بالضغط على تأكيد، فإنك توافق على شروط وأحكام خيوط
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
});

const PointMarker = ({ point, order, value, onChange }: { point: any, order: number, value?: number, onChange?: (val: string) => void, key?: any }) => {
  const ref = React.useRef<HTMLDivElement>(null);
  const hasValue = value !== undefined && value > 0;
  
  React.useEffect(() => {
    if (ref.current) {
      ref.current.style.left = (point.x * 100) + '%';
      ref.current.style.top = (point.y * 100) + '%';
    }
  }, [point.x, point.y]);

  return (
    <div 
       ref={ref}
       className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-auto cursor-pointer"
    >
       {/* Label & Input Container */}
       <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
          <div className="px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[9px] sm:text-[10px] font-normal text-white whitespace-nowrap mb-1 shadow-xl border border-white/10">
            {point.label || point.name}
          </div>
          
          <div className="relative group/input" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              step="0.5"
              min="0"
              value={value || ''}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder="0"
              className={`w-12 h-8 px-1 text-[10px] sm:text-xs text-center border-2 rounded-lg shadow-2xl transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:w-16 bg-white/95 backdrop-blur-md font-black ${
                hasValue ? 'border-emerald-500 text-emerald-600' : 'border-gray-200 text-gray-800'
              }`}
            />
            <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-500 group-focus-within/input:opacity-100 opacity-0 transition-opacity">سم</span>
          </div>
       </div>
    </div>
  );
};

const StartTailoringModal = React.memo(({ 
  onClose, 
  onNavigate, 
  productId,
  config 
}: { 
  onClose: () => void; 
  onNavigate: (path: string) => void;
  productId: string;
  config: ProductPageConfig;
}) => (
  <div 
    className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    onClick={onClose}
    data-overlay="khuyoot-modal"
  >
    <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-gray-200 overflow-hidden" 
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
    >
        <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-[#ededed]">
          <div className="flex items-center gap-3">
              <img src="/logo_big.png?v=4" alt="Khuyoot" className="h-12 w-auto" />
              <h3 className="text-lg font-black text-gray-900 uppercase">اختر الخطوة التالية</h3>
          </div>
          <button 
              onClick={onClose}
              title="إغلاق"
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
          >
              <X size={18} />
          </button>
        </div>

        <div className="p-6 grid gap-4 bg-[#ededed]">
              {config.buttons.tryFabric.enabled && (
                <button 
                   onClick={() => onNavigate(`/tryon/${productId}`)}
                   className="w-full group relative flex items-center gap-4 p-3 rounded-2xl bg-white border border-gray-200 hover:border-theme-primary hover:shadow-lg hover:-translate-y-0.5 transition-all text-right overflow-hidden"
                >
                    <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-black shadow-inner border border-[var(--studio-card-border)]">
                        <video
                          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                          src="/videos/designer/Comparison_01.mp4"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl" />
                    </div>

                    <div className="flex-1 py-1 z-10">
                        <div className="flex items-center justify-between mb-1.5">
                           <div className="font-black text-gray-900 text-base">
                              تجربة قماش مختلف
                           </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                           صممي عبايتك بنفسك، اختاري القماش، وعدلي التفاصيل وشوفي النتيجة 
                        </p>
                    </div>
                    
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:bg-theme-primary group-hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                       <ChevronLeft size={18} className="rtl:rotate-0" />
                    </div>
                </button>
              )}

              {config.buttons.measurements.enabled && (
                <button 
                   onClick={() => onNavigate(`/measurements/${productId}`)}
                   className="w-full group relative flex items-center gap-4 p-3 rounded-2xl bg-white border border-gray-200 hover:border-theme-primary hover:shadow-lg hover:-translate-y-0.5 transition-all text-right overflow-hidden"
                >
                    <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-black shadow-sm border border-gray-200">
                        <video
                          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                          src="/videos/designer/0114.mp4"
                          muted
                          loop
                          playsInline
                          autoPlay
                        />
                        <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-xl" />
                    </div>

                    <div className="flex-1 py-1 z-10">
                        <div className="flex items-center justify-between mb-1.5">
                           <div className="font-black text-gray-900 text-base">
                              أخذ المقاسات
                           </div>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                           اضبطي مقاساتك بدقة باستخدام تقنية القياس الذكي لضمان المقاس المثالي
                        </p>
                    </div>

                    <div className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white flex items-center justify-center text-gray-400 group-hover:bg-theme-primary group-hover:text-white transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                       <ChevronLeft size={18} className="rtl:rotate-0" />
                    </div>
                </button>
              )}

        </div>
        
        <div className="p-5 bg-white border-t border-gray-200">
          <button 
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-medium text-gray-600 hover:text-gray-900 hover:bg-[#ededed] transition-colors text-sm"
          >
              إلغاء
          </button>
        </div>
    </div>
  </div>
));

const VideoDialog = React.memo(({ isOpen, onClose, videoUrl }: { isOpen: boolean; onClose: () => void; videoUrl: string }) => {
  if (!isOpen) return null;

  // Helper function to convert YouTube URL to embed format (copied from ClientMeasurementsV2)
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    const watchMatch = url.match(/[?&]v=([^&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    const shortMatch = url.match(/youtu\.be\/([^?]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return createPortal(
    <div 
      className="fixed inset-0 z-[11000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          title="إغلاق"
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-all backdrop-blur-sm"
        >
          <X size={20} />
        </button>

        {embedUrl ? (
          <iframe
            src={`${embedUrl}?autoplay=1`}
            title="فيديو تعليمات القياس"
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/50">
            <p>الفيديو غير متوفر</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
});

// --- Main Component ---

export const ProductDetails = ({
  forcedProductId,
  embedded = false,
}: {
  forcedProductId?: string;
  embedded?: boolean;
}) => {
  const { t } = useTranslation(['common', 'product']);
  const { id } = useParams<{ id: string }>();
  const productId = forcedProductId ?? id;
  const navigate = useNavigate();
  const { addToCart, appSettings } = useApp();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showStartTailoringActions, setShowStartTailoringActions] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [forceOpenMeasurements, setForceOpenMeasurements] = useState(false);
  const [isMeasurementsPanelOpen, setIsMeasurementsPanelOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);
  const [duplicateOrder, setDuplicateOrder] = useState<any>(null);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);
  const [measurementError, setMeasurementError] = useState<string | null>(null);
  const [customerComments, setCustomerComments] = useState("");
  const [showCommentsField, setShowCommentsField] = useState(false);
  const [savedMeasurementProfiles, setSavedMeasurementProfiles] = useState<any[]>([]);
  const [showSavedMeasurementsModal, setShowSavedMeasurementsModal] = useState(false);
  const [isSavingMeasurement, setIsSavingMeasurement] = useState(false);
  const measurementsRef = React.useRef<HTMLDivElement>(null);

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => (productId ? getProductById(productId) : Promise.resolve(null)),
    enabled: !!productId,
  });

  const product = productQuery.data ?? null;
  const measurementHook = useMeasurementTemplate({ template });

  // --- Fetch Saved Measurements ---
  useEffect(() => {
    if (user?.uid) {
      firebaseService.getMeasurements(user.uid).then(setSavedMeasurementProfiles);
    }
  }, [user?.uid]);

  const handleSaveToProfile = async () => {
    if (!user?.uid) {
       alert("يرجى تسجيل الدخول لحفظ المقاسات");
       return;
    }

    const hasData = Object.keys(measurementHook.measurements).length > 0;
    if (!hasData) {
       alert("يرجى إدخال المقاسات أولاً");
       return;
    }

    const profileName = prompt("أدخل اسماً لهذا المقاس (مثلاً: مقاسي الخاص، مقاس للدوام):", `مقاس ${product?.name || ''}`);
    if (!profileName) return;

    setIsSavingMeasurement(true);
    try {
      const newProfile = {
        userId: user.uid,
        name: profileName,
        type: product?.category || 'dress',
        metrics: measurementHook.measurements,
        notes: customerComments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const profileId = await firebaseService.saveMeasurement(newProfile);
      setSavedMeasurementProfiles(prev => [{ ...newProfile, id: profileId }, ...prev]);
      alert("تم حفظ المقاس بنجاح في ملفك الشخصي");
    } catch (error) {
      console.error("Error saving measurement profile:", error);
      alert("حدث خطأ أثناء حفظ المقاس");
    } finally {
      setIsSavingMeasurement(false);
    }
  };

  const handleApplyProfile = (profile: any) => {
    if (profile.metrics) {
      // Only apply measurements that exist in the current template
      const currentPointIds = new Set(template?.points?.map((p: any) => p.id) || []);
      const filteredMetrics: Record<string, number> = {};
      
      Object.entries(profile.metrics).forEach(([id, val]) => {
        if (currentPointIds.has(id)) {
          filteredMetrics[id] = val as number;
        }
      });

      measurementHook.setMeasurements(filteredMetrics);
      
      if (profile.notes) {
        setCustomerComments(profile.notes);
        setShowCommentsField(true);
      }
      setShowSavedMeasurementsModal(false);
    }
  };

  // --- Persistence Logic ---
  const storageKey = useMemo(() => {
    if (!productId) return null;
    const userPrefix = user?.uid ? `u_${user.uid}_` : 'guest_';
    return `khuyoot_customization_${userPrefix}${productId}`;
  }, [productId, user?.uid]);

  // Load saved data on mount or productId change
  useEffect(() => {
    if (!storageKey) return;
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        if (parsed.measurements && Object.keys(parsed.measurements).length > 0) {
          measurementHook.setMeasurements(parsed.measurements);
        }
        if (parsed.comments) {
          setCustomerComments(parsed.comments);
        }
        if (parsed.showComments) {
          setShowCommentsField(true);
        }
      } catch (e) {
        console.error("Error loading saved customization", e);
      }
    }
  }, [storageKey]);

  // Save data whenever it changes
  useEffect(() => {
    if (!storageKey) return;
    
    // Only save if there's actually something to save to avoid empty overwrites on initial load
    const hasData = Object.keys(measurementHook.measurements).length > 0 || customerComments.length > 0;
    
    if (hasData) {
      const dataToSave = {
        measurements: measurementHook.measurements,
        comments: customerComments,
        showComments: showCommentsField
      };
      localStorage.setItem(storageKey, JSON.stringify(dataToSave));
    }
  }, [measurementHook.measurements, customerComments, showCommentsField, storageKey]);

  useEffect(() => {
    if (product) {
       measurementService.getTemplateForProduct(product).then(setTemplate);
    }
  }, [product]);
  
  const [isMobile, setIsMobile] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia?.('(max-width: 767px)')?.matches ?? false;
  });

  React.useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = () => setIsMobile(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('modal-open', showStartTailoringActions);
    return () => document.body.classList.remove('modal-open');
  }, [showStartTailoringActions]);

  const pageConfig: ProductPageConfig = appSettings?.productPageConfig || {
    buttons: {
      tryFabric: { enabled: true, title: "جربي القماش", subtitle: "تصور 3D", cta: "فتح المعمل", mediaType: 'graphic', graphicType: 'fabric' },
      measurements: { enabled: true, title: "المقاسات", subtitle: "ضبط المقاسات", cta: "تكوين", mediaType: 'graphic', graphicType: 'measurements' }
    },
    thumbnails: { size: 80, gap: 12, borderRadius: 16, aspectRatio: 'video' }
  };

  const tailorQuery = useQuery({
    queryKey: ['tailor', product?.tailorId],
    queryFn: () => (product?.tailorId ? getTailorById(product.tailorId) : Promise.resolve(null)),
    enabled: !!product?.tailorId,
  });

  const tailor = (tailorQuery.data ?? null) as Tailor | null;

  const productImages = React.useMemo(() => {
    if (!product) return [];
    const images = product.images && product.images.length > 0 ? product.images : [product.image];
    return Array.from(new Set(images.filter(Boolean)));
  }, [product]);

  if (productQuery.isLoading || (!product && !!productId)) {
    return <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-[#ededed] text-gray-600">جاري التحميل...</div>;
  }

  const handleAddToCart = () => {
    if (product) {
      addToCart({
        productId: product.id,
        quantity: 1,
        price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      });
    }
  };

  const handleReviewOrder = () => {
    if (!template?.points) return;
    
    const missingPoints = template.points.filter((p: any) => !measurementHook.measurements[p.id]);
    
    if (missingPoints.length > 0) {
      setMeasurementError("يرجى ملأ جميع بيانات المقاسات في الرسم التوضيحي للمتابعة");
      return;
    }
    
    setMeasurementError(null);
    setIsOrderSuccess(false); // Reset success state when opening new summary
    setIsSummaryOpen(true);
  };

  const handlePlaceOrder = async (ignoreDuplicate = false) => {
    if (!product || !tailor || isSubmittingOrder) return;
    
    setIsSubmittingOrder(true);
    try {
      // Create a mapping of measurement point IDs to labels for the tailor
      const measurementLabels: Record<string, string> = {};
      template?.points?.forEach((p: any) => {
        measurementLabels[p.id] = p.label || p.name || p.id;
      });

      // Filter measurements to only include those in the current template
      const filteredMeasurements: Record<string, number> = {};
      template?.points?.forEach((p: any) => {
        if (measurementHook.measurements[p.id] !== undefined) {
          filteredMeasurements[p.id] = measurementHook.measurements[p.id];
        }
      });

      // Check for duplicates first if not explicitly ignored
      if (!ignoreDuplicate && (user?.uid || (user as any)?.id)) {
        const currentPrice = typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0);
        const existingOrder = await firebaseService.findMatchingOrder(
          user?.uid || (user as any)?.id, 
          product.id, 
          filteredMeasurements,
          customerComments,
          tailor.id,
          currentPrice
        );
        
        if (existingOrder) {
          setDuplicateOrder(existingOrder);
          setShowDuplicateWarning(true);
          setIsSubmittingOrder(false);
          return;
        }
      }

      const orderData = {
        productId: product.id,
        productName: product.name,
        productImage: product.image || (product.images && product.images[0]),
        price: typeof product.price === 'string' ? parseFloat(product.price) : (product.price || 0),
        tailorId: tailor.id,
        tailorName: tailor.name,
        tailorLocation: tailor.location || tailor.region,
        measurements: filteredMeasurements,
        measurementLabels: measurementLabels,
        templateId: template?.id,
        templateUrl: template?.imageUrl || template?.baseImageUrl,
        templatePoints: template?.points || [],
        templateArrows: template?.arrows || [],
        comments: customerComments,
        customerName: user?.displayName || (user as any)?.name || 'عميل خيوط',
        customerEmail: user?.email || '',
        customerPhone: (user as any)?.phone || '',
        status: 'pending',
        submissionStatus: 'submitted', 
        createdAt: new Date().toISOString(),
        userId: user?.uid || (user as any)?.id || null 
      };

      await firebaseService.createOrder(orderData);
      setIsOrderSuccess(true);
      // We don't close the dialog immediately, the user wants to see the success message
    } catch (error) {
      console.error('Error placing order:', error);
      alert('حدث خطأ أثناء إتمام الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (isMobile) {
    return (
      <MobileProductDetails
        product={product}
        tailor={tailor}
        productImages={productImages}
        currentImageIndex={currentImageIndex}
        setCurrentImageIndex={setCurrentImageIndex}
        isLiked={isLiked}
        onLikeToggle={() => setIsLiked(!isLiked)}
        onBack={() => navigate(-1)}
        onStartTailoring={() => setShowStartTailoringActions(true)}
        onAddToCart={handleAddToCart}
        template={template}
        measurementHook={measurementHook}
        onPlaceOrder={handleReviewOrder}
        measurementError={measurementError}
        customerComments={customerComments}
        setCustomerComments={setCustomerComments}
        showCommentsField={showCommentsField}
        setShowCommentsField={setShowCommentsField}
        onSaveToProfile={handleSaveToProfile}
        onApplyProfile={() => setShowSavedMeasurementsModal(true)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#ededed] dir-rtl font-sans">
      <MontHeader />

      <main className="flex flex-col md:flex-row w-full md:h-[calc(100vh-72px)] bg-[#ededed] dir-rtl px-2 md:px-8 py-2 gap-8 md:overflow-hidden">
        <ImageGallery 
            images={productImages} 
            currentIndex={currentImageIndex} 
            onIndexChange={setCurrentImageIndex}
            productName={product.name}
        />

        <section className="w-full md:w-[60%] h-full overflow-y-auto custom-scrollbar bg-white border border-black/5 rounded-3xl shadow-sm">
          <div className="p-6 md:p-8 max-w-2xl mx-auto min-h-full flex flex-col space-y-4">
              
              <div className="flex items-center justify-between">
                <button 
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1);
                    } else if (tailor?.id) {
                      navigate(`/tailor/${tailor.id}`);
                    } else {
                      navigate('/');
                    }
                  }}
                  className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
                  title="رجوع"
                >
                  <ArrowRight size={16} className="rtl:rotate-180" />
                  <span className="text-xs font-bold">رجوع</span>
                </button>

                <div className="flex items-center gap-2">
                  <button 
                     onClick={() => setIsLiked(!isLiked)}
                     title={isLiked ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
                     className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                        isLiked 
                        ? 'border-rose-200 bg-rose-50 text-rose-500' 
                        : 'border-gray-200 bg-white text-gray-400 hover:text-rose-500'
                     }`}
                  >
                     <Heart size={16} className={isLiked ? "fill-current" : ""} />
                  </button>
                  
                  <button 
                   title="مشاركة"
                   className="w-9 h-9 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-theme-primary flex items-center justify-center transition-all"
                  >
                     <Share2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-black text-gray-900 leading-tight tracking-tight">
                    {product.name}
                  </h1>
                  {product.price && (
                    <>
                      <div className="w-px h-5 bg-gray-300"></div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-gray-900">{product.price}</span>
                        <span className="text-xs font-bold text-gray-600">ر.ع</span>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Compact Info Table */}
                <div className="grid grid-cols-3 divide-x divide-x-reverse border border-gray-100 rounded-2xl overflow-hidden bg-[#fbfbfb] shadow-sm">
                   {/* Col 1: Tailor */}
                   <div 
                    className="p-3 flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => tailor && navigate(`/tailor/${tailor.id}`)}
                   >
                     {tailor?.image ? (
                        <img src={tailor.image} alt={tailor.name} className="w-6 h-6 rounded-full object-cover shadow-sm" />
                     ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                           <User size={12} />
                        </div>
                     )}
                     <div className="flex items-center gap-1">
                       <span className="text-[10px] font-black text-gray-900 truncate max-w-[80px]">
                          {tailor?.name || product.tailorName || 'المصمم'}
                       </span>
                       {tailor?.approvalStatus === 'approved' && <CheckCircle2 size={10} className="text-theme-primary" />}
                     </div>
                   </div>

                   {/* Col 2: Duration */}
                   <div className="p-3 flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1 text-gray-400">
                         <Clock size={12} />
                         <span className="text-[8px] font-black uppercase tracking-tighter">مدة التنفيذ</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-900">{product.duration || '7-10 أيام'}</span>
                   </div>

                   {/* Col 3: Location */}
                   <div className="p-3 flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1 text-gray-400">
                         <MapPin size={12} />
                         <span className="text-[8px] font-black uppercase tracking-tighter">الموقع</span>
                      </div>
                      <span className="text-[10px] font-bold text-gray-900">{product.location || 'مسقط'}</span>
                   </div>
                </div>
              </div>

              <div className="space-y-3 py-5 border-y border-gray-100 my-2">
                <div className="flex flex-col gap-0.5 mb-1">
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">ابدأ التفصيل</h3>
                    <p className="text-[10px] font-medium text-gray-500">اختر الطريقة المختصرة للبدء</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button 
                       onClick={() => {
                          setForceOpenMeasurements(true);
                          setTimeout(() => {
                            measurementsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            setTimeout(() => setForceOpenMeasurements(false), 100);
                          }, 200);
                       }}
                       className={`group flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all text-center ${
                         isMeasurementsPanelOpen 
                           ? 'bg-theme-primary border-theme-primary text-white shadow-lg' 
                           : 'bg-white border-theme-primary hover:bg-theme-primary/5 hover:shadow-lg'
                       }`}
                    >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isMeasurementsPanelOpen 
                            ? 'bg-white/20 text-white' 
                            : 'bg-theme-primary/10 text-theme-primary'
                        }`}>
                            <Ruler size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className={`font-bold text-xs mb-0.5 ${
                              isMeasurementsPanelOpen ? 'text-white' : 'text-gray-900'
                            }`}>إدخال / تعديل المقاسات</div>
                            <p className={`text-[9px] leading-snug ${
                              isMeasurementsPanelOpen ? 'text-white/80' : 'text-gray-500'
                            }`}>إدخال المقاسات على الرسم</p>
                        </div>
                    </button>

                    <button 
                       onClick={() => navigate(`/tryon/${product.id}`)}
                       className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white border-2 border-theme-primary hover:bg-theme-primary/5 hover:shadow-lg transition-all text-center"
                    >
                        <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                            <Palette size={20} strokeWidth={2.5} />
                        </div>
                        <div>
                            <div className="font-bold text-gray-900 text-xs mb-0.5">تجربة قماش مختلف</div>
                            <p className="text-[9px] text-gray-500 leading-snug">تغيير القماش ومعاينة النتيجة</p>
                        </div>
                    </button>
                </div>
              </div>

              <div className="text-sm text-gray-600 leading-relaxed">
                 <p>{product.description || "تصميم فريد يجمع بين الأناقة العصرية واللمسات التقليدية. مصنوع من أجود أنواع الأقمشة لضمان الراحة والمظهر المتميز في آن واحد."}</p>
              </div>

              <div className="pt-4 border-t border-gray-100">
                 <div ref={measurementsRef}>
                   <MeasurementInstructionsCollapsible 
                    template={template} 
                    measurementHook={measurementHook}
                    forceOpen={forceOpenMeasurements}
                    onToggle={setIsMeasurementsPanelOpen}
                    onSaveToProfile={handleSaveToProfile}
                    onApplyProfile={() => setShowSavedMeasurementsModal(true)}
                   />
                 </div>

                 {isMeasurementsPanelOpen && (
                    <div className="pt-4 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {/* Comments Section */}
                        <div className="mb-6">
                            {!showCommentsField ? (
                                <button 
                                    onClick={() => setShowCommentsField(true)}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-theme-primary transition-colors"
                                >
                                    <MessageSquare size={14} />
                                    <span>إضافة ملاحظات إضافية للطلب؟</span>
                                </button>
                            ) : (
                                <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400">ملاحظاتك للخياط</label>
                                        <button 
                                            onClick={() => {
                                                setShowCommentsField(false);
                                                setCustomerComments("");
                                            }}
                                            className="text-[10px] font-bold text-red-400 hover:text-red-500"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                    <textarea
                                        value={customerComments}
                                        onChange={(e) => setCustomerComments(e.target.value)}
                                        placeholder="مثلاً: طول اليد، تغيير في شكل الرقبة، الخ..."
                                        className="w-full h-24 p-4 text-xs bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-theme-primary focus:ring-0 transition-all resize-none font-medium text-gray-700"
                                        dir="rtl"
                                    />
                                </div>
                            )}
                        </div>

                        {measurementError && (
                            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-amber-700 text-xs font-bold animate-shake">
                                <AlertCircle size={16} />
                                <span>{measurementError}</span>
                            </div>
                        )}
                        <button 
                            onClick={handleReviewOrder}
                            className="w-full h-14 bg-theme-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-theme-primary/20 hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                        >
                            <CheckCircle2 size={20} />
                            <span>مراجعة الطلب والمتابعة</span>
                        </button>
                    </div>
                 )}
              </div>

          </div>
        </section>
      </main>

      <ProductSummaryDialog
        isOpen={isSummaryOpen}
        onClose={() => {
          setIsSummaryOpen(false);
          setIsOrderSuccess(false);
          setShowDuplicateWarning(false);
          setDuplicateOrder(null);
        }}
        product={product}
        tailor={tailor}
        measurements={measurementHook.measurements}
        template={template}
        onConfirm={handlePlaceOrder}
        isSubmitting={isSubmittingOrder}
        isSuccess={isOrderSuccess}
        comments={customerComments}
        showDuplicateWarning={showDuplicateWarning}
        onConfirmDuplicate={() => handlePlaceOrder(true)}
        onCancelDuplicate={() => {
            setShowDuplicateWarning(false);
            setDuplicateOrder(null);
        }}
      />

      <SavedMeasurementsSheet 
         isOpen={showSavedMeasurementsModal}
         onClose={() => setShowSavedMeasurementsModal(false)}
         profiles={savedMeasurementProfiles}
         onSelect={handleApplyProfile}
      />
    </div>
  );
};


