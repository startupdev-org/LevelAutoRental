import { motion } from 'framer-motion';
import { Filter, Fuel, Search, Star, Users } from 'lucide-react';
import React, { useState } from 'react';
import { cars } from '../data/cars';
import { useCounter } from '../hooks/useCounter';
import { useInView } from '../hooks/useInView';
import { Car } from '../types';
import { fadeInUp, staggerContainer } from '../utils/animations';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface CarCardProps {
  car: Car;
  index: number;
}

const CarCard: React.FC<CarCardProps> = ({ car, index }) => {
  const { ref, isInView } = useInView();
  const animatedPrice = useCounter(car.pricePerDay, 1500, 0);

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        <div className="relative">
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
            src={car.image}
            alt={car.name}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-4 right-4">
            <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium capitalize">
              {car.category}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{car.name}</h3>
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{car.rating}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4" />
              <span>{car.seats} seats</span>
            </div>
            <div className="flex items-center space-x-1">
              <Fuel className="w-4 h-4" />
              <span className="capitalize">{car.fuelType}</span>
            </div>
            <span className="capitalize">{car.transmission}</span>
          </div>

          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {car.features.slice(0, 3).map((feature, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                ${isInView ? animatedPrice : car.pricePerDay}
              </span>
              <span className="text-gray-600">/day</span>
            </div>
            <Button variant="secondary" size="sm">
              Book Now
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const Cars: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [showFilters, setShowFilters] = useState(false);
  const { ref, isInView } = useInView();

  const categories = ['all', 'economy', 'compact', 'midsize', 'fullsize', 'suv', 'luxury'];

  const filteredCars = cars.filter(car => {
    const matchesSearch = car.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || car.category === selectedCategory;
    const matchesPrice = car.pricePerDay >= priceRange[0] && car.pricePerDay <= priceRange[1];
    
    return matchesSearch && matchesCategory && matchesPrice;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="text-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
            >
              Our Fleet
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-xl text-gray-600 max-w-3xl mx-auto"
            >
              Choose from our extensive collection of premium vehicles
            </motion.p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`lg:w-64 ${showFilters ? 'block' : 'hidden lg:block'}`}
          >
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
              
              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Cars
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <motion.button
                      key={category}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        selectedCategory === category
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range (per day)
                </label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </Button>
            </div>

            {/* Results Header */}
            <motion.div
              ref={ref}
              variants={fadeInUp}
              initial="initial"
              animate={isInView ? "animate" : "initial"}
              className="flex items-center justify-between mb-6"
            >
              <p className="text-gray-600">
                Showing {filteredCars.length} of {cars.length} cars
              </p>
            </motion.div>

            {/* Cars Grid */}
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate={isInView ? "animate" : "initial"}
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              {filteredCars.map((car, index) => (
                <CarCard key={car.id} car={car} index={index} />
              ))}
            </motion.div>

            {/* No Results */}
            {filteredCars.length === 0 && (
              <motion.div
                variants={fadeInUp}
                initial="initial"
                animate={isInView ? "animate" : "initial"}
                className="text-center py-12"
              >
                <p className="text-gray-500 text-lg">
                  No cars found matching your criteria.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setPriceRange([0, 200]);
                  }}
                  className="mt-4"
                >
                  Clear Filters
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};