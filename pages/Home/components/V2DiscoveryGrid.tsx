import React from 'react';
import { Bookmark, Heart, Share2, Sparkles, ChevronLeft } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../../types';
import {
  addToWishlist,
  hasLikedProduct,
  isInWishlist,
  likeProduct,
  removeFromWishlist,
  unlikeProduct,
} from '../../../services/interactionService';

const MAX_ITEMS = 12;

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

const TileActions = React.memo(function TileActions({
  productId,
  initialLikes,
  initialSaves,
}: {
  productId: string;
  initialLikes: number;
  initialSaves: number;
}) {
  const { user } = useApp();
  const [isLiked, setIsLiked] = React.useState(false);
  const [inWishlist, setInWishlist] = React.useState(false);
  const [likesCount, setLikesCount] = React.useState(initialLikes);
  const [savesCount, setSavesCount] = React.useState(initialSaves);
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
        /* silent */
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
    if (!ensureLoggedIn() || loading) return;
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
    if (!ensureLoggedIn() || loading) return;
    setLoading(true);
    try {
      if (inWishlist) {
        await removeFromWishlist(user!.id, productId);
        setInWishlist(false);
        setSavesCount((c) => Math.max(0, c - 1));
      } else {
        await addToWishlist(user!.id, productId);
        setInWishlist(true);
        setSavesCount((c) => c + 1);
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
      /* fall through */
    }

    try {
      await navigator.clipboard.writeText(url);
      alert('تم نسخ الرابط');
    } catch {
      alert('فشل نسخ الرابط');
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="إعجاب"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleLike();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm text-white hover:bg-black/70 transition disabled:opacity-60"
      >
        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current text-red-400' : 'text-white'}`} />
      </button>
      {likesCount > 0 && (
        <div className="px-1.5 py-0.5 rounded-full bg-black/55 border border-white/10 text-white text-[10px] font-semibold">
          {likesCount}
        </div>
      )}

      <button
        type="button"
        aria-label="حفظ"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleWishlist();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm text-white hover:bg-black/70 transition disabled:opacity-60"
      >
        <Bookmark className={`w-3.5 h-3.5 ${inWishlist ? 'fill-current text-violet-300' : 'text-white'}`} />
      </button>
      {savesCount > 0 && (
        <div className="px-1.5 py-0.5 rounded-full bg-black/55 border border-white/10 text-white text-[10px] font-semibold">
          {savesCount}
        </div>
      )}

      <button
        type="button"
        aria-label="مشاركة"
        onClick={(e) => {
          e.stopPropagation();
          void handleShare();
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-black/60 border border-white/15 backdrop-blur-sm text-white hover:bg-black/70 transition"
      >
        <Share2 className="w-3.5 h-3.5 text-white" />
      </button>
    </div>
  );
});

const DiscoveryTile = React.memo(function DiscoveryTile({
  product,
  index,
  onClick,
  radiusPx,
  width,
  height,
}: {
  product: Product;
  index: number;
  onClick: () => void;
  radiusPx?: number;
  width?: number;
  height?: number;
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
      className="group overflow-hidden bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-pointer"
      style={{
        width: width && width > 0 ? `${width}px` : 'auto',
        height: height && height > 0 ? `${height}px` : 'auto',
        borderRadius: typeof radiusPx === 'number' ? `${radiusPx}px` : undefined,
      }}
    >
      <div className="relative w-full h-full bg-slate-900">
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

        {/* Action buttons - always visible */}
        <div className="absolute top-2 right-2 z-10">
          <TileActions 
            productId={product.id} 
            initialLikes={(product as any)?.likes ?? 0}
            initialSaves={(product as any)?.saves ?? 0}
          />
        </div>

        {/* Price - always visible at bottom */}
        {priceNumber !== null && (
          <div className="absolute bottom-2 left-2 right-2 z-10 flex justify-center">
            <span className="px-2.5 py-1 rounded-full bg-black/60 border border-white/20 backdrop-blur-sm text-[color:var(--theme-secondary)] text-[11px] md:text-xs font-semibold">
              {priceNumber.toFixed(3)} ر.ع
            </span>
          </div>
        )}

        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute inset-0 flex flex-col items-center justify-center py-4 px-3">
            <div className="text-center space-y-1.5 max-w-full">
              <div className="text-white text-base md:text-lg font-semibold tracking-wide uppercase drop-shadow-lg leading-tight">
                {product.name}
              </div>
              {shopName && (
                <div className="text-white/90 text-[11px] md:text-xs font-medium">{shopName}</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

interface V2DiscoveryGridProps {
  title?: string;
  products: Product[];
  loading?: boolean;
  onSelect: (product: Product) => void;
}

export const V2DiscoveryGrid: React.FC<V2DiscoveryGridProps> = React.memo(function V2DiscoveryGrid({
  title,
  products,
  loading = false,
  onSelect,
}) {
  const { appSettings } = useApp();
  const navigate = useNavigate();
  const v2Config = (appSettings as any)?.homePageV2Layout?.blockConfig?.masonryDiscovery;
  const maxItemsFromConfig = v2Config?.maxColumns && v2Config?.maxRows ? v2Config.maxColumns * v2Config.maxRows : MAX_ITEMS;

  const displayTitle = title ?? v2Config?.title ?? 'اكتشف أزياء مختارة';
  const displaySubtitle = v2Config?.subtitle ?? 'مستوحاة من تخطيط 2.1 بدون تبديل الصفحة';
  const gapPx = Math.max(0, Number(v2Config?.cardGapPx ?? 20));
  const radiusPx = Math.max(0, Number(v2Config?.cardRadiusPx ?? 16));
  const cardWidthPx = Math.max(0, Number(v2Config?.cardWidth ?? 200));
  const cardHeightPx = Math.max(0, Number(v2Config?.cardHeight ?? 250));
  
  const items = products.slice(0, maxItemsFromConfig);
  const showSkeletons = loading && items.length === 0;

  if (!showSkeletons && items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-xl md:text-2xl font-extrabold text-white">{displayTitle}</h2>
          {displaySubtitle && <p className="text-sm text-slate-400">{displaySubtitle}</p>}
        </div>
      </div>

      <div className="flex flex-wrap" style={{ gap: `${gapPx}px` }}>
        {showSkeletons
          ? Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="overflow-hidden bg-slate-900 animate-pulse border border-white/5"
                style={{
                  width: `${cardWidthPx}px`,
                  height: `${cardHeightPx}px`,
                  borderRadius: `${radiusPx}px`,
                }}
              />
            ))
          : items.map((product) => (
              <DiscoveryTile
                key={product.id}
                product={product}
                index={0}
                onClick={() => onSelect(product)}
                radiusPx={radiusPx}
                width={cardWidthPx}
                height={cardHeightPx}
              />
            ))}

        {/* "Show All" Card - only if there are more products available */}
        {!showSkeletons && products.length > items.length && (
          <button
            onClick={() => navigate('/products')}
            className="group flex flex-col items-center justify-center bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer"
            style={{
              width: `${cardWidthPx}px`,
              height: `${cardHeightPx}px`,
              borderRadius: `${radiusPx}px`,
            }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/10 group-hover:bg-[color:var(--theme-secondary)]/20 flex items-center justify-center transition-colors">
                <ChevronLeft size={24} className="text-white/70 group-hover:text-[color:var(--theme-secondary)]" />
              </div>
              <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">عرض الكل</span>
            </div>
          </button>
        )}
      </div>
    </section>
  );
});
