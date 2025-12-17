import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  isTransitioning?: boolean;
  onLoadingComplete?: () => void;
}

// Function to preload images
const preloadImages = (imageUrls: string[]): Promise<void[]> => {
  const promises = imageUrls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        
        resolve();
      };
      img.onerror = () => {
        console.warn(`⚠️ Failed to load image: ${url}`);
        resolve(); // Still resolve to not block the loading process
      };
      img.src = url;
    });
  });
  return Promise.all(promises);
};

const LoadingScreen = ({ isTransitioning = false, onLoadingComplete }: LoadingScreenProps) => {

  useEffect(() => {
    // Define all critical images that need to be preloaded
    const criticalImages = [
      // Logo
      '/logo.png',
      
      // Background images
      '/lvl_bg.png',
      '/backgrounds/bg2-desktop.jpeg',
      '/backgrounds/bg3-mobile.jpeg',
      '/backgrounds/bg4-mobile.jpeg',
      '/backgrounds/bg10-mobile.jpeg',
      
      // Brand logos
      '/logos/audi.png',
      '/logos/bmw.webp',
      '/logos/hyundai.png',
      '/logos/maserati.png',
      '/logos/merc.svg',
      
      // Car images (main images only for faster loading)
      // '/cars/c43/c43-1.jpg',
      // '/cars/gle/gle-1.jpg',
      // '/cars/cls/cls-1.jpg',
      // '/cars/maserati/maserati-1.jpg',
    ];

    // Preload images
    Promise.all(
      criticalImages.map((url) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // Still resolve to not block the loading process
          img.src = url;
        });
      })
    ).then(() => {
      // Wait a bit for the user to see the completion, then trigger transition
      setTimeout(() => {
        onLoadingComplete?.();
      }, 1000); // 1 second delay to show completion status
    });
  }, []);

  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        onLoadingComplete?.();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, onLoadingComplete]);

  return (
    <div 
      className={`fixed inset-0 bg-black transition-opacity duration-300 ease-in-out z-[9999999] ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        zIndex: 9999999,
      }}
    >
      {/* Background Image Layer - loads in background */}
      <div 
        className="absolute inset-0 bg-cover bg-no-repeat bg-mobile-loader bg-loader-mobile md:bg-desktop-loader md:bg-loader-desktop opacity-40"
        style={{ 
          animation: 'background-scale 2s ease-in-out infinite',
        }}
      ></div>
      
      {/* Dark Overlay for better logo visibility */}
      <div className="absolute inset-0 bg-black/40"></div>
      
      {/* Loading Content */}
      <div className="relative flex flex-col items-center justify-center min-h-screen">
        {/* Logo */}
        <div className="relative w-64 h-24 flex items-center justify-center">
          <img 
            src="/logo.png" 
            alt="Level Auto Rental" 
            className="w-64 h-auto brightness-0 invert drop-shadow-lg"
            style={{ 
              animation: 'scale-premium 2s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Custom CSS for loading animation */}
      <style>{`
        @keyframes scale-premium {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes background-scale {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .bg-image-transition {
          transition: background-image 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;
