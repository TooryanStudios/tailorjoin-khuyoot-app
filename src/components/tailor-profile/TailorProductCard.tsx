import React from 'react';
import { ShoppingBag, Tag } from 'lucide-react';
import { Product } from '../../../types';
import { StableImage } from '../../../components/StableImage';
import { TailorProductActions } from './TailorProductActions';

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
   isHot,
}: {
   product: Product;
   viewMode: ViewMode;
   onClick: () => void;
   onLikeChange?: (newCount: number) => void;
   isHot?: boolean;
}) {
   const cover = getCoverImage(product);
   const price = formatOmr(product.price);
   const likes = typeof (product as any).likes === 'number' ? (product as any).likes : 0;
   const tags: string[] = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];

   const isCompact = viewMode === 'compact';
   const isList = viewMode === 'list';

   const priceNode = price ? (
      <div className="inline-flex items-baseline gap-1 rounded-lg bg-blue-500/10 px-2.5 py-1">
         <span className="text-sm font-extrabold text-blue-600 tabular-nums">{price}</span>
         <span className="text-[11px] font-semibold text-blue-600/80">ر.ع</span>
      </div>
   ) : null;

   if (isList) {
      return (
         <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
               if (e.key === 'Enter' || e.key === ' ') onClick();
            }}
            className="group w-full text-right bg-[var(--studio-card)] border border-[var(--studio-card-border)] rounded-xl overflow-hidden hover:shadow-lg transition-all flex gap-3 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
            <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden bg-[var(--studio-surface)] rounded-lg">
               <StableImage src={cover} alt={product.name} aspectClass="h-full" className="h-full" imgClassName="transition-transform duration-500 group-hover:scale-105" />
               <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                  <TailorProductActions productId={product.id} initialLikes={likes} onLikeChange={onLikeChange} />
               </div>

               {isHot && (
                  <div className="absolute bottom-2 left-2">
                     <span className="inline-flex items-center rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-black text-white tracking-wide">
                        <span className="animate-pulse">HOT</span>
                     </span>
                  </div>
               )}

               {tags.length > 0 && (
                  <div className="absolute top-2 left-2">
                     <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2 py-1 text-[10px] font-semibold text-white max-w-[140px]">
                        <Tag className="h-3 w-3" />
                        <span className="truncate">{tags[0]}</span>
                     </span>
                  </div>
               )}
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-between">
               <div>
                  <div className="flex items-start justify-between gap-2">
                     <div className="text-[var(--studio-text)] font-normal text-sm line-clamp-2">{product.name}</div>
                     {priceNode}
                  </div>
                  {tags.length > 1 && (
                     <div className="mt-1 text-[11px] text-[var(--studio-text-muted)] line-clamp-1">{tags.slice(1, 4).join(' • ')}</div>
                  )}

                   <button
                      type="button"
                      onClick={(e) => {
                         e.stopPropagation();
                         onClick();
                      }}
                      className="group/start mt-3 w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg text-white text-sm font-bold py-2 transition-all bg-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                   >
                      <ShoppingBag size={16} />
                      ابدأ التفصيل
                   </button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div
         role="button"
         tabIndex={0}
         onClick={onClick}
         onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') onClick();
         }}
         className={
            'group w-full text-right bg-[var(--studio-card)] border border-[var(--studio-card-border)] overflow-hidden hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
            (isCompact ? 'rounded-lg' : 'rounded-xl')
         }
      >
         <div className={isCompact ? 'relative aspect-square overflow-hidden bg-[var(--studio-surface)]' : 'relative aspect-[3/4] overflow-hidden bg-[var(--studio-surface)]'}>
            <StableImage
               src={cover}
               alt={product.name}
               aspectClass="h-full"
               className="h-full"
               imgClassName="w-full h-full object-cover transition-transform duration-500 hover:scale-[1.05]"
            />

            <div className="absolute top-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
               <TailorProductActions productId={product.id} initialLikes={likes} onLikeChange={onLikeChange} />
            </div>

            {isHot && (
               <div className="absolute bottom-2 right-2">
                  <span className="inline-flex items-center rounded-full bg-red-600 px-3 py-1.5 text-[11px] font-black text-white tracking-wide shadow-lg">
                     <span className="animate-pulse">HOT</span>
                  </span>
               </div>
            )}

            {tags.length > 0 && (
               <div className="absolute top-2 left-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-black/55 backdrop-blur px-2 py-1 text-[10px] font-semibold text-white max-w-[160px]">
                     <Tag className="h-3 w-3" />
                     <span className="truncate">{tags[0]}</span>
                  </span>
               </div>
            )}

         </div>

         <div className={isCompact ? 'p-2' : 'p-3'}>
            <div className="flex items-start justify-between gap-2">
               <div className={isCompact ? 'text-slate-900 dark:text-white font-normal text-xs truncate' : 'text-slate-900 dark:text-white font-normal text-sm line-clamp-2'}>
                  {product.name}
               </div>
               {priceNode}
            </div>
            {tags.length > 1 && !isCompact && (
               <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{tags.slice(1, 4).join(' • ')}</div>
            )}

            <button
               type="button"
               onClick={(e) => {
                  e.stopPropagation();
                  onClick();
               }}
               className={
                  'group/start mt-3 w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg text-white font-bold transition-all bg-blue-600 shadow-md hover:shadow-lg hover:-translate-y-0.5 ' +
                  (isCompact ? 'py-2 text-xs' : 'py-2.5 text-sm')
               }
            >
               <ShoppingBag size={isCompact ? 14 : 16} />
               ابدأ التفصيل
            </button>
         </div>
      </div>
   );
});
