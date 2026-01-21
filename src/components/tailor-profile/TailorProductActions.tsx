import React, { useCallback, useEffect, useState } from 'react';
import { Heart, Tag } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import {
   addToWishlist,
   hasLikedProduct,
   isInWishlist,
   likeProduct,
   removeFromWishlist,
   unlikeProduct,
} from '../../../services/interactionService';

export const TailorProductActions = React.memo(function TailorProductActions({
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
