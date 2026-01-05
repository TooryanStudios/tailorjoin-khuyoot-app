
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Heart, Share2, Star, MapPin, Clock, MessageCircle, UserPlus } from 'lucide-react';
import { Product, Tailor } from '../types';
import { getProductById, getTailorById } from '../services/mockService';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { ProductPageLayout } from '../src/modules/product/components/ProductPageLayout';

type StarActionChoiceCardProps = {
  title: string;
  subtitle: string;
  cta: string;
  imageUrl?: string;
  onClick: () => void;
};

const StarActionChoiceCard = React.memo<StarActionChoiceCardProps>(function StarActionChoiceCard({
  title,
  subtitle,
  cta,
  imageUrl,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-right rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
    >
      <div className="relative w-full aspect-[16/9] bg-slate-100 dark:bg-slate-900">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-2 right-2 left-2">
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

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showStartTailoringActions, setShowStartTailoringActions] = useState(false);

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
      });
    }
  }, [id]);

  if (!product) return <div className="p-10 text-center">جاري التحميل...</div>;

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
        <div className="relative w-full h-full bg-slate-900">
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

          {productImages.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center z-10"
              >
                <ChevronLeft size={20} className="text-white" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center z-10"
              >
                <ChevronRight size={20} className="text-white" />
              </button>
              <div className="absolute bottom-3 right-3 bg-black/50 px-2.5 py-1 rounded-full text-white text-xs z-10">
                {currentImageIndex + 1} / {productImages.length}
              </div>
            </>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Product Header */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-4 flex-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200 font-semibold">
                      {product.category ? `#${product.category}` : '#تفصيل_خاص'}
                    </span>
                    <span>آخر تحديث 25-11-2025</span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">
                      {product.name}
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      تصميم خاص لدى {product.tailorName || 'أم مازن'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2.5 rounded-full border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Share2 size={18} />
                  </button>
                  <button
                    onClick={() => setIsLiked(!isLiked)}
                    className={`p-2.5 rounded-full border border-slate-200 dark:border-slate-700 transition-all ${
                      isLiked ? 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Heart size={18} className={isLiked ? 'fill-current' : ''} />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1 font-semibold">
                  <Star size={16} className="text-yellow-400 fill-yellow-400" />
                  <span>{product.rating?.toFixed(1) ?? '5.0'}</span>
                  <span className="text-slate-400 text-xs font-normal">تقييم عام</span>
                </div>
                <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{product.location || 'غير محدد'}</span>
                </div>
                <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>جاهز لاستقبال الطلبات</span>
                </div>
              </div>
            </div>

            {/* Price & CTA Section */}
            <div className="rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6 space-y-4 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-white/80">السعر يبدأ من</p>
                  <p className="text-4xl font-black tracking-tight">
                    {product.price.toFixed(0)}
                    <span className="text-2xl font-semibold mr-1">ريال</span>
                  </p>
                </div>
                {product.duration && (
                  <div className="bg-white/15 rounded-2xl px-4 py-3 text-center">
                    <p className="text-xs text-white/70">المدة التقديرية</p>
                    <p className="text-lg font-semibold">{product.duration}</p>
                  </div>
                )}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-expanded={showStartTailoringActions}
                  onClick={() => setShowStartTailoringActions((v) => !v)}
                  className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg hover:bg-slate-50 transition-colors"
                >
                  <ShoppingBag size={20} className="text-blue-700" />
                  ابدأ التفصيل
                </button>
                <button
                  onClick={() => addToCart(product)}
                  className="w-full border border-white/40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 bg-white/10 backdrop-blur hover:bg-white/20 transition-colors"
                >
                  <ShoppingBag size={20} />
                  أضف إلى السلة
                </button>
              </div>

              {showStartTailoringActions && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <StarActionChoiceCard
                    title="جرّبي القماش"
                    subtitle="افتحي المصمم لتجربة القماش"
                    cta="فتح المصمم"
                    imageUrl={previewA}
                    onClick={() => {
                      setShowStartTailoringActions(false);
                      navigate('/designer-v2-1');
                    }}
                  />
                  <StarActionChoiceCard
                    title="اذهبي للمقاسات"
                    subtitle="انتقلي مباشرة لإدخال المقاسات"
                    cta="إدخال المقاسات"
                    imageUrl={previewB}
                    onClick={() => {
                      setShowStartTailoringActions(false);
                      navigate(`/measurements/${product.id}`);
                    }}
                  />
                </div>
              )}

              <p className="text-xs text-white/80 flex items-center gap-2">
                <ArrowRight size={14} className="text-white/70" />
                يشمل العرض جلسة استشارة سريعة ومراجعة للمقاسات قبل التفصيل
              </p>
            </div>

            {/* Product Specs */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white mb-3">مواصفات المنتج</h3>
                  {product.description ? (
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                      {product.description}
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                      <li>تفصيل حسب المقاس</li>
                      <li>جودة عالية في الخياطة</li>
                      <li>خامات ممتازة بعناية</li>
                    </ul>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {quickFacts.map((fact) => (
                    <div key={fact.label} className="rounded-xl bg-slate-50 dark:bg-slate-700/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{fact.label}</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-3">مزايا الخدمة</h4>
                <div className="flex flex-wrap gap-2">
                  {serviceHighlights.map((highlight) => (
                    <span
                      key={highlight}
                      className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700/60 text-sm text-slate-600 dark:text-slate-200"
                    >
                      {highlight}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Designer Info */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">المصمم المسؤول</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">تواصل مباشرة مع {product.tailorName || 'المصمم'}</p>
                </div>
                <button className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-600 text-sm font-semibold text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors flex items-center gap-2">
                  <UserPlus size={18} />
                  متابعة
                </button>
              </div>
              <div className="flex items-center gap-4">
                {tailor?.image ? (
                  <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-slate-200 dark:ring-slate-600 flex-shrink-0">
                    <img
                      src={tailor.image}
                      alt={product.tailorName || 'المصمم'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-white flex-shrink-0">
                    {product.tailorName?.charAt(0) || 'أ'}
                  </div>
                )}
                <div className="flex-1 grid gap-4 sm:grid-cols-2 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1">الموقع</p>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      <MapPin size={14} />
                      {product.location || 'غير محدد'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1">الخبرة</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{product.duration || 'خبرة موثوقة'}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1">التقييم</p>
                    <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                      <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      {product.rating?.toFixed(1) ?? '5.0'}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400 mb-1">متوسط الإنجاز</p>
                    <p className="font-semibold text-slate-900 dark:text-white">{product.duration || 'حسب الاتفاق'}</p>
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  onClick={() => navigate(`/chat/${product.tailorId}`)}
                  className="w-full border border-slate-200 dark:border-slate-600 rounded-xl py-3 font-semibold text-slate-900 dark:text-white flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <MessageCircle size={18} />
                  دردش الآن
                </button>
                <button
                  onClick={() => navigate(product.tailorId ? `/tailor/${product.tailorId}` : '/shops')}
                  className="w-full bg-slate-900 text-white dark:bg-slate-700 rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  <ArrowRight size={18} />
                  معرض المصمم
                </button>
              </div>
            </div>
      </div>
    </ProductPageLayout>
  );
};
