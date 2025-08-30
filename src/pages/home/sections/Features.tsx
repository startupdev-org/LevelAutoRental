import { motion } from 'framer-motion';
import { Award, Clock, DollarSign, Headphones } from 'lucide-react';
import React from 'react';
import { useInView } from '../../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Card } from '../../../components/ui/Card';
import { useTranslation } from 'react-i18next';


export const Features: React.FC = () => {

  const { t } = useTranslation();
  const { ref, isInView } = useInView();

  const features = [
    {
      icon: DollarSign,
      title: t("features.bestPrices.title"),
      description: t("features.bestPrices.description")
    },
    {
      icon: Headphones,
      title: t("features.support.title"),
      description: t("features.support.description")
    },
    {
      icon: Clock,
      title: t("features.easyBooking.title"),
      description: t("features.easyBooking.description")
    },
    {
      icon: Award,
      title: t("features.wideSelection.title"),
      description: t("features.wideSelection.description")
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
            {t("features.sectionLabel")}
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
          >
            {t("features.sectionTitle")}
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