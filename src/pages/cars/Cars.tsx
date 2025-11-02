import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Search, Filter, X, Car, Gauge, Zap, UserRound, Star, Shield, Baby, Wifi, Wrench } from 'lucide-react';
import { cars } from '../../data/cars';
import { useInView } from '../../hooks/useInView';
import { staggerContainer } from '../../utils/animations';
import { CarCard } from './CarCard';

export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const InfoIconPath = (
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
      clipRule="evenodd"
    />
  );


  // Filter state
  const [filters, setFilters] = useState({
    make: '',
    model: '',
    location: '',
    dateRange: { startDate: '', endDate: '' }
  });

  // Applied filters state (what's actually used for filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    make: '',
    model: '',
    location: '',
    dateRange: { startDate: '', endDate: '' }
  });

  // Dropdown states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDateCalendar, setShowDateCalendar] = useState(false);
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.dropdown-container')) {
        closeAllDropdowns();
      }
    };

    if (showLocationDropdown || showDateCalendar || showMakeDropdown || showModelDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown, showDateCalendar, showMakeDropdown, showModelDropdown]);

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

  // Helper functions
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const formatDateRange = (dateRange: { startDate: string; endDate: string }): string => {
    if (!dateRange.startDate && !dateRange.endDate) return '';
    if (!dateRange.endDate) return formatDate(dateRange.startDate);
    if (!dateRange.startDate) return formatDate(dateRange.endDate);
    return `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`;
  };

  const generateCalendarDays = (date: Date): (string | null)[] => {
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
  };

  const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate();
  };

  // Initialize date range
  const todayDate = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowDateString = tomorrowDate.toISOString().split('T')[0];

  // Get min/max values for sliders
  const priceRange = useMemo(() => {
    const prices = cars.map(car => car.pricePerDay);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, []);

  const yearRangeData = useMemo(() => {
    const years = cars.map(car => car.year);
    return { min: Math.min(...years), max: Math.max(...years) };
  }, []);

  // Sidebar filter state
  const [sidebarFilters, setSidebarFilters] = useState({
    rentalType: 'Any', // Per Day, Per Hour, Any
    priceRange: [0, 1000] as [number, number], // Will be updated in useEffect
    yearRange: [2010, 2025] as [number, number], // Will be updated in useEffect
    transmission: 'Any', // Any, Manual, Automatic
    fuelType: 'Any', // Any, Petrol, Diesel, Electric, Hybrid, etc.
    seats: 'Any', // Any, 2, 4, 5, 7
    vehicleCondition: 'All', // All, Brand New, Used
    availability: 'Any' // Any, Available, Not Available
  });

  // Update sidebar filters when priceRange and yearRangeData are available
  useEffect(() => {
    if (priceRange.min && priceRange.max && yearRangeData.min && yearRangeData.max) {
      setSidebarFilters(prev => ({
        ...prev,
        priceRange: prev.priceRange[0] === 0 && prev.priceRange[1] === 1000 
          ? [priceRange.min, priceRange.max] 
          : prev.priceRange,
        yearRange: prev.yearRange[0] === 2010 && prev.yearRange[1] === 2025
          ? [yearRangeData.min, yearRangeData.max]
          : prev.yearRange
      }));
    }
  }, [priceRange.min, priceRange.max, yearRangeData.min, yearRangeData.max]);

  const [sortBy, setSortBy] = useState('default');
  const [showAllParams, setShowAllParams] = useState(false);
  const [applyError, setApplyError] = useState('');

  // Read URL parameters on mount and apply them
  useEffect(() => {
    const makeParam = searchParams.get('make');
    const modelParam = searchParams.get('model');
    const locationParam = searchParams.get('location');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    if (makeParam || modelParam || locationParam || startDateParam || endDateParam) {
      const initialFilters = {
        make: makeParam || '',
        model: modelParam || '',
        location: locationParam || '',
        dateRange: {
          startDate: startDateParam || '',
          endDate: endDateParam || ''
        }
      };
      setFilters(initialFilters);
      setAppliedFilters(initialFilters);
    }
  }, [searchParams]);

  // Validation states
  const [validationErrors, setValidationErrors] = useState({
    yearRange: false,
    priceRange: false,
    kilometersRange: false,
  });

  // Get unique makes from cars data
  const uniqueMakes = useMemo(() => {
    const makes = cars.map(car => {
      const parts = car.name.split(' ');
      const firstPart = parts[0];
      // Handle hyphenated makes like "Mercedes-AMG" -> extract "Mercedes"
      return firstPart.includes('-') ? firstPart.split('-')[0] : firstPart;
    });
    return [...new Set(makes)];
  }, []);

  // Map makes to their available models
  const makeToModels = useMemo(() => {
    const mapping: Record<string, string[]> = {};
    cars.forEach(car => {
      const parts = car.name.split(' ');
      const firstPart = parts[0];
      // Handle hyphenated makes like "Mercedes-AMG" -> extract "Mercedes"
      const make = firstPart.includes('-') ? firstPart.split('-')[0] : firstPart;
      const model = parts.slice(1).join(' '); // Rest is the model
      
      if (!mapping[make]) {
        mapping[make] = [];
      }
      if (model && !mapping[make].includes(model)) {
        mapping[make].push(model);
      }
    });
    return mapping;
  }, []);

  // Get available models for selected make
  const availableModels = useMemo(() => {
    if (!filters.make) return [];
    return makeToModels[filters.make] || [];
  }, [filters.make, makeToModels]);

  // Filter and sort cars
  const filteredCars = useMemo(() => {
    let filtered = cars.filter((car) => {
      // Extract make: split on '-' first for cases like "Mercedes-AMG" -> "Mercedes"
      const firstPart = car.name.split(' ')[0];
      const carMake = firstPart.includes('-') ? firstPart.split('-')[0].toLowerCase() : firstPart.toLowerCase();
      const carModel = car.name.split(' ').slice(1).join(' ').toLowerCase();

      // Make filter
      if (appliedFilters.make && carMake !== appliedFilters.make.toLowerCase()) {
        return false;
      }

      // Model filter
      if (appliedFilters.model && !carModel.includes(appliedFilters.model.toLowerCase())) {
        return false;
      }

      // Sidebar filters
      // Price range filter
      if (car.pricePerDay < sidebarFilters.priceRange[0] || car.pricePerDay > sidebarFilters.priceRange[1]) {
        return false;
      }

      // Year range filter
      if (car.year < sidebarFilters.yearRange[0] || car.year > sidebarFilters.yearRange[1]) {
        return false;
      }

      // Transmission filter
      if (sidebarFilters.transmission !== 'Any' && car.transmission !== sidebarFilters.transmission) {
        return false;
      }

      // Fuel type filter
      if (sidebarFilters.fuelType !== 'Any') {
        const fuelTypeMap: Record<string, string> = {
          'Petrol': 'gasoline',
          'Gasoline': 'gasoline',
          'Diesel': 'diesel',
          'Electric': 'electric',
          'Hybrid': 'hybrid'
        };
        const mappedFuelType = fuelTypeMap[sidebarFilters.fuelType] || sidebarFilters.fuelType.toLowerCase();
        if (car.fuelType !== mappedFuelType) {
          return false;
        }
      }

      // Seats filter
      if (sidebarFilters.seats !== 'Any') {
        const seatsCount = parseInt(sidebarFilters.seats);
        if (car.seats !== seatsCount) {
          return false;
        }
      }

      return true;
    });

    // Sort cars
    switch (sortBy) {
      case 'price-low':
        return filtered.sort((a, b) => a.pricePerDay - b.pricePerDay);
      case 'price-high':
        return filtered.sort((a, b) => b.pricePerDay - a.pricePerDay);
      case 'year-new':
        return filtered.sort((a, b) => b.year - a.year);
      case 'year-old':
        return filtered.sort((a, b) => a.year - b.year);
      case 'rating':
        return filtered.sort((a, b) => b.rating - a.rating);
      default:
        return filtered;
    }
  }, [appliedFilters, sortBy, sidebarFilters]);

  const handleFilterChange = (key: string, value: string | { startDate: string; endDate: string }) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // If make is being changed, reset model if it's not valid for the new make
      if (key === 'make') {
        const newMake = value as string;
        if (newMake && prev.model) {
          const validModels = makeToModels[newMake] || [];
          const currentModelValid = validModels.some(model => 
            model.toLowerCase() === prev.model.toLowerCase()
          );
          if (!currentModelValid) {
            newFilters.model = '';
          }
        } else if (!newMake) {
          // If make is cleared, also clear model
          newFilters.model = '';
        }
      }
      
      return newFilters;
    });
    setApplyError('');
  };

  const handleDateSelect = (selectedDate: string) => {
    const { startDate, endDate } = filters.dateRange;
    
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      validateRanges(filters);
    }, 800);

    return () => clearTimeout(timer);
  }, [filters]);

  const validateRanges = (currentFilters: typeof filters) => {
    // No validation needed for simplified filters
    setValidationErrors({
      yearRange: false,
      priceRange: false,
      kilometersRange: false,
    });
  };

  const resetFilters = () => {
    setFilters({
      make: '',
      model: '',
      location: '',
      dateRange: { startDate: '', endDate: '' }
    });
    setAppliedFilters({
      make: '',
      model: '',
      location: '',
      dateRange: { startDate: '', endDate: '' }
    });
    setSidebarFilters({
      rentalType: 'Any',
      priceRange: [priceRange.min, priceRange.max],
      yearRange: [yearRangeData.min, yearRangeData.max],
      transmission: 'Any',
      fuelType: 'Any',
      seats: 'Any',
      vehicleCondition: 'All',
      availability: 'Any'
    });
    setValidationErrors({
      yearRange: false,
      priceRange: false,
      kilometersRange: false,
    });
    // Clear URL params
    navigate('/cars', { replace: true });
  };

  const handleSidebarFilterChange = (key: string, value: any) => {
    setSidebarFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    // Validate that at least one filter is set
    const hasFilters = 
      filters.make || 
      filters.model || 
      filters.location || 
      filters.dateRange.startDate || 
      filters.dateRange.endDate;
    
    if (!hasFilters) {
      setApplyError('Vă rugăm să selectați cel puțin un filtru pentru căutare.');
      setTimeout(() => setApplyError(''), 3000);
      return;
    }
    
    setApplyError('');
    setAppliedFilters({ ...filters });
    closeAllDropdowns();
    
    // Update URL with search parameters
    const params = new URLSearchParams();
    
    if (filters.make) {
      params.set('make', filters.make);
    }
    if (filters.model) {
      params.set('model', filters.model);
    }
    if (filters.location) {
      params.set('location', filters.location);
    }
    if (filters.dateRange.startDate) {
      params.set('startDate', filters.dateRange.startDate);
    }
    if (filters.dateRange.endDate) {
      params.set('endDate', filters.dateRange.endDate);
    }
    
    const queryString = params.toString();
    navigate(`/cars${queryString ? `?${queryString}` : ''}`, { replace: true });
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
                  className={`text-base font-medium cursor-pointer transition-colors pr-8 ${filters.make ? 'text-white' : 'text-white/70'}`}
                  onClick={() => openDropdown('make')}
                >
                  {filters.make || 'Selectează marca'}
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
                        <div
                          className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${filters.make === '' ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            handleFilterChange('make', '');
                            closeAllDropdowns();
                          }}
                        >
                          Selectează marca
                        </div>
                        {uniqueMakes.map((make) => (
                          <div
                            key={make}
                            className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${filters.make === make ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                            onClick={() => {
                              handleFilterChange('make', make);
                              closeAllDropdowns();
                            }}
                          >
                            {make}
                          </div>
                        ))}
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
                  onClick={() => filters.make && openDropdown('model')}
                >
                  {!filters.make ? 'Selectează marca' : (filters.model || 'Orice')}
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
                        <div
                          className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${filters.model === '' ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            handleFilterChange('model', '');
                            closeAllDropdowns();
                          }}
                        >
                          Orice
                        </div>
                        {availableModels.length > 0 ? (
                          availableModels.map((model) => (
                            <div
                              key={model}
                              className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${filters.model === model ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                              onClick={() => {
                                handleFilterChange('model', model);
                                closeAllDropdowns();
                              }}
                            >
                              {model}
                            </div>
                          ))
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
            <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-white/20 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible">
              <label className={`text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${filters.location ? 'text-white' : 'text-white/80'}`}>
                Locație
              </label>
              <div className="relative overflow-visible">
                <div
                  className={`text-base font-medium cursor-pointer transition-colors pr-8 ${filters.location ? 'text-white' : 'text-white/70'}`}
                  onClick={() => openDropdown('location')}
                >
                  {filters.location || 'Selectează locația'}
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                          className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${filters.location === 'Chisinau Airport' ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
                          onClick={() => {
                            handleFilterChange('location', 'Chisinau Airport');
                            closeAllDropdowns();
                          }}
                        >
                          Chisinau Airport
                        </div>
                        <div
                          className={`px-4 py-2 text-sm cursor-pointer select-none border-b border-gray-100 last:border-b-0 transition-colors ${filters.location === 'Chisinau' ? 'text-gray-900 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}
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
            <div className="flex-1 relative border-b-0 md:border-b lg:border-b-0 px-4 py-3 md:px-6 md:py-5 dropdown-container overflow-visible">
              <label className={`text-[11px] font-semibold mb-2 md:mb-3 block transition-colors uppercase tracking-widest ${filters.dateRange.startDate || filters.dateRange.endDate ? 'text-white' : 'text-white/80'}`}>
                Perioadă
              </label>
              <div className="relative overflow-visible">
                <div
                  className={`text-base font-medium cursor-pointer transition-colors pr-8 ${filters.dateRange.startDate || filters.dateRange.endDate ? 'text-white' : 'text-white/70'}`}
                  onClick={() => openDropdown('date')}
                >
                  {formatDateRange(filters.dateRange) || 'Selectează perioada'}
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
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
                          {!filters.dateRange.startDate 
                            ? 'Selectează data de început' 
                            : !filters.dateRange.endDate 
                            ? 'Selectează data de sfârșit'
                            : 'Clic pentru a schimba perioada'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => {
                            const currentDate = filters.dateRange.startDate || todayDate;
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            setFilters(prev => ({
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
                          {new Date(filters.dateRange.startDate || todayDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button
                          onClick={() => {
                            const currentDate = filters.dateRange.startDate || todayDate;
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            setFilters(prev => ({
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
                        {generateCalendarDays(new Date(filters.dateRange.startDate || todayDate)).map((day, index) => {
                          if (!day) return <div key={index}></div>;
                          
                          const dayDate = new Date(day);
                          const dayString = day;
                          const isStartDate = filters.dateRange.startDate && isSameDay(dayDate, new Date(filters.dateRange.startDate));
                          const isEndDate = filters.dateRange.endDate && isSameDay(dayDate, new Date(filters.dateRange.endDate));
                          const isInRange = filters.dateRange.startDate && filters.dateRange.endDate && 
                                            dayString >= filters.dateRange.startDate && 
                                            dayString <= filters.dateRange.endDate;
                          const isSelected = isStartDate || isEndDate;

                          return (
                            <div
                              key={index}
                              className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded-xl transition-colors ${
                                day ? 'text-gray-700' : 'text-gray-300'
                              } ${
                                isSelected
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

            {/* Search Button */}
            <div className="px-4 py-3 md:px-6 md:py-5 flex-[1.5] lg:flex-[1]">
              <button
                onClick={applyFilters}
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
                      className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-8">
                    {/* Price Range */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Price Range</label>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-900">${sidebarFilters.priceRange[0]}</span>
                          <span className="text-gray-400">—</span>
                          <span className="font-semibold text-gray-900">${sidebarFilters.priceRange[1]}</span>
                        </div>
                        <div className="relative h-1.5 bg-gray-100 rounded-full">
                          <div 
                            className="absolute h-1.5 bg-theme-500 rounded-full"
                            style={{
                              left: `${((sidebarFilters.priceRange[0] - priceRange.min) / (priceRange.max - priceRange.min)) * 100}%`,
                              width: `${((sidebarFilters.priceRange[1] - sidebarFilters.priceRange[0]) / (priceRange.max - priceRange.min)) * 100}%`
                            }}
                          />
                          <input
                            type="range"
                            min={priceRange.min}
                            max={priceRange.max}
                            value={sidebarFilters.priceRange[0]}
                            onChange={(e) => handleSidebarFilterChange('priceRange', [parseInt(e.target.value), sidebarFilters.priceRange[1]])}
                            className="absolute w-full h-1.5 opacity-0 cursor-pointer z-10"
                          />
                          <input
                            type="range"
                            min={priceRange.min}
                            max={priceRange.max}
                            value={sidebarFilters.priceRange[1]}
                            onChange={(e) => handleSidebarFilterChange('priceRange', [sidebarFilters.priceRange[0], parseInt(e.target.value)])}
                            className="absolute w-full h-1.5 opacity-0 cursor-pointer z-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Year */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Year</label>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-semibold text-gray-900">{sidebarFilters.yearRange[0]}</span>
                          <span className="text-gray-400">—</span>
                          <span className="font-semibold text-gray-900">{sidebarFilters.yearRange[1]}</span>
                        </div>
                        <div className="relative h-1.5 bg-gray-100 rounded-full">
                          <div 
                            className="absolute h-1.5 bg-theme-500 rounded-full"
                            style={{
                              left: `${((sidebarFilters.yearRange[0] - yearRangeData.min) / (yearRangeData.max - yearRangeData.min)) * 100}%`,
                              width: `${((sidebarFilters.yearRange[1] - sidebarFilters.yearRange[0]) / (yearRangeData.max - yearRangeData.min)) * 100}%`
                            }}
                          />
                          <input
                            type="range"
                            min={yearRangeData.min}
                            max={yearRangeData.max}
                            value={sidebarFilters.yearRange[0]}
                            onChange={(e) => handleSidebarFilterChange('yearRange', [parseInt(e.target.value), sidebarFilters.yearRange[1]])}
                            className="absolute w-full h-1.5 opacity-0 cursor-pointer z-10"
                          />
                          <input
                            type="range"
                            min={yearRangeData.min}
                            max={yearRangeData.max}
                            value={sidebarFilters.yearRange[1]}
                            onChange={(e) => handleSidebarFilterChange('yearRange', [sidebarFilters.yearRange[0], parseInt(e.target.value)])}
                            className="absolute w-full h-1.5 opacity-0 cursor-pointer z-10"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Transmission */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Transmission</label>
                      <div className="flex flex-wrap gap-2">
                        {['Any', 'Manual', 'Automatic'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleSidebarFilterChange('transmission', type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              sidebarFilters.transmission === type
                                ? 'bg-theme-500 text-white hover:bg-theme-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Fuel Type */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Fuel Type</label>
                      <div className="flex flex-wrap gap-2">
                        {['Any', 'Petrol', 'Diesel', 'Electric', 'Hybrid'].map((type) => (
                          <button
                            key={type}
                            onClick={() => handleSidebarFilterChange('fuelType', type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              sidebarFilters.fuelType === type
                                ? 'bg-theme-500 text-white hover:bg-theme-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Seats */}
                    <div>
                      <label className="text-sm font-medium text-gray-900 mb-4 block">Seats</label>
                      <div className="flex flex-wrap gap-2">
                        {['Any', '2', '4', '5', '7'].map((seat) => (
                          <button
                            key={seat}
                            onClick={() => handleSidebarFilterChange('seats', seat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                              sidebarFilters.seats === seat
                                ? 'bg-theme-500 text-white hover:bg-theme-600'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {seat === 'Any' ? 'Any' : `${seat} Seater`}
                          </button>
                        ))}
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
          {/* Cars Grid */}
          {filteredCars.length > 0 ? (
            <motion.div
              ref={ref}
              variants={staggerContainer}
              initial="initial"
              animate={isInView ? "animate" : "initial"}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
            >
              {filteredCars.map((car, index) => (
                <CarCard key={car.id} car={car} index={index} />
              ))}
            </motion.div>
          ) : (
            // Check if any filters are applied
            (appliedFilters.make || appliedFilters.model || appliedFilters.location || 
             appliedFilters.dateRange.startDate || appliedFilters.dateRange.endDate ||
             Object.values(sidebarFilters).some(value => {
               if (Array.isArray(value)) {
                 return value[0] !== (value[1] === 2025 ? 2020 : 0) || value[1] !== 2025;
               }
               return value !== 'Any' && value !== 'All';
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

          {/* Rental Options Section */}
          <div className="mt-16 bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Opțiuni de închiriere</h2>
            
            <p className="text-gray-700 leading-relaxed mb-8">
              O varietate de opțiuni disponibile pentru activare extinde semnificativ posibilitățile în cadrul închirierii unei mașini de la AUTOHUB. De exemplu, puteți activa asigurarea CASCO, care acoperă toate tipurile de daune ale vehiculului, iar prin activarea serviciului Priority Service beneficiați de procesare prioritară a documentelor și suport prioritar pe tot parcursul închirierii. De asemenea, sunt disponibile opțiuni precum: închirierea scaunelor auto pentru copii, asistență rutieră, livrare la adresa indicată și multe altele.
            </p>

            <div className="space-y-6">
              {/* Delivery Option */}
              <div className="border-l-4 border-theme-500 pl-6 py-4 bg-gray-50 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                  <Car className="w-5 h-5 text-theme-500" />
                  Preluarea automobilului la adresa convenabilă pentru dvs./dumneavoastră
                </h3>
                <p className="text-gray-600 text-sm">Costul se calculează separat și depinde de locul livrării</p>
              </div>

              {/* Return Option */}
              <div className="border-l-4 border-theme-500 pl-6 py-4 bg-gray-50 rounded-r-lg">
                <h3 className="font-semibold text-gray-900 text-lg mb-2 flex items-center gap-2">
                  <Car className="w-5 h-5 text-theme-500" />
                  Returnarea mașinii la adresa convenabilă pentru dumneavoastră
                </h3>
                <p className="text-gray-600 text-sm">Prețul se negociază separat și depinde de locul returnării</p>
              </div>

              {/* Options Grid */}
              <div className="grid md:grid-cols-2 gap-4 mt-6">
                {/* Unlimited KM */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-theme-50 flex items-center justify-center">
                      <Gauge className="w-5 h-5 text-theme-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Kilometraj nelimitat</h4>
                      <p className="text-theme-500 font-semibold text-sm">Prețul închirierii va fi cu 50% mai mare</p>
                    </div>
                  </div>
                </div>

                {/* Speed Limit Increase */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-theme-50 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-theme-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Creșterea limitei de viteză</h4>
                      <p className="text-theme-500 font-semibold text-sm">Prețul închirierii va fi cu 20% mai mare</p>
                    </div>
                  </div>
                </div>

                {/* Personal Driver */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <UserRound className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Șofer personal</h4>
                      <p className="text-gray-700 font-semibold text-sm">din 800 MDL pe zi</p>
                    </div>
                  </div>
                </div>

                {/* Priority Service */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Star className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Priority Service</h4>
                      <p className="text-gray-700 font-semibold text-sm">din 1000 MDL pe zi</p>
                    </div>
                  </div>
                </div>

                {/* Tire Insurance */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-theme-50 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-theme-500" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Asigurare pentru anvelope și parbriz</h4>
                      <p className="text-theme-500 font-semibold text-sm">Prețul închirierii va fi cu 20% mai mare</p>
                    </div>
                  </div>
                </div>

                {/* Child Seat */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Baby className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Scaun auto pentru copii</h4>
                      <p className="text-gray-700 font-semibold text-sm">din 100 MDL pe zi</p>
                    </div>
                  </div>
                </div>

                {/* SIM Card */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Cartelă SIM cu internet</h4>
                      <p className="text-gray-700 font-semibold text-sm">din 100 MDL pe zi</p>
                    </div>
                  </div>
                </div>

                {/* Roadside Assistance */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-theme-500 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">Asistență rutieră</h4>
                      <p className="text-gray-700 font-semibold text-sm">din 500 MDL pe zi</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contract Section */}
          <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contract</h2>
            
            <p className="text-gray-700 leading-relaxed mb-6">
              Compania noastră oferă servicii de închiriere auto pe teritoriul Republicii Moldova, respectând cu strictețe legislația în vigoare. Interacțiunea cu clienții se bazează pe Contractul de închiriere, care garantează protecția juridică a intereselor acestora.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-4">Condiții și cerințe</h3>
            <p className="text-gray-700 mb-4">
              Pentru a închiria o mașină, trebuie îndeplinite următoarele cerințe și acceptate următoarele condiții:
            </p>

            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Vârsta minimă a șoferului: 21 ani.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Permis de conducere valabil, categoria B.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Experiență de conducere de cel puțin 3 ani.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Deținerea buletinului de identitate.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Achitarea integrală (100%) a taxei de închiriere pentru mașina selectată.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Depunerea unui depozit conform valorii stabilite în Contract. Depozitul reprezintă o asigurare a îndeplinirii obligațiilor de către Chiriaș și este returnat după 10 zile de la predarea mașinii, în absența încălcărilor majore.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Toate amenzile primite în timpul utilizării vehiculului revin în responsabilitatea șoferului.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>În lipsa poliței CASCO, responsabilitatea pentru accidente revine șoferului.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Limita zilnică de parcurs este de 200 km. În cazul închirierii pentru mai multe zile, limita se calculează în total. În cazul depășirii limitei și în lipsa opțiunii activate «Kilometraj nelimitat», depășirea se achită separat.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Plata se poate efectua în numerar, prin transfer bancar sau cu cardul.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Clientul are dreptul la recalcularea costului în caz de returnare anticipată a vehiculului.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Prelungirea Contractului de închiriere este posibilă în format la distanță, dar nu este garantată.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Este posibilă livrarea sau returnarea mașinii la adresa convenabilă. Costul se confirmă la telefon +373 79 75-22-22.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-theme-500 mt-2"></span>
                <span>Înainte de semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 0 lei. După semnarea Contractului de închiriere, costul adăugării unui al doilea șofer este de 500 lei.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
