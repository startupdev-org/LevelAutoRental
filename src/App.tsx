import { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Loader from './components/layout/Loader';
import RouterWrapper from './components/RouterWrapper';
import { ExchangeRateProvider } from './context/ExchangeRateContext';


function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    // Suppress external MutationObserver errors from browser extensions
    const originalError = window.console.error;
    window.console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('MutationObserver')) {
        return; // Suppress MutationObserver errors from extensions
      }
      originalError.apply(console, args);
    };

    // Fallback timer in case images take too long (max 10 seconds)
    const fallbackTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 10000);

    return () => {
      clearTimeout(fallbackTimer);
      window.console.error = originalError; // Restore original console.error
    };
  }, []);

  // Handle loading completion from Loader component
  const handleLoadingComplete = () => {
    setIsTransitioning(true);
    
    // Hide loader after fade completes
    setTimeout(() => {
      setInitialLoading(false);
    }, 300); // 0.3s fade duration
  };

  return (
    <>
      <ExchangeRateProvider>
        {/* Show loader while initial loading */}
        {initialLoading && <Loader isTransitioning={isTransitioning} onLoadingComplete={handleLoadingComplete} />}
        
        {/* Show content immediately, even during fade-out */}
        <Router>
          <Layout>
            <RouterWrapper />
          </Layout>
        </Router>
      </ExchangeRateProvider>
    </>
  );
}

export default App;