import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AppProvider } from './context/AppContext';
import TailorJoinFlow from './features/tailor-join/TailorJoinFlow';

// Auto-redirect component - redirects root to join-tailor
const AutoRedirect: React.FC = () => {
  const location = useLocation();
  
  useEffect(() => {
    // If user opens the app without a hash, force the default join route.
    // (This avoids landing on '/' which can appear as a 404 in static hosting.)
    if (location.pathname === '/' && (!window.location.hash || window.location.hash === '#')) {
      window.location.hash = '#/join-tailor/';
    }
  }, [location]);
  
  return <Navigate to="/join-tailor/" replace />;
};

const App: React.FC = () => {
  return (
    <HelmetProvider>
      <AppProvider>
        <HashRouter>
          <Routes>
          {/* Auto-redirect root to join-tailor */}
          <Route path="/" element={<AutoRedirect />} />
          
          {/* Tailor Join routes */}
          <Route path="/join-tailor" element={<TailorJoinFlow />} />
          <Route path="/join-tailor/" element={<TailorJoinFlow />} />
          <Route path="/join-tailor/step-:step" element={<TailorJoinFlow />} />
          <Route path="/join-tailor/step/:step" element={<TailorJoinFlow />} />
          <Route path="/join-tailor/:step" element={<TailorJoinFlow />} />
          
          {/* Catch-all redirect to join-tailor */}
          <Route path="*" element={<Navigate to="/join-tailor/" replace />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  </HelmetProvider>
  );
};

export default App;
