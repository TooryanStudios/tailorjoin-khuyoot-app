
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Star, MessageCircle, Clock, CheckCircle2, ShoppingBag, ImageIcon, User, RefreshCw, Grid3x3, LayoutGrid, List, Heart, Tag, Trash2 } from 'lucide-react';
import { Tailor, Product, Review } from '../types';
import { firebaseService } from '../services/firebase';
import { Button } from '../components/Button';
import { useApp } from '../context/AppContext';
import { getSpecializationLabel } from '../utils/specializationHelper';
import { StableImage } from '../components/StableImage';
import {
   addToWishlist,
   hasLikedProduct,
   isInWishlist,
   likeProduct,
   removeFromWishlist,
   unlikeProduct,
} from '../services/interactionService';
import { addReview, getReviews, hasUserReviewed, deleteReview } from '../services/reviewService';

type ViewMode = 'grid' | 'compact' | 'list';

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

const TailorProductActions = React.memo(function TailorProductActions({
   productId,
   initialLikes,
   onLikeChange,
}: {
   productId: string;
   initialLikes: number;
   onLikeChange?: (newCount: number) => void;
}) {
   const { user, toggleAuthModal } = useApp();
   const [isLiked, setIsLiked] = useState(false);
   const [inWishlist, setInWishlist] = useState(false);
   const [likesCount, setLikesCount] = useState(initialLikes);
   const [likeLoading, setLikeLoading] = useState(false);
   const [wishlistLoading, setWishlistLoading] = useState(false);

   useEffect(() => {
      setLikesCount(initialLikes);
   }, [initialLikes]);

   useEffect(() => {
      let cancelled = false;
      async function load() {
         if (!user) {
            setIsLiked(false);
            setInWishlist(false);
            return;
         }
         try {
            const [liked, wishlisted] = await Promise.all([
               hasLikedProduct(user.id, productId),
               isInWishlist(user.id, productId),
            ]);
            if (cancelled) return;
            setIsLiked(liked);
            setInWishlist(wishlisted);
         } catch (e) {
            console.warn('[TailorProductActions] Failed to load interactions:', e);
         }
      }
      load();
      return () => {
         cancelled = true;
      };
   }, [user, productId]);

   const requireAuth = useCallback(() => {
      if (!user) {
         toggleAuthModal(true);
         return false;
      }
      return true;
   }, [toggleAuthModal, user]);

   const toggleLike = useCallback(async () => {
      if (!requireAuth()) return;
      if (likeLoading) return;

      setLikeLoading(true);
      try {
         if (isLiked) {
            await unlikeProduct(user!.id, productId);
            const next = Math.max(0, likesCount - 1);
            setIsLiked(false);
            setLikesCount(next);
            onLikeChange?.(next);
         } else {
            await likeProduct(user!.id, productId);
            const next = likesCount + 1;
            setIsLiked(true);
            setLikesCount(next);
            onLikeChange?.(next);
         }
      } catch (e) {
         console.warn('[TailorProductActions] Like failed:', e);
      } finally {
         setLikeLoading(false);
      }
   }, [requireAuth, likeLoading, isLiked, user, productId, likesCount, onLikeChange]);

   const toggleWishlist = useCallback(async () => {
      if (!requireAuth()) return;
      if (wishlistLoading) return;

      setWishlistLoading(true);
      try {
         if (inWishlist) {
            await removeFromWishlist(user!.id, productId);
            setInWishlist(false);
         } else {
            await addToWishlist(user!.id, productId);
            setInWishlist(true);
         }
      } catch (e) {
         console.warn('[TailorProductActions] Wishlist failed:', e);
      } finally {
         setWishlistLoading(false);
      }
   }, [requireAuth, wishlistLoading, inWishlist, user, productId]);

   return (
      <div className="flex items-center gap-1.5">
         <button
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               toggleLike();
            }}
            disabled={likeLoading}
            className={
               'group inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 bg-black/45 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-black/55 hover:ring-white/25 disabled:opacity-60'
            }
            aria-label="Like"
            title="أعجبني"
         >
            <Heart
               className={
                  'h-4 w-4 transition-transform duration-200 ' +
                  (isLiked ? 'fill-current text-red-300 scale-110' : 'group-hover:scale-110')
               }
            />
            <span className="text-[11px] font-semibold tabular-nums">{likesCount}</span>
         </button>

         <button
            type="button"
            onClick={(e) => {
               e.stopPropagation();
               toggleWishlist();
            }}
            disabled={wishlistLoading}
            className={
               'group inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/15 backdrop-blur transition hover:bg-black/55 hover:ring-white/25 disabled:opacity-60'
            }
            aria-label="Save"
            title="وسم"
         >
            <Tag className={'h-4 w-4 transition-transform duration-200 ' + (inWishlist ? 'scale-110 text-purple-300' : 'group-hover:scale-110')} />
         </button>
      </div>
   );
});

const TailorProductCard = React.memo(function TailorProductCard({
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
      <div className="inline-flex items-baseline gap-1 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 px-2.5 py-1">
         <span className="text-sm font-extrabold text-blue-700 dark:text-blue-200 tabular-nums">{price}</span>
         <span className="text-[11px] font-semibold text-blue-700/80 dark:text-blue-200/80">ر.ع</span>
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
            className="group w-full text-right bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden hover:shadow-lg dark:hover:border-white/20 transition-all flex gap-3 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
         >
            <div className="relative w-28 h-28 flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-lg">
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
                     <div className="text-slate-900 dark:text-white font-normal text-sm line-clamp-2">{product.name}</div>
                     {priceNode}
                  </div>
                  {tags.length > 1 && (
                     <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">{tags.slice(1, 4).join(' • ')}</div>
                  )}

                  <button
                     type="button"
                     onClick={(e) => {
                        e.stopPropagation();
                        onClick();
                     }}
                     className="group/start mt-3 w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg text-white text-sm font-bold py-2 transition-all bg-neutral-900 dark:bg-zinc-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-neutral-800 dark:hover:bg-zinc-700"
                  >
                     <span className="pointer-events-none absolute -inset-x-10 inset-y-0 opacity-0 group-hover/start:opacity-100 transition-opacity">
                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/start:translate-x-full transition-transform duration-700" />
                     </span>
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
            'group w-full text-right bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 overflow-hidden hover:shadow-lg dark:hover:border-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ' +
            (isCompact ? 'rounded-lg' : 'rounded-xl')
         }
      >
         <div className={isCompact ? 'relative aspect-square overflow-hidden bg-slate-100 dark:bg-slate-900' : 'relative aspect-[3/4] overflow-hidden bg-slate-100 dark:bg-slate-900'}>
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
                  'group/start mt-3 w-full relative overflow-hidden inline-flex items-center justify-center gap-2 rounded-lg text-white font-bold transition-all bg-neutral-900 dark:bg-zinc-800 shadow-md hover:shadow-lg hover:-translate-y-0.5 hover:bg-neutral-800 dark:hover:bg-zinc-700 ' +
                  (isCompact ? 'py-2 text-xs' : 'py-2.5 text-sm')
               }
            >
               <span className="pointer-events-none absolute -inset-x-10 inset-y-0 opacity-0 group-hover/start:opacity-100 transition-opacity">
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/start:translate-x-full transition-transform duration-700" />
               </span>
               <ShoppingBag size={isCompact ? 14 : 16} />
               ابدأ التفصيل
            </button>
         </div>
      </div>
   );
});

export const TailorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
   const { user, toggleAuthModal } = useApp();
  const [tailor, setTailor] = useState<Tailor | null>(null);
  const [tailorProducts, setTailorProducts] = useState<Product[]>([]);
   const [loadingTailor, setLoadingTailor] = useState(false);
   const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'portfolio' | 'reviews'>('products');
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
   const [contentMinHeight, setContentMinHeight] = useState<number>(0);
   const contentRef = useRef<HTMLDivElement | null>(null);

   const [shopReviews, setShopReviews] = useState<Review[]>([]);
   const [loadingReviews, setLoadingReviews] = useState(false);
   const [reviewRating, setReviewRating] = useState(0);
   const [reviewHover, setReviewHover] = useState(0);
   const [reviewComment, setReviewComment] = useState('');
   const [reviewSubmitting, setReviewSubmitting] = useState(false);
   const [termsAccepted, setTermsAccepted] = useState(false);
   const [hasReviewed, setHasReviewed] = useState(false);

  const handleCardLikeChange = useCallback((productId: string, newCount: number) => {
     setTailorProducts((prev) =>
        prev.map((p) => (p.id === productId ? ({ ...p, likes: newCount } as any) : p))
     );
  }, []);

  const handleContactClick = () => {
    if (!user) {
      toggleAuthModal(true);
    } else {
      // فتح نافذة المحادثة أو الانتقال لصفحة الرسائل
      alert('سيتم فتح المحادثة قريباً');
    }
  };

  useEffect(() => {
     if (!user) {
        setTermsAccepted(false);
        setHasReviewed(false);
        return;
     }
     const key = `review_terms_accepted_v1_${user.id}`;
     setTermsAccepted(localStorage.getItem(key) === '1');
  }, [user]);

   const loadTailor = async () => {
      if (!id) return;
      setLoadingTailor(true);
      try {
         const profile = await firebaseService.getUserProfile(id);
         if (!profile) {
            setTailor(null);
            return;
         }

         const anyProfile = profile as any;
         const mapped: Tailor = {
            id,
            name: anyProfile.name || anyProfile.shopName || anyProfile.email || 'خياط',
            specialization: anyProfile.specialization,
            tailorGender: anyProfile.tailorGender,
            rating: anyProfile.rating || anyProfile.ratingAvg,
            location: anyProfile.location,
            region: anyProfile.region,
            bio: anyProfile.bio,
            followers: anyProfile.followers,
            approvalStatus: anyProfile.approvalStatus,
            portfolio: Array.isArray(anyProfile.portfolio) ? anyProfile.portfolio : [],
            reviews: Array.isArray(anyProfile.reviews) ? anyProfile.reviews : [],
            image: anyProfile.profileImage || anyProfile.image || anyProfile.photoURL || '',
            coverImage: anyProfile.coverImage || anyProfile.boardImage || '',
         };

         setTailor(mapped);
      } finally {
         setLoadingTailor(false);
      }
   };

   const loadProducts = async () => {
      if (!id) return;
      setLoadingProducts(true);
      try {
         const products = await firebaseService.getProductsByTailorId(id);
         const filtered = (products || []).filter((p: any) => {
            if (!p) return false;
            if (p.isDraft === true) return false;

            const owner = p.tailorId || p.ownerId || p.userId;
            if (owner && owner !== id) return false;

            return true;
         });
         setTailorProducts(filtered);
      } finally {
         setLoadingProducts(false);
      }
   };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadProducts();
    setTimeout(() => setRefreshing(false), 500);
  };

  useEffect(() => {
    if (id) {
         loadTailor();
         loadProducts();
    }
  }, [id]);

  useEffect(() => {
     if (!id) return;
     if (activeTab !== 'reviews') return;

     let cancelled = false;
     async function load() {
        setLoadingReviews(true);
        try {
           const items = await getReviews('shop', id, 50);
           if (cancelled) return;
           setShopReviews(items || []);
        } finally {
           if (!cancelled) setLoadingReviews(false);
        }
     }
     load();

     return () => {
        cancelled = true;
     };
  }, [activeTab, id]);

  useEffect(() => {
     if (!user || !id) {
        setHasReviewed(false);
        return;
     }
     if (activeTab !== 'reviews') return;

     let cancelled = false;
     async function load() {
        try {
           const already = await hasUserReviewed(user.id, 'shop', id);
           if (cancelled) return;
           setHasReviewed(already);
        } catch {
           if (!cancelled) setHasReviewed(false);
        }
     }
     load();
     return () => {
        cancelled = true;
     };
  }, [activeTab, id, user]);

  useEffect(() => {
     const el = contentRef.current;
     if (!el) return;
     const next = el.scrollHeight;
     if (!Number.isFinite(next) || next <= 0) return;
     setContentMinHeight((prev) => Math.max(prev, next));
  }, [activeTab, loadingProducts, tailorProducts.length, loadingReviews, shopReviews.length, tailor?.portfolio?.length]);

  const submitReview = useCallback(async () => {
     if (!id || !tailor) return;
     if (reviewSubmitting) return;

     if (reviewRating <= 0) {
        alert('يرجى اختيار تقييم');
        return;
     }

     if (!user) {
        toggleAuthModal(true);
        alert('سجل الدخول لإرسال تقييمك');
        return;
     }

     const termsKey = `review_terms_accepted_v1_${user.id}`;
     if (!termsAccepted) {
        alert('يرجى الإقرار بقراءة الشروط والأحكام قبل النشر');
        return;
     }
     localStorage.setItem(termsKey, '1');

     setReviewSubmitting(true);
     try {
        const created = await addReview({
           userId: user.id,
           userName: user.name,
           userAvatar: (user as any).profileImage,
           rating: reviewRating,
           comment: reviewComment.trim(),
           targetType: 'shop',
           targetId: id,
           verified: false,
        });
        setShopReviews((prev) => [created, ...prev]);
        setHasReviewed(true);
        setReviewRating(0);
        setReviewComment('');
     } catch (e) {
        console.warn('[TailorProfile] submitReview failed:', e);
        alert('حدث خطأ أثناء إضافة التقييم');
     } finally {
         setReviewSubmitting(false);
      }
   }, [id, tailor, reviewSubmitting, reviewRating, reviewComment, user, toggleAuthModal, termsAccepted]);

   const handleDeleteReview = useCallback(async (reviewId: string) => {
      if (!window.confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

      try {
         await deleteReview(reviewId);
         setShopReviews((prev) => prev.filter((r) => r.id !== reviewId));
         setHasReviewed(false); // Enable reviewing again
      } catch (error) {
         console.error('Failed to delete review:', error);
         alert('حدث خطأ أثناء حذف التقييم');
      }
   }, []);

   if (!tailor) {
      return (
         <div className="p-10 text-center text-slate-500 dark:text-slate-400">
            {loadingTailor ? 'جاري التحميل...' : 'لم يتم العثور على هذا الخياط'}
         </div>
      );
   }

  return (
    <div className="pb-24">
      {/* Cover Image */}
             <div className="h-48 md:h-64 bg-slate-200 dark:bg-slate-800 relative">
                   {tailor.coverImage ? (
                      <StableImage
                           src={tailor.coverImage}
                           alt="Cover"
                           aspectClass="h-full"
                      />
                   ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
                   )}
         <div className="absolute inset-0 bg-black/30"></div>
         <button 
           onClick={() => navigate(-1)}
           className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors"
         >
           <ArrowRight size={20} />
         </button>
      </div>

      {/* Profile Header */}
      <div className="px-2 sm:px-3 md:px-6 max-w-5xl mx-auto -mt-16 relative">
         <div className="bg-white dark:bg-[#0f172a] rounded-2xl p-6 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-6 items-start md:items-end">
            <div className="w-32 h-32 rounded-2xl bg-slate-100 p-1 bg-white shadow-lg -mt-16 md:-mt-20 overflow-hidden">
                      {tailor.image ? (
                         <StableImage src={tailor.image} alt={tailor.name} aspectClass="h-full" className="rounded-xl" />
                      ) : (
                         <div className="h-full w-full rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                            <User size={40} className="text-slate-400" />
                         </div>
                      )}
            </div>
            
            <div className="flex-1">
               <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                       {tailor.name}
                       {tailor.approvalStatus === 'approved' && <CheckCircle2 size={20} className="text-blue-500" />}
                    </h1>
                    <div className="flex items-center gap-2 text-sm">
                      <p className="text-slate-500 dark:text-slate-400">{getSpecializationLabel(tailor.specialization)}</p>
                      {tailor.tailorGender && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          tailor.tailorGender === 'male' 
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' 
                            : 'bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400'
                        }`}>
                          {tailor.tailorGender === 'male' ? '👔 رجالي' : '👗 نسائي'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white">{tailor.followers}</p>
                        <p className="text-[10px] text-slate-500">متابع</p>
                     </div>
                     <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                     <div className="text-center">
                        <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1 justify-center">
                           {tailor.rating} <Star size={12} className="text-amber-500 fill-amber-500" />
                        </p>
                        <p className="text-[10px] text-slate-500">تقييم</p>
                     </div>
                  </div>
               </div>
               
               <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1"><MapPin size={16} /> {tailor.location}</span>
                  <span className="flex items-center gap-1"><Clock size={16} /> يفتح: 9:00 ص - 10:00 م</span>
               </div>
            </div>

            <Button 
              onClick={handleContactClick}
              className="shrink-0 flex items-center gap-2"
            >
               <MessageCircle size={18} /> {user ? 'تواصل' : 'سجّل للتواصل'}
            </Button>
         </div>
         
         {/* Bio */}
         {tailor.bio && (
            <div className="mt-6 px-2">
               <p className="text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">{tailor.bio}</p>
            </div>
         )}

         {/* Tabs */}
         <div className="mt-8 border-b border-slate-200 dark:border-slate-700 flex gap-6 items-center justify-between">
            <div className="flex gap-6">
               <button 
                  onClick={() => setActiveTab('products')}
                  className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'products' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
               >
                  الموديلات
                  {activeTab === 'products' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600"></div>}
               </button>
               <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`pb-3 font-bold text-sm transition-colors relative ${activeTab === 'reviews' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}
               >
                  التقييمات
                  {activeTab === 'reviews' && <div className="absolute bottom-0 right-0 w-full h-0.5 bg-blue-600"></div>}
               </button>
            </div>
            
            {activeTab === 'products' && (
               <div className="flex items-center gap-2">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                     <button
                        onClick={() => setViewMode('grid')}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                           viewMode === 'grid'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="عرض شبكي"
                     >
                        <Grid3x3 size={16} />
                     </button>
                     <button
                        onClick={() => setViewMode('compact')}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                           viewMode === 'compact'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="عرض مضغوط"
                     >
                        <LayoutGrid size={16} />
                     </button>
                     <button
                        onClick={() => setViewMode('list')}
                        className={`w-8 h-8 rounded flex items-center justify-center transition-all ${
                           viewMode === 'list'
                              ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                              : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                        }`}
                        title="عرض قائمة"
                     >
                        <List size={16} />
                     </button>
                  </div>
                  
                  <button
                     onClick={handleRefresh}
                     disabled={refreshing}
                     className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
                     title="تحديث المنتجات"
                  >
                     <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                     <span>تحديث</span>
                  </button>
               </div>
            )}
         </div>

         {/* Content */}
         <div
            className="mt-6"
            ref={contentRef}
            style={contentMinHeight ? { minHeight: `${contentMinHeight}px` } : undefined}
         >
            {activeTab === 'products' && (
               <>
                  {loadingProducts && tailorProducts.length === 0 ? (
                     <div className="py-10 text-center text-slate-400">جاري تحميل الموديلات...</div>
                  ) : tailorProducts.length > 0 ? (
                     <>
                        {viewMode === 'grid' && (
                           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-[6px]">
                              {tailorProducts.map((p, idx) => (
                                 <TailorProductCard
                                   key={p.id}
                                   product={p}
                                   viewMode={viewMode}
                                   onClick={() => navigate(`/product/${p.id}`)}
                                                    onLikeChange={(count) => handleCardLikeChange(p.id, count)}
                                   isHot={idx < 2}
                                 />
                              ))}
                           </div>
                        )}

                        {viewMode === 'compact' && (
                           <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-[6px]">
                              {tailorProducts.map((p, idx) => (
                                 <TailorProductCard
                                   key={p.id}
                                   product={p}
                                   viewMode={viewMode}
                                   onClick={() => navigate(`/product/${p.id}`)}
                                                    onLikeChange={(count) => handleCardLikeChange(p.id, count)}
                                   isHot={idx < 2}
                                 />
                              ))}
                           </div>
                        )}

                        {viewMode === 'list' && (
                           <div className="space-y-2">
                              {tailorProducts.map((p, idx) => (
                                 <TailorProductCard
                                   key={p.id}
                                   product={p}
                                   viewMode={viewMode}
                                   onClick={() => navigate(`/product/${p.id}`)}
                                                    onLikeChange={(count) => handleCardLikeChange(p.id, count)}
                                   isHot={idx < 2}
                                 />
                              ))}
                           </div>
                        )}
                     </>
                  ) : (
                     <div className="py-10 text-center text-slate-400">
                        <ShoppingBag size={48} className="mx-auto mb-2 opacity-30" />
                        <p>لا توجد موديلات معروضة حالياً</p>
                     </div>
                  )}
               </>
            )}

            {activeTab === 'reviews' && (
               <div className="space-y-4 max-w-2xl">
                  <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 sm:p-4 rounded-2xl border border-zinc-200 dark:border-white/5 backdrop-blur-sm">
                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                           <span className="text-sm font-bold text-zinc-700 dark:text-zinc-200">قيم تجربتك</span>
                           <div className="flex items-center gap-0.5" dir="ltr">
                              {[1, 2, 3, 4, 5].map((star) => (
                                 <button
                                    key={star}
                                    type="button"
                                    onClick={() => setReviewRating(star)}
                                    onMouseEnter={() => setReviewHover(star)}
                                    onMouseLeave={() => setReviewHover(0)}
                                    className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                                    aria-label={`Rate ${star}`}
                                 >
                                    <Star
                                       className={
                                          'w-5 h-5 ' +
                                          (star <= (reviewHover || reviewRating)
                                             ? 'fill-amber-400 text-amber-400'
                                             : 'text-zinc-300 dark:text-zinc-700')
                                       }
                                    />
                                 </button>
                              ))}
                           </div>
                           {reviewRating > 0 && (
                              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                                 {reviewRating === 1 && 'ضعيف'}
                                 {reviewRating === 2 && 'مقبول'}
                                 {reviewRating === 3 && 'جيد'}
                                 {reviewRating === 4 && 'جيد جداً'}
                                 {reviewRating === 5 && 'ممتاز'}
                              </span>
                           )}
                        </div>
                        {hasReviewed && (
                           <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                              تم التقييم
                           </div>
                        )}
                     </div>

                     <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        className="w-full px-3 py-2.5 text-sm border-0 bg-white dark:bg-black/20 rounded-xl shadow-sm ring-1 ring-zinc-200 dark:ring-white/10 focus:ring-2 focus:ring-purple-500/50 resize-y min-h-[60px] text-zinc-900 dark:text-white placeholder:text-zinc-400"
                        rows={2}
                        placeholder="اكتب تعليقك هنا..."
                     />

                     <div className="mt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {user ? (
                           !termsAccepted ? (
                              <label className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 cursor-pointer select-none">
                                 <input
                                    type="checkbox"
                                    className="rounded border-zinc-300 dark:border-zinc-700 text-purple-600 focus:ring-purple-500/30"
                                    checked={termsAccepted}
                                    onChange={(e) => {
                                       const next = e.target.checked;
                                       setTermsAccepted(next);
                                       if (next) {
                                          try {
                                             localStorage.setItem(`review_terms_accepted_v1_${user.id}`, '1');
                                          } catch {}
                                       }
                                    }}
                                 />
                                 <span>
                                    أوافق على <a className="text-zinc-700 dark:text-zinc-300 hover:underline" href="/terms" target="_blank" rel="noreferrer">الشروط</a>
                                 </span>
                              </label>
                           ) : (
                              <div className="text-[10px] text-zinc-400 flex items-center gap-1">
                                 <CheckCircle2 size={12} />
                                 <span>الشروط مقبولة</span>
                              </div>
                           )
                        ) : (
                           <div className="text-xs text-zinc-500">سجل الدخول للتقييم</div>
                        )}

                        <button
                           type="button"
                           disabled={reviewSubmitting || hasReviewed}
                           onClick={submitReview}
                           className="self-end sm:self-auto px-4 py-1.5 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                           {reviewSubmitting ? 'جاري...' : 'نشر التقييم'}
                        </button>
                     </div>
                  </div>

                  {loadingReviews && shopReviews.length === 0 ? (
                     <div className="text-center py-10 text-slate-400">جاري تحميل التقييمات...</div>
                  ) : shopReviews.length > 0 ? (
                     shopReviews.map((review) => (
                        <div key={review.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                 <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                    <User size={14} className="text-slate-500" />
                                 </div>
                                 <span className="font-bold text-sm text-slate-900 dark:text-white">{review.userName}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                 <div className="flex text-amber-500 text-xs" dir="ltr">
                                    {[...Array(5)].map((_, i) => (
                                       <Star
                                          key={i}
                                          size={12}
                                          fill={i < review.rating ? 'currentColor' : 'none'}
                                          className={i >= review.rating ? 'text-slate-300 dark:text-slate-600' : ''}
                                       />
                                    ))}
                                 </div>
                                 {user && user.id === review.userId && (
                                    <button
                                       onClick={() => handleDeleteReview(review.id)}
                                       className="text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1"
                                       title="حذف التقييم"
                                    >
                                       <Trash2 size={14} />
                                    </button>
                                 )}
                              </div>
                           </div>
                           <p className="text-slate-600 dark:text-slate-300 text-sm">{review.comment}</p>
                           {review.date && <p className="text-xs text-slate-400 mt-2">{review.date}</p>}
                        </div>
                     ))
                  ) : (
                     <div className="text-center py-10 text-slate-400">لا توجد تقييمات بعد</div>
                  )}
               </div>
            )}
         </div>

      </div>
    </div>
  );
};
