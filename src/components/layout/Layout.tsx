import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { pageTransition } from '../../utils/animations';
import { Footer } from './Footer';
import { Header } from './Header';
import Loader from './Loader';
import { FloatingContact } from '../ui/FloatingContact';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const [isPageTransitioning, setIsPageTransitioning] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Check if current route is an auth page or admin page
  const isAuthPage = location.pathname.startsWith('/auth');
  const isAdminPage = location.pathname.startsWith('/admin');

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
      {/* Show loader during page transitions - overlays on top with high z-index */}
      {showLoader && <Loader isTransitioning={isPageTransitioning} />}
      
      {/* Content is always rendered */}
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <AnimatePresence {...({ mode: "wait" } as any)} initial={false}>
          <motion.main
            key={location.pathname}
            variants={pageTransition}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex-1"
          >
            {children}
          </motion.main>
        </AnimatePresence>
        {!isAuthPage && <Footer />}
      </div>
      
      {/* Floating Contact Component - Hidden on admin page */}
      {!isAdminPage && <FloatingContact />}
    </>
  );
};