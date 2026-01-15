import React from 'react';
import { useApp } from '../../../context/AppContext';
import { V2DynamicHero } from './V2DynamicHero';
import { V2DiscoveryGrid } from './V2DiscoveryGrid';
import { V2ActionCards } from './V2ActionCards';
import { V2BlockC } from './V2BlockC';
import { V2TermsPrivacy } from './V2TermsPrivacy';
import type { Product } from '../../../types';

function numberOrZero(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function getCreatedAtMillis(product: Product): number {
  const anyProduct = product as any;
  const raw = anyProduct?.createdAt;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  if (typeof raw === 'string') {
    const asNum = Number(raw);
    if (Number.isFinite(asNum) && asNum > 0) return asNum;
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (raw && typeof raw === 'object' && typeof raw.toMillis === 'function') {
    try {
      const n = raw.toMillis();
      if (typeof n === 'number' && Number.isFinite(n)) return n;
    } catch {
      /* ignore */
    }
  }
  return 0;
}

function pickUniqueProducts(params: { pool: Product[]; shown: Set<string>; max: number }): Product[] {
  const { pool, shown, max } = params;
  if (max <= 0) return [];
  const picked: Product[] = [];
  for (const p of pool) {
    if (!p?.id) continue;
    if (shown.has(p.id)) continue;
    picked.push(p);
    shown.add(p.id);
    if (picked.length >= max) break;
  }
  return picked;
}

type BlockKey = 
  | 'dynamicHero'
  | 'actionCards'
  | 'masonryDiscovery'
  | 'blockA'
  | 'blockB'
  | 'blockC'
  | 'blockD'
  | 'blockE'
  | 'blockF';

interface V2BlocksRendererProps {
  products: Product[];
  productsLoading: boolean;
  onProductSelect: (product: Product) => void;
}

const V2BlocksRenderer: React.FC<V2BlocksRendererProps> = React.memo(function V2BlocksRenderer({
  products,
  productsLoading,
  onProductSelect,
}) {
  const { appSettings } = useApp();
  
  const v2Layout = (appSettings as any)?.homePageV2Layout;
  const order = (v2Layout?.order as BlockKey[]) || [];
  const visibility = v2Layout?.visibility || {};
  
  // Only render if layout config exists
  if (!v2Layout || !order.length) {
    return null;
  }

  // Build different real-product feeds so each block isn't a duplicate.
  const sortedLatest = React.useMemo(() => {
    const copy = [...(products || [])];
    copy.sort((a, b) => getCreatedAtMillis(b) - getCreatedAtMillis(a));
    return copy;
  }, [products]);

  const sortedMostViewed = React.useMemo(() => {
    const copy = [...(products || [])];
    copy.sort((a, b) => numberOrZero((b as any)?.views) - numberOrZero((a as any)?.views));
    return copy;
  }, [products]);

  const sortedMostLiked = React.useMemo(() => {
    const copy = [...(products || [])];
    copy.sort((a, b) => numberOrZero((b as any)?.likes) - numberOrZero((a as any)?.likes));
    return copy;
  }, [products]);

  // De-duplicate products across blocks based on their order, so the page feels curated.
  const selectedByKey = React.useMemo(() => {
    const shown = new Set<string>();
    const result: Partial<Record<BlockKey, Product[]>> = {};

    const getMaxForKey = (key: BlockKey): number => {
      const cfg = v2Layout?.blockConfig?.[key] ?? v2Layout?.blockConfig?.masonryDiscovery;
      const maxCols = numberOrZero(cfg?.maxColumns);
      const maxRows = numberOrZero(cfg?.maxRows);
      const max = maxCols > 0 && maxRows > 0 ? Math.floor(maxCols * maxRows) : 12;
      return Math.max(1, max);
    };

    for (const key of order) {
      if (visibility[key] === false) continue;

      let pool: Product[] | null = null;
      if (key === 'masonryDiscovery') pool = sortedLatest;
      if (key === 'blockB') pool = sortedLatest;
      if (key === 'blockD') pool = sortedMostViewed;
      if (key === 'blockE') pool = sortedMostLiked;

      if (!pool) continue;
      const max = getMaxForKey(key);
      const picked = pickUniqueProducts({ pool, shown, max });
      if (picked.length) result[key] = picked;
    }

    return result;
  }, [order, visibility, v2Layout?.blockConfig, sortedLatest, sortedMostViewed, sortedMostLiked]);

  const renderBlock = (key: BlockKey) => {
    // Check visibility
    if (visibility[key] === false) {
      return null;
    }

    switch (key) {
      case 'dynamicHero':
        return <V2DynamicHero key={key} />;

      case 'actionCards':
        return <V2ActionCards key={key} />;

      case 'masonryDiscovery':
        const masonryCfg = v2Layout?.blockConfig?.masonryDiscovery;
        return (
          <V2DiscoveryGrid
            key={key}
            title={masonryCfg?.title}
            configKey={key}
            products={selectedByKey.masonryDiscovery ?? products}
            loading={productsLoading}
            onSelect={onProductSelect}
          />
        );

      case 'blockC':
        return <V2BlockC key={key} />;

      // Map legacy/placeholder keys to existing sections so HomeV2 is always complete.
      case 'blockA':
        return <V2ActionCards key={key} />;

      case 'blockB':
      case 'blockD':
      case 'blockE': {
        const cfg = v2Layout?.blockConfig?.[key] ?? v2Layout?.blockConfig?.masonryDiscovery;
        const titleByKey: Record<string, string> = {
          blockB: (cfg?.title as string) ?? 'الأحدث',
          blockD: (cfg?.title as string) ?? 'الأكثر مشاهدة',
          blockE: (cfg?.title as string) ?? 'الأكثر إعجاباً',
        };
        return (
          <V2DiscoveryGrid
            key={key}
            title={titleByKey[key]}
            configKey={key}
            products={selectedByKey[key] ?? []}
            loading={productsLoading}
            onSelect={onProductSelect}
          />
        );
      }

      case 'blockF':
        return <V2TermsPrivacy key={key} />;

      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      {order.map((key) => renderBlock(key))}
    </div>
  );
});

export default V2BlocksRenderer;
