import { motion } from 'framer-motion';
import { Fuel, Star, Users, Snowflake, Settings, ArrowRight, Calendar } from 'lucide-react';
import React, { useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Button } from '../ui/Button';
import { CarCard } from '../../pages/cars/CarCards';
import { Car } from '../../types';


export const CarGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { ref, isInView } = useInView();

  const cars: Car[] = [
    {
      id: 1,
      name: "Toyota Rav 4",
      year: 2025,
      image: "https://hips.hearstapps.com/hmg-prod/images/2025-toyota-rav4-101-6707e09a230c3.jpg?crop=0.946xw:0.883xh;0,0.117xh&resize=2048:*",
      rating: 4.7,
      reviews: 134,
      seats: 5,
      transmission: "Automatic",
      fuelType: "gasoline",
      pricePerDay: 42,
      category: 'suv',
      features: ["Air Conditioning", "Bluetooth", "USB Ports"],
    },
    {
      id: 2,
      name: "Honda Civic",
      year: 2025,
      image: "https://hips.hearstapps.com/hmg-prod/images/2025-honda-civic-si-113-66e83d9bc4d8a.jpg?crop=1xw:1xh;center,top&resize=980:*",
      rating: 4.6,
      reviews: 98,
      seats: 5,
      transmission: "Manual",
      fuelType: "gasoline",
      pricePerDay: 39,
      category: 'compact',
      features: ["Air Conditioning", "Backup Camera", "Bluetooth"],
    },
    {
      id: 3,
      name: "BMW 3 Series",
      year: 2021,
      image: "https://hips.hearstapps.com/hmg-prod/images/2021-bmw-3-series-mmp-1-1593549868.jpg?crop=0.865xw:0.811xh;0.0304xw,0.0960xh&resize=2048:*",
      rating: 4.8,
      reviews: 145,
      seats: 5,
      transmission: "Automatic",
      fuelType: "diesel",
      category: 'compact',
      pricePerDay: 72,
      features: []
    },
    {
      id: 4,
      name: "Ford Focus",
      year: 2018,
      image: "https://hips.hearstapps.com/hmg-prod/amv-prod-cad-assets/wp-content/uploads/2016/10/2016-Ford-Focus-RS-106.jpg?resize=980:*",
      rating: 4.5,
      reviews: 76,
      seats: 5,
      transmission: "Manual",
      fuelType: "petrol",
      category: 'compact',
      pricePerDay: 35,
      features: []
    },
  ];


  return (
    <section className="py-16 mt-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-12"
        >
          <motion.span
            variants={fadeInUp}
            className="text-sm font-semibold tracking-wider text-gray-400 uppercase"
            id="popular-cars"
          >
            Popular Cars
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-gray-900 leading-tight"
          >
            Most popular cars rental deals
          </motion.h2>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
        >
          {cars.map((car, index) => (
            <CarCard key={car.name} car={car} index={index} />
          ))}
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" className="inline-flex items-center gap-2 rounded-3xl">
            Show All Vehicles
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};