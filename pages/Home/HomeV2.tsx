import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useHomeProducts } from '../../src/hooks/useHomeData';
import V2BlocksRenderer from './components/V2BlocksRenderer';
import type { Product } from '../../types';

/**
 * HomeV2 - Direct access to Homepage 2.1
 * This component always renders the V2 homepage layout
 * regardless of the enableHomepageV2 setting.
 * 
 * Access via: /home-v2
 */
export const HomeV2: React.FC = () => {
  const navigate = useNavigate();

  const { data: products = [], isPending: productsLoading } = useHomeProducts('all');

  const handleProductSelect = React.useCallback((product: Product) => {
    navigate(`/product/${product.id}`);
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>الرئيسية 2.1 - خيوط</title>
        <meta name="description" content="اكتشف أحدث الأزياء والتصاميم في خيوط" />
      </Helmet>
      <V2BlocksRenderer 
        products={products}
        productsLoading={productsLoading}
        onProductSelect={handleProductSelect}
      />
    </>
  );
};
