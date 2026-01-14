
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Heart, Share2, Star, MapPin, Clock, MessageCircle, UserPlus, Home, Info, List, MessageSquare } from 'lucide-react';
import { Product, Tailor, Review, ProductPageConfig } from '../types';
import { getProductById, getTailorById, MOCK_PRODUCTS } from '../services/mockService';
import { useApp } from '../context/AppContext';
import { ProductPageLayout } from '../src/modules/product/components/ProductPageLayout';

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
      className="text-right rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors w-full"
    >
      <div className="relative w-full aspect-[16/9] bg-slate-100 dark:bg-slate-900 overflow-hidden">
        {graphic ? (
          <div className="absolute inset-0 w-full h-full">{graphic}</div>
        ) : imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        <div className="absolute bottom-2 right-2 left-2 z-10">
          <div className="text-white font-black text-base leading-tight">{title}</div>
          <div className="text-white/80 text-xs mt-1">{subtitle}</div>
        </div>
      </div>
      <div className="p-3">
        <div className="w-full rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-2 text-sm font-bold">
          {cta}
        </div>
      </div>
    </button>
  );
});

const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
      active
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-lg'
        : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

const getGraphic = (type?: 'fabric' | 'measurements') => {
  if (type === 'fabric') {
    return (
      <svg viewBox="0 0 200 112" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="fabricGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <pattern id="fabricPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="#ccff00" fillOpacity="0.3" />
          </pattern>
        </defs>
        <rect width="200" height="112" fill="url(#fabricGrad)" />
        <rect width="200" height="112" fill="url(#fabricPattern)" />
        <path d="M50 30 C 80 10, 120 10, 150 30 L 150 90 C 120 110, 80 110, 50 90 Z" fill="#ccff00" fillOpacity="0.1" />
        <path d="M60 40 C 80 25, 110 25, 130 40 L 130 80 C 110 95, 80 95, 60 80 Z" fill="#ccff00" fillOpacity="0.2" />
      </svg>
    );
  }
  if (type === 'measurements') {
    return (
      <svg viewBox="0 0 200 112" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="measureGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
        <rect width="200" height="112" fill="url(#measureGrad)" />
        <path d="M-10 56 L210 56" stroke="#ccff00" strokeOpacity="0.2" strokeWidth="40" />
        <path d="M10 40 L10 50 M30 40 L30 50 M50 40 L50 50 M70 40 L70 50 M90 40 L90 50 M110 40 L110 50 M130 40 L130 50 M150 40 L150 50 M170 40 L170 50 M190 40 L190 50" stroke="#ccff00" strokeWidth="2" />
        <path d="M20 45 L20 50 M40 45 L40 50 M60 45 L60 50 M80 45 L80 50 M100 45 L100 50 M120 45 L120 50 M140 45 L140 50 M160 45 L160 50 M180 45 L180 50" stroke="#ccff00" strokeOpacity="0.6" strokeWidth="1" />
      </svg>
    );
  }
  return null;
};

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart, appSettings } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showStartTailoringActions, setShowStartTailoringActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'specs' | 'reviews'>('details');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  
  // Get page config from app settings or use defaults
  const pageConfig: ProductPageConfig = appSettings?.productPageConfig || {
    buttons: {
      tryFabric: {
        enabled: true,
        title: "جربي القماش",
        subtitle: "تصور بالذكاء الاصطناعي",
        cta: "فتح المصمم",
        mediaType: 'graphic',
        graphicType: 'fabric'
      },
      measurements: {
        enabled: true,
        title: "المقاسات",
        subtitle: "أدخلي مقاساتك",
        cta: "تكوين",
        mediaType: 'graphic',
        graphicType: 'measurements'
      }
    },
    thumbnails: {
      size: 80,
      gap: 12,
      borderRadius: 16,
      aspectRatio: 'video'
    }
  };

  // Prevent the underlying (parent) page from scrolling while this full-screen view is open.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';

    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
    };
  }, []);

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

  useEffect(() => {
    if (id) {
      getProductById(id).then((prod) => {
        setProduct(prod);
        if (prod?.tailorId) {
          getTailorById(prod.tailorId).then(setTailor);
        }
        // Mock related products
        setRelatedProducts(MOCK_PRODUCTS.filter(p => p.id !== id).slice(0, 4));
      });
    }
  }, [id]);

  if (!product) return <div className="flex items-center justify-center h-screen text-slate-500">جاري التحميل...</div>;

  const previewA = productImages[0];
  const previewB = productImages[1] || productImages[0];

  const quickFacts = [
    { label: 'الفئة', value: product.category ? `#${product.category}` : 'تفصيل مخصص' },
    { label: 'الموقع', value: product.location || 'غير محدد' },
    { label: 'الخياط', value: product.tailorName || 'أم مازن' },
    { label: 'المدة', value: product.duration || 'يتم الاتفاق' }
  ];

  const serviceHighlights = [
    'تفصيل دقيق حسب المقاسات',
    'متابعة مباشرة مع الخياط',
    'جودة أقمشة معتمدة',
    'ضمان تعديل بعد التسليم',
    'طرق دفع متعددة',
    'إشعارات فورية بحالة الطلب'
  ];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  return (
    <ProductPageLayout
      swapPanels
      left={
        <div className="relative w-full h-full bg-slate-900 group">
          {productImages.length > 0 ? (
            productImages.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`${product.name} - ${index + 1}`}
                className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${
                  index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                }`}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
              />
            ))
          ) : (
            <div className="w-full h-full bg-slate-900 animate-pulse" />
          )}

          {/* Navigation Arrows */}
          {productImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center z-10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/30 hover:bg-black/60 backdrop-blur-md rounded-full flex items-center justify-center z-10 transition-all opacity-0 group-hover:opacity-100"
              >
                <ChevronRight size={24} className="text-white" />
              </button>
            </>
          )}
        </div>
      }
    >
        {/* Product Header - Redesigned to match reference */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-4 text-slate-400 text-sm">
              <span>المشاريع</span>
              <span>/</span>
              <span className="text-white">{product.category || 'تفصيل خاص'}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight mb-4 uppercase tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <div className="text-slate-500 dark:text-slate-400 text-sm">تصميم:</div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 pr-4 pl-2 py-1 rounded-full">
                {tailor?.image ? (
                  <img src={tailor.image} alt={product.tailorName} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center text-xs font-bold text-black">
                    {product.tailorName?.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-slate-900 dark:text-white text-sm underline decoration-slate-500 underline-offset-4 cursor-pointer hover:text-lime-500 transition-colors" onClick={() => navigate(`/tailor/${product.tailorId}`)}>
                  {product.tailorName || 'مصمم غير معروف'}
                </span>
              </div>
            </div>

            {/* Main CTA Section - Matching "Clone project" style */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setShowStartTailoringActions(!showStartTailoringActions)}
                className="flex-1 bg-[#ccff00] hover:bg-[#b3e600] text-black font-black text-lg py-4 rounded-xl shadow-[0_0_20px_rgba(204,255,0,0.3)] hover:shadow-[0_0_30px_rgba(204,255,0,0.5)] transition-all flex items-center justify-center gap-2 uppercase tracking-wide"
              >
                <ShoppingBag size={22} strokeWidth={2.5} />
                ابدأ التفصيل
              </button>
              <button 
                onClick={() => setIsLiked(!isLiked)}
                className="w-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-colors border border-slate-700"
              >
                <Heart size={22} className={isLiked ? "fill-rose-500 text-rose-500" : ""} />
              </button>
              <button className="w-14 bg-slate-800 hover:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-colors border border-slate-700">
                <Share2 size={22} />
              </button>
            </div>

            {/* Expandable Actions */}
            {showStartTailoringActions && (
              <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-top-4">
                {pageConfig.buttons.tryFabric.enabled && (
                  <StarActionChoiceCard
                    title={pageConfig.buttons.tryFabric.title}
                    subtitle={pageConfig.buttons.tryFabric.subtitle}
                    cta={pageConfig.buttons.tryFabric.cta}
                    imageUrl={pageConfig.buttons.tryFabric.mediaType === 'image' ? pageConfig.buttons.tryFabric.mediaUrl : undefined}
                    graphic={pageConfig.buttons.tryFabric.mediaType === 'graphic' ? getGraphic(pageConfig.buttons.tryFabric.graphicType) : undefined}
                    onClick={() => {
                      setShowStartTailoringActions(false);
                      navigate(`/designer-v2-1/${product.id}`);
                    }}
                  />
                )}
                {pageConfig.buttons.measurements.enabled && (
                  <StarActionChoiceCard
                    title={pageConfig.buttons.measurements.title}
                    subtitle={pageConfig.buttons.measurements.subtitle}
                    cta={pageConfig.buttons.measurements.cta}
                    imageUrl={pageConfig.buttons.measurements.mediaType === 'image' ? pageConfig.buttons.measurements.mediaUrl : undefined}
                    graphic={pageConfig.buttons.measurements.mediaType === 'graphic' ? getGraphic(pageConfig.buttons.measurements.graphicType) : undefined}
                    onClick={() => {
                      setShowStartTailoringActions(false);
                      navigate(`/measurements/${product.id}`);
                    }}
                  />
                )}
              </div>
            )}

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none mb-6">
              <p className="text-slate-400 text-base leading-relaxed">
                {product.description || "لقد وصل حلم طفولتك أخيرًا. لقد سمعت ذلك ألف مرة - ماذا لو تم تفصيل هذا التصميم خصيصًا لك؟ الآن أصبح الأمر حقيقة: قماش أسطوري، وحرفية حقيقية، ومقاس مثالي - الأسلوب الأيقوني أعيد تصوره كإنتاج شخصي."}
              </p>
            </div>

            {/* Tags */}
            <div className="space-y-2 mb-8">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">الوسوم</div>
              <div className="flex flex-wrap gap-2">
                {[product.category, 'مقاس مخصص', 'قماش فاخر', 'صناعة يدوية', 'رائج', 'إصدار محدود'].filter(Boolean).map((tag, i) => (
                  <span key={i} className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors cursor-default border border-slate-700">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800 w-full" />

          {/* Project Assets / Gallery Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white text-lg">ملفات المشروع</h3>
              <div className="flex gap-2">
                <button className="px-3 py-1.5 bg-slate-800 text-xs font-bold text-white rounded-lg border border-slate-700 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-lime-400"></div>
                  صورة
                </button>
                <button className="px-3 py-1.5 bg-transparent text-xs font-bold text-slate-500 rounded-lg hover:text-white transition-colors flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                  فيديو
                </button>
              </div>
            </div>
            
            <div 
              className="grid gap-3" 
              style={{ 
                gridTemplateColumns: `repeat(auto-fill, minmax(${pageConfig?.thumbnails.size || 150}px, 1fr))`,
                gap: pageConfig?.thumbnails.gap
              }}
            >
              {productImages.map((img, idx) => (
                <div 
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={`group relative overflow-hidden cursor-pointer border-2 ${currentImageIndex === idx ? 'border-lime-400' : 'border-transparent'}`}
                  style={{ 
                    borderRadius: pageConfig?.thumbnails.borderRadius,
                    aspectRatio: pageConfig?.thumbnails.aspectRatio === 'video' ? '16/9' : pageConfig?.thumbnails.aspectRatio === 'square' ? '1/1' : '3/4'
                  }}
                >
                  <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                  {idx === 0 && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase">
                      الرئيسية
                    </div>
                  )}
                </div>
              ))}
              {/* Add some mock assets to fill the grid if needed */}
              {productImages.length < 4 && Array.from({ length: 4 - productImages.length }).map((_, i) => (
                <div 
                  key={`mock-${i}`} 
                  className="bg-slate-800 border border-slate-700 flex items-center justify-center"
                  style={{ 
                    borderRadius: pageConfig?.thumbnails.borderRadius,
                    aspectRatio: pageConfig?.thumbnails.aspectRatio === 'video' ? '16/9' : pageConfig?.thumbnails.aspectRatio === 'square' ? '1/1' : '3/4'
                  }}
                >
                  <span className="text-slate-600 text-xs font-bold">معاينة الملف</span>
                </div>
              ))}
            </div>
          </div>
        </div>


      {/* Mobile Sticky Footer */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800 z-50 pb-safe">
        <div className="flex gap-3">
          <button
            onClick={() => setShowStartTailoringActions(true)}
            className="flex-1 bg-[#ccff00] text-black py-3.5 rounded-xl font-bold shadow-[0_0_15px_rgba(204,255,0,0.3)] active:scale-95 transition-transform flex items-center justify-center gap-2 uppercase tracking-wide"
          >
            <ShoppingBag size={18} strokeWidth={2.5} />
            ابدأ التفصيل
          </button>
          <button
            onClick={() => addToCart(product)}
            className="px-4 py-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white font-bold active:bg-slate-700 transition-colors"
          >
            <ShoppingBag size={18} />
          </button>
        </div>
      </div>
    </ProductPageLayout>
  );
};
