import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useMemo, useEffect } from 'react';
import { cars } from '../../data/cars';
import { useInView } from '../../hooks/useInView';
import { staggerContainer } from '../../utils/animations';
import { CarCard } from './CarCard';

export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();

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
    generation: '',
    kilometersFrom: '',
    kilometersTo: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
  });

  // Applied filters state (what's actually used for filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    make: '',
    model: '',
    generation: '',
    kilometersFrom: '',
    kilometersTo: '',
    yearFrom: '',
    yearTo: '',
    priceFrom: '',
    priceTo: '',
  });

  const [sortBy, setSortBy] = useState('default');
  const [showAllParams, setShowAllParams] = useState(false);
  const [applyError, setApplyError] = useState('');


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
      const carMake = car.name.split(' ')[0].toLowerCase();
      const carModel = car.name.split(' ').slice(1).join(' ').toLowerCase();

      // Make filter
      if (appliedFilters.make && !carMake.includes(appliedFilters.make.toLowerCase())) {
        return false;
      }

      // Model filter
      if (appliedFilters.model && !carModel.includes(appliedFilters.model.toLowerCase())) {
        return false;
      }

      // Year filter
      if (appliedFilters.yearFrom && car.year < Number.parseInt(appliedFilters.yearFrom)) {
        return false;
      }
      if (appliedFilters.yearTo && car.year > Number.parseInt(appliedFilters.yearTo)) {
        return false;
      }

      // Price filter
      if (appliedFilters.priceFrom && car.pricePerDay < Number.parseInt(appliedFilters.priceFrom)) {
        return false;
      }
      if (appliedFilters.priceTo && car.pricePerDay > Number.parseInt(appliedFilters.priceTo)) {
        return false;
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
  }, [appliedFilters, sortBy]);

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
    const errors = {
      yearRange: false,
      priceRange: false,
      kilometersRange: false,
    };

    // Validate year range
    if (currentFilters.yearFrom && currentFilters.yearTo) {
      const fromYear = Number.parseInt(currentFilters.yearFrom);
      const toYear = Number.parseInt(currentFilters.yearTo);
      if (!Number.isNaN(fromYear) && !Number.isNaN(toYear) && fromYear > toYear) {
        errors.yearRange = true;
      }
    }

    // Validate price range
    if (currentFilters.priceFrom && currentFilters.priceTo) {
      const fromPrice = Number.parseInt(currentFilters.priceFrom);
      const toPrice = Number.parseInt(currentFilters.priceTo);
      if (!Number.isNaN(fromPrice) && !Number.isNaN(toPrice) && fromPrice > toPrice) {
        errors.priceRange = true;
      }
    }

    // Validate kilometers range
    if (currentFilters.kilometersFrom && currentFilters.kilometersTo) {
      const fromKm = Number.parseInt(currentFilters.kilometersFrom);
      const toKm = Number.parseInt(currentFilters.kilometersTo);
      if (!Number.isNaN(fromKm) && !Number.isNaN(toKm) && fromKm > toKm) {
        errors.kilometersRange = true;
      }
    }

    setValidationErrors(errors);
  };

  const resetFilters = () => {
    setFilters({
      make: '',
      model: '',
      generation: '',
      kilometersFrom: '',
      kilometersTo: '',
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: '',
    });
    setAppliedFilters({
      make: '',
      model: '',
      generation: '',
      kilometersFrom: '',
      kilometersTo: '',
      yearFrom: '',
      yearTo: '',
      priceFrom: '',
      priceTo: '',
    });
    setValidationErrors({
      yearRange: false,
      priceRange: false,
      kilometersRange: false,
    });
  };

  const applyFilters = () => {
    if (
      validationErrors.yearRange ||
      validationErrors.priceRange ||
      validationErrors.kilometersRange
    ) {
      setApplyError('Corectați erorile din filtre înainte de a aplica.');
      return; // Stop applying
    }

    setApplyError(''); // Clear error if no issues
    setAppliedFilters({ ...filters });
  };


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1450px] mx-auto px-8 sm:px-12 lg:px-16 py-16 mt-16">
        {/* Filter Section */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-10 mb-10 backdrop-blur-sm relative overflow-hidden"
        >
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-transparent to-blue-50/20 pointer-events-none"></div>

          <div className="relative z-10 flex justify-between items-center mb-10">
            <div>
              <h3 className="text-4xl font-bold text-gray-900 mb-3">Filtre</h3>
              <p className="text-gray-600 text-lg">Găsește mașina perfectă pentru tine</p>
            </div>
            <div className="flex items-center text-red-600 cursor-pointer hover:text-red-700 transition-all duration-300 bg-red-50 hover:bg-red-100 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md">
              <span className="mr-3 font-semibold">Salvează căutarea</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Filter Inputs */}
          <div className="relative z-10 space-y-8">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Make */}
              <div className="space-y-3">
                <label htmlFor="make-select" className="text-sm font-bold text-gray-800 block flex items-center gap-2">
                  <span>Marca</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </label>
                <div className="relative group">
                  <select
                    id="make-select"
                    value={filters.make}
                    onChange={(e) => handleFilterChange('make', e.target.value)}
                    className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-gray-700 font-medium appearance-none cursor-pointer backdrop-blur-sm"
                  >
                    <option value="" className="py-2">Selectează marca</option>
                    {uniqueMakes.map((make) => (
                      <option key={make} value={make} className="py-2 bg-white text-gray-700">{make}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Model */}
              <div className="space-y-3">
                <label htmlFor="model-select" className="text-sm font-bold text-gray-800 block flex items-center gap-2">
                  <span>Model</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </label>
                <div className="relative group">
                  <select
                    id="model-select"
                    value={filters.model}
                    onChange={(e) => handleFilterChange('model', e.target.value)}
                    className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-gray-700 font-medium appearance-none cursor-pointer backdrop-blur-sm"
                  >
                    <option value="" className="py-2">Selectează modelul</option>
                    <option value="AMG C43" className="py-2 bg-white text-gray-700">AMG C43</option>
                    <option value="GLE" className="py-2 bg-white text-gray-700">GLE</option>
                    <option value="CLS" className="py-2 bg-white text-gray-700">CLS</option>
                    <option value="Ghibli" className="py-2 bg-white text-gray-700">Ghibli</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Generation */}
              <div className="space-y-3">
                <label htmlFor="generation-select" className="text-sm font-bold text-gray-800 block flex items-center gap-2">
                  <span>Generație</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </label>
                <div className="flex gap-4">
                  <div className="relative group flex-1">
                    <select
                      id="generation-select"
                      value={filters.generation}
                      onChange={(e) => handleFilterChange('generation', e.target.value)}
                      className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-gray-700 font-medium appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="" className="py-2">Selectează generația</option>
                      <option value="W205" className="py-2 bg-white text-gray-700">W205</option>
                      <option value="W167" className="py-2 bg-white text-gray-700">W167</option>
                      <option value="C257" className="py-2 bg-white text-gray-700">C257</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <button className="px-5 py-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-2xl border-2 border-gray-200 transition-all duration-300 hover:shadow-lg group">
                    <svg className="w-5 h-5 text-gray-600 group-hover:text-gray-800 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Kilometers */}
              <div className="space-y-3">
                <label htmlFor="kilometers-from" className="text-sm font-bold text-gray-800 block flex items-center gap-2">
                  <span>Kilometri parcurși</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <AnimatePresence>
                    {validationErrors.kilometersRange && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-1 text-red-500 text-xs"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          {InfoIconPath}
                        </svg>
                        <span>Kilometrajul „de la” trebuie să fie mai mic decât „până la”.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    id="kilometers-from"
                    placeholder="De la..."
                    value={filters.kilometersFrom}
                    onChange={(e) => handleFilterChange('kilometersFrom', e.target.value)}
                    className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 placeholder-gray-400 font-medium"
                  />
                  <input
                    type="text"
                    id="kilometers-to"
                    placeholder="Până la..."
                    value={filters.kilometersTo}
                    onChange={(e) => handleFilterChange('kilometersTo', e.target.value)}
                    className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 placeholder-gray-400 font-medium"
                  />
                </div>
              </div>

              {/* Year */}
              <div className="space-y-3">
                <label htmlFor="year-from" className="text-sm font-bold text-gray-800 block flex items-center gap-2">
                  <span>Anul</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <AnimatePresence>
                    {validationErrors.yearRange && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-1 text-red-500 text-xs"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          {InfoIconPath}
                        </svg>
                        <span>Anul „de la” trebuie să fie mai mic decât „până la”.</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                <div className="flex gap-4">
                  <div className="relative group flex-1">
                    <select
                      id="year-from"
                      value={filters.yearFrom}
                      onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                      className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-gray-700 font-medium appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="" className="py-2">De la</option>
                      {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                        <option key={year} value={year} className="py-2 bg-white text-gray-700">{year}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="relative group flex-1">
                    <select
                      id="year-to"
                      value={filters.yearTo}
                      onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                      className="w-full px-5 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-gray-700 font-medium appearance-none cursor-pointer backdrop-blur-sm"
                    >
                      <option value="" className="py-2">Până la</option>
                      {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                        <option key={year} value={year} className="py-2 bg-white text-gray-700">{year}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Third Row - Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label htmlFor="price-from" className="text-sm font-bold text-gray-800 block flex items-center gap-2">
                  <span>Prețul</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <AnimatePresence>
                    {validationErrors.priceRange && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-1 text-red-500 text-xs"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          {InfoIconPath}
                        </svg>
                        <span>Prețul "de la" trebuie să fie mai mic decât "până la"</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    id="price-from"
                    placeholder="De la..."
                    value={filters.priceFrom}
                    onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                    className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 placeholder-gray-400 font-medium"
                  />
                  <input
                    type="text"
                    id="price-to"
                    placeholder="Până la..."
                    value={filters.priceTo}
                    onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                    className="flex-1 px-5 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-gray-700 placeholder-gray-400 font-medium"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="relative z-10 flex justify-between items-center mt-12 pt-8 border-t-2 border-gray-100">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setShowAllParams(!showAllParams)}
                className="flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md font-semibold"
              >
                <span>Toți parametrii</span>
                <svg className={`w-5 h-5 ml-3 transition-transform duration-300 ${showAllParams ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center text-gray-700 hover:text-gray-900 transition-all duration-300 bg-gray-50 hover:bg-gray-100 px-6 py-3 rounded-2xl shadow-sm hover:shadow-md font-semibold"
              >
                <span>Resetează filtrele</span>
                <svg className="w-5 h-5 ml-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <AnimatePresence>
              {applyError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1 text-red-500 text-xs"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    {InfoIconPath}
                  </svg>
                  <span className="text-red-500 text-sm font-medium">{applyError}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <button
              onClick={applyFilters}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 text-lg"
            >
              Aplică filtrele
            </button>
          </div>
        </motion.div>

        {/* Results Section */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Mașini disponibile</h2>
            <p className="text-gray-600 text-xl">{filteredCars.length} mașini disponibile</p>
          </div>
          <div className="flex items-center gap-4">
            <label htmlFor="sort-select" className="text-sm font-bold text-gray-800">Sortează după:</label>
            <div className="relative group">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-4 pr-12 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-red-500/20 focus:border-red-500 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl hover:border-gray-300 transition-all duration-300 text-gray-700 font-medium min-w-[220px] appearance-none cursor-pointer backdrop-blur-sm"
              >
                <option value="default" className="py-2">Implicit</option>
                <option value="price-low" className="py-2 bg-white text-gray-700">Preț: Mic la Mare</option>
                <option value="price-high" className="py-2 bg-white text-gray-700">Preț: Mare la Mic</option>
                <option value="year-new" className="py-2 bg-white text-gray-700">An: Nou la Vechi</option>
                <option value="year-old" className="py-2 bg-white text-gray-700">An: Vechi la Nou</option>
                <option value="rating" className="py-2 bg-white text-gray-700">Rating</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                <svg className="w-5 h-5 text-gray-500 group-hover:text-gray-700 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Cars Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
        >
          {filteredCars.map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};
