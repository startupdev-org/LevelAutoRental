import { motion, AnimatePresence } from 'framer-motion';
import { Globe, DollarSign } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useExchangeRateContext } from '../../context/ExchangeRateContext';
import { LANGUAGES } from '../../constants';

interface LanguageCurrencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CURRENCIES = [
  { code: 'MDL', symbol: 'MDL', label: 'MDL' },
  { code: 'EUR', symbol: '€', label: 'EUR' },
  { code: 'USD', symbol: '$', label: 'USD' },
];

export const LanguageCurrencyModal: React.FC<LanguageCurrencyModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const { selectedCurrency, setSelectedCurrency } = useExchangeRateContext();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState<'MDL' | 'EUR' | 'USD'>(selectedCurrency);

  useEffect(() => {
    if (isOpen) {
      // Set initial values from current settings
      setSelectedLanguage(i18n.language);
      setSelectedCurrencyCode(selectedCurrency);
    }
  }, [isOpen, selectedCurrency]);

  // Get translation function for the selected language (preview only)
  const tPreview = i18n.getFixedT(selectedLanguage);

  // Handle language change in real-time (only for modal preview)
  const handleLanguageChange = (code: string) => {
    setSelectedLanguage(code);
    // Don't change the global language yet - only preview in modal
  };

  const handleConfirm = () => {
    // Apply language change to the whole website
    i18n.changeLanguage(selectedLanguage);
    localStorage.setItem('selectedLanguage', selectedLanguage);

    // Save currency selection
    setSelectedCurrency(selectedCurrencyCode);
    localStorage.setItem('selectedCurrency', selectedCurrencyCode);

    // Mark that user has completed the initial setup
    localStorage.setItem('languageCurrencySetupCompleted', 'true');

    // Close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
              {/* Header */}
              <div className="relative p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 text-center">
                  {tPreview('languageCurrencyModal.title', 'Bine ați venit!')}
                </h2>
                <p className="text-xs text-gray-600 text-center mt-1">
                  {tPreview('languageCurrencyModal.subtitle', 'Selectați limba și moneda preferate')}
                </p>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Language Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-theme-500" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tPreview('languageCurrencyModal.language', 'Limbă')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {LANGUAGES.map(({ code, iconClass }) => (
                      <button
                        key={code}
                        onClick={() => handleLanguageChange(code)}
                        className={`flex flex-col items-center p-2.5 rounded-lg border-2 transition-all duration-200 ${
                          selectedLanguage === code
                            ? 'border-theme-500 bg-theme-50 text-theme-600 shadow-sm scale-105'
                            : 'border-gray-200 text-gray-600 hover:border-theme-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`${iconClass} w-6 h-4 mb-1`}></span>
                        <span className="text-xs font-medium">{tPreview(`languages.${code}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Currency Selection */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-theme-500" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      {tPreview('languageCurrencyModal.currency', 'Monedă')}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {CURRENCIES.map((currency) => (
                      <button
                        key={currency.code}
                        onClick={() => setSelectedCurrencyCode(currency.code as 'MDL' | 'EUR' | 'USD')}
                        className={`flex flex-col items-center p-2.5 rounded-lg border-2 transition-all duration-200 ${
                          selectedCurrencyCode === currency.code
                            ? 'border-theme-500 bg-theme-50 text-theme-600 shadow-sm scale-105'
                            : 'border-gray-200 text-gray-600 hover:border-theme-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-md bg-gray-100 flex items-center justify-center mb-1">
                          <span className={`font-bold text-gray-800 ${
                            currency.code === 'MDL' ? 'text-xs' : 'text-base'
                          }`}>
                            {currency.symbol}
                          </span>
                        </div>
                        <span className="text-xs font-medium">{currency.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200 flex justify-end">
                <button
                  onClick={handleConfirm}
                  className="px-5 py-2 bg-theme-500 hover:bg-theme-600 text-white font-semibold text-sm rounded-lg transition-colors shadow-sm hover:shadow-md"
                >
                  {tPreview('languageCurrencyModal.confirm', 'Confirmă')}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

