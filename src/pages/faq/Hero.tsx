import { motion } from 'framer-motion';
import React from 'react';
import { useInView } from '../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../utils/animations';

export const Hero: React.FC = () => {
  const { ref, isInView } = useInView();

  return (
    <section className="relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat flex items-center justify-center" style={{ backgroundImage: 'url(/bg-hero.jpg)' }}>
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      <div className="relative z-10 text-center">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="max-w-4xl mx-auto px-6"
        >
          <motion.span
            variants={fadeInUp}
            className="text-sm font-semibold tracking-wider text-theme-500 uppercase bg-gradient-to-r from-theme-500 to-theme-600 bg-clip-text"
          >
            Help & Support
          </motion.span>
          <motion.h1
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl mx-auto drop-shadow-lg"
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            variants={fadeInUp}
            className="mt-4 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md"
          >
            Find answers to common questions about our car rental services
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
};