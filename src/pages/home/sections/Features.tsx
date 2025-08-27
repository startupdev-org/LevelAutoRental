import { motion } from 'framer-motion';
import { Award, Clock, DollarSign, Headphones } from 'lucide-react';
import React from 'react';
import { useInView } from '../../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Card } from '../../../components/ui/Card';

export const Features: React.FC = () => {
  const { ref, isInView } = useInView();

  const features = [
    {
      icon: DollarSign,
      title: 'Cele mai bune prețuri',
      description: 'Tarife competitive fără costuri ascunse. Obțineți cea mai bună valoare pentru banii voștri cu prețurile noastre transparente.'
    },
    {
      icon: Headphones,
      title: 'Suport 24/7',
      description: 'Serviciu clienți non-stop pentru a vă ajuta oricând aveți nevoie de asistență în perioada de închiriere.'
    },
    {
      icon: Clock,
      title: 'Rezervare ușoară',
      description: 'Proces simplu și rapid de rezervare. Rezervați mașina în doar câteva clicuri cu confirmare instantanee.'
    },
    {
      icon: Award,
      title: 'Selecție largă',
      description: 'Alegeți din flota noastră extinsă de vehicule bine întreținute pentru a satisface fiecare nevoie și buget.'
    }
  ];

  return (
    <section className="py-20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            className="text-sm font-semibold tracking-wider text-red-500 uppercase bg-gradient-to-r from-red-500 to-red-600 bg-clip-text"
            id="why-choose-us"
          >
            De ce să ne alegeți
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
          >
            Oferim cea mai bună experiență cu ofertele noastre de închirieri
          </motion.h2>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <motion.div 
              key={feature.title} 
              variants={fadeInUp} 
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <feature.icon className="w-8 h-8 text-red-600" />
              </div>
              <div className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</div>
              <div className="text-gray-600 text-sm leading-relaxed">{feature.description}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};