import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X } from 'lucide-react';
import { useInView } from '../../hooks/useInView';
import { staggerContainer } from '../../utils/animations';
import { CarCard } from '../../components/car/CarCard';
import { fetchCars, fetchFilteredCars, CarFilters, fetchCarsMake, fetchCarsModels, fetchFilteredCarsWithPhotos, fetchCarsWithPhotos } from '../../lib/db/cars/cars-page/cars';
import { Car as CarType } from '../../types';

import { RentalOptionsSection } from './sections/RentalOptionsSection'
import { ContractSection } from './sections/ContractSection';
import { FUEL_TYPE_MAP, FuelTypeUI } from '../../constants';

// Display Car type for CarCard component
interface DisplayCar extends CarType {
  name: string;
  image: string;
  pricePerDay: number;
  photoGallery?: string[];
  fuelType?: string;
  availability?: string;
}

interface SidebarFilters {
  transmission: 'Any' | 'Automatic' | 'Manual';
  fuelType: FuelTypeUI;
  make?: string;
  model?: string;
  priceRange: [number, number];
  yearRange: [number, number];
  seats?: number;
  status?: string;
}

export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [cars, setCars] = useState<CarType[]>([]);
  const [loading, setLoading] = useState(true);
  const [makes, setMakes] = useState<string[]>([]);
  const [models, setModels] = useState<string[]>([]);

  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'year-new' | 'year-old'>('price-low');

  const NUMBER_OF_CARS = 4; // or whatever number you want

  async function handleFetchCarsWithPhotos() {
    setLoading(true);
    try {
      const fetchedCars = await fetchCarsWithPhotos(NUMBER_OF_CARS);
      setCars(fetchedCars);
      console.log('Fetched cars with photos:', fetchedCars);
    } catch (error) {
      console.error('Error fetching cars with photos:', error);
    } finally {
      setLoading(false);
    }
  }


  async function handleFetchCarsModel(make: string) {
    // setLoading(true);
    try {
      const fetchedMakeModels = await fetchCarsModels(make);
      console.log('fetched models are: ', fetchedMakeModels)
      setModels(fetchedMakeModels)
    } catch (error) {
      console.error('Error fetching make models:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchCars() {
    setLoading(true);
    try {
      const fetchedCars = await fetchCars();
      setCars(fetchedCars);
    } catch (error) {
      console.error('Error fetching cars:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFetchCarsMake() {
    try {
      const fetchedCarsMake = await fetchCarsMake();
      setMakes(fetchedCarsMake);
    } catch (error) {
      console.error('Error fetching cars make:', error);
    }
  }

  async function handleFetchFilteredCars(basicFilters: typeof filters) {
    setLoading(true);
    // console.log('fetching the cars after filters: ', filters)
    console.log('fetching the cars WITH THIS applied filters: ', basicFilters)
    console.log('fetching the cars WITH THIS sidebar filters: ', sidebarFilters)
    try {
      // Build filter object from applied filters and sidebar filters
      const filters: CarFilters = {
        make: basicFilters.make || undefined,
        model: basicFilters.model || undefined,
        minPrice: sidebarFilters.priceRange[0],
        maxPrice: sidebarFilters.priceRange[1],
        minYear: sidebarFilters.yearRange[0],
        maxYear: sidebarFilters.yearRange[1],
        fuelType: sidebarFilters.fuelType !== 'Any'
          ? FUEL_TYPE_MAP[sidebarFilters.fuelType as keyof typeof FUEL_TYPE_MAP]
          : undefined,
        transmission: sidebarFilters.transmission !== 'Any' ? sidebarFilters.transmission as 'Automatic' | 'Manual' : undefined,
        seats: sidebarFilters.seats !== undefined ? sidebarFilters.seats : undefined,
      };

      console.log('the last filters are: ', filters)

      const fetchedCars = await fetchFilteredCarsWithPhotos(filters);
      setCars(fetchedCars);
    } catch (error) {
      console.error('Error fetching filtered cars:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    handleFetchCarsWithPhotos();
    // handleFetchCars();
    handleFetchCarsMake();
  }, []);

  // Filter state
  const [filters, setFilters] = useState({
    make: '',
    model: ''
  });

  // Applied filters state (what's actually used for filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    make: '',
    model: ''
  });

  // Dropdown states
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowMakeDropdown(false);
    setShowModelDropdown(false);
  };

  useEffect(() => {
    console.log('SidebarFilters are: ', sidebarFilters)
  }, [showAdvancedFilters])

  // Handle opening a specific dropdown and closing others
  const openDropdown = (dropdownType: 'make' | 'model') => {
    if ((dropdownType === 'make' && showMakeDropdown) ||
      (dropdownType === 'model' && showModelDropdown)) {
      closeAllDropdowns();
      return;
    }

    closeAllDropdowns();
    if (dropdownType === 'make') {
      setShowMakeDropdown(true);
    } else if (dropdownType === 'model') {
      setShowModelDropdown(true);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    if (showMakeDropdown || showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMakeDropdown, showModelDropdown]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (showAdvancedFilters) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showAdvancedFilters]);


  const defaultSidebarFilters: SidebarFilters = {
    priceRange: [0, 10000],
    yearRange: [new Date().getFullYear() - 10, new Date().getFullYear()],
    transmission: 'Any',
    fuelType: 'Any',
    seats: undefined,
  };

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState<SidebarFilters>(defaultSidebarFilters);

  const [applyError, setApplyError] = useState('');

  // Read URL parameters on mount and apply them
  useEffect(() => {
    const makeParam = searchParams.get('make');
    const modelParam = searchParams.get('model');

    if (makeParam || modelParam) {
      const initialFilters = {
        make: makeParam || '',
        model: modelParam || ''
      };
      setFilters(initialFilters);
      setAppliedFilters(initialFilters);
    }
  }, [searchParams]);

  // Validation states (kept for potential future use)
  // const [validationErrors, setValidationErrors] = useState({
  //   yearRange: false,
  //   priceRange: false,
  //   kilometersRange: false,
  // });

  // Get unique makes from fetched makes array
  const uniqueMakes = useMemo(() => {
    return makes.map(make => {
      const parts = make.split(' ');
      const firstPart = parts[0];
      // Handle hyphenated makes like "Mercedes-AMG" -> extract "Mercedes"
      return firstPart.includes('-') ? firstPart.split('-')[0] : firstPart;
    }).filter((value, index, self) => self.indexOf(value) === index);
  }, [makes]);

  // Get car make logo path
  const getMakeLogo = (make: string): string | null => {
    const makeLower = make.toLowerCase();
    const logoMap: { [key: string]: string } = {
      'mercedes': '/LevelAutoRental/logos/merc.svg',
      'mercedes-benz': '/LevelAutoRental/logos/merc.svg',
      'bmw': '/LevelAutoRental/logos/bmw.webp',
      'audi': '/LevelAutoRental/logos/audi.png',
      'hyundai': '/LevelAutoRental/logos/hyundai.png',
      'maserati': '/LevelAutoRental/logos/maserati.png',
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

  const handleFilterChange = (key: string, value: string) => {
    console.log('settings the filter: key = ', key, ' ; value = ', value)
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };

      // If make is being changed, reset model if it's not valid for the new make
      if (key === 'make') {
        const newMake = value;

        // Load models from DB when make changes
        if (newMake) {
          handleFetchCarsModel(newMake);
        } else {
          setModels([]);
        }

        // Reset model if invalid for new make
        if (prev.model) {
          newFilters.model = '';
        }
      }
      console.log('the new filters: ', newFilters)
      return newFilters;
    });
    setApplyError('');
  };

  const resetFilters = () => {
    setFilters({
      make: '',
      model: ''
    });
    setAppliedFilters({
      make: '',
      model: ''
    });
    setSidebarFilters(defaultSidebarFilters);
    // Clear URL params
    navigate('/cars', { replace: true });

    handleFetchCarsWithPhotos()
  };

  const handleSidebarFilterChange = (key: string, value: any) => {
    console.log('changing the sidebar filters: key = ', key, ' ; value = ', value)
    if (value === 'Any')
      value = undefined
    setSidebarFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = (liveFilters: typeof filters) => {
    console.log('making a request to get the cars from the filters')
    console.log('applying the filters: ', liveFilters)

    console.log('sidebarFilters: ', sidebarFilters)

    // Validate that at least one filter is set
    const hasFilters =
      liveFilters.make ||
      liveFilters.model;

    if (!hasFilters) {
      setApplyError('Vă rugăm să selectați cel puțin un filtru pentru căutare.');
      setTimeout(() => setApplyError(''), 3000);
      return;
    }

    setApplyError('');
    setAppliedFilters({
      make: liveFilters.make,
      model: liveFilters.model,
    });

    closeAllDropdowns();

    // Update URL with search parameters
    const params = new URLSearchParams();

    if (liveFilters.make) {
      params.set('make', liveFilters.make);
    }
    if (liveFilters.model) {
      params.set('model', liveFilters.model);
    }

    const queryString = params.toString();
    navigate(`/cars${queryString ? `?${queryString}` : ''}`, { replace: true });

    // Trigger filtered fetch
    // console.log('should fetch cars after the filters')
    handleFetchFilteredCars(liveFilters);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Top Filter Section - Full Width */}
        <div className="mt-8 mb-10 relative">
          <div
            className="rounded-3xl overflow-visible min-h-[620px] md:min-h-[350px] flex flex-col justify-end relative"
          >
            {/* Background Image Container - Clipped */}
            <div
              className="absolute inset-0 rounded-3xl overflow-hidden bg-cover bg-center md:bg-[center_-400px] z-0"
              style={{ backgroundImage: 'url(/LevelAutoRental/backgrounds/bg10-mobile.jpeg)' }}
            >
              {/* Black Overlay */}
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
            </div>

            {/* Advanced Filters Button - Top Corner (Desktop) */}
            <button
              onClick={() => setShowAdvancedFilters(true)}
              className={`hidden md:flex absolute top-6 right-6 w-14 h-14 rounded-2xl items-center justify-center transition-all transform hover:scale-105 z-20 ${showAdvancedFilters ? 'bg-theme-500 text-white hover:bg-theme-600 shadow-lg' : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border border-white/20'}`}
            >
              <Filter className="w-5 h-5 stroke-2" />
            </button>

            {/* Hero Text */}
            <div className="absolute top-6 left-4 right-4 md:top-12 md:left-12 md:right-auto z-10 max-w-[calc(100%-2rem)] md:max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-4"
              >
                Închiriază Mașina Ta Ideală
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-sm md:text-base lg:text-lg text-white/90 font-medium leading-relaxed"
              >
                Flotă variată de vehicule premium • Servicii complete cu sau fără șofer • Asistență permanentă și prețuri clare
              </motion.p>
            </div>

            <div className="flex flex-col gap-4 p-6 md:p-8 relative z-10">
              {/* Mobile Error Notification - Fixed at top */}
              <AnimatePresence>
                {applyError && (
                  <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="fixed top-24 left-4 right-4 z-[10000] md:hidden bg-white border-l-4 border-theme-500 text-gray-900 px-4 py-3 rounded-xl text-sm font-medium shadow-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-theme-500 flex items-center justify-center mt-0.5">
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <p className="flex-1 text-gray-900">{applyError}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message and Reset Button - Same Row (Desktop) */}
              <div className="hidden md:flex items-center justify-between gap-4">
                {/* Error Message Container - Always present to prevent layout shift */}
                <div className="flex-1 min-w-0">
                  <AnimatePresence>
                    {applyError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="bg-red-500/10 backdrop-blur-sm border border-red-400/30 text-red-100 px-4 py-3 rounded-xl text-sm font-medium"
                      >
                        {applyError}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Reset Button - Always visible */}
                <button
                  onClick={resetFilters}
                  className="text-sm md:text-base text-white/80 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap flex-shrink-0"
                >
                  <X className="w-3 h-3 md:w-4 md:h-4" />
                  Clear all filters
                </button>
              </div>

              {/* Filter and Reset Buttons - Mobile */}
              <div className="flex md:hidden items-center justify-between gap-2.5 mb-2">
                {/* Reset Button - Mobile */}
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <X className="w-4 h-4" />
                  Clear all filters
                </button>

                {/* Advanced Filters Button - Mobile */}
                <button
                  onClick={() => setShowAdvancedFilters(true)}
                  className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${showAdvancedFilters ? 'bg-theme-500 text-white hover:bg-theme-600 shadow-lg' : 'backdrop-blur-md bg-white/20 hover:bg-white/30 border border-white/30 text-white'}`}
                >
                  <Filter className="w-5 h-5 stroke-2" />
                </button>
              </div>

              {/* Filter Card - Glassmorphism Style */}
              <div className="backdrop-blur-md bg-white/20 border border-white/30 rounded-3xl overflow-visible shadow-lg">
                <div className="flex flex-col lg:flex-row gap-0 items-stretch">
                  {/* Car Brand */}
                  <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible">
                    <label className={`text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${filters.make ? 'text-white' : 'text-white/80'}`}>
                      Marca
                    </label>
                    <div className="relative overflow-visible">
                      <div
                        className={`text-base font-medium cursor-pointer transition-colors pr-8 flex items-center gap-2 ${filters.make ? 'text-white' : 'text-white/70'}`}
                        onClick={() => openDropdown('make')}
                      >
                        {filters.make && (() => {
                          const logoPath = getMakeLogo(filters.make.toLowerCase());
                          return logoPath ? (
                            <img
                              src={logoPath}
                              alt={filters.make}
                              className={`${getLogoSizeClass(filters.make)} object-contain brightness-0 invert`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          ) : null;
                        })()}
                        <span>{filters.make || 'Selectează marca'}</span>
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors flex items-center gap-2 ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${filters.make === make ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
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

                  {/* Car Model */}
                  <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible">
                    <label className={`text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${filters.model ? 'text-white' : 'text-white/80'}`}>
                      Model
                    </label>
                    <div className="relative overflow-visible">
                      <div
                        className={`text-base font-medium transition-colors pr-8 ${!filters.make ? 'text-white/50 cursor-not-allowed' : filters.model ? 'text-white cursor-pointer' : 'text-white/70 cursor-pointer'}`}
                        onClick={() => filters.make && models && openDropdown('model')}
                      >
                        {!filters.make ? 'Selectează marca' : (filters.model || 'Selectează modelul')}
                      </div>
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className={`w-4 h-4 ${!filters.make ? 'text-white/30' : 'text-white/60'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>

                      {/* Model Dropdown */}
                      <AnimatePresence>
                        {showModelDropdown && filters.make && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-[100] min-w-[200px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="py-1">
                              {models.length > 0 ? (
                                models.map((model, index) => {
                                  const isFirst = index === 0;
                                  const isLast = index === models.length - 1;
                                  return (
                                    <div
                                      key={model}
                                      className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${isFirst ? 'rounded-t-2xl' : ''} ${isLast ? 'rounded-b-2xl' : ''} ${filters.model === model ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
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

                  {/* Search Button */}
                  <div className="px-4 py-3 md:px-6 md:py-5 flex-[1.5] lg:flex-[1]">
                    <button
                      onClick={() => applyFilters(filters)}
                      className="w-full py-3.5 md:py-4 lg:py-3.5 bg-gradient-to-r from-theme-500 to-theme-600 hover:from-theme-600 hover:to-theme-700 text-white font-bold px-6 md:px-8 rounded-2xl text-sm md:text-base flex items-center justify-center gap-2.5 transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                    >
                      <Search className="w-4 h-4 md:w-5 md:h-5 stroke-[2.5]" />
                      Caută
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Keys Image Overlay - Outside rounded container */}
          <img
            src="/LevelAutoRental/assets/Design Elements/keys.png"
            alt=""
            className="absolute hidden lg:block lg:bottom-[100px] lg:right-[250px] bottom-[400px] right-[0px]  lg:w-[300px] w-[200px] h-auto object-contain z-[10] pointer-events-none"
          />
        </div>

        {/* Advanced Filters Drawer */}
        <AnimatePresence>
          {showAdvancedFilters && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/50 z-[9998]"
                onClick={() => setShowAdvancedFilters(false)}
              />
              {/* Drawer */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="text-lg font-semibold text-gray-900">Filtre</h3>
                    <button
                      onClick={() => setShowAdvancedFilters(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>

                  {/* Clear All Button */}
                  <div className="mb-8">
                    <button
                      onClick={() => {
                        resetFilters();
                        setShowAdvancedFilters(false);
                      }}
                      className="text-lg font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Price Range</label>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm gap-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900"
                            value={sidebarFilters.priceRange[0]}
                            onChange={(e) =>
                              setSidebarFilters({
                                ...sidebarFilters,
                                priceRange: [Number(e.target.value), sidebarFilters.priceRange[1]],
                              })
                            }
                          />

                          <span className="text-gray-400">—</span>

                          <input
                            type="number"
                            className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900"
                            value={sidebarFilters.priceRange[1]}
                            onChange={(e) =>
                              setSidebarFilters({
                                ...sidebarFilters,
                                priceRange: [sidebarFilters.priceRange[0], Number(e.target.value)],
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Year Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Year</label>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm gap-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900"
                            value={sidebarFilters.yearRange[0]}
                            onChange={(e) =>
                              setSidebarFilters({
                                ...sidebarFilters,
                                yearRange: [Number(e.target.value), sidebarFilters.yearRange[1]],
                              })
                            }
                          />

                          <span className="text-gray-400">—</span>

                          <input
                            type="number"
                            className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900"
                            value={sidebarFilters.yearRange[1]}
                            onChange={(e) =>
                              setSidebarFilters({
                                ...sidebarFilters,
                                yearRange: [sidebarFilters.yearRange[0], Number(e.target.value)],
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Transmission</label>
                      <div className="flex flex-wrap gap-2">
                        {['Any', 'Manual', 'Automatic'].map((type) => {
                          const value = type === 'Any' ? undefined : type; // store undefined for "Any"
                          const isActive = sidebarFilters.transmission === value || value === undefined && sidebarFilters.transmission === 'Any';

                          return (
                            <button
                              key={type}
                              onClick={() => handleSidebarFilterChange('transmission', value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-theme-500 text-white hover:bg-theme-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Fuel Type</label>
                      <div className="flex flex-wrap gap-2">
                        {(['Any', ...Object.keys(FUEL_TYPE_MAP)] as FuelTypeUI[]).map((type) => {
                          const value = type === 'Any' ? undefined : type; // lowercase to match your filters
                          const isActive = sidebarFilters.fuelType === value || value === undefined && sidebarFilters.fuelType === 'Any';

                          return (
                            <button
                              key={type}
                              onClick={() => handleSidebarFilterChange('fuelType', value)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-theme-500 text-white hover:bg-theme-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                              {type}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Seats */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Seats</label>

                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm gap-2">
                          <input
                            type="number"
                            className="w-20 px-2 py-1 rounded-md border border-gray-300 text-gray-900"
                            value={sidebarFilters.seats}
                            onChange={(e) =>
                              setSidebarFilters({
                                ...sidebarFilters,
                                seats: parseInt((e.target.value)),
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Layout */}
        <div className="w-full mt-8">
          {/* Loading State */}
          {loading ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 border-4 border-theme-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-600">Se încarcă mașinile...</p>
            </div>
          ) : (
            <>
              {/* Cars Grid */}
              {cars.length > 0 ? (
                <motion.div
                  ref={ref}
                  variants={staggerContainer}
                  initial="initial"
                  animate={isInView ? "animate" : "initial"}
                  className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
                >
                  {cars.map((car, index) => (
                    <CarCard key={car.id} car={car} index={index} />
                  ))}
                </motion.div>
              ) : (
                // Check if any filters are applied
                (appliedFilters.make || appliedFilters.model ||
                  Object.values(sidebarFilters).some(value => {
                    if (Array.isArray(value)) {
                      return value[0] !== (value[1] === 2025 ? 2020 : 0) || value[1] !== 2025;
                    }
                    return value !== 'Any';
                  })) ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-16 px-4"
                  >
                    <div className="max-w-md mx-auto">
                      <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                        <Search className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">
                        Nu s-au găsit mașini
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Nu am găsit mașini care să corespundă criteriilor dvs. de filtrare. Vă rugăm să încercați să modificați filtrele.
                      </p>
                      <button
                        onClick={resetFilters}
                        className="px-6 py-3 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-xl transition-colors"
                      >
                        Resetează filtrele
                      </button>
                    </div>
                  </motion.div>
                ) : null
              )}
            </>
          )}

          {/* Rental Options Section */}
          <RentalOptionsSection />

          {/* Contract Section */}
          <ContractSection />

        </div>
      </div>
    </div>
  );
};
