import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, MapPin } from 'lucide-react';
import { cars } from '../../data/cars';
import { useInView } from '../../hooks/useInView';
import { staggerContainer } from '../../utils/animations';
import { CarCard } from './CarCard';

export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();
  const [searchParams] = useSearchParams();

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
    dateRange: ''
  });

  // Applied filters state (what's actually used for filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    make: '',
    model: '',
    location: '',
    dateRange: ''
  });

  // Dropdown states
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showDateCalendar, setShowDateCalendar] = useState(false);

  // Close all dropdowns
  const closeAllDropdowns = () => {
    setShowLocationDropdown(false);
    setShowDateCalendar(false);
  };

  // Handle opening a specific dropdown and closing others
  const openDropdown = (dropdownType: 'location' | 'date') => {
    if ((dropdownType === 'location' && showLocationDropdown) ||
        (dropdownType === 'date' && showDateCalendar)) {
      closeAllDropdowns();
      return;
    }
    
    closeAllDropdowns();
    if (dropdownType === 'location') {
      setShowLocationDropdown(true);
    } else if (dropdownType === 'date') {
      setShowDateCalendar(true);
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

    if (showLocationDropdown || showDateCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showLocationDropdown, showDateCalendar]);

  // Helper functions
  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
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

  // Initialize date range with today's date if empty
  const todayDate = new Date().toISOString().split('T')[0];
  useEffect(() => {
    if (!filters.dateRange) {
      setFilters(prev => ({ ...prev, dateRange: todayDate }));
    }
  }, []);

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
    if (makeParam) {
      const initialFilters = {
        make: makeParam,
        model: '',
        location: '',
        dateRange: ''
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
      return parts[0]; // First part is usually the make
    });
    return [...new Set(makes)];
  }, []);

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

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setApplyError('');
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
      dateRange: ''
    });
    setAppliedFilters({
      make: '',
      model: '',
      location: '',
      dateRange: ''
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
  };

  const handleSidebarFilterChange = (key: string, value: any) => {
    setSidebarFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setAppliedFilters({ ...filters });
    console.log('All the filters are: ', filters)
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16">
        {/* Top Filter Section - Full Width */}
        <div className="mt-8 mb-10 flex flex-col lg:flex-row gap-4 items-stretch relative">
          {/* Filter Card */}
          <div className="flex-1 bg-gray-50 border border-gray-200 rounded-2xl overflow-visible">
          <div className="flex flex-col lg:flex-row gap-0 items-stretch">
            {/* Car Brand */}
            <div className="flex-1 relative border-r border-gray-200 px-5 py-4 lg:py-4">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5 block">
                Marca
                </label>
              <div className="relative">
                  <select
                    value={filters.make}
                    onChange={(e) => handleFilterChange('make', e.target.value)}
                  className="w-full text-base font-bold text-gray-900 bg-transparent border-none outline-none appearance-none cursor-pointer pr-8 focus:ring-0"
                  >
                  <option value="">Selectează marca</option>
                    {uniqueMakes.map((make) => (
                    <option key={make} value={make}>{make}</option>
                    ))}
                  </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

            {/* Car Model */}
            <div className="flex-1 relative border-r border-gray-200 px-5 py-4 lg:py-4">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5 block">
                Model
                </label>
              <div className="relative">
                  <select
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                  className="w-full text-base font-bold text-gray-900 bg-transparent border-none outline-none appearance-none cursor-pointer pr-8 focus:ring-0"
                >
                  <option value="">Orice</option>
                  <option value="AMG C43">AMG C43</option>
                  <option value="GLE">GLE</option>
                  <option value="CLS">CLS</option>
                  <option value="Ghibli">Ghibli</option>
                  </select>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex-1 relative border-r border-gray-200 px-5 py-4 lg:py-4 dropdown-container overflow-visible">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5 block">
                Locație
              </label>
              <div className="relative overflow-visible">
                <MapPin className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <div
                  className="pl-6 pr-8 text-base font-medium text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={() => openDropdown('location')}
                >
                  {filters.location || 'Selectează locația'}
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[100] min-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="py-1">
                        <div
                          className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors"
                          onClick={() => {
                            handleFilterChange('location', 'Chisinau Airport');
                            closeAllDropdowns();
                          }}
                        >
                          Chisinau Airport
                        </div>
                        <div
                          className="px-4 py-2 text-sm text-gray-700 cursor-pointer select-none border-b border-gray-100 last:border-b-0 hover:bg-gray-100 transition-colors"
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
            <div className="flex-1 relative px-5 py-4 lg:py-4 dropdown-container overflow-visible">
              <label className="text-xs font-medium text-gray-600 uppercase tracking-wider mb-1.5 block">
                Perioadă
              </label>
              <div className="relative overflow-visible">
                <Calendar className="absolute left-0 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <div
                  className="pl-6 pr-8 text-base font-medium text-gray-900 cursor-pointer hover:text-gray-700 transition-colors"
                  onClick={() => openDropdown('date')}
                >
                  {filters.dateRange ? formatDate(filters.dateRange) : 'Selectează perioada'}
                </div>
                <div className="absolute right-0 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={() => {
                            const currentDate = filters.dateRange || todayDate;
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() - 1);
                            handleFilterChange('dateRange', newDate.toISOString().split('T')[0]);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
                        >
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <div className="text-sm font-medium text-gray-700">
                          {new Date(filters.dateRange || todayDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </div>
                        <button
                          onClick={() => {
                            const currentDate = filters.dateRange || todayDate;
                            const newDate = new Date(currentDate);
                            newDate.setMonth(newDate.getMonth() + 1);
                            handleFilterChange('dateRange', newDate.toISOString().split('T')[0]);
                          }}
                          className="p-1 hover:bg-gray-100 rounded transition-colors"
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
                        {generateCalendarDays(new Date(filters.dateRange || todayDate)).map((day, index) => (
                          <div
                            key={index}
                            className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded hover:bg-gray-100 transition-colors ${
                              day ? 'text-gray-700' : 'text-gray-300'
                            } ${
                              day && filters.dateRange && isSameDay(new Date(day), new Date(filters.dateRange))
                                ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                : ''
                            }`}
                            onClick={() => {
                              if (day) {
                                handleFilterChange('dateRange', day);
                                closeAllDropdowns();
                              }
                            }}
                          >
                            {day ? new Date(day).getDate() : ''}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* Search Button - Separate on Right */}
        <div className="lg:w-auto w-full flex items-stretch">
              <button
                onClick={applyFilters}
              className="w-full lg:min-w-[180px] lg:w-auto h-full bg-theme-500 hover:bg-theme-600 text-white font-bold px-8 py-4 rounded-2xl text-base lg:text-lg flex items-center justify-center transition-colors duration-200"
              >
                Caută
              </button>
          </div>
        </div>

        {/* Main Layout with Sidebar */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 sticky top-4 max-h-[calc(100vh-4rem)] overflow-y-auto shadow-sm">
              <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
                <button
                  onClick={resetFilters}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Reset All
                </button>
              </div>

              <div className="space-y-6 pt-1">
                {/* Price Range */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 block">
                    PRICE RANGE
                  </label>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                      <span>${sidebarFilters.priceRange[0]}</span>
                      <span>${sidebarFilters.priceRange[1]}</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full">
                      <div 
                        className="absolute h-2 bg-theme-500 rounded-full"
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
                        className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                      />
                      <input
                        type="range"
                        min={priceRange.min}
                        max={priceRange.max}
                        value={sidebarFilters.priceRange[1]}
                        onChange={(e) => handleSidebarFilterChange('priceRange', [sidebarFilters.priceRange[0], parseInt(e.target.value)])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Year */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 block">
                    YEAR
                  </label>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm font-semibold text-gray-700">
                      <span>{sidebarFilters.yearRange[0]}</span>
                      <span>{sidebarFilters.yearRange[1]}</span>
                    </div>
                    <div className="relative h-2 bg-gray-200 rounded-full">
                      <div 
                        className="absolute h-2 bg-theme-500 rounded-full"
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
                        className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                      />
                      <input
                        type="range"
                        min={yearRangeData.min}
                        max={yearRangeData.max}
                        value={sidebarFilters.yearRange[1]}
                        onChange={(e) => handleSidebarFilterChange('yearRange', [sidebarFilters.yearRange[0], parseInt(e.target.value)])}
                        className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Transmission */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 block">
                    TRANSMISSION
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Any', 'Manual', 'Automatic'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSidebarFilterChange('transmission', type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sidebarFilters.transmission === type
                            ? 'bg-theme-500 text-white shadow-sm'
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
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 block">
                    FUEL TYPE
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Any', 'Petrol', 'Diesel', 'Electric', 'Hybrid'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleSidebarFilterChange('fuelType', type)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sidebarFilters.fuelType === type
                            ? 'bg-theme-500 text-white shadow-sm'
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
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3 block">
                    SEAT
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {['Any', '2', '4', '5', '7'].map((seat) => (
                      <button
                        key={seat}
                        onClick={() => handleSidebarFilterChange('seats', seat)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          sidebarFilters.seats === seat
                            ? 'bg-theme-500 text-white shadow-sm'
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
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Cars Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate={isInView ? "animate" : "initial"}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-5"
            >
              {filteredCars.map((car, index) => (
                <CarCard key={car.id} car={car} index={index} />
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};
