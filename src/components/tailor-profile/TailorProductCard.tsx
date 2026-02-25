import React from 'react';
import { ShoppingBag, Scissors, ChevronLeft, ChevronRight } from 'lucide-react';
import { Product } from '../../../types';
import { StableImage } from '../../../components/StableImage';
import { TailorProductActions } from './TailorProductActions';
import { useImageLightbox } from '../../../components/ImageLightbox';

export type ViewMode = 'grid' | 'compact' | 'list';

function formatOmr(value: unknown) {
   const num = typeof value === 'number' ? value : Number(value);
   if (!Number.isFinite(num)) return null;
   return num.toFixed(3);
}

function getCoverImage(product: Product) {
   const anyProduct = product as any;
   const images = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : (Array.isArray(anyProduct?.imageUrls) ? anyProduct.imageUrls : []);

   const coverIndex = typeof product.coverImageIndex === 'number' ? product.coverImageIndex : 0;
   const candidate = images[coverIndex] || images[0] || product.image;
   return candidate || null;
}

export const TailorProductCard = React.memo(function TailorProductCard({
   product,
   viewMode,
   onClick,
   onLikeChange,
   onToggleLike,
   isHot,
   compact
}: {
   product: Product;
   viewMode: ViewMode;
   onClick: () => void;
   onLikeChange?: (newCount: number) => void;
   onToggleLike?: (id: string, count: number) => void;
   isHot?: boolean;
   compact?: boolean;
}) {
   const cover = getCoverImage(product);
   const price = formatOmr(product.price);
   const likes = typeof (product as any).likes === 'number' ? (product as any).likes : ((product as any).likeCount || 0);

   // Handle both like handlers
   const handleLikeChange = (newCount: number) => {
       if (onLikeChange) onLikeChange(newCount);
       if (onToggleLike) onToggleLike(product.id, newCount);
   };

   // Slideshow Logic for Desktop Hover
   const images = Array.isArray(product.images) && product.images.length > 0 
        ? product.images 
        : (Array.isArray((product as any).imageUrls) ? (product as any).imageUrls : (product.image ? [product.image] : []));
   
   const [index, setIndex] = React.useState(0);
   const intervalRef = React.useRef<NodeJS.Timeout | null>(null);
   const { openLightbox, LightboxPortal } = useImageLightbox();

   const startSlideshow = () => {
        if (images.length > 1 && !intervalRef.current) {
            intervalRef.current = setInterval(() => {
                setIndex((prev) => (prev + 1) % images.length);
            }, 1200);
        }
   };

   const pauseSlideshow = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
   };

   const stopSlideshow = () => {
        pauseSlideshow();
        setIndex(0);
   };

   const goToPrev = (e: React.MouseEvent) => {
        e.stopPropagation();
        pauseSlideshow();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
   };

   const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        pauseSlideshow();
        setIndex((prev) => (prev + 1) % images.length);
   };

   const handleImageClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        const lightboxImages = images.length > 0 ? images : (cover ? [cover] : []);
        if (lightboxImages.length > 0) openLightbox(lightboxImages, index);
   };

   // List View (Horizontal)
   if (viewMode === 'list') {
      return (
         <div 
            onClick={onClick}
            className="group flex gap-4 bg-white p-3 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all cursor-pointer"
         >
            <div className="w-24 h-24 shrink-0 rounded-xl overflow-hidden bg-zinc-100 relative">
               <StableImage 
                  src={cover} 
                  alt={product.name} 
                  aspectClass="h-full" 
                  className="h-full w-full" 
                  imgClassName="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
               />
            </div>
            <div className="flex-1 flex flex-col justify-center text-right">
                <h3 className="font-bold text-zinc-900 text-sm mb-1">{product.name}</h3>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Scissors size={12} />
                    <span>يبدأ من <span className="font-bold text-zinc-900">{price}</span> ر.ع</span>
                </div>
            </div>
         </div>
      );
   }

   // Grid / Compact View - Matches Home Page "Trends" Design
   return (
      <>
      <div 
        className="cursor-pointer group h-full flex flex-col" 
        onClick={onClick}
      >
        <div 
            className="relative aspect-[3/4] bg-zinc-800 rounded-3xl overflow-hidden mb-3 border border-white/10 shadow-sm hover:shadow-md transition-all duration-300"
            onMouseEnter={startSlideshow}
            onMouseLeave={stopSlideshow}
            onClick={handleImageClick}
        >
             {/* Slideshow Check */}
             {images.length > 0 ? (
                 images.map((img: string, i: number) => (
                    <img 
                        key={i}
                        src={img} 
                        className={`w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ${
                             i === index ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                        }`}
                        alt={product.name} 
                        loading="eager"
                        decoding="async"
                    />
                 ))
             ) : (
                <StableImage
                    src={cover}
                    alt={product.name}
                    aspectClass="w-full h-full"
                    className="w-full h-full"
                    imgClassName="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
             )}
             
             {/* Gradient Overlay (Subtle) */}
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

             {/* Manual Nav Arrows */}
             {images.length > 1 && (
               <>
                 <button
                   className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white p-1.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow"
                   onClick={goToPrev}
                   aria-label="السابق"
                 >
                   <ChevronRight size={17} />
                 </button>
                 <button
                   className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/65 text-white p-1.5 rounded-full z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 shadow"
                   onClick={goToNext}
                   aria-label="التالي"
                 >
                   <ChevronLeft size={17} />
                 </button>
               </>
             )}

             {/* Image Counter Dots */}
             {images.length > 1 && (
               <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                 {images.map((_: string, i: number) => (
                   <span
                     key={i}
                     className={`block rounded-full transition-all duration-300 ${
                       i === index ? 'w-3 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/50'
                     }`}
                   />
                 ))}
               </div>
             )}

             {/* Like Button Top Right - Force Activated */}
             <div className="absolute top-3 right-3 opacity-100 transition-opacity duration-300 z-20">
                <TailorProductActions 
                    productId={product.id} 
                    initialLikes={likes} 
                    onLikeChange={handleLikeChange}
                    variant="glass"
                />
             </div>

             {/* Hidden "Start" Button (Shop Bag) - appears on hover like Home Page */}
             <button 
                className="absolute bottom-4 right-4 bg-[var(--theme-primary)] text-white w-10 h-10 rounded-full flex items-center justify-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 z-10 shadow-xl"
                title="تفاصيل"
                onClick={(e) => { e.stopPropagation(); onClick(); }}
             >
                <ShoppingBag size={18} />
             </button>
        </div>

        <div className="px-1 text-right">
             {/* Title */}
             <h4 className="text-sm font-light text-white mb-1 leading-tight transition-colors line-clamp-1">
                 {product.name}
             </h4>
             
             {/* Price */}
             <div className="flex items-center gap-1.5 text-xs text-white/70 font-light">
                 <Scissors size={12} className="text-white/40" />
                 <span>يبدأ من <span className="text-white font-medium">{price}</span> ر.ع</span>
             </div>
        </div>
      </div>

      <LightboxPortal />
      </>
   );
});
