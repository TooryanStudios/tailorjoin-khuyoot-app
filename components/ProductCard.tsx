
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../types';
import { Star, ShoppingBag, MapPin, Clock, ChevronLeft, ChevronRight, Loader2, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ProductActions from './ProductActions';
import { firebaseService } from '../services/firebase';

interface ProductCardProps {
  product: Product;
  viewMode?: 'grid' | 'compact' | 'list';
  isOwner?: boolean; // هل المستخدم هو صاحب المنتج
  showLegacyBadge?: boolean; // عرض شارة الصور القديمة (للاستخدام في الصفحة الرئيسية)
  legacyBadgeText?: string; // نص الشارة
  legacyBadgeClassName?: string; // فئة الألوان للشارة
  onDelete?: () => void; // callback when product is deleted
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid', isOwner = false, showLegacyBadge = false, legacyBadgeText = 'صورة قديمة', legacyBadgeClassName = 'bg-amber-600/90', onDelete }) => {
  const { addToCart, user } = useApp();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check if this is an old product (from root products collection)
  // This flag is set by the backend when fetching products
  const isOldProduct = React.useMemo(() => {
    const anyProduct = product as any;
    return anyProduct._isOldStructure === true;
  }, [product]);

  const handleDeleteOldProduct = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm('هل أنت متأكد من حذف هذا المنتج من النظام القديم؟')) {
      return;
    }

    setDeleting(true);
    try {
      await firebaseService.deleteOldProduct(product.id);
      alert('تم حذف المنتج بنجاح');
      if (onDelete) onDelete();
    } catch (error) {
      console.error('Error deleting old product:', error);
      alert('فشل حذف المنتج: ' + (error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  // Get all product images - simplified
  const productImages = React.useMemo(() => {
    const anyProduct = product as any;
    const fallbackUrls = Array.isArray(anyProduct?.imageUrls) ? anyProduct.imageUrls : [];
    const images = product.images && product.images.length > 0
      ? product.images
      : (fallbackUrls.length > 0 ? fallbackUrls : [product.image]);
    const validImages = Array.from(new Set(images.filter(Boolean)));
    return validImages;
  }, [product]);

  // Detect if we're using legacy image approach (imageUrls) due to missing images[]
  const usingLegacyImage = React.useMemo(() => {
    const anyProduct = product as any;
    const hasImages = Array.isArray(product.images) && product.images.length > 0;
    const hasImageUrls = Array.isArray(anyProduct?.imageUrls) && anyProduct.imageUrls.length > 0;
    return !hasImages && hasImageUrls;
  }, [product]);

  // Reset image loaded state when image changes
  React.useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [currentImageIndex, productImages]);

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
  };

  // List view layout
  if (viewMode === 'list') {
    return (
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg dark:hover:border-white/20 transition-all group flex gap-4 p-3">
        <div 
          className="relative w-32 h-32 flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-lg cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
          )}
          <img 
            src={productImages[currentImageIndex]} 
            alt={product.name} 
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {showLegacyBadge && usingLegacyImage && (
            <div className={`absolute bottom-1 right-1 ${legacyBadgeClassName} backdrop-blur-md px-1.5 py-0.5 rounded text-white text-[10px] z-10`}>
              {legacyBadgeText}
            </div>
          )}
          {productImages.length > 1 && (
            <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-white text-xs">
              {currentImageIndex + 1}/{productImages.length}
            </div>
          )}
          {productImages.length > 1 && (
            <>
              <button onClick={prevImage} className="absolute left-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronLeft size={12} />
              </button>
              <button onClick={nextImage} className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight size={12} />
              </button>
            </>
          )}
        </div>
        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <h3 className="text-slate-800 dark:text-slate-100 font-bold text-base">{product.name}</h3>
            <div className="flex flex-col gap-1 mt-1">
              {product.tailorName && (
                <span className="text-slate-700 dark:text-slate-300 text-xs font-medium truncate">{product.tailorName}</span>
              )}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  <Star size={12} className="text-yellow-400 fill-yellow-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">{product.rating}</span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">•</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">{product.location}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{product.price.toFixed(3)} ر.ع</span>
            <button onClick={() => addToCart(product)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              أضف للسلة
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compact view layout
  if (viewMode === 'compact') {
    return (
      <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden hover:shadow-lg dark:hover:border-white/20 transition-all group">
        <div 
          className="relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
          onClick={() => navigate(`/product/${product.id}`)}
        >
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          )}
          <img 
            src={productImages[currentImageIndex]} 
            alt={product.name} 
            className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          {showLegacyBadge && usingLegacyImage && (
            <div className={`absolute bottom-1 right-1 ${legacyBadgeClassName} backdrop-blur-md px-1.5 py-0.5 rounded text-white text-[10px] z-10`}>
              {legacyBadgeText}
            </div>
          )}
          {productImages.length > 1 && (
            <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded text-white text-[10px]">
              {currentImageIndex + 1}/{productImages.length}
            </div>
          )}
          <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
            {productImages.map((_, index) => (
              <div key={index} className={`h-0.5 flex-1 rounded-full transition-all ${index === currentImageIndex ? 'bg-white' : 'bg-white/30'}`} />
            ))}
          </div>
        </div>
        <div className="p-2">
          <h3 className="text-slate-800 dark:text-slate-100 font-medium text-xs truncate">{product.name}</h3>
          <div className="flex items-center justify-between mt-1">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">{product.price.toFixed(3)}</span>
            <div className="flex items-center gap-0.5">
              <Star size={10} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[10px] text-slate-600 dark:text-slate-400">{product.rating}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default grid view layout
  return (
    <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg dark:hover:border-white/20 transition-all group">
      <div 
        className="relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900 cursor-pointer"
        onClick={() => navigate(`/product/${product.id}`)}
      >
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 dark:bg-slate-800 z-10">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          </div>
        )}
        <img 
          src={productImages[currentImageIndex]} 
          alt={product.name} 
          className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
        {showLegacyBadge && usingLegacyImage && (
          <div className={`absolute bottom-2 right-2 ${legacyBadgeClassName} backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[10px] font-medium z-10`}>
            {legacyBadgeText}
          </div>
        )}
        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 z-10">
          <Star size={12} className="text-yellow-400 fill-yellow-400" />
          <span className="text-xs text-white font-medium">{product.rating}</span>
        </div>

        {/* Delete button for old products (admin only) */}
        {user?.role === 'admin' && isOldProduct && (
          <button
            onClick={handleDeleteOldProduct}
            disabled={deleting}
            className="absolute bottom-2 left-2 w-8 h-8 bg-red-600/90 hover:bg-red-700 backdrop-blur-md rounded-full flex items-center justify-center transition-all z-10 disabled:opacity-50"
            title="حذف المنتج القديم"
          >
            {deleting ? (
              <Loader2 size={14} className="text-white animate-spin" />
            ) : (
              <Trash2 size={14} className="text-white" />
            )}
          </button>
        )}

        {/* Image Counter Badge */}
        {productImages.length > 1 && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full text-white text-xs font-medium z-10">
            {currentImageIndex + 1}/{productImages.length}
          </div>
        )}

        {/* Navigation Arrows - Always visible on mobile, show on hover on desktop */}
        {productImages.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronLeft size={16} className="text-slate-700 dark:text-white" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110 z-10 opacity-100 md:opacity-0 md:group-hover:opacity-100"
            >
              <ChevronRight size={16} className="text-slate-700 dark:text-white" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {productImages.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {productImages.map((_, index) => (
              <div
                key={index}
                className={`h-1 rounded-full transition-all ${
                  index === currentImageIndex 
                    ? 'w-4 bg-white' 
                    : 'w-1 bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 space-y-2">
        <div>
          <h3 className="text-slate-800 dark:text-slate-100 font-bold truncate text-sm md:text-base">{product.name}</h3>
          
          <div className="flex flex-col gap-1 mt-1">
             {product.tailorName && (
               <div className="text-slate-700 dark:text-slate-300 text-xs font-medium truncate">
                 {product.tailorName}
               </div>
             )}
             <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
               <MapPin size={10} />
               <span className="truncate">{product.location}</span>
             </div>
             {product.duration && (
               <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs">
                 <Clock size={10} />
                 <span className="truncate">مدة التفصيل: {product.duration}</span>
               </div>
             )}
          </div>
        </div>

        <button 
          onClick={() => navigate(`/product/${product.id}`)}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag size={16} />
          ابدأ التفصيل
        </button>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 dark:text-blue-400 font-bold text-sm md:text-base">{product.price.toFixed(3)} ر.ع</span>
            <ProductActions productId={product.id} likes={product.likes} compact />
          </div>
          <button 
            onClick={() => addToCart(product)}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-700 dark:text-white hover:text-white flex items-center justify-center transition-colors"
            aria-label="Add to cart"
          >
            <ShoppingBag size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
