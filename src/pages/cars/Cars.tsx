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
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8 backdrop-blur-sm"
        >
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">Filtre</h3>
              <p className="text-gray-600">Găsește mașina perfectă pentru tine</p>
            </div>
            <div className="flex items-center text-red-600 cursor-pointer hover:text-red-700 transition-colors duration-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl">
              <span className="mr-2 font-medium">Salvează căutarea</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
            </div>
          </div>

          {/* Filter Inputs */}
          <div className="space-y-6">
            {/* First Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Make */}
              <div className="space-y-2">
                <label htmlFor="make-select" className="text-sm font-semibold text-gray-700 block">Marca</label>
                <select
                  id="make-select"
                  value={filters.make}
                  onChange={(e) => handleFilterChange('make', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700"
                >
                  <option value="">Selectează marca</option>
                  {uniqueMakes.map((make) => (
                    <option key={make} value={make}>{make}</option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div className="space-y-2">
                <label htmlFor="model-select" className="text-sm font-semibold text-gray-700 block">Model</label>
                <select
                  id="model-select"
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700"
                >
                  <option value="">Selectează modelul</option>
                  <option value="AMG C43">AMG C43</option>
                  <option value="GLE">GLE</option>
                  <option value="CLS">CLS</option>
                  <option value="Ghibli">Ghibli</option>
                </select>
              </div>

              {/* Generation */}
              <div className="space-y-2">
                <label htmlFor="generation-select" className="text-sm font-semibold text-gray-700 block">Generație</label>
                <div className="flex gap-3">
                  <select
                    id="generation-select"
                    value={filters.generation}
                    onChange={(e) => handleFilterChange('generation', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700"
                  >
                    <option value="">Selectează generația</option>
                    <option value="W205">W205</option>
                    <option value="W167">W167</option>
                    <option value="C257">C257</option>
                  </select>
                  <button className="px-4 py-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all duration-200 hover:shadow-md">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Kilometers */}
              <div className="space-y-2">
                <label htmlFor="kilometers-from" className="text-sm font-semibold text-gray-700 block">Kilometri parcurși</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="kilometers-from"
                    placeholder="De la..."
                    value={filters.kilometersFrom}
                    onChange={(e) => handleFilterChange('kilometersFrom', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                  <input
                    type="text"
                    id="kilometers-to"
                    placeholder="Până la..."
                    value={filters.kilometersTo}
                    onChange={(e) => handleFilterChange('kilometersTo', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Year */}
              <div className="space-y-2">
                <label htmlFor="year-from" className="text-sm font-semibold text-gray-700 block">Anul</label>
                <div className="flex gap-3">
                  <select
                    id="year-from"
                    value={filters.yearFrom}
                    onChange={(e) => handleFilterChange('yearFrom', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700"
                  >
                    <option value="">De la</option>
                    {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                  <select
                    id="year-to"
                    value={filters.yearTo}
                    onChange={(e) => handleFilterChange('yearTo', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700"
                  >
                    <option value="">Până la</option>
                    {Array.from({ length: 10 }, (_, i) => 2024 - i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Third Row - Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="price-from" className="text-sm font-semibold text-gray-700 block">Prețul</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    id="price-from"
                    placeholder="De la..."
                    value={filters.priceFrom}
                    onChange={(e) => handleFilterChange('priceFrom', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                  <input
                    type="text"
                    id="price-to"
                    placeholder="Până la..."
                    value={filters.priceTo}
                    onChange={(e) => handleFilterChange('priceTo', e.target.value)}
                    className="flex-1 px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>
              <div></div> {/* Empty div to maintain grid structure */}
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-6">
              <button
                onClick={() => setShowAllParams(!showAllParams)}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl"
              >
                <span className="font-medium">Toți parametrii</span>
                <svg className={`w-4 h-4 ml-2 transition-transform duration-200 ${showAllParams ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <button
                onClick={resetFilters}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors duration-200 bg-gray-50 hover:bg-gray-100 px-4 py-2 rounded-xl"
              >
                <span className="font-medium">Resetează filtrele</span>
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <button
              onClick={applyFilters}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Aplică filtrele
            </button>
          </div>
        </motion.div>

        {/* Results Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Mașini disponibile</h2>
            <p className="text-gray-600 text-lg">{filteredCars.length} mașini disponibile</p>
          </div>
          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-sm font-semibold text-gray-700">Sortează după:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm hover:shadow-md transition-all duration-200 text-gray-700 min-w-[200px]"
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
