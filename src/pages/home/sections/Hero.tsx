import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { BiSolidPhoneCall } from "react-icons/bi";
import React, { useState, useMemo, useEffect } from 'react';
import { Button } from '../../../components/ui/Button';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchCars } from '../../../lib/db/cars/cars-page/cars';
import { Car } from '../../../types';

export const Hero: React.FC = () => {

  const { t } = useTranslation();

  const navigate = useNavigate();
  const todayDate = new Date().toISOString().split('T')[0];

  const [cars, setCars] = useState<Car[]>([]);

  useEffect(() => {
    const loadCars = async () => {
      try {
        const fetchedCars = await fetchCars();
        setCars(fetchedCars);
      } catch (error) {
        console.error('Error fetching cars:', error);
      }
    };
    loadCars();
  }, []);

  const [bookingForm, setBookingForm] = useState({
    make: '',
    model: '',
    location: '',
    dateRange: { startDate: '', endDate: '' } as { startDate: string; endDate: string }
  });
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Get unique makes
  const uniqueMakes = useMemo(() => {
    const makes = cars.map(car => {
      const make = car.make || '';
      const normalizedMake = make.includes('-') ? make.split('-')[0] : make;
      return normalizedMake.trim().toLowerCase();
    });
    const uniqueNormalizedMakes = Array.from(new Set(makes)).filter(Boolean);

    // Convert back to title case for display
    return uniqueNormalizedMakes.map(make =>
      make.charAt(0).toUpperCase() + make.slice(1).toLowerCase()
    );
  }, [cars]);

  // Map makes to their available models
  const makeToModels = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    cars.forEach(car => {
      const make = car.make || '';
      const model = car.model || '';
      const cleanMake = make.includes('-') ? make.split('-')[0] : make;
      const normalizedMake = cleanMake.trim().toLowerCase();

      if (!normalizedMake) return;

      // Use normalized make as key
      if (!mapping[normalizedMake]) {
        mapping[normalizedMake] = [];
      }
      if (model && !mapping[normalizedMake].includes(model)) {
        mapping[normalizedMake].push(model);
      }
    });
    return mapping;
  }, [cars]);

  // Get available models for selected make
  const availableModels = useMemo(() => {
    if (!bookingForm.make) return [];
    const normalizedMake = bookingForm.make.trim().toLowerCase();
    return makeToModels[normalizedMake] || [];
  }, [bookingForm.make, makeToModels]);

  // Get car make logo path
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
    };
    return logoMap[makeLower] || null;
  };

  // Get logo size class based on make
  const getLogoSizeClass = (make: string): string => {
    const makeLower = make.toLowerCase();
    if (makeLower === 'audi' || makeLower === 'maserati') {
      return 'w-6 h-6';
    }
    return 'w-4 h-4';
  };

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowLocationDropdown(false);
    setShowDateCalendar(false);
    setShowMakeDropdown(false);
    setShowModelDropdown(false);
  };

  // Handle opening a specific dropdown and closing others
  const openDropdown = (dropdownType: 'location' | 'date' | 'make' | 'model') => {
    if ((dropdownType === 'location' && showLocationDropdown) ||
        (dropdownType === 'date' && showDateCalendar) ||
        (dropdownType === 'make' && showMakeDropdown) ||
        (dropdownType === 'model' && showModelDropdown)) {
      closeAllDropdowns();
      return;
    }
    
    closeAllDropdowns();
    if (dropdownType === 'location') {
      setShowLocationDropdown(true);
    } else if (dropdownType === 'date') {
      setShowDateCalendar(true);
    } else if (dropdownType === 'make') {
      setShowMakeDropdown(true);
    } else if (dropdownType === 'model') {
      setShowModelDropdown(true);
    }
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      // Check if click is outside the entire search bar container
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    // Only add listener if any dropdown is open
    if (showLocationDropdown || showDateCalendar || showMakeDropdown || showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown, showDateCalendar, showMakeDropdown, showModelDropdown]);

  const handleFilterChange = (key: string, value: string | { startDate: string; endDate: string }) => {
    setBookingForm(prev => {
      const newForm = { ...prev, [key]: value };
      
      // If make is being changed, reset model if it's not valid for the new make
      if (key === 'make') {
        const newMake = value as string;
        if (newMake && prev.model) {
          // Use normalized make for lookup
          const normalizedNewMake = newMake.trim().toLowerCase();
          const validModels = makeToModels[normalizedNewMake] || [];
          const currentModelValid = validModels.some(model =>
            model.toLowerCase() === prev.model.toLowerCase()
          );
          if (!currentModelValid) {
            newForm.model = '';
          }
        } else if (!newMake) {
          // If make is cleared, also clear model
          newForm.model = '';
        }
      }
      
      return newForm;
    });
  };

  const handleDateSelect = (selectedDate: string) => {
    const { startDate, endDate } = bookingForm.dateRange;
    
    // If no start date, set it as start date
    if (!startDate) {
      handleFilterChange('dateRange', { startDate: selectedDate, endDate: '' });
      return;
    }
    
    // If start date exists but no end date yet
    if (!endDate) {
      // If selected date is before start date, reset start date
      if (selectedDate < startDate) {
        handleFilterChange('dateRange', { startDate: selectedDate, endDate: '' });
      }
      // If selected date is on or after start date, set as end date
      else if (selectedDate >= startDate) {
        handleFilterChange('dateRange', { startDate, endDate: selectedDate });
        setTimeout(() => closeAllDropdowns(), 200);
      }
    }
    // If both dates exist, allow changing them
    else {
      // If clicking before start date, set new start date
      if (selectedDate < startDate) {
        handleFilterChange('dateRange', { startDate: selectedDate, endDate: '' });
      }
      // If clicking between start and end, or after end, set new end date
      else {
        handleFilterChange('dateRange', { startDate, endDate: selectedDate });
        setTimeout(() => closeAllDropdowns(), 200);
      }
    }
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    if (bookingForm.make) {
      params.set('make', bookingForm.make);
    }
    if (bookingForm.model) {
      params.set('model', bookingForm.model);
    }
    if (bookingForm.location) {
      params.set('location', bookingForm.location);
    }
    if (bookingForm.dateRange.startDate) {
      params.set('startDate', bookingForm.dateRange.startDate);
    }
    if (bookingForm.dateRange.endDate) {
      params.set('endDate', bookingForm.dateRange.endDate);
    }
    
    const queryString = params.toString();
    navigate(`/cars${queryString ? `?${queryString}` : ''}`);
  };

  return (
    <section className="relative h-[725px] pt-36 font-sans bg-white">
      {/* Background Image - Desktop version */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <img
          src="/lvl_bg.png"
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            position: 'absolute',
            top: '-300px',
            left: 0,
            width: '100%',
            height: 'calc(100% + 300px)',
            objectFit: 'cover',
            objectPosition: 'center center',
            zIndex: 0
          }}
        />
      </div>

      {/* Background Image - Tablet version */}
      <div className="hidden md:block lg:hidden absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <img
          src="/lvl_bg.png"
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            position: 'absolute',
            top: '25px',
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            zIndex: 0
          }}
        />
      </div>

      {/* Background Image - Mobile version with img element for better mobile support */}
      <div className="md:hidden absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <img
          src="/backgrounds/bg10-mobile.jpeg"
          alt="Background"
          className="w-full h-full object-cover"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            zIndex: 0
          }}
        />
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60" style={{ zIndex: 1 }}></div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible relative z-10">
        <div className="flex items-center justify-center h-full lg:pt-24">
          {/* Centered Text Content */}
          <div className="text-center space-y-10 max-w-4xl">
            <div className="space-y-8">
              <div className="space-y-6 ">
                <p className="text-lg md:text-xl text-theme-500 font-semibold drop-shadow-md uppercase tracking-wide">

                </p>
                <h1 className="text-4xl md:text-4xl lg:text-5xl font-bold text-white leading-tight drop-shadow-lg">
                  Level Auto Rental
                </h1>

                <p className="text-lg md:text-xl text-white max-w-2xl mx-auto leading-relaxed drop-shadow-md">
                  {t('hero.label')}
                  <span className="text-theme-500 font-medium block"> {t('hero.smallLabel')}</span>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="relative">
                  {/* Live Circle Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2 border-red-400"
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.8, 0, 0.8]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />

                  <div className="relative">
                    <motion.button
                      className="relative px-8 py-4 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 overflow-hidden"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open('tel:+37362000112', '_self')}
                      animate={{
                        boxShadow: [
                          "0 4px 15px rgba(239, 68, 68, 0.3)",
                          "0 8px 25px rgba(239, 68, 68, 0.6)",
                          "0 4px 15px rgba(239, 68, 68, 0.3)"
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                    <motion.div
                      animate={{
                        rotate: [0, 5, -5, 0]
                      }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      {BiSolidPhoneCall({ className: "w-6 h-6" })}
                    </motion.div>
                    {t('hero.start')}
                    </motion.button>
                  </div>
                </div>
                <button
                  className="px-10 py-4 border-2 border-white hover:border-theme-500 text-white hover:text-theme-500 font-semibold rounded-2xl transition-all duration-300 transform hover:scale-105 bg-white/10 backdrop-blur-sm"
                  onClick={() => navigate('/cars')}
                >
                  {t('hero.seeCars')}
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="py-[0px] top-[140px] lg:top-[305px] -mt-10 md:-mt-28 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white backdrop-blur-sm rounded-3xl shadow-lg border border-white/20 dropdown-container">
            {/* Mobile Layout - Stack vertically */}
            <div className="flex flex-col md:hidden space-y-4 p-4">
              {/* Make */}
              <div className="w-full dropdown-container overflow-visible">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Marca
                </label>
                <div className="relative overflow-visible">
                  <div
                    className="w-full text-sm font-medium text-gray-900 bg-transparent border border-gray-200 rounded-xl py-3 px-4 cursor-pointer flex items-center gap-2"
                    onClick={() => openDropdown('make')}
                  >
                    {bookingForm.make && (() => {
                      const logoPath = getMakeLogo(bookingForm.make.toLowerCase());
                      return logoPath ? (
                        <img 
                          src={logoPath} 
                          alt={bookingForm.make}
                          className={`${getLogoSizeClass(bookingForm.make)} object-contain`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })()}
                    <span className="flex-1">{bookingForm.make || 'Selectează marca'}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Make Dropdown */}
                  <AnimatePresence>
                    {showMakeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          {uniqueMakes.map((make, index) => {
                            const logoPath = getMakeLogo(make.toLowerCase());
                            const isFirst = index === 0;
                            const isLast = index === uniqueMakes.length - 1;
                            return (
                              <div
                                key={make}
                                className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-2 ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${bookingForm.make === make ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => {
                                  handleFilterChange('make', make);
                                  closeAllDropdowns();
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

              {/* Model */}
              <div className="w-full dropdown-container overflow-visible">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Model
                </label>
                <div className="relative overflow-visible">
                  <div
                    className={`w-full text-sm font-medium text-gray-900 bg-transparent border border-gray-200 rounded-xl py-3 px-4 cursor-pointer flex items-center gap-2 ${!bookingForm.make ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => bookingForm.make && openDropdown('model')}
                  >
                    <span className="flex-1">{!bookingForm.make ? 'Selectează marca' : (bookingForm.model || 'Selectează modelul')}</span>
                    <svg className={`w-4 h-4 text-gray-400 ${!bookingForm.make ? 'opacity-30' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Model Dropdown */}
                  <AnimatePresence>
                    {showModelDropdown && bookingForm.make && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          {availableModels.length > 0 ? (
                            availableModels.map((model, index) => {
                              const isFirst = index === 0;
                              const isLast = index === availableModels.length - 1;
                              return (
                                <div
                                  key={model}
                                  className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${bookingForm.model === model ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                  onClick={() => {
                                    handleFilterChange('model', model);
                                    closeAllDropdowns();
                                  }}
                                >
                                  {model}
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              Nu sunt modele disponibile
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Location */}
              <div className="w-full">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  {t("hero.location")}
                </label>
                <div className="relative">
                  <div
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700 transition-colors border border-gray-200 rounded-xl py-3 px-4"
                    onClick={() => openDropdown('location')}
                  >
                    {bookingForm.location || t("hero.searchLocation")}
                  </div>

                  {/* Location Dropdown */}
                  <AnimatePresence>
                    {showLocationDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors rounded-t-2xl"
                            onClick={() => {
                              handleFilterChange('location', 'Chisinau Airport');
                              closeAllDropdowns();
                            }}
                          >
                            Chisinau Airport
                          </div>
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors rounded-b-2xl"
                            onClick={() => {
                              handleFilterChange('location', 'Chisinau');
                              closeAllDropdowns();
                            }}
                          >
                            Chisinau
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Date Range */}
              <div className="w-full hidden">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Perioadă
                </label>
                <div className="relative">
                  <div
                    className="text-sm font-medium text-gray-900 cursor-pointer hover:text-gray-700 transition-colors border border-gray-200 rounded-xl py-3 px-4"
                    onClick={() => openDropdown('date')}
                  >
                    {formatDateRange(bookingForm.dateRange) || 'Selectează perioada'}
                  </div>

                  {/* Calendar Dropdown */}
                  <AnimatePresence>
                    {showDateCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 p-3 min-w-[280px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Instruction Message */}
                        <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs text-gray-600">
                            {!bookingForm.dateRange.startDate 
                              ? 'Selectează data de început' 
                              : !bookingForm.dateRange.endDate 
                              ? 'Selectează data de sfârșit'
                              : 'Clic pentru a schimba perioada'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              const currentDate = bookingForm.dateRange.startDate || todayDate;
                              const newDate = new Date(currentDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setBookingForm(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, startDate: newDate.toISOString().split('T')[0] }
                              }));
                            }}
                            className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(bookingForm.dateRange.startDate || todayDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <button
                            onClick={() => {
                              const currentDate = bookingForm.dateRange.startDate || todayDate;
                              const newDate = new Date(currentDate);
                              newDate.setMonth(newDate.getMonth() + 1);
                              setBookingForm(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, startDate: newDate.toISOString().split('T')[0] }
                              }));
                            }}
                            className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {generateCalendarDays(new Date(bookingForm.dateRange.startDate || todayDate)).map((day, index) => {
                            if (!day) return <div key={index}></div>;
                            
                            const dayDate = new Date(day);
                            const dayString = day;
                            const isStartDate = bookingForm.dateRange.startDate && isSameDay(dayDate, new Date(bookingForm.dateRange.startDate));
                            const isEndDate = bookingForm.dateRange.endDate && isSameDay(dayDate, new Date(bookingForm.dateRange.endDate));
                            const isInRange = bookingForm.dateRange.startDate && bookingForm.dateRange.endDate && 
                                              dayString >= bookingForm.dateRange.startDate && 
                                              dayString <= bookingForm.dateRange.endDate;
                            const isSelected = isStartDate || isEndDate;

                            return (
                              <div
                                key={index}
                                className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded-xl transition-colors ${day ? 'text-gray-700' : 'text-gray-300'
                                  } ${isSelected
                                    ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                    : isInRange
                                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                      : 'hover:bg-gray-100'
                                  }`}
                                onClick={() => {
                                  handleDateSelect(day);
                                }}
                              >
                                {new Date(day).getDate()}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Search Button - Full width on mobile */}
              <div className="w-full">
                <Button
                  onClick={handleSearch}
                  className="w-full bg-theme-500 hover:bg-theme-600 text-white py-5 px-8 rounded-2xl text-base font-semibold flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4 stroke-2" />
                  {t("hero.search")}
                </Button>
              </div>
            </div>

            {/* Desktop Layout - Horizontal flex */}
            <div className="hidden md:flex">
              {/* Make */}
              <div className="flex-1 px-6 py-5 dropdown-container overflow-visible">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Marca
                </label>
                <div className="relative overflow-visible">
                  <div
                    className="w-full text-sm text-gray-500 bg-transparent border-none outline-none cursor-pointer hover:text-gray-700 transition-colors pr-8 flex items-center gap-2"
                    onClick={() => openDropdown('make')}
                  >
                    {bookingForm.make && (() => {
                      const logoPath = getMakeLogo(bookingForm.make.toLowerCase());
                      return logoPath ? (
                        <img 
                          src={logoPath} 
                          alt={bookingForm.make}
                          className={`${getLogoSizeClass(bookingForm.make)} object-contain`}
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : null;
                    })()}
                    <span className="flex-1">{bookingForm.make || 'Selectează marca'}</span>
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Make Dropdown */}
                  <AnimatePresence>
                    {showMakeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          {uniqueMakes.map((make, index) => {
                            const logoPath = getMakeLogo(make.toLowerCase());
                            const isFirst = index === 0;
                            const isLast = index === uniqueMakes.length - 1;
                            return (
                              <div
                                key={make}
                                className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-2 ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${bookingForm.make === make ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                onClick={() => {
                                  handleFilterChange('make', make);
                                  closeAllDropdowns();
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

              {/* Separator */}
              <div className="w-px bg-gray-200 my-4"></div>

              {/* Model */}
              <div className="flex-1 px-6 py-5 dropdown-container overflow-visible">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Model
                </label>
                <div className="relative overflow-visible">
                  <div
                    className={`w-full text-sm text-gray-500 bg-transparent border-none outline-none cursor-pointer hover:text-gray-700 transition-colors pr-8 flex items-center gap-2 ${!bookingForm.make ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={() => bookingForm.make && openDropdown('model')}
                  >
                    <span className="flex-1">{!bookingForm.make ? 'Selectează marca' : (bookingForm.model || 'Selectează modelul')}</span>
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className={`w-4 h-4 ${!bookingForm.make ? 'opacity-30' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Model Dropdown */}
                  <AnimatePresence>
                    {showModelDropdown && bookingForm.make && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          {availableModels.length > 0 ? (
                            availableModels.map((model, index) => {
                              const isFirst = index === 0;
                              const isLast = index === availableModels.length - 1;
                              return (
                                <div
                                  key={model}
                                  className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${bookingForm.model === model ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                                  onClick={() => {
                                    handleFilterChange('model', model);
                                    closeAllDropdowns();
                                  }}
                                >
                                  {model}
                                </div>
                              );
                            })
                          ) : (
                            <div className="px-4 py-2 text-sm text-gray-500">
                              Nu sunt modele disponibile
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px bg-gray-200 my-4"></div>

              {/* Location */}
              <div className="flex-1 px-6 py-5 dropdown-container overflow-visible">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Locație
                </label>
                <div className="relative">
                  <div
                    className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors pr-8"
                    onClick={() => openDropdown('location')}
                  >
                    {bookingForm.location || t("hero.searchLocation")}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>

                  {/* Location Dropdown */}
                  <AnimatePresence>
                    {showLocationDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="py-1">
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors rounded-t-2xl"
                            onClick={() => {
                              handleFilterChange('location', 'Chisinau Airport');
                              closeAllDropdowns();
                            }}
                          >
                            Chisinau Airport
                          </div>
                          <div
                            className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors rounded-b-2xl"
                            onClick={() => {
                              handleFilterChange('location', 'Chisinau');
                              closeAllDropdowns();
                            }}
                          >
                            Chisinau
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px bg-gray-200 my-4"></div>

              {/* Date Range - Hidden */}
              {/* <div className="flex-1 px-6 py-5 dropdown-container overflow-visible hidden">
                <label className="block text-xs font-semibold text-gray-700 uppercase mb-2 tracking-wide">
                  Perioadă
                </label>
                <div className="relative">
                  <div
                    className="text-sm text-gray-500 cursor-pointer hover:text-gray-700 transition-colors pr-8"
                    onClick={() => openDropdown('date')}
                  >
                    {formatDateRange(bookingForm.dateRange) || 'Selectează perioada'}
                  </div>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div> */}

                  {/* Calendar Dropdown */}
                  {/* <AnimatePresence>
                    {showDateCalendar && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-50 p-3 min-w-[280px]"
                        onClick={(e) => e.stopPropagation()}
                      > */}
                        {/* Instruction Message */}
                        {/* <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                          <p className="text-xs text-gray-600">
                            {!bookingForm.dateRange.startDate 
                              ? 'Selectează data de început' 
                              : !bookingForm.dateRange.endDate 
                              ? 'Selectează data de sfârșit'
                              : 'Clic pentru a schimba perioada'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mb-3">
                          <button
                            onClick={() => {
                              const currentDate = bookingForm.dateRange.startDate || todayDate;
                              const newDate = new Date(currentDate);
                              newDate.setMonth(newDate.getMonth() - 1);
                              setBookingForm(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, startDate: newDate.toISOString().split('T')[0] }
                              }));
                            }}
                            className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(bookingForm.dateRange.startDate || todayDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                          </div>
                          <button
                            onClick={() => {
                              const currentDate = bookingForm.dateRange.startDate || todayDate;
                              const newDate = new Date(currentDate);
                              newDate.setMonth(newDate.getMonth() + 1);
                              setBookingForm(prev => ({
                                ...prev,
                                dateRange: { ...prev.dateRange, startDate: newDate.toISOString().split('T')[0] }
                              }));
                            }}
                            className="p-1 hover:bg-gray-100 rounded-xl transition-colors"
                          >
                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                          ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                          {generateCalendarDays(new Date(bookingForm.dateRange.startDate || todayDate)).map((day, index) => {
                            if (!day) return <div key={index}></div>;
                            
                            const dayDate = new Date(day);
                            const dayString = day;
                            const isStartDate = bookingForm.dateRange.startDate && isSameDay(dayDate, new Date(bookingForm.dateRange.startDate));
                            const isEndDate = bookingForm.dateRange.endDate && isSameDay(dayDate, new Date(bookingForm.dateRange.endDate));
                            const isInRange = bookingForm.dateRange.startDate && bookingForm.dateRange.endDate && 
                                              dayString >= bookingForm.dateRange.startDate && 
                                              dayString <= bookingForm.dateRange.endDate;
                            const isSelected = isStartDate || isEndDate;

                            return (
                              <div
                                key={index}
                                className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded-xl transition-colors ${day ? 'text-gray-700' : 'text-gray-300'
                                  } ${isSelected
                                    ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                    : isInRange
                                      ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                      : 'hover:bg-gray-100'
                                  }`}
                                onClick={() => {
                                  handleDateSelect(day);
                                }}
                              >
                                {new Date(day).getDate()}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence> */}
                {/* </div>
              </div> */}

              {/* Separator - Hidden */}
              {/* <div className="w-px bg-gray-200 my-4 hidden"></div> */}

              {/* Search Button */}
              <div className="flex-1 px-6 py-5 flex items-center">
                <Button
                  onClick={handleSearch}
                  className="w-full h-full bg-theme-500 hover:bg-theme-600 text-white py-3 px-6 rounded-2xl font-medium flex items-center justify-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 stroke-2" />
                  {t("hero.search")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  // Helper functions
  function formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  }

  function formatDateRange(dateRange: { startDate: string; endDate: string }): string {
    if (!dateRange.startDate && !dateRange.endDate) return '';
    if (!dateRange.endDate) return formatDate(dateRange.startDate);
    if (!dateRange.startDate) return formatDate(dateRange.endDate);
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  }

  function generateCalendarDays(date: Date): (string | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days: (string | null)[] = [];
    const currentDate = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      if (currentDate.getMonth() === month) {
        days.push(currentDate.toISOString().split('T')[0]);
      } else {
        days.push(null);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  }

  function isSameDay(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  }
};