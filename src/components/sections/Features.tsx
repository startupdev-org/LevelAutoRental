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
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Featured car with subtle map-like backdrop and floating cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="relative"
          >
            <img
              src="/bmw.png"
              alt="Featured car"
              className="w-full max-w-xl md:max-w-2xl h-auto select-none pointer-events-none drop-shadow-[0_35px_45px_rgba(0,0,0,0.35)] lg:-mr-10 mt-20"
            />
          </motion.div>

          {/* Right: Headline and reasons */}
          <motion.div
            ref={ref}
            variants={staggerContainer}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="lg:pl-6"
          >
            <motion.span
              variants={fadeInUp}
              className="text-sm font-semibold tracking-wider text-gray-400 uppercase"
              id="why-choose-us"
            >
              Why choose us
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-3 text-3xl md:text-5xl font-bold text-gray-900 leading-tight"
            >
              We offer the best experience with our rental deals
            </motion.h2>

            <div className="mt-8 space-y-6">
              {features.map((feature) => (
                <motion.div key={feature.title} variants={fadeInUp} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0">
                    <feature.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gray-900">{feature.title}</div>
                    <div className="text-gray-600 text-sm max-w-md">{feature.description}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};