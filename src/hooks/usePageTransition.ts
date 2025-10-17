import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const usePageTransition = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const location = useLocation();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    // Skip loader on initial page load to prevent flash
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      return;
    }

    // Show loader when route changes
    setIsLoading(true);
    setIsTransitioning(false);

    // Simulate loading time
    const timer = setTimeout(() => {
      setIsTransitioning(true);
      
      // Hide loader after transition animation
      setTimeout(() => {
        setIsLoading(false);
        setIsTransitioning(false);
      }, 300); // Transition duration
    }, 800); // Loading duration

    return () => {
      clearTimeout(timer);
    };
  }, [location.pathname]);

  return {
    isLoading,
    isTransitioning,
    onLoadingComplete: () => {
      setIsTransitioning(true);
      setTimeout(() => {
        setIsLoading(false);
        setIsTransitioning(false);
      }, 300);
    }
  };
};