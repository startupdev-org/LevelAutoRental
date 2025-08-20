import { motion } from 'framer-motion';
import { Fuel, Star, Users, Snowflake, Settings, ArrowRight, Calendar } from 'lucide-react';
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

  const formatPrice = (value: number) => new Intl.NumberFormat('en-US').format(value);

  return (
    <motion.div
      ref={ref}
      variants={fadeInUp}
      initial="initial"
      animate={isInView ? "animate" : "initial"}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="overflow-hidden rounded-3xl border-2 border-gray-200 shadow-lg hover:shadow-2xl transition-shadow bg-white w-full md:w-[700px] lg:w-[900px] mx-auto">


        <div className="p-5">
          <div className="bg-gray-50 rounded-xl h-44 flex items-center justify-center overflow-hidden">
            <a href={car.image} target="_blank" rel="noopener noreferrer" className="block">
              <motion.img
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
                src={car.image}
                alt={car.name}
                className="h-64 w-full object-contain select-none pointer-events-auto drop-shadow rounded-xl"
              />
            </a>
          </div>


          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span>{car.rating.toFixed(1)}</span>
            <span className="text-gray-400">({car.reviews}+ reviews)</span>
          </div>

          <h3 className="mt-1 text-lg font-semibold text-gray-900">{car.name}</h3>

          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600">
            <div className="flex items-center gap-2"><Users className="w-4 h-4" /><span>{car.seats} Passengers</span></div>
            <div className="flex items-center gap-2"><Settings className="w-4 h-4" /><span className="capitalize">{car.transmission}</span></div>
            <div className="flex items-center gap-2"><Snowflake className="w-4 h-4" /><span>Air Conditioning</span></div>
            <div className="flex items-center gap-2"><Fuel className="w-4 h-4" /><span className="capitalize">{car.fuelType}</span></div>
          </div>


          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-gray-900">${car.pricePerDay}</span>
              <span className="text-gray-500 text-sm">/day</span>
            </div>
            <button className="text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-2">
              Rent Now
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

export const CarGrid: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { ref, isInView } = useInView();

  const cars = [
    {
      id: 1,
      name: "Toyota Rav 4",
      year: 2025,
      image: "https://hips.hearstapps.com/hmg-prod/images/2025-toyota-rav4-101-6707e09a230c3.jpg?crop=0.946xw:0.883xh;0,0.117xh&resize=2048:*",
      rating: 4.7,
      reviews: 134,
      seats: 5,
      transmission: "automatic",
      fuelType: "gas",
      pricePerDay: 42,
    },
    {
      id: 2,
      name: "Honda Civic",
      year: 2025,
      image: "https://hips.hearstapps.com/hmg-prod/images/2025-honda-civic-si-113-66e83d9bc4d8a.jpg?crop=1xw:1xh;center,top&resize=980:*",
      rating: 4.6,
      reviews: 98,
      seats: 5,
      transmission: "manual",
      fuelType: "petrol",
      pricePerDay: 39,
    },
    {
      id: 3,
      name: "BMW 3 Series",
      year: 2021,
      image: "https://hips.hearstapps.com/hmg-prod/images/2021-bmw-3-series-mmp-1-1593549868.jpg?crop=0.865xw:0.811xh;0.0304xw,0.0960xh&resize=2048:*",
      rating: 4.8,
      reviews: 145,
      seats: 5,
      transmission: "automatic",
      fuelType: "diesel",
      pricePerDay: 72,
    },
    {
      id: 4,
      name: "Ford Focus",
      year: 2018,
      image: "https://hips.hearstapps.com/hmg-prod/amv-prod-cad-assets/wp-content/uploads/2016/10/2016-Ford-Focus-RS-106.jpg?resize=980:*",
      rating: 4.5,
      reviews: 76,
      seats: 5,
      transmission: "manual",
      fuelType: "petrol",
      pricePerDay: 35,
    },
  ];


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