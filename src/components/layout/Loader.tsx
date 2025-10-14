import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  isLoading?: boolean;
  isTransitioning?: boolean;
  onLoadingComplete?: () => void;
}

const LoadingScreen = ({ isLoading = true, isTransitioning = false, onLoadingComplete }: LoadingScreenProps) => {
  const [showLoader, setShowLoader] = useState(true);

  useEffect(() => {
    if (isTransitioning) {
      // Start fade out animation
      const timer = setTimeout(() => {
        setShowLoader(false);
        onLoadingComplete?.();
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isTransitioning, onLoadingComplete]);

  useEffect(() => {
    if (isLoading) {
      setShowLoader(true);
    }
  }, [isLoading]);

  if (!showLoader) {
    return null;
  }

  return (
    <div 
      className={`fixed inset-0 bg-white transition-opacity duration-300 ease-in-out ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ zIndex: 999999 }}
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
