import { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Loader from './components/layout/Loader';
import RouterWrapper from './components/RouterWrapper';

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

    // Preload background image globally to prevent any flash
    const img = new Image();
    img.src = '/LevelAutoRental/lvl_bg.png';

    // Start transition after 1.5 seconds, then hide loader after fade completes
    const transitionTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 1500);

    const hideTimer = setTimeout(() => {
      setInitialLoading(false);
    }, 1800); // 1.5s + 0.3s fade duration
    
    return () => {
      clearTimeout(transitionTimer);
      clearTimeout(hideTimer);
      window.console.error = originalError; // Restore original console.error
    };
  }, []);

  return (
    <>
      {/* Show loader while initial loading */}
      {initialLoading && <Loader isTransitioning={isTransitioning} />}
      
      {/* Show content immediately, even during fade-out */}
      <Router basename="/LevelAutoRental/">
        <Layout>
          <RouterWrapper />
        </Layout>
      </Router>
    </>
  );
}

export default App;