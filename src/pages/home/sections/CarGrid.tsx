import { motion } from 'framer-motion';
import { Fuel, Star, Users, Snowflake, Settings, ArrowRight, Calendar } from 'lucide-react';
import React, { useState } from 'react';
import { useInView } from '../../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Button } from '../../../components/ui/Button';
import { CarCard } from '../../cars/CarCard';
import { Car } from '../../../types';
import { useNavigate } from 'react-router-dom';


export const CarGrid: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { ref, isInView } = useInView();

  const cars: Car[] = [
    {
      id: 1,
      name: "Mercedes-AMG C43",
      year: 2018,
      image: "/cars/c43/c43-1.jpg",
      photoGallery: [
        "/cars/c43/c43-1.jpg",
        "/cars/c43/c43-2.jpg",
        "/cars/c43/c43-3.jpg",
        "/cars/c43/c43-4.jpg",
        "/cars/c43/c43-5.jpg"
      ],
      rating: 4.9,
      reviews: 156,
      seats: 5,
      transmission: "Automatic",
      fuelType: "gasoline",
      pricePerDay: 280,
      category: 'luxury',
      features: ["V6 BiTurbo 3.0L", "4MATIC AWD", "Sport-Lux Interior"],
      mileage: 45000,
      fuelConsumption: 18,
      drivetrain: "AWD",
      availability: "Liber de 2 septembrie, 14:00"
    },
    {
      id: 2,
      name: "Mercedes GLE",
      year: 2021,
      image: "/cars/gle/gle-1.jpg",
      photoGallery: [
        "/cars/gle/gle-1.jpg",
        "/cars/gle/gle-2.jpg",
        "/cars/gle/gle-3.jpg",
        "/cars/gle/gle-4.jpg",
        "/cars/gle/gle-5.jpg"
      ],
      rating: 4.8,
      reviews: 134,
      seats: 7,
      transmission: "Automatic",
      fuelType: "gasoline",
      pricePerDay: 420,
      category: 'luxury',
      features: ["Motor Benzină 2.0L", "Interior Premium", "Design Imponător"],
      mileage: 68000,
      fuelConsumption: 22,
      drivetrain: "AWD",
      availability: "Liber de 5 septembrie, 10:00"
    },
    {
      id: 3,
      name: "Mercedes CLS",
      year: 2022,
      image: "/cars/cls/cls-1.jpg",
      photoGallery: [
        "/cars/cls/cls-1.jpg",
        "/cars/cls/cls-2.jpg",
        "/cars/cls/cls-3.jpg",
        "/cars/cls/cls-4.jpg",
        "/cars/cls/cls-6.jpg"
      ],
      rating: 4.9,
      reviews: 187,
      seats: 4,
      transmission: "Automatic",
      fuelType: "diesel",
      pricePerDay: 380,
      category: 'luxury',
      features: ["Motor 3.0 Diesel", "Interior Luxos Premium", "Confort Exclusiv"],
      mileage: 52000,
      fuelConsumption: 16,
      drivetrain: "RWD"
    },
    {
      id: 4,
      name: "Maserati Ghibli",
      year: 2017,
      image: "/cars/maserati/maserati-1.jpg",
      photoGallery: [
        "/cars/maserati/maserati-1.jpg",
        "/cars/maserati/maserati-2.jpg",
        "/cars/maserati/maserati-3.jpg",
        "/cars/maserati/maserati-4.jpg",
        "/cars/maserati/maserati-5.jpg"
      ],
      rating: 4.9,
      reviews: 203,
      seats: 5,
      transmission: "Automatic",
      fuelType: "gasoline",
      pricePerDay: 520,
      category: 'luxury',
      features: ["Motor V6 3.0", "Interior Premium Piele", "Ocazii Speciale"],
      mileage: 78000,
      fuelConsumption: 25,
      drivetrain: "RWD",
      availability: "Liber de 8 septembrie, 16:00"
    },
  ];


  return (
    <section className="py-16 pb-32 ">
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
            <CarCard key={car.name} car={car} index={index} />
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