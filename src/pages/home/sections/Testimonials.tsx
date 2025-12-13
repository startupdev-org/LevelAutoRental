import React from 'react';
import { testimonials } from '../../../data/testimonials';
import { useTranslation } from 'react-i18next';
import { TestimonialSlider } from '../../../components/ui/TestimonialSlider';

export const Testimonials: React.FC = () => {
  const { t } = useTranslation();

  return (
    <section className="relative py-0 mt-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <span className="text-sm font-semibold tracking-wider text-red-500 uppercase bg-gradient-to-r from-red-500 to-red-600 bg-clip-text">
            {t('testimonials.sectionLabel')}
          </span>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto">
            {t('testimonials.sectionTitle')}
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            {t('testimonials.sectionDescription')}
          </p>
        </div>

        <TestimonialSlider
          testimonials={testimonials}
          showArrows={true}
          autoplay={true}
          autoplaySpeed={4000}
        />
      </div>
    </section>
  );
};