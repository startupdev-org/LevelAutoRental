import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { useInView } from '../../hooks/useInView';
import { useTranslation } from 'react-i18next';
import { reviews } from '../../data/reviews';
import { ReviewCard } from './sections/ReviewCard';

interface GoogleReview {
    author_name: string;
    rating: number;
    text: string;
    time: number;
    profile_photo_url?: string;
}


export const Reviews: React.FC = () => {
    const { t } = useTranslation();
    const { ref, isInView } = useInView();
    const [isDesktop, setIsDesktop] = useState<boolean>(
        typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
    );

    console.log('is Desktop: ', isDesktop)

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(min-width: 640px)");
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
        <div className="min-h-screen">
            {/* Hero Section */}
            <section
                className={`relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat 
          pt-36 font-sans text-white
          ${isDesktop ? "bg-fixed bg-cover bg-center bg-no-repeat" : "bg-cover bg-center bg-no-repeat"}
          `}
                style={{
                    backgroundImage: isDesktop ? "url(/LevelAutoRental/lvl_bg.png)" : "none",
                    backgroundPosition: "center -420px",
                }}
            >
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-black/70" />

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
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

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
                        className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-4 mb-10"
                    >
                        <motion.div
                            variants={fadeInUp}
                            className="bg-gray-100 rounded-3xl px-5 py-8 flex flex-col items-center justify-center text-center"
                        >
                            <div className="text-3xl md:text-4xl font-extrabold text-red-500 mb-1">
                                {totalReviews}
                            </div>
                            <div className="text-sm md:text-base text-gray-600">
                                {t('pages.reviews.stats.totalReviews')}
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="bg-gray-100 rounded-3xl px-5 py-8 flex flex-col items-center justify-center text-center"
                        >
                            <div className="text-3xl md:text-4xl font-extrabold text-red-500 mb-1">
                                {avgRating}
                            </div>
                            <div className="text-sm md:text-base text-gray-600">
                                {t('pages.reviews.stats.averageRating')}
                            </div>
                        </motion.div>

                        <motion.div
                            variants={fadeInUp}
                            className="bg-gray-100 rounded-3xl px-5 py-8 flex flex-col items-center justify-center text-center"
                        >
                            <div className="text-3xl md:text-4xl font-extrabold text-red-500 mb-1">
                                {satisfactionPercent}%
                            </div>
                            <div className="text-sm md:text-base text-gray-600">
                                {t('pages.reviews.stats.satisfaction')}
                            </div>
                        </motion.div>
                    </motion.div>

                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        animate={isInView ? "animate" : "initial"}
                        className="flex flex-wrap -mx-3 gap-y-6"
                    >
                        {reviews.map((review, index) => (
                            <motion.div
                                key={review.id}
                                variants={fadeInUp}
                                className="w-full md:w-1/2 lg:w-1/3 px-3"
                            >
                                <div className="h-full">
                                    <ReviewCard review={review} index={index} />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>
        </div >
    );
};