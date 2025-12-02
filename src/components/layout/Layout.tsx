import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { pageTransition } from '../../utils/animations';
import { Footer } from './Footer';
import { Header } from './Header';
import Loader from './Loader';
import { FloatingContact } from '../ui/FloatingContact';
import { Toaster } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Check if current route is an auth page, admin page, or dashboard page
  const isAuthPage = location.pathname.startsWith('/auth');
  const isAdminPage = location.pathname.startsWith('/admin');
  const isDashboardPage = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    // Start page transition loader
    setShowLoader(true);
    setIsPageTransitioning(false); // Start with opacity 100

    // Start fade out after holding for a smoother experience (matching initial loader)
    const fadeTimer = setTimeout(() => {
      setIsPageTransitioning(true); // Start fade out
    }, 1500);

    // Hide loader after fade completes
    const hideTimer = setTimeout(() => {
      setShowLoader(false);
    }, 1800); // 1500ms + 300ms fade duration

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  return (
    <>
      {/* Toast Notifications - Hidden on admin pages (admin has its own NotificationToaster) */}
      {!isAdminPage && (
      <Toaster 
        position="bottom-right"
        toastOptions={{
          duration: 6000,
          classNames: {
            toast: 'bg-white border border-gray-200 text-gray-900 shadow-lg rounded-xl',
            success: 'bg-white border border-green-200 text-gray-900',
            title: 'text-green-800 font-semibold',
            description: 'text-green-700',
          },
        }}
      />
      )}
      
      {/* Show loader during page transitions - overlays on top with high z-index */}
      {showLoader && <Loader isTransitioning={isPageTransitioning} />}
      
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="absolute left-[-9999px] w-1 h-1 focus:left-4 focus:top-4 focus:z-[100] focus:w-auto focus:h-auto focus:px-4 focus:py-2 focus:bg-theme-500 focus:text-white focus:rounded-lg focus:font-semibold focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2"
      >
        Skip to content
      </a>
      
      {/* Content is always rendered */}
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <AnimatePresence {...({ mode: "wait" } as any)} initial={false}>
          <motion.main
            id="main-content"
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1"
            tabIndex={-1}
          >
            {children}
          </motion.main>
        </AnimatePresence>
        {!isAuthPage && !isDashboardPage && <Footer />}
      </div>
      
      {/* Floating Contact Component - Hidden on admin and dashboard pages */}
      {!isAdminPage && !isDashboardPage && <FloatingContact />}
    </>
  );
};