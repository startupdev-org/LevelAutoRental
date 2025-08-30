import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { testimonials } from '../../../data/testimonials';
import { useInView } from '../../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Card } from '../../../components/ui/Card';
import { useTranslation } from 'react-i18next';

export const Testimonials: React.FC = () => {

  const { t } = useTranslation();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const { ref, isInView } = useInView();

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextTestimonial, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-20 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={staggerContainer}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          className="text-center mb-12"
        >
          <motion.span
            variants={fadeInUp}
            className="text-sm font-semibold tracking-wider text-gray-400 uppercase"
            id="testimonials"
          >
            {t("testimonials.sectionLabel")}
          </motion.span>
          <motion.h2
            variants={fadeInUp}
            className="mt-3 text-3xl md:text-5xl font-bold text-gray-900 leading-tight"
          >
            {t("testimonials.sectionTitle")}
          </motion.h2>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate={isInView ? "animate" : "initial"}
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
          className="relative"
        >
          {/* Prev Button */}
          <div className="absolute inset-y-0 left-0 flex items-center z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={prevTestimonial}
              className="hidden md:flex w-10 h-10 bg-white rounded-full shadow-md items-center justify-center text-gray-600 hover:text-theme-500 hover:shadow-lg"
              style={{ top: '60%', transform: 'translateY(-60%)' }}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Next Button */}
          <div className="absolute inset-y-0 right-0 flex items-center z-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextTestimonial}
              className="hidden md:flex w-10 h-10 bg-theme-500 text-white rounded-full shadow-md items-center justify-center hover:bg-theme-600"
              style={{ top: '60%', transform: 'translateY(-60%)' }}
            >
              <ChevronRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Testimonial Card */}
          <Card className="p-6 md:p-10 mt-10 max-w-3xl md:max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Left photo */}
              <div>
                <motion.img
                  key={currentIndex}
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                  src={currentTestimonial.avatar}
                  alt={currentTestimonial.name}
                  className="w-full h-[320px] md:h-[360px] object-cover rounded-2xl"
                />
              </div>

              {/* Right content */}
              <div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  {currentTestimonial.comment}
                </p>

                <div className="mt-6">
                  <div className="text-xl font-semibold text-gray-900">
                    {currentTestimonial.name}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${i < currentTestimonial.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                      />
                    ))}
                    <span className="ml-2 text-gray-600 text-sm">
                      {currentTestimonial.rating.toFixed(1)}
                    </span>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-6 flex items-center gap-2">
                    {testimonials.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`${index === currentIndex ? 'w-10 bg-theme-500' : 'w-6 bg-gray-300'} h-1 rounded-full transition-all`}
                        aria-label={`Go to testimonial ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};