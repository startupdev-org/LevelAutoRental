import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { fadeInUp } from '../utils/animations';
import { useTranslation } from 'react-i18next';

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main content with background */}
      <section
        className="relative flex-1 bg-cover bg-no-repeat bg-fixed bg-center min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: window.innerWidth < 768
            ? "url('/LevelAutoRental/backgrounds/bg10-mobile.jpeg')"
            : "url('/LevelAutoRental/backgrounds/bg2-desktop.jpeg')",
          backgroundPosition: 'center center',
          backgroundSize: 'cover'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 w-full h-40 
            bg-[linear-gradient(to_top,rgba(15,15,15,1),rgba(15,15,15,0))] 
            z-20 pointer-events-none">
        </div>

        {/* Content */}
        <div className="relative z-30 w-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            className="max-w-2xl w-full text-center"
          >
            {/* 404 Number */}
            <motion.h1
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-[100px] md:text-[150px] font-extrabold text-white/20 leading-none mb-6"
            >
              404
            </motion.h1>

            {/* Title */}
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('notFound.title')}
            </h2>

            {/* Description */}
            <p className="text-lg text-gray-300 mb-10 max-w-xl mx-auto">
              {t('notFound.description')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/')}
                className="px-8 py-4 bg-theme-500 hover:bg-theme-600 text-white font-semibold rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                {t('notFound.goBackHome')}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="px-8 py-4 border-2 border-white/30 hover:border-white/50 text-white font-semibold rounded-2xl transition-all duration-300 bg-white/10 backdrop-blur-sm flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                {t('notFound.goBack')}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default NotFound;
