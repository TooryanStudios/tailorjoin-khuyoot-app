
import React from 'react';
import './src/styles/global.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './src/components/MainLayout';
import { Home } from './pages/Home';
import { ProductList } from './pages/ProductList';
import { Account } from './pages/Account';
import { DesignerV2 as Designer } from './pages/DesignerV2';
import { ErrorBoundary } from './components/ErrorBoundary';
import { TailorCollections } from './pages/TailorCollections';
import { TailorOrders } from './pages/TailorOrders';
import { TailorList } from './pages/TailorList';
import { TailorProfile } from './pages/TailorProfile';
import { ProductDetails } from './pages/ProductDetails';
import { Measurements } from './pages/Measurements';
import { TailorMaterials } from './pages/TailorMaterials';
import { CreditProvider } from './src/modules/CreditManager';
import { OrderDetails } from './pages/OrderDetails';
import { ShopsList } from './pages/ShopsList';
import { ShopProfile } from './pages/ShopProfile';
import { Notifications } from './pages/Notifications';
import { StoreAdmin } from './pages/StoreAdmin';
import { TailorDashboard } from './pages/TailorDashboard';
import { TailorAccount, BoutiqueAccount, ShopAccount } from './pages/accounts';
import { ClientLayout } from './src/client/layout/ClientLayout';
import { AdminApp } from './src/admin/AdminApp';
import { Collections } from './pages/Collections';
import { Cart } from './pages/Cart';
import { BoutiqueOrders } from './pages/BoutiqueOrders';
import { ShopOrders } from './pages/ShopOrders';
import { ShopInventory } from './pages/ShopInventory';
import PortfolioManagement from './pages/PortfolioManagement';
import { Customization } from './pages/Customization';
import { CustomizationPage } from './pages/CustomizationPage';
import { ClientMeasurements } from './pages/ClientMeasurements';
import DesignsList from './pages/DesignsList';
import { OrderSummary } from './pages/OrderSummary';
import { Checkout } from './pages/Checkout';
import TailorJoinFlow from './src/features/tailor-join/TailorJoinFlow';
import { Maintenance } from './src/pages/Maintenance';
import { TestTemplatePickerPage } from './pages/TestTemplatePickerPage';
import KlingEffectViewer from './src/pages/KlingEffectViewer';
import { TryOnPage } from './pages/TryOnPage';
import { JankSandbox } from './pages/JankSandbox';
import { useAppStore } from './src/store/useAppStore';
import { LoadingShell } from './src/components/LoadingShell';
import { AppInitializer } from './src/components/AppInitializer';
import { DesignerV2_1 } from './src/pages/DesignerV2_1/DesignerV2_1';
const Drafts = React.lazy(() => import('./pages/Drafts'));
// Ensure dev.khuyoot.app defaults to designer (not tailor join)
const DevDefaultRoute: React.FC = () => {
  // Disabled: No longer redirecting dev.khuyoot.app to /designer
  // Users will land on homepage (/) by default
  return null;
};

// Auto-redirect component for tailorjoin subdomain
const TailorJoinRedirect: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    const isTailorJoinDomain = hostname === 'tailorjoin.khuyoot.app';

    // Only redirect for tailorjoin.khuyoot.app, NOT for dev.khuyoot.app
    if (isTailorJoinDomain && (pathname === '/' || pathname === '')) {
      navigate('/join-tailor', { replace: true });
    }
  }, [navigate]);
  return null;
};

const App: React.FC = () => {
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  // Check if we're on the main production domain
  const isMaintenanceMode = React.useMemo(() => {
    const hostname = window.location.hostname;
    return hostname === 'www.khuyoot.app' || hostname === 'khuyoot.app';
  }, []);

  // If maintenance mode, show maintenance page
  if (isMaintenanceMode) {
    return (
      <HelmetProvider>
        <Maintenance />
      </HelmetProvider>
    );
  }

  // Normal app for dev.khuyoot.app and localhost
  // Block rendering until Zustand store is hydrated from localStorage
  if (!hasHydrated) {
    return <LoadingShell />;
  }

  return (
    <HelmetProvider>
      <AppInitializer>
        {(config) => (
          <AppProvider initialAppSettings={config}>
            <BrowserRouter>
             <DevDefaultRoute />
             <TailorJoinRedirect />
             <CreditProvider>
             <Routes>
               {/* Standalone Admin Route (Separated from Client Layout) */}
               <Route path="/admin/*" element={<AdminApp />} />
               
               {/* Store Admin Route (Separated Management) */}
               <Route path="/store-admin" element={<StoreAdmin />} />

               {/* Test Routes */}
               <Route path="/test-template-picker" element={<TestTemplatePickerPage />} />
               {/* Jank sandbox without ClientLayout (no header/footer) */}
               <Route path="/jank-sandbox" element={<JankSandbox />} />

               {/* Public App Routes */}
               <Route element={<ClientLayout />}>
                 <Route path="/" element={<Home />} />
                 <Route path="/jackets" element={<ProductList />} />
                 <Route path="/tailor-account" element={<TailorAccount />} />
                 <Route path="/boutique-account" element={<BoutiqueAccount />} />
                 <Route path="/shop-account" element={<ShopAccount />} />
                 {/* Fabric store removed in new role model */}
                 <Route path="/account" element={<Account />} />
                 <Route path="/measurements" element={<ClientMeasurements />} />
                 <Route path="/measurements/:productId" element={<ClientMeasurements />} />
                 <Route path="/order-summary" element={<OrderSummary />} />
                 <Route path="/order-summary/:draftId" element={<OrderSummary />} />
                 <Route path="/drafts" element={<React.Suspense fallback={<div>Loading drafts...</div>}><Drafts /></React.Suspense>} />
                 <Route path="/checkout" element={<Checkout />} />
                 <Route path="/measurements-old" element={<Measurements />} />
                 <Route path="/designer" element={<ErrorBoundary><Designer /></ErrorBoundary>} />
                 <Route path="/designer/:id" element={<ErrorBoundary><Designer /></ErrorBoundary>} />
                 <Route path="/designer-v2-1" element={<ErrorBoundary><DesignerV2_1 /></ErrorBoundary>} />
                 <Route path="/designer-v2-1/design/:taskId" element={<ErrorBoundary><DesignerV2_1 /></ErrorBoundary>} />
                 <Route path="/designs" element={<DesignsList />} />
                 <Route path="/tailors" element={<TailorList />} />
                 <Route path="/tailor/:id" element={<TailorProfile />} />
                 <Route path="/shops" element={<ShopsList />} />
                 <Route path="/shop/:id" element={<ShopProfile />} />
                 <Route path="/product/:id" element={<ProductDetails />} />
                 <Route path="/customization" element={<CustomizationPage />} />
                 <Route path="/customization/:productId" element={<CustomizationPage />} />
                 <Route path="/tailor/collections" element={<TailorCollections />} />
                 <Route path="/tailor/orders" element={<TailorOrders />} />
                 <Route path="/tailor-materials" element={<TailorMaterials />} />
                 <Route path="/tailor-dashboard" element={<TailorDashboard />} />
                 <Route path="/order/:id" element={<OrderDetails />} />
                 <Route path="/notifications" element={<Notifications />} />
                 <Route path="/collections" element={<Collections />} />
                 <Route path="/cart" element={<Cart />} />
                 <Route path="/boutique/orders" element={<BoutiqueOrders />} />
                 <Route path="/shop/orders" element={<ShopOrders />} />
                 <Route path="/shop/inventory" element={<ShopInventory />} />
                 <Route path="/portfolio-management" element={<PortfolioManagement />} />
                 <Route path="/try-on" element={<TryOnPage />} />
                <Route path="/kling-effects" element={<KlingEffectViewer />} />
               </Route>

               {/* Standalone Tailor Join (no ClientLayout header/footer) */}
               <Route path="/join-tailor" element={<TailorJoinFlow />} />
               {/* Support multiple step URL shapes for robustness */}
               <Route path="/join-tailor/step-:step" element={<TailorJoinFlow />} />
               <Route path="/join-tailor/step/:step" element={<TailorJoinFlow />} />
               <Route path="/join-tailor/:step" element={<TailorJoinFlow />} />

               <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
             </CreditProvider>
            </BrowserRouter>
          </AppProvider>
        )}
      </AppInitializer>
    </HelmetProvider>
  );
};

export default App;
