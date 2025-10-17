import { useEffect, useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import Loader from './components/layout/Loader';
import RouterWrapper from './components/RouterWrapper';


function App() {
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    // Suppress external MutationObserver errors from browser extensions
    const originalError = window.console.error;
    window.console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('MutationObserver')) {
        return; // Suppress MutationObserver errors from extensions
      }
      originalError.apply(console, args);
    };

    const timer = setTimeout(() => setInitialLoading(false), 2000);

    return () => {
      clearTimeout(timer);
      window.console.error = originalError; // Restore original console.error
    };
  }, []);

  // Show initial loader on first load
  if (initialLoading) {
    return <Loader />;
  }

  return (
    <Router basename="/LevelAutoRental/">
      <Layout>
        <RouterWrapper />
      </Layout>
    </Router>
  );
}

export default App;