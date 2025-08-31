import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { useInView } from '../../hooks/useInView';
import { Hero } from "./Hero";
import { Questions } from "./Questions";


export const FAQ: React.FC = () => {
  return (
    <div>
      {/* <Hero /> */}
      <Questions />
    </div>
  )
}