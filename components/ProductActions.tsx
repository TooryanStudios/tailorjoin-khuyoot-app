import React, { useState, useEffect } from 'react';
import { Heart, Bookmark, Share2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  likeProduct,
  unlikeProduct,
  hasLikedProduct,
  addToWishlist,
  removeFromWishlist,
  isInWishlist
} from '../services/interactionService';

interface ProductActionsProps {
  productId: string;
  likes?: number;
  onLikeChange?: (newCount: number) => void;
  compact?: boolean;
}

export default function ProductActions({ 
  productId, 
  likes = 0,
  onLikeChange,
  compact = false 
}: ProductActionsProps) {
  const { user } = useApp();
  const [isLiked, setIsLiked] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [likesCount, setLikesCount] = useState(likes);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      checkUserInteractions();
    }
  }, [user, productId]);

  const checkUserInteractions = async () => {
    if (!user) return;
    
    try {
      const [liked, wishlisted] = await Promise.all([
        hasLikedProduct(user.id, productId),
        isInWishlist(user.id, productId)
      ]);
      
      setIsLiked(liked);
      setInWishlist(wishlisted);
    } catch (error) {
      console.error('Error checking user interactions:', error);
    }
  };

  const handleLike = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول للإعجاب بالمنتجات');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (isLiked) {
        await unlikeProduct(user.id, productId);
        const newCount = Math.max(0, likesCount - 1);
        setLikesCount(newCount);
        setIsLiked(false);
        onLikeChange?.(newCount);
      } else {
        await likeProduct(user.id, productId);
        const newCount = likesCount + 1;
        setLikesCount(newCount);
        setIsLiked(true);
        onLikeChange?.(newCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWishlist = async () => {
    if (!user) {
      alert('يجب تسجيل الدخول لإضافة المنتجات إلى قائمة الأمنيات');
      return;
    }

    if (loading) return;
    setLoading(true);

    try {
      if (inWishlist) {
        await removeFromWishlist(user.id, productId);
        setInWishlist(false);
      } else {
        await addToWishlist(user.id, productId);
        setInWishlist(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      alert(error instanceof Error ? error.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/product/${productId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'منتج من خيوط',
        url: url
      }).catch(() => {
        // Fallback to copy
        copyToClipboard(url);
      });
    } else {
      copyToClipboard(url);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('تم نسخ الرابط');
    }).catch(() => {
      alert('فشل نسخ الرابط');
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleLike}
          disabled={loading}
          className={`flex items-center gap-1 text-sm ${
            isLiked 
              ? 'text-red-500' 
              : 'text-gray-600 hover:text-red-500'
          } transition disabled:opacity-50`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          {likesCount > 0 && <span>{likesCount}</span>}
        </button>
        
        <button
          onClick={handleWishlist}
          disabled={loading}
          className={`text-sm ${
            inWishlist 
              ? 'text-purple-500' 
              : 'text-gray-600 hover:text-purple-500'
          } transition disabled:opacity-50`}
        >
          <Bookmark className={`w-4 h-4 ${inWishlist ? 'fill-current' : ''}`} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {/* Like Button */}
      <button
        onClick={handleLike}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
          isLiked 
            ? 'bg-red-50 border-red-200 text-red-600' 
            : 'bg-white border-gray-200 text-gray-600 hover:border-red-200 hover:text-red-600'
        } disabled:opacity-50`}
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
        <span className="font-medium">
          {isLiked ? 'معجب' : 'أعجبني'} {likesCount > 0 && `(${likesCount})`}
        </span>
      </button>

      {/* Wishlist Button */}
      <button
        onClick={handleWishlist}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
          inWishlist 
            ? 'bg-purple-50 border-purple-200 text-purple-600' 
            : 'bg-white border-gray-200 text-gray-600 hover:border-purple-200 hover:text-purple-600'
        } disabled:opacity-50`}
      >
        <Bookmark className={`w-5 h-5 ${inWishlist ? 'fill-current' : ''}`} />
        <span className="font-medium">
          {inWishlist ? 'في قائمتي' : 'حفظ'}
        </span>
      </button>

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:border-blue-200 hover:text-blue-600 bg-white transition"
      >
        <Share2 className="w-5 h-5" />
        <span className="font-medium">مشاركة</span>
      </button>
    </div>
  );
}
