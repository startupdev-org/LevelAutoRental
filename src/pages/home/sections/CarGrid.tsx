import { motion } from 'framer-motion';
import { Fuel, Star, Users, Snowflake, Settings, ArrowRight, Calendar } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useInView } from '../../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Button } from '../../../components/ui/Button';
import { CarCard } from '../../../components/car/CarCard';
import { Car as CarType } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { fetchCarsWithPhotos } from '../../../lib/db/cars/cars-page/cars';

const NUMBER_OF_CARS = 4;

export const CarGrid: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { ref, isInView } = useInView();

  const [cars, setCars] = useState<CarType[]>([]);

  async function handleFetchCarsWithPhotos() {
    try {
      const fetchedCars = await fetchCarsWithPhotos(NUMBER_OF_CARS);
      setCars(fetchedCars);
      console.log('fetched cars are: ', fetchedCars)
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  }

  useEffect(() => {
    handleFetchCarsWithPhotos();
  }, []);

  return (
    <section className="py-16 pb-32 https://sevenluxurycarrental.com/wp-content/uploads/2024/08/benefits-of-renting-an-exotic-car-in-dubai.jpg">
      <div className="max-w-[1450px] mx-auto px-8 sm:px-12 lg:px-16">
        {/* Header Section */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-16"
        >
          <motion.span
            variants={fadeInUp}
            className="text-sm font-semibold tracking-wider text-transparent bg-gradient-to-r from-red-500 to-red-600 bg-clip-text uppercase"
            id="popular-cars"
          >
            Mașini Populare
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
          >
            Cele mai populare oferte de închirieri auto
          </motion.h2>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5"
        >
          {cars.map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mt-16"
        >
          <Button variant="outline" size="lg" className="inline-flex items-center gap-2 rounded-2xl border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300"
            onClick={() => navigate('/cars')}
          >
            Vezi Toate Vehiculele
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};