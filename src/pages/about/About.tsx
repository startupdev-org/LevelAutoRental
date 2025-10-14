import { motion } from 'framer-motion';
import { Award, Car, Clock, Shield, Users, CheckCircle } from 'lucide-react';
import React from 'react';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Card } from '../../components/ui/Card';
import { useTranslation } from 'react-i18next';

export const About: React.FC = () => {
  const { t } = useTranslation();

  const stats = [
    { icon: Car, label: t('about.stats.vehicles'), value: '500+' },
    { icon: Users, label: t('about.stats.customers'), value: '10,000+' },
    { icon: Clock, label: t('about.stats.experience'), value: '15+' },
    { icon: Award, label: t('about.stats.awards'), value: '25+' }
  ];

  const values = [
    {
      icon: Shield,
      title: t('about.values.safety.title'),
      description: t('about.values.safety.description')
    },
    {
      icon: Users,
      title: t('about.values.customer.title'),
      description: t('about.values.customer.description')
    },
    {
      icon: Award,
      title: t('about.values.quality.title'),
      description: t('about.values.quality.description')
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat pt-36 font-sans" style={{ backgroundImage: 'url(/bg-hero.jpg)', backgroundPosition: 'center -420px' }}>
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible relative z-10">
          <div className="flex items-center justify-center h-full pt-16">
            {/* Centered Text Content */}
            <div className="text-center space-y-10 max-w-4xl">
              <div className="space-y-8">
                <div className="space-y-6">
            <p className="text-sm font-semibold tracking-wider text-red-500 uppercase">
              {t('about.hero.label')}
            </p>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                    {t('about.hero.title')}
                  </h1>
            {/* Description removed for minimal hero */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 mt-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="text-sm font-semibold tracking-wider text-red-500 uppercase"
            >
              {t('about.story.label')}
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
            >
              Evoluția noastră în Moldova
            </motion.h2>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Timeline */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="relative"
            >
              {/* vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-red-500 via-red-400 to-red-500 hidden lg:block" />

              <div className="space-y-10">
                {/* 2009 */}
                <div className="relative flex items-start">
                  <div className="hidden lg:flex absolute left-4 w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-lg z-10" />
                  <div className="lg:ml-16">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">2023</div>
                      <Shield className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Lansarea</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Am început cu 3 mașini și o viziune: să facem închirierile auto accesibile în Moldova.
                    </p>
                  </div>
                </div>

                {/* 2015—2020 */}
                <div className="relative flex items-start">
                  <div className="hidden lg:flex absolute left-4 w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-lg z-10" />
                  <div className="lg:ml-16">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">2023—2024</div>
                      <Award className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Primul an</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Am ajuns la 15 mașini și 200+ clienți fideli. Procese mai simple, prețuri transparente.
                    </p>
                  </div>
                </div>

                {/* Astăzi */}
                <div className="relative flex items-start">
                  <div className="hidden lg:flex absolute left-4 w-4 h-4 bg-red-500 rounded-full border-4 border-white shadow-lg z-10" />
                  <div className="lg:ml-16">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="px-3 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">Astăzi</div>
                      <CheckCircle className="w-4 h-4 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Acum</h3>
                    <p className="text-gray-600 leading-relaxed">
                      25+ mașini, rezervări online, livrare la domiciliu. Continuăm să creștem pas cu pas.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Visual */}
            <motion.div
              variants={fadeInUp}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              className="relative"
            >
              <img
                src="/lvl_bg.png"
                alt="Our story"
                className="rounded-2xl shadow-lg"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-10 mb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.span
              variants={fadeInUp}
              className="text-sm font-semibold tracking-wider text-red-500 uppercase"
            >
              {t('about.values.label')}
            </motion.span>
            <motion.h2
              variants={fadeInUp}
              className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
            >
              {t('about.values.title')}
            </motion.h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid md:grid-cols-3 gap-8"
          >
            {values.map((value, index) => (
              <motion.div key={value.title} variants={fadeInUp}>
                <div className="text-center relative">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                    className="w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center bg-gradient-to-b from-red-500 to-red-600"
                  >
                    <value.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <div className="text-xl font-bold text-gray-800 mb-3">
                    {value.title}
                  </div>
                  <div className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                    {value.description}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

    </div>
  );
};