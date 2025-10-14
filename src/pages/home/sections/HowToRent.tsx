import { motion } from 'framer-motion';
import React from 'react';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { useTranslation } from 'react-i18next';

export const HowToRent: React.FC = () => {
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
        <section className="bg-gray-50 py-20 mt-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <motion.span
                        variants={fadeInUp}
                        className="text-sm font-semibold tracking-wider text-red-500 uppercase bg-gradient-to-r from-red-500 to-red-600 bg-clip-text"
                    >
                        {t("howToRent.sectionLabel")}
                    </motion.span>
                    <motion.h2
                        variants={fadeInUp}
                        className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
                    >
                        {t("howToRent.sectionTitle")}
                    </motion.h2>
                    <motion.p
                        variants={fadeInUp}
                        className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto"
                    >
                        {t("howToRent.sectionDescription")}
                    </motion.p>
                </motion.div>

                {/* Timeline Steps */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="mx-auto mt-12 grid max-w-md grid-cols-1 gap-10 sm:mt-16 lg:mt-20 lg:max-w-5xl lg:grid-cols-5"
                >
                    {steps.map((step, index) => (
                        <motion.li
                            key={step.title}
                            variants={fadeInUp}
                            className="flex-start group relative flex lg:flex-col lg:items-center"
                        >
                            {/* Connecting Line */}
                            {index < steps.length - 1 && (
                                <span 
                                    className="absolute left-[24px] top-16 h-[calc(100%_-_40px)] w-px bg-gradient-to-b from-red-300 to-red-500 lg:right-0 lg:left-auto lg:top-[24px] lg:h-px lg:w-[calc(100%_-_180px)]" 
                                    aria-hidden="true"
                                />
                            )}
                            
                            {/* Number Container */}
                            <motion.div
                                whileHover={{ scale: 1.1, rotate: 5 }}
                                transition={{ duration: 0.2 }}
                                className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white bg-red-500 transition-all duration-200 group-hover:border-red-500 group-hover:bg-white shadow-lg lg:mx-auto"
                            >
                                <span className="text-lg font-bold text-white group-hover:text-red-500 transition-colors duration-200">
                                    {step.number}
                                </span>
                            </motion.div>
                            
                            {/* Content */}
                            <div className="ml-6 lg:ml-0 lg:mt-10 lg:text-center">
                                <div className="text-xl font-bold text-gray-800 mb-3">
                                    {step.title}
                                </div>
                                <div className="text-gray-500 text-sm leading-relaxed max-w-xs lg:mx-auto">
                                    {step.description}
                                </div>
                            </div>
                        </motion.li>
                    ))}
                </motion.div>
            </div>
        </section>
    );
};