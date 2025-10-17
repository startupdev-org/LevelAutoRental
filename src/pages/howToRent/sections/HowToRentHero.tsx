import { motion } from 'framer-motion';
import React from 'react';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { useTranslation } from 'react-i18next';

export const HowToRentHero: React.FC = () => {
    const { t } = useTranslation();

    const steps = [
        {
            number: 1,
            title: t("howToRent.steps.contact.title"),
            description: t("howToRent.steps.contact.description")
        },
        {
            number: 2,
            title: t("howToRent.steps.details.title"),
            description: t("howToRent.steps.details.description")
        },
        {
            number: 3,
            title: t("howToRent.steps.price.title"),
            description: t("howToRent.steps.price.description")
        },
        {
            number: 4,
            title: t("howToRent.steps.pickup.title"),
            description: t("howToRent.steps.pickup.description")
        },
        {
            number: 5,
            title: t("howToRent.steps.return.title"),
            description: t("howToRent.steps.return.description")
        }
    ];

    return (
        <section className="relative py-60 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url(/LevelAutoRental/lvl_bg.png)', backgroundPosition: 'center -150px' }}>
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black/60"></div>
            
            <div className="relative max-w-7xl mx-auto">
                {/* Header Section */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <motion.span
                        variants={fadeInUp}
                        className="text-sm font-semibold tracking-wider text-red-500 uppercase"
                    >
                        {t("howToRent.sectionLabel")}
                    </motion.span>
                    <motion.h2
                        variants={fadeInUp}
                        className="mt-4 text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto drop-shadow-lg"
                    >
                        {t("howToRent.sectionTitle")}
                    </motion.h2>
                    <motion.p
                        variants={fadeInUp}
                        className="mt-6 text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-md"
                    >
                        {t("howToRent.sectionDescription")}
                    </motion.p>
                </motion.div>

                {/* Steps Grid */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-6"
                >
                    {steps.map((step, index) => (
                        <motion.div
                            key={step.title}
                            variants={fadeInUp}
                            className="relative group"
                        >
                            {/* Card Background */}
                            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full">
                                {/* Number Badge */}
                                <div className="flex justify-center mb-6">
                                    <motion.div
                                        whileHover={{ scale: 1.1 }}
                                        transition={{ duration: 0.2 }}
                                        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-lg"
                                    >
                                        <span className="text-2xl font-bold text-white">
                                            {step.number}
                                        </span>
                                    </motion.div>
                                </div>
                                
                                {/* Content */}
                                <div className="text-center">
                                    <h3 className="text-xl font-bold text-white mb-4 leading-tight">
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-200 text-sm leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Connecting Arrow */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};