import { motion } from 'framer-motion';
import { Award, Clock, DollarSign, Headphones } from 'lucide-react';
import React from 'react';
import { useInView } from '../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Card } from '../ui/Card';

export const Features: React.FC = () => {
  const { ref, isInView } = useInView();

  const features = [
    {
      icon: DollarSign,
      title: 'Best Prices',
      description: 'Competitive rates with no hidden fees. Get the best value for your money with our transparent pricing.'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Round-the-clock customer service to assist you whenever you need help during your rental period.'
    },
    {
      icon: Clock,
      title: 'Easy Booking',
      description: 'Simple and fast booking process. Reserve your car in just a few clicks with instant confirmation.'
    },
    {
      icon: Award,
      title: 'Wide Selection',
      description: 'Choose from our extensive fleet of well-maintained vehicles to suit every need and budget.'
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
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
            Why Choose Us
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Experience the difference with our premium car rental service
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={fadeInUp}>
              <Card className="p-6 text-center h-full">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.2 }}
                  className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <feature.icon className="w-8 h-8 text-blue-600" />
                </motion.div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};