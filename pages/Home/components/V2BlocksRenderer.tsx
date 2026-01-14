import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../../context/AppContext';
import { V2DynamicHero } from './V2DynamicHero';
import { V2DiscoveryGrid } from './V2DiscoveryGrid';
import { V2ActionCards } from './V2ActionCards';
import { V2BlockC } from './V2BlockC';
import { V2TermsPrivacy } from './V2TermsPrivacy';
import type { Product } from '../../../types';

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
  const navigate = useNavigate();
  
  const v2Layout = (appSettings as any)?.homePageV2Layout;
  const order = (v2Layout?.order as BlockKey[]) || [];
  const visibility = v2Layout?.visibility || {};
  
  // Only render if layout config exists
  if (!v2Layout || !order.length) {
    return null;
  }

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
            products={products}
            loading={productsLoading}
            onSelect={onProductSelect}
          />
        );

      case 'blockC':
        return <V2BlockC key={key} />;

      case 'blockF':
        return <V2TermsPrivacy key={key} />;

      // Placeholder blocks (can be customized later)
      case 'blockA':
      case 'blockB':
      case 'blockC':
      case 'blockD':
      case 'blockE':
        return (
          <div
            key={key}
            className="p-6 rounded-xl border border-white/10 bg-white/5 text-center text-slate-400 text-sm"
          >
            {key} - Coming Soon
          </div>
        );

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
