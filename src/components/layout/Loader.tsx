import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isLoading?: boolean;
  isTransitioning?: boolean;
  onLoadingComplete?: () => void;
}

const LoadingScreen = ({ isLoading = true, isTransitioning = false, onLoadingComplete }: LoadingScreenProps) => {
  useEffect(() => {
    // Simple timer for testing
    const timer = setTimeout(() => {
      onLoadingComplete?.();
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [onLoadingComplete]);

  if (!isLoading) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 z-[999999] bg-white transition-opacity duration-700 ease-in-out ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Loading Content */}
      <div className="flex items-center justify-center min-h-screen">
        <img 
          src="/logo.png" 
          alt="Level Auto Rental" 
          className="w-64 h-auto"
          style={{ 
            animation: 'scale-premium 2s ease-in-out infinite',
          }}
          onLoad={() => console.log('Logo loaded successfully')}
          onError={(e) => {
            console.error('Logo failed to load:', e);
          }}
        />
      </div>

      {/* Custom CSS for loading animation */}
      <style>{`
        @keyframes scale-premium {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
