
import React from 'react';
import './src/styles/global.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider, useApp } from './context/AppContext';
import { MainLayout } from './src/components/MainLayout';
import { Home } from './pages/Home';
import { HomeClassic } from './pages/Home/HomeClassic';
import { HomeV2 } from './pages/Home/HomeV2';
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
import ClientLayout from './src/client/layout/ClientLayout';
import { AdminApp } from './src/admin/AdminApp';
import { Collections } from './pages/Collections';
import { Cart } from './pages/Cart';
import { BoutiqueOrders } from './pages/BoutiqueOrders';
import { ShopOrders } from './pages/ShopOrders';
import { ShopInventory } from './pages/ShopInventory';
import PortfolioManagement from './pages/PortfolioManagement';
import { Customization } from './pages/Customization';
import { CustomizationPage } from './pages/CustomizationPage';
const ClientMeasurements = React.lazy(() => import('./pages/ClientMeasurements').then(m => ({ default: m.ClientMeasurements })));
import ClientMeasurementsV2 from './src/modules/measurements/ClientMeasurementsV2';
import DesignsList from './pages/DesignsList';
import { OrderSummary } from './src/modules/orders/OrderSummary';
import { Checkout } from './pages/Checkout';
import TailorJoinFlow from './src/features/tailor-join/TailorJoinFlow';
import { Maintenance } from './src/pages/Maintenance';
import { TestTemplatePickerPage } from './pages/TestTemplatePickerPage';
import KlingEffectViewer from './src/pages/KlingEffectViewer';
import { TryOnPage } from './pages/TryOnPage';
import { JankSandbox } from './pages/JankSandbox';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { Settings } from './pages/Settings';
import { DemoShellLayout } from './src/pages/demoShell/DemoShellLayout';
import { DemoShellPageA } from './src/pages/demoShell/DemoShellPageA';
import { DemoShellPageB } from './src/pages/demoShell/DemoShellPageB';
import { DemoShellTopTailors } from './src/pages/demoShell/DemoShellTopTailors';
import { useAppStore } from './src/store/useAppStore';
import { LoadingShell } from './src/components/LoadingShell';
import { NewProductPage } from './src/modules/admin/features/product-creator-v2';
import { AppInitializer } from './src/components/AppInitializer';
import { DesignerV2_1 } from './src/pages/DesignerV2_1/DesignerV2_1';
import { TouchPointerOverlay } from './src/components/TouchPointerOverlay';
import { AdminDevTools } from './src/components/AdminDevTools';
import { isAdmin } from './types/user-schema';
import { ErrorBoundary as GlobalErrorBoundary } from './components/ErrorBoundary';
const Drafts = React.lazy(() => import('./pages/Drafts'));
const DevVideoLabPage = React.lazy(() => import('./src/pages/DevVideoLab/DevVideoLabPage'));
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
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);
  const [touchPointerEnabled, setTouchPointerEnabled] = React.useState(false);

  // Failsafe: never get stuck on a blank LoadingShell if Zustand rehydration errors.
  // If storage is blocked/corrupt, allow the app to mount with default in-memory state.
  React.useEffect(() => {
    if (hasHydrated) return;
    const t = window.setTimeout(() => {
      try {
        const state = useAppStore.getState();
        if (!state.hasHydrated) {
          state.setHasHydrated(true);
        }
      } catch {
        // ignore
      }
    }, 1500);
    return () => window.clearTimeout(t);
  }, [hasHydrated]);

  // Listen for critical Firebase errors
  React.useEffect(() => {
    const handleCriticalError = (event: CustomEvent) => {
      console.error('🚨 Critical Firebase error detected:', event.detail);
      setMaintenanceMode(true);
    };

    window.addEventListener('firebase-critical-error' as any, handleCriticalError as any);
    return () => {
      window.removeEventListener('firebase-critical-error' as any, handleCriticalError as any);
    };
  }, []);

  // Touch pointer for screen recording (admin only)
  React.useEffect(() => {
    const savedState = localStorage.getItem('admin_touch_pointer_enabled');
    if (savedState === 'true') {
      setTouchPointerEnabled(true);
    }

    // Listen for toggle event
    const handleToggle = ((event: CustomEvent) => {
      const enabled = event.detail.enabled;
      setTouchPointerEnabled(enabled);
      localStorage.setItem('admin_touch_pointer_enabled', String(enabled));
    }) as EventListener;

    window.addEventListener('toggle-touch-pointer', handleToggle);
    return () => {
      window.removeEventListener('toggle-touch-pointer', handleToggle);
    };
  }, []);

  // Check if we're on the main production domain
  const isMaintenanceMode = React.useMemo(() => {
    const hostname = window.location.hostname;
    return hostname === 'www.khuyoot.app' || hostname === 'khuyoot.app';
  }, []);

  // If maintenance mode (production domain OR critical error), show maintenance page
  if (isMaintenanceMode || maintenanceMode) {
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
            <AppContent touchPointerEnabled={touchPointerEnabled} />
          </AppProvider>
        )}
      </AppInitializer>
    </HelmetProvider>
  );
};

// Wrapper component that has access to AppProvider context
const AppContent: React.FC<{ touchPointerEnabled: boolean }> = ({ touchPointerEnabled }) => {
  const { user } = useApp();
  const isDev = import.meta.env.DEV;
  
  return (
    <>
      {/* Admin-only touch pointer overlay for screen recording */}
      {user && isAdmin(user) && <TouchPointerOverlay isEnabled={touchPointerEnabled} />}
      {/* Admin-only dev tools panel */}
      <AdminDevTools />
            <BrowserRouter>
              <DevDefaultRoute />
              <TailorJoinRedirect />
              <CreditProvider>
              <GlobalErrorBoundary>
              <Routes>
               {isDev && (
                 <Route
                   path="/__dev/video-lab"
                   element={
                     <React.Suspense fallback={<LoadingShell />}>
                       <DevVideoLabPage />
                     </React.Suspense>
                   }
                 />
               )}
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
                 <Route path="/home-classic" element={<HomeClassic />} />
                 <Route path="/home-v2" element={<HomeV2 />} />
                 <Route path="/jackets" element={<ProductList />} />
                 <Route path="/tailor-account" element={<TailorAccount />} />
                 <Route path="/boutique-account" element={<BoutiqueAccount />} />
                 <Route path="/shop-account" element={<ShopAccount />} />
                 {/* Fabric store removed in new role model */}
                 <Route path="/account" element={<Account />} />
                 <Route path="/measurements" element={<ClientMeasurementsV2 />} />
                 <Route path="/measurements/:productId" element={<ClientMeasurementsV2 />} />
                 <Route path="/measurements-v2" element={<ClientMeasurementsV2 />} />
                 <Route path="/measurements-v2/:productId" element={<ClientMeasurementsV2 />} />
                 <Route path="/order-summary/:orderId" element={<OrderSummary />} />
                 <Route path="/drafts" element={<React.Suspense fallback={<div>Loading drafts...</div>}><Drafts /></React.Suspense>} />
                 <Route path="/checkout" element={<Checkout />} />
                 <Route path="/measurements-old" element={<Measurements />} />
                 <Route path="/designer" element={<ErrorBoundary><Designer /></ErrorBoundary>} />
                 <Route path="/designer/:id" element={<ErrorBoundary><Designer /></ErrorBoundary>} />
                 <Route path="/designer-v2-1" element={<ErrorBoundary><DesignerV2_1 /></ErrorBoundary>} />
                 <Route path="/designer-v2-1/:productId" element={<ErrorBoundary><DesignerV2_1 /></ErrorBoundary>} />
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
                 <Route path="/tailor/product/new" element={<NewProductPage />} />
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
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/settings" element={<Settings />} />

                   <Route path="/demo-shell" element={<DemoShellLayout />}>
                     <Route index element={<Navigate to="a" replace />} />
                     <Route path="a" element={<DemoShellPageA />} />
                     <Route path="b" element={<DemoShellPageB />} />
                     <Route path="top-tailors" element={<DemoShellTopTailors />} />
                     {/* Designer route kept for navigation but rendered manually in layout */}
                     <Route path="designer" element={<div />} />
                   </Route>
               </Route>

               {/* Standalone Tailor Join (no ClientLayout header/footer) */}
               <Route path="/join-tailor" element={<TailorJoinFlow />} />
               {/* Support multiple step URL shapes for robustness */}
               <Route path="/join-tailor/step-:step" element={<TailorJoinFlow />} />
               <Route path="/join-tailor/step/:step" element={<TailorJoinFlow />} />
               <Route path="/join-tailor/:step" element={<TailorJoinFlow />} />

               <Route path="*" element={<Navigate to="/" replace />} />
             </Routes>
             </GlobalErrorBoundary>
             </CreditProvider>
            </BrowserRouter>
    </>
  );
};

export default App;
