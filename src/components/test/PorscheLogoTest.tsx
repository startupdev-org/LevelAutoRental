import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const PorscheLogoTest: React.FC = () => {
  const [selectedMake, setSelectedMake] = useState<string>('Porsche');
  const [showDropdown, setShowDropdown] = useState(false);

  const getMakeLogo = (make: string): string | null => {
    const makeLower = make.toLowerCase();
    const logoMap: { [key: string]: string } = {
      'mercedes': '/logos/merc.svg',
      'mercedes-benz': '/logos/merc.svg',
      'bmw': '/logos/bmw.webp',
      'audi': '/logos/audi.png',
      'hyundai': '/logos/hyundai.png',
      'maserati': '/logos/maserati.png',
      'volkswagen': '/logos/volkswagen-1-logo-black-and-white.png',
      'vw': '/logos/volkswagen-1-logo-black-and-white.png',
      'lincoln': '/logos/lincoln.png',
      'porsche': '/logos/porsche.png',
    };
    return logoMap[makeLower] || null;
  };

  const getLogoSizeClass = (make: string): string => {
    const makeLower = make.toLowerCase();
    if (makeLower === 'audi' || makeLower === 'maserati' || makeLower === 'lincoln' || makeLower === 'porsche') {
      return 'w-6 h-6';
    }
    return 'w-4 h-4';
  };

  const testMakes = ['Porsche', 'Audi', 'BMW', 'Mercedes', 'Lincoln', 'Volkswagen'];

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-4">Porsche Logo Test</h2>
        
        {/* Mock Search Bar */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
            Make
          </label>
          <div className="relative overflow-visible">
            <div
              className="w-full text-sm font-medium text-gray-900 bg-transparent border border-gray-200 rounded-xl py-3 px-4 cursor-pointer flex items-center gap-2"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {selectedMake && (() => {
                const logoPath = getMakeLogo(selectedMake.toLowerCase());
                return logoPath ? (
                  <img 
                    src={logoPath} 
                    alt={selectedMake}
                    className={`${getLogoSizeClass(selectedMake)} object-contain`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : null;
              })()}
              <span className="flex-1">{selectedMake || 'Select Make'}</span>
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Dropdown */}
            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1">
                    {testMakes.map((make, index) => {
                      const logoPath = getMakeLogo(make.toLowerCase());
                      const isFirst = index === 0;
                      const isLast = index === testMakes.length - 1;
                      return (
                        <div
                          key={make}
                          className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-2 ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${selectedMake === make ? 'text-gray-900 font-medium bg-gray-50' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            setSelectedMake(make);
                            setShowDropdown(false);
                          }}
                        >
                          <div className="w-6 flex items-center justify-start flex-shrink-0">
                            {logoPath && (
                              <img 
                                src={logoPath} 
                                alt={make}
                                className={`${getLogoSizeClass(make)} object-contain`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            )}
                          </div>
                          <span>{make}</span>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Logo Preview */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Logo Preview</h3>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Porsche Logo</p>
              <img 
                src="/logos/porsche.png" 
                alt="Porsche"
                className="w-24 h-24 object-contain border border-gray-200 rounded-lg p-2"
                onError={(e) => {
                  console.error('Porsche logo failed to load');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-2">Size in dropdown (w-6 h-6)</p>
              <img 
                src="/logos/porsche.png" 
                alt="Porsche"
                className="w-6 h-6 object-contain border border-gray-200 rounded p-1"
                onError={(e) => {
                  console.error('Porsche logo failed to load');
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

