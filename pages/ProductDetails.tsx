
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Heart, Share2, Star, MapPin, Clock, MessageCircle, User, Info, List, Tag, CheckCircle2, Ruler, Play, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Product, Tailor, ProductPageConfig } from '../types';
import { getProductById, getTailorById, MOCK_PRODUCTS } from '../services/mockService';
import { useApp } from '../context/AppContext';
import { useQuery } from '@tanstack/react-query';
import { StableImage } from '../components/StableImage';

type StarActionChoiceCardProps = {
  title: string;
  subtitle: string;
  cta: string;
  imageUrl?: string;
  graphic?: React.ReactNode;
  onClick: () => void;
};

const StarActionChoiceCard = React.memo<StarActionChoiceCardProps>(function StarActionChoiceCard({
  title,
  subtitle,
  cta,
  imageUrl,
  graphic,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-right rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-white dark:hover:bg-slate-800 transition-all w-full group"
    >
      <div className="relative w-full aspect-[2/1] bg-slate-200 dark:bg-black overflow-hidden">
        {graphic ? (
          <div className="absolute inset-0 w-full h-full">{graphic}</div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-3 right-3 left-3 z-10">
          <div className="text-white font-bold text-sm leading-tight">{title}</div>
          <div className="text-slate-300 text-[10px] mt-0.5">{subtitle}</div>
        </div>
      </div>
      <div className="p-2">
        <div className="w-full rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 py-1.5 text-xs font-bold text-center group-hover:shadow-md transition-shadow">
          {cta}
        </div>
      </div>
    </button>
  );
});

const getGraphic = (type?: 'fabric' | 'measurements') => {
  if (type === 'fabric') {
    return (
      <svg viewBox="0 0 200 112" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
          <pattern id="fabricPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#fff" fillOpacity="0.2" />
          </pattern>
        </defs>
        <rect width="200" height="112" fill="url(#fabricGrad)" />
        <rect width="200" height="112" fill="url(#fabricPattern)" />
        <path d="M50 30 C 80 10, 120 10, 150 30 L 150 90 C 120 110, 80 110, 50 90 Z" fill="#fff" fillOpacity="0.1" />
      </svg>
    );
  }
  if (type === 'measurements') {
    return (
      <svg viewBox="0 0 200 112" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="measureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
             <stop offset="0%" stopColor="#0f172a" />
             <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>
        <rect width="200" height="112" fill="url(#measureGrad)" />
        <path d="M-10 56 L210 56" stroke="#fff" strokeOpacity="0.1" strokeWidth="40" />
        <path d="M10 40 L10 50 M30 40 L30 50 M50 40 L50 50 M70 40 L70 50 M90 40 L90 50 M110 40 L110 50 M130 40 L130 50 M150 40 L150 50 M170 40 L170 50 M190 40 L190 50" stroke="#fff" strokeWidth="1" strokeOpacity="0.5" />
      </svg>
    );
  }
  return null;
};

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
  const { user, addToCart, appSettings } = useApp();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showStartTailoringActions, setShowStartTailoringActions] = useState(false);

  // Manage body class for modal
  useEffect(() => {
    if (showStartTailoringActions) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [showStartTailoringActions]);

  const pageConfig: ProductPageConfig = appSettings?.productPageConfig || {
    buttons: {
      tryFabric: { enabled: true, title: "جربي القماش", subtitle: "تصور 3D", cta: "فتح المعمل", mediaType: 'graphic', graphicType: 'fabric' },
      measurements: { enabled: true, title: "المقاسات", subtitle: "ضبط المقاسات", cta: "تكوين", mediaType: 'graphic', graphicType: 'measurements' }
    },
    thumbnails: { size: 80, gap: 12, borderRadius: 16, aspectRatio: 'video' }
  };

  const productQuery = useQuery({
    queryKey: ['product', productId],
    queryFn: () => (productId ? getProductById(productId) : Promise.resolve(null)),
    enabled: !!productId,
  });

  const product = productQuery.data ?? null;

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

  useEffect(() => {
    if (productImages.length === 0) {
      setCurrentImageIndex(0);
      return;
    }
    setCurrentImageIndex((prev) => Math.min(prev, productImages.length - 1));
  }, [productImages.length]);

  if (productQuery.isLoading || (!product && !!productId)) {
    return <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 text-slate-500">جاري التحميل...</div>;
  }

  const nextImage = () => setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  const prevImage = () => setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);

  return (
    <main className="flex flex-col lg:flex-row w-full h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-950 overflow-hidden dir-rtl">
      
      {/* RIGHT PANE (Images) */}
      <section className="relative w-full lg:w-1/2 h-[50vh] lg:h-full bg-slate-100 dark:bg-black/20 flex flex-col items-center justify-start flex-shrink-0 border-l border-slate-200 dark:border-slate-900/50 pb-6 lg:pb-10">
          {productImages.length > 0 ? (
             <>
                <div className="w-full flex-1 relative p-4 lg:p-6 transition-all min-h-0">
                    <div className="relative w-full h-full">
                      <StableImage 
                        src={productImages[currentImageIndex]} 
                        alt={product.name}
                        className="w-full h-full bg-transparent"
                        imgClassName="w-full h-full object-contain object-top drop-shadow-2xl rounded-lg"
                        aspectClass="h-full"
                      />
                    </div>
                    
                    {/* Navigation Arrows */}
                    {productImages.length > 1 && (
                      <>
                        <button
                          onClick={prevImage}
                          className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm rounded-full flex items-center justify-center z-10 transition-all text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
                        >
                          <ChevronRight size={24} />
                        </button>
                        <button
                          onClick={nextImage}
                          className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 dark:bg-slate-900/90 hover:bg-white dark:hover:bg-slate-800 backdrop-blur-sm rounded-full flex items-center justify-center z-10 transition-all text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-xl opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0"
                        >
                          <ChevronLeft size={24} />
                        </button>
                      </>
                    )}
                </div>

                {/* Thumbnails Strip - Static Position Below Image */}
                <div className="w-full px-4 pb-4 pt-2 flex justify-center gap-3 overflow-x-auto no-scrollbar z-20 h-auto flex-shrink-0">
                  {productImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`relative w-16 h-16 lg:w-20 lg:h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                            currentImageIndex === idx 
                            ? 'border-slate-900 dark:border-white ring-2 ring-slate-200 dark:ring-slate-800 scale-110 shadow-lg' 
                            : 'border-transparent opacity-40 hover:opacity-100 grayscale hover:grayscale-0'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                      </button>
                  ))}
                </div>
             </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
               <div className="text-center">
                  <ShoppingBag size={48} className="mx-auto mb-2 opacity-20" />
                  <p>لا توجد صور</p>
               </div>
            </div>
          )}
      </section>

      {/* LEFT PANE (Details) - Scrollable */}
      <section className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
        <div className="p-5 lg:p-8 max-w-xl mx-auto min-h-full flex flex-col">
            
            {/* Breadcrumb & Meta */}
            <div className="flex items-center gap-2 mb-3 text-xs font-medium text-slate-500 dark:text-slate-400">
               {tailor ? (
                 <button 
                  onClick={() => navigate(`/tailor/${tailor.id}`)}
                  className="flex items-center gap-2 hover:text-slate-900 dark:hover:text-white transition-colors"
                 >
                    <ArrowRight size={14} className="rtl:rotate-180" />
                    <span>{tailor.name}</span>
                 </button>
               ) : (
                  <span>{t('product:projects')}</span>
               )}
              <span className="opacity-50">/</span>
              <span className="text-slate-900 dark:text-white">{product.category || 'تفصيل خاص'}</span>
            </div>

            {/* Title & Tailor */}
            <div className="mb-6">
              <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white mb-3 leading-tight tracking-tight">
                {product.name}
              </h1>
              
              <div 
                 className="inline-flex items-center gap-2 py-1.5 px-3 rounded-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                 onClick={() => tailor && navigate(`/tailor/${tailor.id}`)}
              >
                  {tailor?.image ? (
                     <img src={tailor.image} alt={tailor.name} className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                     <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px]">
                        <User size={12} />
                     </div>
                  )}
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                     {tailor?.name || product.tailorName || 'المصمم'}
                  </span>
                  {tailor?.approvalStatus === 'approved' && <CheckCircle2 size={14} className="text-slate-900 dark:text-white fill-current" />}
              </div>
            </div>

            {/* Pricing Node */}
            {product.price && (
               <div className="mb-6 flex items-baseline gap-1">
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{product.price}</span>
                  <span className="text-sm font-medium text-slate-500">ر.ع</span>
               </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 mb-6">
               <div className="flex-1 relative">
                  <button
                     onClick={() => setShowStartTailoringActions(true)}
                     className="w-full bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-black font-black py-4 rounded-xl shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wide"
                  >
                     <ShoppingBag size={18} strokeWidth={2.5} />
                     {t('product:startTailoring')}
                  </button>
               </div>

               <button 
                  onClick={() => setIsLiked(!isLiked)}
                  className={`w-14 rounded-xl border flex items-center justify-center transition-colors ${
                     isLiked 
                     ? 'border-rose-200 bg-rose-50 text-rose-500 dark:border-rose-900/30 dark:bg-rose-900/10' 
                     : 'border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
               >
                  <Heart size={22} className={isLiked ? "fill-current" : ""} />
               </button>
               
               <button className="w-14 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors">
                  <Share2 size={22} />
               </button>
            </div>

            {/* Description */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
               <p>{product.description || "تصميم فريد يجمع بين الأناقة العصرية واللمسات التقليدية. مصنوع من أجود أنواع الأقمشة لضمان الراحة والمظهر المتميز في آن واحد."}</p>
            </div>

            {/* Quick Specs */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">

               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المواصفات</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                     <Clock size={16} className="text-slate-400" />
                     <div>
                        <div className="text-[10px] text-slate-500">مدة التنفيذ</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-200">{product.duration || '7-10 أيام'}</div>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <MapPin size={16} className="text-slate-400" />
                     <div>
                        <div className="text-[10px] text-slate-500">الموقع</div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-200">{product.location || 'مسقط'}</div>
                     </div>
                  </div>
               </div>
            </div>

        </div>
      </section>

      {/* Start Tailoring Modal - Portalized and Protected */}
      {showStartTailoringActions && createPortal(
          <div 
            className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowStartTailoringActions(false)}
            data-overlay="khuyoot-modal"
          >
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden" 
                dir="rtl"
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
                  <div className="flex items-center gap-3">
                      <img src="/logo_big.png?v=4" alt="Khuyoot" className="h-12 w-auto" />
                      <h3 className="text-lg font-medium text-slate-900 dark:text-white dark:font-bold">اختر الخطوة التالية</h3>
                  </div>
                  <button 
                      onClick={() => setShowStartTailoringActions(false)}
                      className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                      <X size={18} />
                  </button>
                </div>

                <div className="p-5 grid gap-3">
                  
                      {/* Option 1: Designer */}
                      {pageConfig.buttons.tryFabric.enabled && (
                        <button 
                           onClick={() => navigate(`/designer-v2-1/${product.id}`)}
                           className="w-full group relative flex items-center gap-4 p-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all text-right overflow-hidden"
                        >
                            {/* Video Thumbnail */}
                            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-900 shadow-inner border border-slate-100 dark:border-slate-800">
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

                            {/* Text Content */}
                            <div className="flex-1 py-1 z-10">
                                <div className="flex items-center justify-between mb-1.5">
                                   <div className="font-medium text-slate-900 dark:text-white dark:font-bold text-base">
                                      تجربة قماش مختلف
                                   </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                                   صممي عبايتك بنفسك، اختاري القماش، وعدلي التفاصيل وشوفي النتيجة 
                                </p>
                            </div>
                            
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                               <ChevronLeft size={16} className="rtl:rotate-0" />
                            </div>
                        </button>
                      )}

                      {/* Option 2: Measurements */}
                      {pageConfig.buttons.measurements.enabled && (
                        <button 
                           onClick={() => navigate(`/measurements/${product.id}`)}
                           className="w-full group relative flex items-center gap-4 p-2.5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all text-right overflow-hidden"
                        >
                            {/* Video Thumbnail */}
                            <div className="relative w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-900 shadow-inner border border-slate-100 dark:border-slate-800">
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

                            {/* Text Content */}
                            <div className="flex-1 py-1 z-10">
                                <div className="flex items-center justify-between mb-1.5">
                                   <div className="font-medium text-slate-900 dark:text-white dark:font-bold text-base">
                                      أخذ المقاسات
                                   </div>
                                </div>
                                <p className="text-xs text-slate-500 leading-relaxed dark:text-slate-400">
                                   اضبطي مقاساتك بدقة باستخدام تقنية القياس الذكي لضمان المقاس المثالي
                                </p>
                            </div>

                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-slate-900 transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0">
                               <ChevronLeft size={16} className="rtl:rotate-0" />
                            </div>
                        </button>
                      )}

                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
                  <button 
                      onClick={() => setShowStartTailoringActions(false)}
                      className="w-full py-3 rounded-xl font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-sm"
                  >
                      إلغاء
                  </button>
                </div>
            </div>
          </div>,
          document.body
      )}

    </main>
  );
};
