import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { useTranslation } from 'react-i18next';
import { reviews } from '../../data/reviews';
import { ReviewCard } from './sections/ReviewCard';
import { Star, Award, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Reviews: React.FC = () => {
    const { t } = useTranslation();
    const [isDesktop, setIsDesktop] = useState<boolean>(
        globalThis.window?.matchMedia("(min-width: 640px)").matches ?? false
    );

    const navigate = useNavigate();

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
                className="relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat pt-36 font-sans text-white overflow-hidden"
                style={{
                    backgroundImage: isDesktop ? 'url(/lvl_bg.png)' : 'url(/backgrounds/bg4-mobile.jpeg)',
                    backgroundPosition: isDesktop ? 'center -420px' : 'center -300px',
                    backgroundSize: isDesktop ? '115%' : 'cover'
                }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/70" />

                {/* Bottom Gradient Fade */}
                <div className="absolute bottom-0 left-0 w-full h-40 
            bg-[linear-gradient(to_top,rgba(15,15,15,1),rgba(15,15,15,0))] 
            z-10 pointer-events-none">
                </div>

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
                                    {/* Description removed for minimal hero */}
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

                    {/* Stats Section */}
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="mt-0 grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="bg-gray-100 rounded-2xl p-5 flex flex-row items-center gap-5"
                        >
                            <Award className="w-12 h-12 text-gray-600 flex-shrink-0" />
                            <div className="flex flex-col">
                                <div className="text-3xl font-bold text-gray-900">
                                    {totalReviews}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {t('pages.reviews.stats.totalReviews')}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="bg-gray-100 rounded-2xl p-5 flex flex-row items-center gap-5"
                        >
                            <Star className="w-12 h-12 text-gray-600 flex-shrink-0" />
                            <div className="flex flex-col">
                                <div className="text-3xl font-bold text-gray-900">
                                    {avgRating}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {t('pages.reviews.stats.averageRating')}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="bg-gray-100 rounded-2xl p-5 flex flex-row items-center gap-5"
                        >
                            <TrendingUp className="w-12 h-12 text-gray-600 flex-shrink-0" />
                            <div className="flex flex-col">
                                <div className="text-3xl font-bold text-gray-900">
                                    {satisfactionPercent}%
                                </div>
                                <div className="text-xs text-gray-600">
                                    {t('pages.reviews.stats.satisfaction')}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Reviews Grid with enhanced animations */}
                    <div
                        className="columns-1 md:columns-2 lg:columns-3 gap-6"
                    >
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.05,
                                    ease: "easeOut"
                                }}
                                whileHover={{
                                    y: -12,
                                    scale: 1.03,
                                    transition: { 
                                        duration: 0.4,
                                        ease: [0.25, 0.46, 0.45, 0.94] // Custom cubic-bezier for smooth animation
                                    }
                                }}
                                className="w-full break-inside-avoid mb-6"
                            >
                                <ReviewCard review={review} index={index} />
                            </motion.div>
                        ))}
                    </div>


                    <motion.div
                        variants={fadeInUp}
                        className="mt-16 mb-10 text-center max-w-3xl mx-auto"
                    >
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                            {t('pages.reviews.cta.title')}
                        </h3>
                        <p className="text-lg text-gray-600 mb-8">
                            {t('pages.reviews.cta.description')}
                        </p>
                        <motion.button
                            className="bg-red-600 hover:bg-red-700 text-white px-10 py-4 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/cars')}
                        >
                            {t('pages.reviews.cta.button')}
                        </motion.button>
                    </motion.div>
                </div>
            </section>
        </div >
    );
};