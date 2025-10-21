import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { useInView } from '../../hooks/useInView';
import { useTranslation } from 'react-i18next';
import { reviews } from '../../data/reviews';
import { ReviewCard } from './sections/ReviewCard';
import { Star, Heart, Award, TrendingUp, CarFront } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Reviews: React.FC = () => {
    const { t } = useTranslation();
    const { ref, isInView } = useInView();
    const [isDesktop, setIsDesktop] = useState<boolean>(
        globalThis.window?.matchMedia("(min-width: 640px)").matches ?? false
    );

    const navigate = useNavigate();

    console.log('is Desktop: ', isDesktop)

    useEffect(() => {
        if (globalThis.window === undefined) return;

        const mediaQuery = globalThis.window.matchMedia("(min-width: 640px)");
        const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

        // ✅ Set initial value and listen for changes
        setIsDesktop(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);

        // 🧹 Clean up listener on unmount
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);


    // derived stats
    const totalReviews = reviews.length;
    const avgRating = totalReviews
        ? (reviews.reduce((sum, r) => sum + (r.rating ?? 0), 0) / totalReviews)
            .toFixed(1)
        : "0.0";
    const satisfactionPercent = totalReviews
        ? Math.round((reviews.filter((r) => (r.rating ?? 0) >= 4).length / totalReviews) * 100)
        : 0;

    return (
        <div className="min-h-screen font-montserrat">
            {/* Hero Section */}
            <section
                className={`relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat 
          pt-36 font-montserrat text-white overflow-hidden
          ${isDesktop ? "bg-fixed bg-cover bg-center bg-no-repeat" : "bg-cover bg-center bg-no-repeat"}
          `}
                style={{
                    backgroundImage: isDesktop ? "url(/LevelAutoRental/lvl_bg.png)" : "none",
                    backgroundPosition: "center -420px",
                }}
            >
                {/* Dark Overlay with gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-red-900/30" />

                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 overflow-visible relative z-10">
                    <div className="flex items-center justify-center h-full pt-16">
                        {/* Centered Text Content */}
                        <div className="text-center space-y-10 max-w-4xl">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <p className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                        {t('pages.reviews.hero.label')}
                                    </p>
                                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                                        {t('pages.reviews.hero.title')}
                                    </h1>
                                    <p className="text-lg md:text-xl text-gray-200 max-w-2xl mx-auto">
                                        {t('pages.reviews.hero.description')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            {/* Reviews Grid Section */}
            <section className="py-20 bg-gradient-to-br from-gray-50 to-white relative overflow-hidden font-montserrat">
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.1, 0.2, 0.1],
                        }}
                        transition={{
                            duration: 8,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        className="absolute -top-20 -right-20 w-80 h-80 bg-red-100 rounded-full blur-3xl"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.05, 0.15, 0.05],
                        }}
                        transition={{
                            duration: 10,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 2
                        }}
                        className="absolute -bottom-20 -left-20 w-96 h-96 bg-red-200 rounded-full blur-3xl"
                    />
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                    <motion.div
                        ref={ref}
                        variants={staggerContainer}
                        initial="initial"
                        animate={isInView ? "animate" : "initial"}
                        className="text-center mb-16"
                    >
                        <motion.span
                            variants={fadeInUp}
                            className="text-sm font-semibold tracking-wider text-red-500 uppercase"
                        >
                            {t('pages.reviews.sectionLabel')}
                        </motion.span>
                        <motion.h2
                            variants={fadeInUp}
                            className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
                        >
                            {t('pages.reviews.sectionTitle')}
                        </motion.h2>
                        <motion.p
                            variants={fadeInUp}
                            className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
                        >
                            {t('pages.reviews.sectionDescription')}
                        </motion.p>
                    </motion.div>


                    {/* Stats Section */}
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 mb-16"
                    >
                        <motion.div
                            variants={fadeInUp}
                            whileHover={{
                                scale: 1.05,
                                y: -5,
                                boxShadow: "0 20px 40px rgba(239, 68, 68, 0.15)"
                            }}
                            className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl px-6 py-8 flex flex-col items-center justify-center text-center border border-red-200 hover:border-red-300 transition-all duration-300"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4"
                            >
                                <Award className="w-8 h-8 text-white" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="text-3xl md:text-4xl font-extrabold text-red-600 mb-2"
                            >
                                {totalReviews}
                            </motion.div>
                            <div className="text-sm md:text-base text-gray-700 font-medium">
                                {t('pages.reviews.stats.totalReviews')}
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            whileHover={{
                                scale: 1.05,
                                y: -5,
                                boxShadow: "0 20px 40px rgba(239, 68, 68, 0.15)"
                            }}
                            className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl px-6 py-8 flex flex-col items-center justify-center text-center border border-red-200 hover:border-red-300 transition-all duration-300"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4"
                            >
                                <Star className="w-8 h-8 text-white" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="text-3xl md:text-4xl font-extrabold text-red-600 mb-2"
                            >
                                {avgRating}
                            </motion.div>
                            <div className="text-sm md:text-base text-gray-700 font-medium">
                                {t('pages.reviews.stats.averageRating')}
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            whileHover={{
                                scale: 1.05,
                                y: -5,
                                boxShadow: "0 20px 40px rgba(239, 68, 68, 0.15)"
                            }}
                            className="bg-gradient-to-br from-red-50 to-red-100 rounded-3xl px-6 py-8 flex flex-col items-center justify-center text-center border border-red-200 hover:border-red-300 transition-all duration-300"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mb-4"
                            >
                                <TrendingUp className="w-8 h-8 text-white" />
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.6 }}
                                className="text-3xl md:text-4xl font-extrabold text-red-600 mb-2"
                            >
                                {satisfactionPercent}%
                            </motion.div>
                            <div className="text-sm md:text-base text-gray-700 font-medium">
                                {t('pages.reviews.stats.satisfaction')}
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Reviews Grid with enhanced animations */}
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate={isInView ? "animate" : "initial"}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {reviews.map((review, index) => (
                                <motion.div
                                    key={review.id}
                                    variants={fadeInUp}
                                    initial={{ opacity: 0, y: 50, scale: 0.9 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -50, scale: 0.9 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: index * 0.1,
                                        ease: "easeOut"
                                    }}
                                    whileHover={{
                                        y: -8,
                                        scale: 1.02,
                                        transition: { duration: 0.2 }
                                    }}
                                    className="w-full"
                                >
                                    <div className="h-full">
                                        <ReviewCard review={review} index={index} />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>


                    <motion.div
                        variants={fadeInUp}
                        className="mt-20 flex justify-center"
                    >
                        <motion.div
                            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl max-w-4xl w-full text-center"
                            whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <h3 className="text-    2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                                Ready to Experience Excellence?
                            </h3>
                            <p className="text-gray-300 mb-8 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
                                Join thousands of satisfied customers who trust LevelAutoRental for their car rental needs.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <motion.button
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/cars')}
                                >
                                    Book Your Car Now
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                </div>
            </section>
        </div >
    );
};