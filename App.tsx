
import React from 'react';
import './src/styles/global.css';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { createPortal } from 'react-dom';
import { DemoShellLayout } from './src/pages/demoShell/DemoShellLayout';
import { DemoShellPageA } from './src/pages/demoShell/DemoShellPageA';
import { DemoShellPageB } from './src/pages/demoShell/DemoShellPageB';
import { DemoShellTopTailors } from './src/pages/demoShell/DemoShellTopTailors';
import { AppProvider, useApp } from './context/AppContext';
import { OrderDetailsProvider } from './src/context/OrderDetailsContext';
import { MainLayout } from './src/components/MainLayout';
import { ProductList } from './pages/ProductList';
import { Account } from './pages/Account';
import { DesignerV2_1 as Designer } from './src/pages/DesignerV2_1/DesignerV2_1';
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
import { FamilyMeasurements } from './pages/FamilyMeasurements';
const ClientMeasurements = React.lazy(() => import('./pages/ClientMeasurements').then(m => ({ default: m.ClientMeasurements })));
import ClientMeasurementsV2 from './src/modules/measurements/ClientMeasurementsV2';
import { StudioMeasurements } from './src/modules/measurements/StudioMeasurements';
import { OrderSummary } from './src/modules/orders/OrderSummary';
import { Checkout } from './pages/Checkout';
import TailorJoinFlow from './src/features/tailor-join/TailorJoinFlow';
import { Maintenance } from './src/pages/Maintenance';
import { TestTemplatePickerPage } from './pages/TestTemplatePickerPage';
import KlingEffectViewer from './src/pages/KlingEffectViewer';
import { TryOnPage } from './pages/TryOnPage';
import { JankSandbox } from './pages/JankSandbox';
import { AuthTestPage } from './src/pages/AuthTestPage';
import { CookieAuthTest } from './src/pages/CookieAuthTest';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';

// DEV-ONLY: WhatsApp Sandbox Testing
const WhatsAppSandboxPanel = React.lazy(() => 
  import('./src/devtools/whatsapp/WhatsAppSandboxPanel').then(m => ({ default: m.WhatsAppSandboxPanel }))
);
// DEV-ONLY: Firebase Auth diagnostic (React port of firebase-auth-diagnostic.html)
const FirebaseAuthDiagnosticReactPage = React.lazy(() =>
  import('./src/devtools/firebaseAuth/FirebaseAuthDiagnosticReactPage').then(m => ({ default: m.FirebaseAuthDiagnosticReactPage }))
);
import ReturnPolicy from './pages/ReturnPolicy';
import { Settings } from './pages/Settings';
import { useAppStore } from './src/store/useAppStore';
import { LoadingShell } from './src/components/LoadingShell';
import { NewProductPage } from './src/modules/admin/features/product-creator-v2';
import { AppInitializer } from './src/components/AppInitializer';
import { PaymentTestPage } from './src/pages/DesignerV2_1/pages/PaymentTestPage';
import TryOn from './src/pages/TryOn';
import { DesignerV2_1_NewShell as TryOnNewShell } from './src/pages/DesignerV2_1/DesignerV2_1.NewShell';
import MontLandingPage from './src/pages/demoShell/MontLandingPage';
import { useModalStore } from './src/store/useModalStore';
import UpgradeModal from './src/components/DesignerV2_1/UpgradeModal';
import { firebaseService } from './services/firebase';
import { isAdmin } from './types/user-schema';
import { ErrorBoundary as GlobalErrorBoundary } from './components/ErrorBoundary';
import { AuthModal } from './components/AuthModal';
import { PrivacyModal } from './components/PrivacyModal';
import { TermsModal } from './components/TermsModal';
import { ReturnPolicyModal } from './components/ReturnPolicyModal';
import { ErrorModal } from './src/pages/DesignerV2_1/components/ErrorModal';
import { PublicSurveyPreviewPage } from './src/features/survey/PublicSurveyPreviewPage';
// Removed designs/drafts pages per request
const DevVideoLabPage = React.lazy(() => import('./src/pages/DevVideoLab/DevVideoLabPage'));
const VisualizerPage = React.lazy(() => import('./pages/VisualizerPage'));
import { NavDebugA, NavDebugB, NavDebugC, NavDebugIndex, NavDebugLayout } from './src/pages/NavDebugPage';
import { ClientNavDebugPage } from './src/pages/ClientNavDebugPage';
import { TransactionHistory } from './src/pages/TransactionHistory';
import PDFTestPage from './src/pages/PDFTest/PDFTestPage';
import { AppLayout } from './src/layouts/AppLayout';
// DEV-ONLY: No longer redirecting dev.khuyoot.app to /designer
// Users will land on homepage (/) by default
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

// Smart Home Redirect - remembers user's last gender selection
const SmartHomeRedirect: React.FC = () => {
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check localStorage for last selected gender
    const lastGender = localStorage.getItem('khuyoot:lastGender');
    const targetPath = lastGender === 'male' ? '/male' : '/female';
    navigate(targetPath, { replace: true });
  }, [navigate]);

  return null;
};

// (Unused) Temporary placeholder retained for reference
const HomeDisabled: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center px-4">
    <img src="/logo_big.png?v=4" alt="خيوط" className="h-24 w-24 object-contain" />
    <div className="text-xl font-bold text-slate-900 dark:text-white">الرئيسية معطلة مؤقتاً</div>
    <div className="text-sm text-slate-600 dark:text-slate-300 max-w-md">
      تم إيقاف واجهة العرض التجريبية (Demo Shell). يمكنك متابعة التصفح عبر باقي الصفحات.
    </div>
  </div>
);

const App: React.FC = () => {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const [maintenanceMode, setMaintenanceMode] = React.useState(false);

  // DEV isolation: run the Firebase auth diagnostic page without the app bootstrap.
  // This prevents AppInitializer/AdminConfig/CreditProvider/AuthModal/etc from running.
  if (
    import.meta.env.DEV &&
    typeof window !== 'undefined' &&
    window.location?.pathname?.startsWith('/__dev/firebase-auth-diagnostic')
  ) {
    return (
      <HelmetProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/__dev/firebase-auth-diagnostic"
              element={
                <React.Suspense fallback={<LoadingShell />}>
                  <FirebaseAuthDiagnosticReactPage />
                </React.Suspense>
              }
            />
          </Routes>
        </BrowserRouter>
      </HelmetProvider>
    );
  }

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
            <AppContent />
          </AppProvider>
        )}
      </AppInitializer>
    </HelmetProvider>
  );
};

// Wrapper component that has access to AppProvider context
const AppContent: React.FC = () => {
  const { user } = useApp();
  const isDev = import.meta.env.DEV;
  const [globalErrorOpen, setGlobalErrorOpen] = React.useState(false);
  const [globalErrorMessage, setGlobalErrorMessage] = React.useState('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
  const [globalErrorTitle, setGlobalErrorTitle] = React.useState('خطأ');

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      const message = event?.message || 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.';
      setGlobalErrorTitle('خطأ');
      setGlobalErrorMessage(message);
      setGlobalErrorOpen(true);
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = (event?.reason && (event.reason.message || event.reason.toString())) || 'حدث خطأ غير متوقع.';
      setGlobalErrorTitle('خطأ');
      setGlobalErrorMessage(reason);
      setGlobalErrorOpen(true);
    };

    const handleFirebaseCritical = (event: CustomEvent) => {
      const detailMessage = (event?.detail && (event.detail.message || event.detail.toString())) || 'تعذر الاتصال بخدمات Firebase مؤقتاً.';
      setGlobalErrorTitle('مشكلة في الاتصال');
      setGlobalErrorMessage(detailMessage);
      setGlobalErrorOpen(true);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);
    window.addEventListener('firebase-critical-error' as any, handleFirebaseCritical as any);
    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
      window.removeEventListener('firebase-critical-error' as any, handleFirebaseCritical as any);
    };
  }, []);

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      if (!target) return;

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.hasAttribute('data-no-nav')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href) return;
      if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      // CRITICAL: Prevent browser default and use React Router via history
      event.preventDefault();
      event.stopPropagation();
      
      // Use browser history API which React Router subscribes to
      const pathname = url.pathname + url.search + url.hash;
      if (pathname !== window.location.pathname + window.location.search + window.location.hash) {
        window.history.pushState(null, '', pathname);
        // Dispatch popstate event so React Router detects the change
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  React.useEffect(() => {
    // Only remove explicitly tagged cleanup overlays to avoid touching React-managed nodes
    const removeBlockingOverlays = () => {
      if (document.body.classList.contains('modal-open')) return;
      const overlays = document.querySelectorAll('[data-khuyoot-overlay="cleanup"]');
      overlays.forEach((overlay) => overlay.remove());
    };

    const interval = window.setInterval(removeBlockingOverlays, 500);
    return () => window.clearInterval(interval);
  }, []);
  
  return (
    <>
      <ErrorModal
        isOpen={globalErrorOpen}
        onClose={() => setGlobalErrorOpen(false)}
        title={globalErrorTitle}
        message={globalErrorMessage}
      />
      <BrowserRouter>
        <DevDefaultRoute />
        <TailorJoinRedirect />
              <OrderDetailsProvider>
              <CreditProvider>
              <GlobalErrorBoundary>
              <Routes>
               {isDev && (
                 <>
                   <Route
                     path="/__dev/video-lab"
                     element={
                       <React.Suspense fallback={<LoadingShell />}>
                         <DevVideoLabPage />
                       </React.Suspense>
                     }
                   />
                   <Route
                     path="/__dev/firebase-auth-diagnostic"
                     element={
                       <React.Suspense fallback={<LoadingShell />}>
                         <FirebaseAuthDiagnosticReactPage />
                       </React.Suspense>
                     }
                   />
                   <Route path="/__dev/nav-debug" element={<NavDebugLayout />}>
                     <Route index element={<NavDebugIndex />} />
                     <Route path="a" element={<NavDebugA />} />
                     <Route path="b" element={<NavDebugB />} />
                     <Route path="c" element={<NavDebugC />} />
                   </Route>
                   <Route
                     path="/__dev/whatsapp-sandbox"
                     element={
                       <React.Suspense fallback={<LoadingShell />}>
                         <WhatsAppSandboxPanel />
                       </React.Suspense>
                     }
                   />
                   <Route path="/__dev/cookie-test" element={<CookieAuthTest />} />
                   <Route path="/__dev/payment-test" element={<PaymentTestPage />} />
                 </>
               )}
               {/* Standalone Admin Route (Separated from Client Layout) */}
               <Route path="/admin/*" element={<AdminApp />} />

               {/* Public shareable survey preview (no admin login) */}
               <Route path="/surveys/khuyoot-validation/preview" element={<PublicSurveyPreviewPage />} />
               
               {/* Store Admin Route (Separated Management) */}
               <Route path="/store-admin" element={<StoreAdmin />} />
{/* Test Routes */}
               <Route path="/auth-test" element={<AuthTestPage />} />
               
               <Route path="/test-template-picker" element={<TestTemplatePickerPage />} />
                <Route path="/pdf-test" element={<PDFTestPage />} />
               {/* Jank sandbox without ClientLayout (no header/footer) */}
               <Route path="/jank-sandbox" element={<JankSandbox />} />
                 <Route path="/visualizer" element={<VisualizerPage />} />
               {/* Homepage / Studio Shell with Persistent Header */}
               <Route element={<AppLayout />}>
                 <Route path="/" element={<DemoShellLayout />}>
                   <Route index element={<SmartHomeRedirect />} />
                   <Route path="women" element={<Navigate to="/female" replace />} />
                   <Route path="men" element={<Navigate to="/male" replace />} />
                   <Route path="female" element={<MontLandingPage />} />
                   <Route path="male" element={<MontLandingPage />} />
                   <Route path="products" element={<Navigate to="/products/women/all" replace />} />
                   <Route path="products/:gender" element={<Navigate to="/products/:gender/all" replace />} />
                   <Route path="products/:gender/:category" element={<ProductList />} />
                   <Route path="product/:id" element={<ProductDetails />} />
                   <Route path="page-a" element={<DemoShellPageA />} />
                   <Route path="page-b" element={<DemoShellPageB />} />
                   <Route path="tailors" element={<TailorList />} />
                   <Route path="tailor/:id" element={<TailorProfile />} />
                   <Route path="designer-v2-1" element={<Navigate to="/tryon" replace />} />
                   <Route path="designer-v2-1/:productId" element={<Navigate to="/tryon" replace />} />
                   <Route path="designer-v2-1/design/:taskId" element={<Navigate to="/tryon" replace />} />
                   <Route path="designer-v2-1/new" element={<Navigate to="/tryon/new" replace />} />
                   <Route path="tryon" element={<TryOn />} />
                   <Route path="tryon/:productId" element={<TryOn />} />
                   <Route path="tryon/design/:taskId" element={<TryOn />} />
                   <Route path="tryon/new" element={<TryOnNewShell />} />
                    <Route path="order-summary/:orderId" element={<OrderSummary />} />
                    <Route path="measurements" element={<ClientMeasurementsV2 />} />
                    <Route path="measurements/:productId" element={<ClientMeasurementsV2 />} />
                    <Route path="studio/measurements/:productId" element={<StudioMeasurements />} />
                    <Route path="measurements-v2" element={<ClientMeasurementsV2 />} />
                    <Route path="measurements-v2/:productId" element={<ClientMeasurementsV2 />} />
                 </Route>
               </Route>

               <Route element={<ClientLayout />}>
                 {isDev && <Route path="/__dev/client-nav-debug" element={<ClientNavDebugPage />} />}
                 <Route path="/jackets" element={<Navigate to="/products/women/jacket" replace />} />
                 <Route path="/tailor-account" element={<TailorAccount />} />
                 <Route path="/boutique-account" element={<BoutiqueAccount />} />
                 <Route path="/shop-account" element={<ShopAccount />} />
                 {/* Fabric store removed in new role model */}
                 <Route path="/account/*" element={<Account />} />
                 <Route path="/transaction-history" element={<TransactionHistory />} />
                 <Route path="/family-measurements" element={<FamilyMeasurements />} />
                 <Route path="/checkout" element={<Checkout />} />
                 <Route path="/measurements-old" element={<Measurements />} />
                 <Route path="/designer" element={<ErrorBoundary><Designer /></ErrorBoundary>} />
                 <Route path="/designer/:id" element={<ErrorBoundary><Designer /></ErrorBoundary>} />
                 <Route path="/product" element={<Navigate to="/products" replace />} />
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
                <Route path="/return-policy" element={<ReturnPolicy />} />
                <Route path="/settings" element={<Settings />} />

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
             </OrderDetailsProvider>

            {/* Global Root-Level Modal Portal */}
            {createPortal(
              <RootModalPortal />,
              document.body
            )}
            </BrowserRouter>
    </>
  );
};

// Separate component for root-level modals to prevent re-renders
const RootModalPortal: React.FC = () => {
  const { isUpgradeModalOpen, setIsUpgradeModalOpen } = useModalStore();
  const { user, isPrivacyModalOpen, togglePrivacyModal, isTermsModalOpen, toggleTermsModal, isReturnPolicyModalOpen, toggleReturnPolicyModal, appSettings } = useApp();

  const privacyContent = (appSettings as any)?.pageTexts?.privacyPolicy || '';
  const termsContent = (appSettings as any)?.pageTexts?.termsAndConditions || '';
  const returnPolicyContent = (appSettings as any)?.pageTexts?.returnPolicy || '';

  const handleUpgrade = async (packageInfo: {
    packageType: string;
    packageName: string;
    credits: number;
    price: number;
    isSubscription: boolean;
  }) => {
    const currentUserId = user?.id;
    if (!currentUserId) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    
    try {
      // Use user-accessible purchase function with full package details
      const result = await firebaseService.purchaseCredits({
        userId: currentUserId,
        amount: packageInfo.credits,
        packageType: packageInfo.packageType,
        packageName: packageInfo.packageName,
        amountPaid: packageInfo.price,
        paymentMethod: 'cash', // Default to cash, can be changed based on payment integration
        isSubscription: packageInfo.isSubscription,
      });
      
      const newBalance = result.new_balance;
      
      // Update localStorage for instant UI
      window.localStorage.setItem(`khuyoot:credits:lastBalance:${currentUserId}`, String(newBalance));
      
      // Trigger event to update all credit displays
      window.dispatchEvent(new CustomEvent('khuyoot:credits-updated', { 
        detail: { balance: newBalance } 
      }));
      
      // Also refresh user profile to update TryOn page
      window.dispatchEvent(new CustomEvent('khuyoot:refresh-user-data'));
    } catch (error: any) {
      throw new Error(error?.message || 'فشل في إضافة الرصيد');
    }
  };

  return (
    <>
      <AuthModal />
      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => {
          console.log('🔴 RootModalPortal - UpgradeModal CLOSE clicked');
          setIsUpgradeModalOpen(false);
        }}
        onUpgradeClick={handleUpgrade}
      />
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => togglePrivacyModal(false)}
        content={privacyContent}
      />
      <TermsModal
        isOpen={isTermsModalOpen}
        onClose={() => toggleTermsModal(false)}
        content={termsContent}
      />
      <ReturnPolicyModal
        isOpen={isReturnPolicyModalOpen}
        onClose={() => toggleReturnPolicyModal(false)}
        content={returnPolicyContent}
      />
    </>
  );
};

export default App;


