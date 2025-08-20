import React from 'react';
import { CarGrid } from '../components/sections/CarGrid';
import { Features } from '../components/sections/Features';
import { Hero } from '../components/sections/Hero';
import { Testimonials } from '../components/sections/Testimonials';

export const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      <Features />
      <CarGrid />
      <Testimonials />
    </div>
  );
};