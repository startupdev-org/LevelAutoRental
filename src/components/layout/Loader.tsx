import { useEffect } from 'react';

interface LoadingScreenProps {
  isTransitioning?: boolean;
  onLoadingComplete?: () => void;
}

const LoadingScreen = ({ isTransitioning = false, onLoadingComplete }: LoadingScreenProps) => {
  useEffect(() => {
    console.log('Loader mounted');
    return () => console.log('Loader unmounted');
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
      className={`fixed inset-0 bg-cover bg-no-repeat transition-opacity duration-300 ease-in-out z-[9999999] bg-mobile-loader bg-loader-mobile md:bg-desktop-loader md:bg-loader-desktop ${
        isTransitioning ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ 
        zIndex: 9999999,
        animation: 'zoom-premium 3s ease-in-out infinite',
      }}
    >
      {/* Dark Overlay for better logo visibility */}
      <div className="absolute inset-0 bg-black/60"></div>
      
      {/* Loading Content */}
      <div className="relative flex items-center justify-center min-h-screen">
        <img 
          src="/LevelAutoRental/logo.png" 
          alt="Level Auto Rental" 
          className="w-64 h-auto brightness-0 invert drop-shadow-lg"
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
        
        @keyframes zoom-premium {
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
