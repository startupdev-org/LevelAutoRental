import { useExchangeRateContext } from '../context/ExchangeRateContext';

/**
 * Custom hook to consume exchange rates from the global context
 */
export const useExchangeRates = () => {
  return useExchangeRateContext();
};
