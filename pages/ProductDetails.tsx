
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, ShoppingBag, ChevronLeft, ChevronRight, Heart, Share2, Star, MapPin, Clock, MessageCircle, UserPlus } from 'lucide-react';
import { Product, Tailor } from '../types';
import { getProductById, getTailorById } from '../services/mockService';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';

export const ProductDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, addToCart } = useApp();
  const [product, setProduct] = useState<Product | null>(null);
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-0 lg:gap-8">
          {/* Left Side - Details */}
          <div className="bg-white dark:bg-slate-800 lg:bg-transparent order-2 lg:order-1">
            <div className="p-4 lg:p-8 space-y-6">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur p-6 space-y-4 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                      <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-200 font-semibold">
                        {product.category ? `#${product.category}` : '#تفصيل_خاص'}
                      </span>
                      <span>آخر تحديث 25-11-2025</span>
                    </div>
                    <div>
                      <h1 className="text-3xl lg:text-4xl font-black text-slate-900 dark:text-white leading-tight">
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
                  <span className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{product.location || 'غير محدد'}</span>
                  </div>
                  <span className="hidden sm:block h-4 w-px bg-slate-200 dark:bg-slate-700" />
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>جاهز لاستقبال الطلبات</span>
                  </div>
                </div>
              </div>

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
                    onClick={() => navigate(`/customization/${product.id}`)}
                    className="w-full bg-white text-slate-900 font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                  >
                    <ShoppingBag size={20} className="text-blue-700" />
                    ابدأ التفصيل
                  </button>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full border border-white/40 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 bg-white/10 backdrop-blur"
                  >
                    <ShoppingBag size={20} />
                    أضف إلى السلة
                  </button>
                </div>
                <p className="text-xs text-white/80 flex items-center gap-2">
                  <ArrowRight size={14} className="text-white/70" />
                  يشمل العرض جلسة استشارة سريعة ومراجعة للمقاسات قبل التفصيل
                </p>
              </div>

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
                    <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-slate-200 dark:ring-slate-600">
                      <img
                        src={tailor.image}
                        alt={product.tailorName || 'المصمم'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-2xl font-bold text-slate-700 dark:text-white">
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
                    className="w-full bg-slate-900 text-white dark:bg-slate-700 dark:text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    <ArrowRight size={18} />
                    زيارة معرض المصمم
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Images */}
          <div className="bg-white dark:bg-slate-800 lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto order-1 lg:order-2">
            <div className="p-4 lg:p-8">
              {/* Main Image Slider */}
              <div className="relative aspect-square bg-slate-100 dark:bg-slate-700 rounded-xl overflow-hidden mb-4">
                <div className="relative w-full h-full">
                  {productImages.length > 0 ? (
                    productImages.map((image, index) => (
                      <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                          index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                    ))
                  ) : (
                    <div className="w-full h-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300">
                      لا توجد صورة للمنتج
                    </div>
                  )}
                </div>
                
                {/* Navigation Arrows */}
                {productImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-800/70 hover:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center transition-all z-10"
                    >
                      <ChevronLeft size={20} className="text-white" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-800/70 hover:bg-slate-800/90 backdrop-blur rounded-full flex items-center justify-center transition-all z-10"
                    >
                      <ChevronRight size={20} className="text-white" />
                    </button>
                  </>
                )}

                {/* Image Counter */}
                {productImages.length > 1 && (
                  <div className="absolute bottom-3 right-3 bg-slate-800/70 backdrop-blur px-2.5 py-1 rounded-full text-white text-xs font-medium z-10">
                    {currentImageIndex + 1} / {productImages.length}
                  </div>
                )}
              </div>

              {/* Thumbnail Images */}
              {productImages.length > 1 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {productImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`aspect-square bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden transition-all ${
                        index === currentImageIndex 
                          ? 'ring-2 ring-blue-500' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-900 dark:via-slate-900 p-4 z-20">
        <div className="max-w-7xl mx-auto">
          <Button 
            onClick={() => addToCart(product)}
            className="w-full py-4 text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-xl flex items-center justify-center gap-2"
          >
            <ShoppingBag size={24} />
            ابدأ التفصيل الآن
          </Button>
        </div>
      </div>
    </div>
  );
};
