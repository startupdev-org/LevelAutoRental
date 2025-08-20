import { motion } from 'framer-motion';
import { Fuel, Star, Users } from 'lucide-react';
import React, { useState } from 'react';
import { cars } from '../../data/cars';
import { useCounter } from '../../hooks/useCounter';
import { useInView } from '../../hooks/useInView';
import { Car } from '../../types';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

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

export const CarGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { ref, isInView } = useInView();

  const categories = ['all', 'economy', 'compact', 'midsize', 'suv', 'luxury'];
  
  const filteredCars = selectedCategory === 'all' 
    ? cars.slice(0, 6) 
    : cars.filter(car => car.category === selectedCategory).slice(0, 6);

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-12"
        >
          <motion.h2
            variants={fadeInUp}
            className="text-3xl md:text-4xl font-bold text-gray-900 mb-4"
          >
            Popular Cars
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-3xl mx-auto mb-8"
          >
            Choose from our premium fleet of well-maintained vehicles
          </motion.p>

          {/* Category Filter */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap justify-center gap-2 mb-8"
          >
            {categories.map((category) => (
              <motion.button
                key={category}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {filteredCars.map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg">
            View All Cars
          </Button>
        </motion.div>
      </div>
    </section>
  );
};