import React from 'react';
import { Bookmark, Heart, Share2, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../../../types';
import { useApp } from '../../../../context/AppContext';
import { useHomeProducts } from '../../../hooks/useHomeData';
import { useLayoutStore } from '../store/useLayoutStore';
import {
  addToWishlist,
  hasLikedProduct,
  isInWishlist,
  likeProduct,
  removeFromWishlist,
  unlikeProduct,
} from '../../../../services/interactionService';
import styles from './homepageV2.module.css';

type CategoryTab = { id: string; name: string };

const TileActions = React.memo(function TileActions({
  productId,
  initialLikes,
}: {
  productId: string;
  initialLikes: number;
}) {
  const { user } = useApp();
  const [isLiked, setIsLiked] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(initialLikes);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    if (!user?.id) return;

    (async () => {
      try {
        const [liked, wishlisted] = await Promise.all([
          hasLikedProduct(user.id, productId),
          isInWishlist(user.id, productId),
        ]);
        if (cancelled) return;
        setIsLiked(liked);
        setInWishlist(wishlisted);
      } catch {
        // Silent: avoid noisy logs in tiles
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, productId]);

  const ensureLoggedIn = (): boolean => {
    if (user?.id) return true;
    alert('يجب تسجيل الدخول لاستخدام هذه الميزة');
    return false;
  };

  const handleToggleLike = async () => {
    if (!ensureLoggedIn()) return;
    if (loading) return;
    setLoading(true);
    try {
      if (isLiked) {
        await unlikeProduct(user!.id, productId);
        setIsLiked(false);
        setLikesCount((c) => Math.max(0, c - 1));
      } else {
        await likeProduct(user!.id, productId);
        setIsLiked(true);
        setLikesCount((c) => c + 1);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!ensureLoggedIn()) return;
    if (loading) return;
    setLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(user!.id, productId);
        setInWishlist(false);
      } else {
        await addToWishlist(user!.id, productId);
        setInWishlist(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/product/${productId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'منتج من خيوط', url });
        return;
      }
    } catch {
      // Fall back to copy
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط');
    } catch {
      alert('فشل نسخ الرابط');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="إعجاب"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleLike();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={
          'inline-flex items-center justify-center w-10 h-10 rounded-full ' +
          'bg-black/60 border border-white/15 backdrop-blur-sm ' +
          'text-white hover:bg-black/70 transition ' +
          'disabled:opacity-60'
        }
      >
        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current text-red-400' : 'text-white'}`} />
      </button>

      <button
        type="button"
        aria-label="حفظ"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleWishlist();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={
          'inline-flex items-center justify-center w-10 h-10 rounded-full ' +
          'bg-black/60 border border-white/15 backdrop-blur-sm ' +
          'text-white hover:bg-black/70 transition ' +
          'disabled:opacity-60'
        }
      >
        <Bookmark className={`w-5 h-5 ${inWishlist ? 'fill-current text-violet-300' : 'text-white'}`} />
      </button>

      <button
        type="button"
        aria-label="مشاركة"
        onClick={(e) => {
          e.stopPropagation();
          void handleShare();
        }}
        onMouseDown={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
        className={
          'inline-flex items-center justify-center w-10 h-10 rounded-full ' +
          'bg-black/60 border border-white/15 backdrop-blur-sm ' +
          'text-white hover:bg-black/70 transition'
        }
      >
        <Share2 className="w-5 h-5 text-white" />
      </button>

      {likesCount > 0 && (
        <div className="px-2 py-1 rounded-full bg-black/55 border border-white/10 text-white text-xs font-semibold">
          {likesCount}
        </div>
      )}
    </div>
  );
});

function getProductCoverUrl(product: Product): string {
  const anyProduct = product as any;
  const images: string[] = Array.isArray(product.images) && product.images.length
    ? product.images
    : Array.isArray(anyProduct?.imageUrls) && anyProduct.imageUrls.length
      ? anyProduct.imageUrls
      : [product.image];

  const first = images.find(Boolean);
  return typeof first === 'string' ? first : '';
}

function getTileAspectClass(index: number): string {
  // Creates visual variety similar to the reference screenshot.
  // Keep these conservative so the masonry stays coherent.
  switch (index % 8) {
    case 0:
      return 'aspect-[3/4]';
    case 1:
      return 'aspect-[4/3]';
    case 2:
      return 'aspect-[1/1]';
    case 3:
      return 'aspect-[16/9]';
    case 4:
      return 'aspect-[3/4]';
    case 5:
      return 'aspect-[4/5]';
    case 6:
      return 'aspect-[3/2]';
    default:
      return 'aspect-[3/4]';
  }
}

const MasonryTile = React.memo(function MasonryTile({
  product,
  index,
  onClick,
}: {
  product: Product;
  index: number;
  onClick: () => void;
}) {
  const coverUrl = getProductCoverUrl(product);
  const aspectClass = getTileAspectClass(index);
  const anyProduct = product as any;
  const shopName: string =
    (typeof anyProduct?.tailorName === 'string' && anyProduct.tailorName) ||
    (typeof anyProduct?.shopName === 'string' && anyProduct.shopName) ||
    (typeof anyProduct?.storeName === 'string' && anyProduct.storeName) ||
    '';
  const rawPrice = anyProduct?.price;
  const priceNumber: number | null = typeof rawPrice === 'number' && Number.isFinite(rawPrice) ? rawPrice : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group w-full rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
    >
      <div className={`relative w-full ${aspectClass} bg-slate-900`}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="absolute inset-0 bg-slate-900 animate-pulse" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />

        {/* Hover Overlay: big title + CTA (matches reference behavior) */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-0 bg-black/40" />

          {/* Like + Collection icons */}
          <div className="absolute top-3 right-3 z-10">
            <TileActions productId={product.id} initialLikes={(product as any)?.likes ?? 0} />
          </div>

          {/* Content flexbox layout to prevent overlap */}
          <div className="absolute inset-0 flex flex-col items-center justify-between py-6 px-4">
            <div className="flex-1" />
            
            {/* Product info centered */}
            <div className="text-center space-y-2 max-w-full">
              <div className="text-white text-xl md:text-2xl font-black tracking-wide uppercase drop-shadow-lg leading-tight">
                {shopName || product.name}
              </div>
              {priceNumber !== null && (
                <div className="inline-flex items-center justify-center mt-1">
                  <span className="px-3 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-sm text-[color:var(--theme-secondary)] text-sm md:text-base font-extrabold">
                    {priceNumber.toFixed(3)} ر.ع
                  </span>
                </div>
              )}
            </div>

            {/* Spacer to push CTA to bottom */}
            <div className="flex-1" />

            {/* CTA button at bottom */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[color:var(--theme-secondary)] text-black font-extrabold shadow-lg text-sm">
              <Sparkles size={14} />
              عرض المنتج
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function MasonryDiscoveryGrid() {
  const navigate = useNavigate();
  const { appSettings } = useApp();
  const cfg = useLayoutStore((s) => s.blockConfig.masonryDiscovery);
  const cardGapPx = cfg?.cardGapPx ?? 16;
  const maxColumns = Math.max(1, Math.floor(cfg?.maxColumns ?? 4));
  const maxItems = Math.max(1, Math.floor((cfg?.maxColumns ?? 4) * (cfg?.maxRows ?? 3)));
  const [activeCategoryId, setActiveCategoryId] = React.useState<string>('all');

  // Fetch products from the database
  const { data: products = [], isPending: isLoading } = useHomeProducts('all');

  const tabs: CategoryTab[] = React.useMemo(() => {
    const base: CategoryTab[] = [{ id: 'all', name: 'الكل' }];
    const cats = (appSettings?.productCategories ?? []) as any[];
    for (const c of cats) {
      const id = typeof c?.id === 'string' ? c.id : '';
      const name = typeof c?.name === 'string' ? c.name : '';
      if (!id || !name) continue;
      base.push({ id, name });
    }
    return base;
  }, [appSettings?.productCategories]);

  const filteredProducts = React.useMemo(() => {
    if (activeCategoryId === 'all') return products;
    return products.filter((p) => {
      const anyP = p as any;
      const cid = typeof anyP?.categoryId === 'string' ? anyP.categoryId : undefined;
      const cat = typeof anyP?.category === 'string' ? anyP.category : undefined;
      return cid === activeCategoryId || cat === activeCategoryId;
    });
  }, [products, activeCategoryId]);

  return (
    <section className="py-6">
      {/* Category chips (horizontal scroll) */}
      <div className="w-full overflow-x-auto">
        <div className={`flex items-center gap-2 min-w-max ${styles.hideScrollbar} px-1`}>
          {tabs.map((t) => {
            const active = t.id === activeCategoryId;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveCategoryId(t.id)}
                className={
                  'h-8 px-3 rounded-full text-xs font-semibold border transition-colors ' +
                  (active
                    ? 'bg-white/10 text-white border-white/20'
                    : 'bg-black/20 text-white/70 border-white/10 hover:bg-white/5 hover:text-white')
                }
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="aspect-[3/4] bg-white/5 border border-white/10 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-4 [column-fill:_balance]" style={{ columnGap: cardGapPx, columnCount: maxColumns }}>
          {filteredProducts.slice(0, maxItems).map((product, index) => (
            <div key={product.id} className="break-inside-avoid" style={{ marginBottom: cardGapPx }}>
              <MasonryTile product={product} index={index} onClick={() => navigate(`/product/${product.id}`)} />
            </div>
          ))}
          
          {/* Show All Card - appears when there are more products */}
          {filteredProducts.length > 0 && (
            <div className="break-inside-avoid" style={{ marginBottom: cardGapPx }}>
              <div
                role="button"
                tabIndex={0}
                onClick={() => navigate('/products')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate('/products');
                  }
                }}
                className="group w-full rounded-2xl overflow-hidden bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-dashed border-white/30 hover:border-white/50 transition-all cursor-pointer aspect-square flex flex-col items-center justify-center gap-3 p-6"
              >
                <div className="text-5xl">🔍</div>
                <div className="text-white text-lg font-bold text-center">عرض الكل</div>
                {filteredProducts.length > maxItems && (
                  <div className="text-white/70 text-sm text-center">
                    {filteredProducts.length - maxItems}+ منتج آخر
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
