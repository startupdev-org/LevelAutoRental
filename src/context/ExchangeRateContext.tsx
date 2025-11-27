import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ExchangeRates {
  eur: number;
  usd: number;
  loading: boolean;
  error: string | null;
  source: 'api' | 'fallback';
}

const ExchangeRateContext = createContext<ExchangeRates | undefined>(undefined);

export const ExchangeRateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [eur, setEur] = useState<number>(19.82); // Fallback rate
  const [usd, setUsd] = useState<number>(17.00); // Fallback rate
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [source, setSource] = useState<'api' | 'fallback'>('fallback');

  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check cache first
        const cachedData = localStorage.getItem('exchange_rates_v2');
        if (cachedData) {
          try {
            const { timestamp, rates } = JSON.parse(cachedData);
            const now = new Date().getTime();
            // Cache valid for 24 hours
            if (now - timestamp < 24 * 60 * 60 * 1000) {
              setEur(rates.eur);
              setUsd(rates.usd);
              setSource('api'); // It's from API, just cached
              setLoading(false);
              return;
            }
          } catch (e) {
            localStorage.removeItem('exchange_rates_v2');
          }
        }

        // Use exchangeratesapi.io
        const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
        let url = `http://api.exchangeratesapi.io/v1/latest?access_key=${apiKey}&symbols=MDL,USD`;
        let usedBackupApi = false;

        // Try primary API
        let response: Response;
        try {
           if (!apiKey) throw new Error('No API key');
           response = await fetch(url);
           if (!response.ok) throw new Error(`API Error: ${response.status}`);
        } catch (e) {
           console.warn('Primary exchange API failed, trying backup...', e);
           // Fallback to exchangerate-api.com (free, no key)
           url = 'https://api.exchangerate-api.com/v4/latest/EUR';
           response = await fetch(url);
           usedBackupApi = true;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch from both exchange rate APIs');
        }

        const data = await response.json();

        // Handle API response format
        let eurToMdl: number | undefined;
        let eurToUsd: number | undefined;

        if (data.rates) {
           eurToMdl = data.rates.MDL;
           eurToUsd = data.rates.USD;
        }

        if (eurToMdl && eurToUsd && eurToMdl > 0 && eurToUsd > 0) {
          const mdlToEurDivisor = eurToMdl;
          const mdlToUsdDivisor = eurToMdl / eurToUsd;

          setEur(mdlToEurDivisor);
          setUsd(mdlToUsdDivisor);
          setSource(usedBackupApi ? 'fallback' : 'api');

          // Save to cache
          localStorage.setItem('exchange_rates_v2', JSON.stringify({
            timestamp: new Date().getTime(),
            rates: { eur: mdlToEurDivisor, usd: mdlToUsdDivisor }
          }));
        } else {
          throw new Error('Invalid exchange rate data received');
        }
      } catch (err) {
        console.error('Error fetching exchange rates:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch exchange rates');
        setSource('fallback');
        // Keep hardcoded fallback rates on error
      } finally {
        setLoading(false);
      }
    };

    fetchExchangeRates();
  }, []);

  return (
    <ExchangeRateContext.Provider value={{ eur, usd, loading, error, source }}>
      {children}
    </ExchangeRateContext.Provider>
  );
};

export const useExchangeRateContext = () => {
  const context = useContext(ExchangeRateContext);
  if (context === undefined) {
    throw new Error('useExchangeRateContext must be used within an ExchangeRateProvider');
  }
  return context;
};

