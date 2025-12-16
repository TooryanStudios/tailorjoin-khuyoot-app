
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { AuthModal } from '../../../components/AuthModal';

export const ClientLayout = () => {
  console.log('🎨 ClientLayout rendering');
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#050817] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500/30 transition-colors duration-300">
      <Header />
      <main id="main-content" className="w-full max-w-7xl mx-auto min-h-[85vh] relative pb-40 md:pb-28">
         <Outlet />
      </main>
      <Footer />
      <AuthModal />
    </div>
  );
};
