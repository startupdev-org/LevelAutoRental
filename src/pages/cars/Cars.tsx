import { motion } from 'framer-motion';
import React from 'react';
import { cars } from '../../data/cars';
import { useInView } from '../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { CarCard } from './CarCard';



export const Cars: React.FC = () => {
  const { ref, isInView } = useInView();

  return (
    <div className="min-h-screen bg-gray-50 p-20">
      {/* Results header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="flex justify-between items-center"
        >
          <h2 className="text-xl font-semibold text-gray-900">
            Our Fleet ({cars.length} vehicles)
          </h2>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Cars Grid */}
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {cars.map((car, index) => (
            <CarCard key={car.id} car={car} index={index} />
          ))}
        </motion.div>
      </div>
    </div>
  );
};
