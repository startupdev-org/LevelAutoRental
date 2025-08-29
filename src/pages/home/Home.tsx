import React, { useEffect, useState } from "react";
import { CarGrid } from "./sections/CarGrid";
import { Features } from "./sections/Features";
import { Hero } from "./sections/Hero";
import { Testimonials } from "./sections/Testimonials";
import { LogoMarquee } from "../../components/sections/LogoMarquee";
import { HowToRent } from "./sections/HowToRent";

export const Home: React.FC = () => {
  return (
    <div>
      <Hero />
      <LogoMarquee />
      <CarGrid />
      <Features />
      <HowToRent />
      <Testimonials />
    </div>
  );
};
