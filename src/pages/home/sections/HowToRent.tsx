import { motion } from 'framer-motion';
import { MapPin, Calendar, Car, DollarSign } from 'lucide-react';
import React from 'react';
import { useInView } from '../../../hooks/useInView';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { BanknotesIcon, KeyIcon } from '@heroicons/react/24/solid'
import { useTranslation } from 'react-i18next';


export const HowToRent: React.FC = () => {

    const { t } = useTranslation();

    const { ref, isInView } = useInView();

    const steps = [
        {
            icon: MapPin,
            title: t("howToRent.steps.contact.title"),
            description: t("howToRent.steps.contact.description"),
            isActive: false
        },
        {
            icon: Calendar,
            title: t("howToRent.steps.details.title"),
            description: t("howToRent.steps.details.description"),
            isActive: true
        },
        {
            icon: BanknotesIcon,
            title: t("howToRent.steps.price.title"),
            description: t("howToRent.steps.price.description"),
            isActive: false
        },
        {
            icon: KeyIcon,
            title: t("howToRent.steps.pickup.title"),
            description: t("howToRent.steps.pickup.description"),
            isActive: true
        },
        {
            icon: Car,
            title: t("howToRent.steps.return.title"),
            description: t("howToRent.steps.return.description"),
            isActive: false
        }
    ];

    return (
        <section className="py-20 mt-20 bg-white">
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
                        className="text-sm font-semibold tracking-wider text-red-500 uppercase"
                    >
                        {t("howToRent.sectionLabel")}
                    </motion.span>
                    <motion.h2
                        variants={fadeInUp}
                        className="mt-3 text-3xl md:text-5xl font-bold text-gray-800 leading-tight max-w-3xl mx-auto"
                    >
                        {t("howToRent.sectionTitle")}
                    </motion.h2>
                </motion.div>

                {/* Steps Grid */}
                <div className="relative">
                    {/* Connecting Lines */}
                    <div className="hidden lg:block absolute top-8 left-1/5 right-1/5 h-0.5 border-t-2 border-dashed border-gray-300"></div>
                    <div className="hidden lg:block absolute top-8 left-2/5 right-2/5 h-0.5 border-t-2 border-dashed border-gray-300"></div>
                    <div className="hidden lg:block absolute top-8 left-3/5 right-3/5 h-0.5 border-t-2 border-dashed border-gray-300"></div>
                    <div className="hidden lg:block absolute top-8 left-4/5 right-4/5 h-0.5 border-t-2 border-dashed border-gray-300"></div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 relative">
                        {steps.map((step) => (
                            <motion.div
                                key={step.title}
                                variants={fadeInUp}
                                className="text-center relative"
                            >
                                <div
                                    className={`w-16 h-16 rounded-2xl mx-auto mb-4 shadow-lg flex items-center justify-center ${step.isActive
                                        ? "bg-gradient-to-b from-red-500 to-red-600"
                                        : "bg-white border-2 border-gray-200"
                                        }`}
                                >
                                    <step.icon
                                        className={`w-8 h-8 ${step.isActive ? "text-white" : "text-red-500"
                                            }`}
                                    />
                                </div>
                                <div className="text-xl font-bold text-gray-800 mb-3">
                                    {step.title}
                                </div>
                                <div className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                                    {step.description}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};