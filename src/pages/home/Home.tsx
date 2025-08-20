import React, { useEffect, useState } from "react";
import { CarGrid } from "./sections/CarGrid";
import { Features } from "./sections/Features";
import { Hero } from "./sections/Hero";
import { Testimonials } from "./sections/Testimonials";

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
