import { motion } from 'framer-motion';
import React, { useState, useMemo } from 'react';
import { cars } from '../../data/cars';
import { useInView } from '../../hooks/useInView';
import { staggerContainer } from '../../utils/animations';
import { CarCard } from './CarCard';



export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();

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

  const [sortBy, setSortBy] = useState('default');
  const [showAllParams, setShowAllParams] = useState(false);

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
      if (filters.make && !carMake.includes(filters.make.toLowerCase())) {
        return false;
      }

      // Model filter
      if (filters.model && !carModel.includes(filters.model.toLowerCase())) {
        return false;
      }

      // Year filter
      if (filters.yearFrom && car.year < Number.parseInt(filters.yearFrom)) {
        return false;
      }
      if (filters.yearTo && car.year > Number.parseInt(filters.yearTo)) {
        return false;
      }

      // Price filter
      if (filters.priceFrom && car.pricePerDay < Number.parseInt(filters.priceFrom)) {
        return false;
      }
      if (filters.priceTo && car.pricePerDay > Number.parseInt(filters.priceTo)) {
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
  }, [filters, sortBy]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
  };

  const applyFilters = () => {
    // Filters are already applied through the useMemo hook
    // This function can be used for additional logic if needed
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
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Filtre</h3>
            <div className="flex items-center text-red-600 cursor-pointer">
              <span className="mr-2">Salvează căutarea</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Filter Inputs */}
          <div className="space-y-4">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Make */}
              <div>
                <select
                  value={filters.make}
                  onChange={(e) => handleFilterChange('make', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Marca</option>
                  {uniqueMakes.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <select
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Model</option>
                  <option value="AMG C43">AMG C43</option>
                  <option value="GLE">GLE</option>
                  <option value="CLS">CLS</option>
                  <option value="Ghibli">Ghibli</option>
                </select>
              </div>

              {/* Generation */}
              <div className="flex gap-2">
                <select
                  value={filters.generation}
                  onChange={(e) => handleFilterChange('generation', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Generație</option>
                  <option value="W205">W205</option>
                  <option value="W167">W167</option>
                  <option value="C257">C257</option>
                </select>
                <button className="px-3 py-3 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kilometers */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kilometri parcurşi, d..."
                  value={filters.kilometersFrom}
                  onChange={(e) => handleFilterChange('kilometersFrom', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="până la"
                  value={filters.kilometersTo}
                  onChange={(e) => handleFilterChange('kilometersTo', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>

              {/* Year */}
              <div className="flex gap-2">
                <select
                  value={filters.yearFrom}
                  onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">An, de la</option>
                  {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <select
                  value={filters.yearTo}
                  onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">până la</option>
                  {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Preţ, de la 356 000 ..."
                  value={filters.priceFrom}
                  onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
                <input
                  type="text"
                  placeholder="până la 986 000 MDL"
                  value={filters.priceTo}
                  onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAllParams(!showAllParams)}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <span>Toți parametrii</span>
                <svg className={`w-4 h-4 ml-1 transition-transform ${showAllParams ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center text-gray-600 hover:text-gray-800"
              >
                <span>Resetează filtrele</span>
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={applyFilters}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Aplică
            </button>
          </div>
        </motion.div>

        {/* Results Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Maşini disponibile</h2>
            <p className="text-gray-600 mt-1">{filteredCars.length} maşini disponibile</p>
          </div>
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="default">Implicit</option>
              <option value="price-low">Preț: Mic la Mare</option>
              <option value="price-high">Preț: Mare la Mic</option>
              <option value="year-new">An: Nou la Vechi</option>
              <option value="year-old">An: Vechi la Nou</option>
              <option value="rating">Rating</option>
            </select>
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
