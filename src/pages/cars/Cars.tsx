import { motion } from 'framer-motion';
import React from 'react';
import { cars } from '../../data/cars';
import { useInView } from '../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { CarCard } from './CarCard';



export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Results header */}
      <div className="max-w-[1450px] mx-auto px-8 sm:px-12 lg:px-16 py-16">
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
          >
            Our Fleet
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
          >
            Our Fleet ({cars.length} vehicles)
          </motion.h2>
        </motion.div>

        {/* Cars Grid */}
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
      </div>
    </div>
  );
};
