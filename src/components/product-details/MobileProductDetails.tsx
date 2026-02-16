import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Heart, Share2, ArrowLeft, Bookmark, ArrowRight, MoreVertical, Star, MapPin, ShoppingBag, MessageCircle, Layers, Clock, Shirt, Ruler, Play, X, ChevronLeft, Palette, AlertCircle, CheckCircle2, MessageSquare, Save, FolderOpen } from 'lucide-react';
import { Product, Tailor } from '../../../types';
import { StableImage } from '../../../components/StableImage';

// Copied VideoDialog from Desktop for synchronization
const VideoDialog = React.memo(({ isOpen, onClose, videoUrl }: { isOpen: boolean; onClose: () => void; videoUrl: string }) => {
    if (!isOpen) return null;
  
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
                className="fixed inset-0 z-[13000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
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
              title="Measurement Instructions Video"
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

const MobilePointMarker = ({ point, value, onChange }: { point: any, value?: number, onChange: (id: string, val: string) => void, key?: any }) => {
    const hasValue = value !== undefined && value > 0;
    const ref = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (ref.current) {
            ref.current.style.left = `${point.x * 100}%`;
            ref.current.style.top = `${point.y * 100}%`;
        }
    }, [point.x, point.y]);

    return (
        <div 
            ref={ref}
            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 animate-in fade-in zoom-in duration-300 pointer-events-auto"
        >
            <div className="px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-md text-[8px] font-normal text-white whitespace-nowrap mb-1 shadow-md border border-white/10 transition-all">
                {point.label || point.name}
            </div>
            <div className="relative group/input" onClick={(e) => e.stopPropagation()}>
                <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={value || ''}
                    onChange={(e) => onChange(point.id, e.target.value)}
                    placeholder="0"
                    className={`w-10 h-6 px-1 text-[8px] text-center border-2 rounded-lg shadow-lg transition-all focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:w-14 bg-white font-black ${
                        hasValue ? 'border-emerald-500 text-emerald-600' : 'border-gray-200 text-gray-800'
                    }`}
                />
            </div>
        </div>
    );
};

interface MobileProductDetailsProps {
    product: Product;
    tailor: Tailor | null;
    productImages: string[];
    currentImageIndex: number;
    setCurrentImageIndex: (index: number) => void;
    isLiked: boolean;
    onLikeToggle: () => void;
    onBack: () => void;
    onStartTailoring: () => void;
    onAddToCart: () => void;
    template?: any;
    measurementHook?: any;
    onPlaceOrder?: () => void;
    measurementError?: string | null;
    customerComments?: string;
    setCustomerComments?: (val: string) => void;
    showCommentsField?: boolean;
    setShowCommentsField?: (val: boolean) => void;
    onSaveToProfile?: () => void;
    onApplyProfile?: () => void;
    openMeasurementsToken?: number;
}

export const MobileProductDetails: React.FC<MobileProductDetailsProps> = ({
    product,
    tailor,
    productImages,
    currentImageIndex,
    setCurrentImageIndex,
    isLiked,
    onLikeToggle,
    onBack,
    onStartTailoring,
    onAddToCart,
    template,
    measurementHook,
    onPlaceOrder,
    measurementError,
    customerComments = "",
    setCustomerComments = (_val: string) => {},
    showCommentsField = false,
    setShowCommentsField = (_val: boolean) => {},
    onSaveToProfile,
    onApplyProfile
    ,openMeasurementsToken
}) => {
    const navigate = useNavigate();
    const [showVideoDialog, setShowVideoDialog] = useState(false);
    const [showMeasurementDialog, setShowMeasurementDialog] = useState(false);
    const carouselRef = React.useRef<HTMLDivElement>(null);

    // Use hook's state if available, otherwise local for safety (though it should always be there now)
    const measurements = measurementHook?.measurements || {};
    const handleMeasurementChange = measurementHook?.handleMeasurementChange || (() => {});

    React.useEffect(() => {
        if (carouselRef.current) {
            carouselRef.current.style.transform = `translateX(-${currentImageIndex * 100}%)`;
        }
    }, [currentImageIndex]);

    React.useEffect(() => {
        if (!openMeasurementsToken) return;
        setShowMeasurementDialog(true);
    }, [openMeasurementsToken]);

    const videoUrl = template?.videoUrl || template?.tutorialVideoUrl || 'https://www.youtube.com/watch?v=6eZtn5Du8O4';

    const formatOmr = (price: number | string | undefined): string => {
        if (!price) return '0.000';
        const numPrice = typeof price === 'string' ? parseFloat(price) : price;
        return numPrice.toFixed(3);
    };

    // Touch handling for swipe
    const [touchStart, setTouchStart] = React.useState(0);
    const [touchEnd, setTouchEnd] = React.useState(0);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentImageIndex < productImages.length - 1) {
            setCurrentImageIndex(currentImageIndex + 1);
        }
        if (isRightSwipe && currentImageIndex > 0) {
            setCurrentImageIndex(currentImageIndex - 1);
        }

        setTouchStart(0);
        setTouchEnd(0);
    };

    return (
        <>
            <div className="min-h-screen bg-[#ededed] pb-20 relative flex flex-col">
                {/* Fixed Back Button - Top Right (Above Credit Bar) */}
                <button 
                    onClick={onBack}
                    className="fixed top-4 right-4 z-[10001] w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-lg border border-gray-200 text-gray-900 transition-transform active:scale-95"
                    title="رجوع"
                    aria-label="رجوع"
                >
                    <ArrowLeft size={20} />
                </button>

                {/* Simplified Header for Mobile */}
                <div className="relative z-10 w-full px-4 pt-4">
                    {/* Product Images Widget Card */}
                    <div 
                        className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-sm border border-black/5 bg-white mb-4"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Main Product Image Slider */}
                        {productImages.length > 0 ? (
                            <div 
                                ref={carouselRef}
                                className="flex w-full h-full transition-transform duration-300 ease-out"
                            >
                                {productImages.map((img, index) => (
                                    <div key={index} className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 bg-[#fbfbfb]">
                                        <StableImage 
                                            src={img} 
                                            alt={`${product.name} - ${index + 1}`}
                                            aspectClass="h-full w-auto" 
                                            className="h-full w-auto" 
                                            imgClassName="h-full w-auto object-contain drop-shadow-xl"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-[#fbfbfb] flex items-center justify-center">
                                <ShoppingBag size={48} className="text-gray-300" />
                            </div>
                        )}

                        {/* Top Card Icons */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
                            <button 
                                onClick={onBack}
                                title="Back"
                                aria-label="Back"
                                className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md text-gray-900 shadow-lg border border-gray-100 transition-transform active:scale-95"
                            >
                                <ArrowRight size={20} className="rtl:rotate-180" />
                            </button>
                            <div className="flex items-center gap-2">
                                <button 
                                    onClick={onLikeToggle}
                                    title={isLiked ? "Unlike" : "Like"}
                                    aria-label={isLiked ? "Unlike" : "Like"}
                                    className={`w-10 h-10 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md border border-gray-100 transition-transform active:scale-95 shadow-lg ${isLiked ? 'text-rose-500' : 'text-gray-400'}`}
                                >
                                    <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                                </button>
                                <button 
                                    title="Share"
                                    aria-label="Share"
                                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/90 backdrop-blur-md text-gray-400 border border-gray-100 transition-transform active:scale-95 shadow-lg"
                                >
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Image Indicators - Bottom of Card */}
                        {productImages.length > 1 && (
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10" dir="ltr">
                                {productImages.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setCurrentImageIndex(index)}
                                        title={`Go to image ${index + 1}`}
                                        aria-label={`Go to image ${index + 1}`}
                                        className={`h-1.5 rounded-full transition-all ${
                                            index === currentImageIndex 
                                                ? 'w-8 bg-theme-primary' 
                                                : 'w-2 bg-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section - now flows naturally */}
                    <div className="w-full flex flex-col items-center gap-4">
                        
                        {/* Primary Info Card */}
                        <div className="w-full bg-white border border-black/5 shadow-sm rounded-3xl p-6 text-right" dir="rtl">
                            <div className="flex items-center gap-3 mb-4">
                                <h1 className="text-2xl font-black text-gray-900 leading-tight tracking-tight">
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

                            <div className="grid grid-cols-3 divide-x divide-x-reverse border border-gray-100 rounded-2xl overflow-hidden bg-[#fbfbfb] shadow-sm">
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

                                <div className="p-3 flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <Clock size={12} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">مدة التنفيذ</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-900">{product.duration || '7-10 أيام'}</span>
                                </div>

                                <div className="p-3 flex flex-col items-center justify-center gap-1">
                                    <div className="flex items-center gap-1 text-gray-400">
                                        <MapPin size={12} />
                                        <span className="text-[8px] font-black uppercase tracking-tighter">الموقع</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-gray-900">{product.location || 'مسقط'}</span>
                                </div>
                            </div>

                            <div className="space-y-3 py-5 border-y border-gray-100 my-2">
                                <div className="flex flex-col gap-0.5 mb-1">
                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">ابدأ التفصيل</h3>
                                    <p className="text-[10px] font-medium text-gray-500">اختر الطريقة المختصرة للبدء</p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <button 
                                       onClick={() => setShowMeasurementDialog(true)}
                                       className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 bg-white border-theme-primary hover:bg-theme-primary/5 hover:shadow-lg transition-all text-center"
                                    >
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-theme-primary/10 text-theme-primary">
                                            <Ruler size={20} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-xs mb-0.5 text-gray-900">إدخال / تعديل المقاسات</div>
                                            <p className="text-[9px] leading-snug text-gray-500">إدخال المقاسات على الرسم</p>
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
                                            <div className="font-bold text-xs mb-0.5 text-gray-900">تجربة قماش مختلف</div>
                                            <p className="text-[9px] leading-snug text-gray-500">تغيير القماش ومعاينة النتيجة</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {/* Order Notes + Review */}
                        {template && template.points?.length > 0 && (
                            <div className="w-full bg-white border border-black/5 shadow-sm rounded-3xl p-6" dir="rtl">
                                <div className="mb-4">
                                    {!showCommentsField ? (
                                        <button 
                                            onClick={() => setShowCommentsField(true)}
                                            className="flex items-center gap-2 text-[10px] font-bold text-gray-500 hover:text-theme-primary transition-colors"
                                        >
                                            <MessageSquare size={12} />
                                            <span>إضافة ملاحظات إضافية للطلب؟</span>
                                        </button>
                                    ) : (
                                        <div className="space-y-2 animate-in fade-in zoom-in duration-300">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[9px] font-black uppercase tracking-wider text-gray-400 text-right w-full">ملاحظاتك للخياط</label>
                                                <button 
                                                    onClick={() => {
                                                        setShowCommentsField(false);
                                                        setCustomerComments("");
                                                    }}
                                                    className="text-[9px] font-bold text-red-400 hover:text-red-500 whitespace-nowrap"
                                                >
                                                    إلغاء
                                                </button>
                                            </div>
                                            <textarea
                                                value={customerComments}
                                                onChange={(e) => setCustomerComments(e.target.value)}
                                                placeholder="مثلاً: طول اليد، تغيير في شكل الرقبة، الخ..."
                                                className="w-full h-20 p-3 text-[10px] bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-theme-primary focus:ring-0 transition-all resize-none font-medium text-gray-700"
                                                dir="rtl"
                                            />
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={onPlaceOrder}
                                    className="w-full h-14 bg-theme-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-theme-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 size={18} />
                                    <span>مراجعة الطلب والمتابعة</span>
                                    <ArrowRight size={18} className="rtl:rotate-180" />
                                </button>
                            </div>
                        )}

                        {showMeasurementDialog && template && template.points?.length > 0 && createPortal(
                            <div className="fixed inset-0 z-[12000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowMeasurementDialog(false)}>
                                <div
                                    className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]"
                                    onClick={(e) => e.stopPropagation()}
                                    dir="rtl"
                                >
                                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-theme-primary/10 flex items-center justify-center text-theme-primary">
                                                <Ruler size={16} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-normal text-gray-900">تسجيل المقاسات</h3>
                                                <p className="text-[9px] text-gray-500 font-normal">{template.name}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setShowMeasurementDialog(false)}
                                            title="إغلاق"
                                            aria-label="إغلاق"
                                            className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-900 transition-colors"
                                        >
                                            <X size={16} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        <div className="p-4 bg-[#ededed] rounded-2xl border border-gray-100 space-y-3">
                                            <div className="flex flex-col gap-1">
                                                <p className="text-xs font-black text-gray-900">تعليمات القياس:</p>
                                                <p className="text-[10px] text-gray-600 leading-relaxed font-bold">
                                                    يرجى إدخال القياسات الصحيحة (بالسنتيمتر) في الخانات الموضحة أدناه. يمكنك النقر مباشرة على الخانة وتعديل الرقم.
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setShowVideoDialog(true)}
                                                className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-black text-[10px] flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                                            >
                                                <Play size={14} className="fill-emerald-500 text-emerald-500" />
                                                <span>مشاهدة فيديو توضيحي</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={onApplyProfile}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-[#fbfbfb] border border-gray-100 rounded-xl text-[9px] font-black text-gray-500 hover:text-theme-primary transition-all active:scale-95"
                                            >
                                                <FolderOpen size={12} className="text-theme-primary" />
                                                <span>تحميل مقاس محفوظ</span>
                                            </button>
                                            <button
                                                onClick={onSaveToProfile}
                                                className="flex items-center justify-center gap-2 py-2.5 bg-theme-primary/5 text-theme-primary border border-theme-primary/10 rounded-xl text-[9px] font-black hover:bg-theme-primary hover:text-white transition-all active:scale-95"
                                            >
                                                <Save size={12} />
                                                <span>حفظ هذه المقاسات</span>
                                            </button>
                                        </div>

                                        <div className="relative w-full aspect-[3/4] bg-[#fdfdfd] rounded-2xl border border-gray-100 overflow-visible">
                                            {template.baseImageUrl ? (
                                                <img
                                                    src={template.baseImageUrl}
                                                    alt={template.name}
                                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none opacity-90 rounded-2xl"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center opacity-5">
                                                    <img src="/logo_big.png?v=4" alt="" className="w-20 h-auto grayscale" />
                                                </div>
                                            )}

                                            <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <defs>
                                                    <marker id="arrowhead-mobile-v1" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto" markerUnits="strokeWidth">
                                                        <path d="M0,0 L0,6 L6,3 z" fill="#10b981" />
                                                    </marker>
                                                </defs>
                                                {(template.arrows || []).map((arrow: any) => (
                                                    <line
                                                        key={arrow.id}
                                                        x1={arrow.startX * 100}
                                                        y1={arrow.startY * 100}
                                                        x2={arrow.endX * 100}
                                                        y2={arrow.endY * 100}
                                                        stroke="#10b981"
                                                        strokeWidth={0.45}
                                                        markerEnd="url(#arrowhead-mobile-v1)"
                                                        opacity={0.7}
                                                    />
                                                ))}
                                            </svg>

                                            {template.points.map((point: any) => (
                                                <MobilePointMarker
                                                    key={point.id}
                                                    point={point}
                                                    value={measurements[point.id]}
                                                    onChange={handleMeasurementChange}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="p-4 bg-gray-50 border-t border-gray-100 space-y-2">
                                        <span className="block text-[9px] text-gray-400 font-bold">أغلق النافذة بعد إكمال القياسات</span>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => setShowMeasurementDialog(false)}
                                                className="w-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-gray-700 bg-white border border-gray-200 rounded-xl transition-all active:scale-95"
                                            >
                                                إلغاء
                                            </button>
                                            <button
                                                onClick={() => setShowMeasurementDialog(false)}
                                                className="w-full px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white bg-theme-primary rounded-xl transition-all active:scale-95"
                                            >
                                                موافق
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>,
                            document.body
                        )}
                        
                        <VideoDialog 
                            isOpen={showVideoDialog} 
                            onClose={() => setShowVideoDialog(false)} 
                            videoUrl={videoUrl} 
                        />

                        {/* Description */}
                        {product.description && (
                            <div className="w-full bg-white border border-black/5 shadow-sm rounded-3xl p-6 text-right">
                                <h3 className="font-black text-gray-900 mb-4 text-sm uppercase tracking-wide">الوصف</h3>
                                <p className="text-sm text-gray-600 leading-relaxed">
                                    {product.description}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

