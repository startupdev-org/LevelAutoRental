import { motion } from 'framer-motion';
import React from 'react';
import { fadeInUp, staggerContainer } from '../../../utils/animations';
import { Plane, Fuel } from 'lucide-react';
import { GiCarKey } from 'react-icons/gi';
import { LiaCarSideSolid } from 'react-icons/lia';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Icon renderer component to handle different icon types
const IconRenderer: React.FC<{ icon: any; className?: string }> = ({ icon, className }) => {
    return React.createElement(icon, { className });
};

export const HowToRent: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    // Journey steps for the customer experience
    const journeySteps = [
        {
            id: 'reservation',
            icon: GiCarKey,
            title: t('howToRent.journey.reservation.title'),
            description: t('howToRent.journey.reservation.description'),
            highlight: true
        },
        {
            id: 'airport',
            icon: Plane,
            title: t('howToRent.journey.airport.title'),
            description: t('howToRent.journey.airport.description'),
            highlight: false
        },
        {
            id: 'handover',
            icon: LiaCarSideSolid,
            title: t('howToRent.journey.handover.title'),
            description: t('howToRent.journey.handover.description'),
            highlight: false
        },
        {
            id: 'departure',
            icon: Fuel,
            title: t('howToRent.journey.departure.title'),
            description: t('howToRent.journey.departure.description'),
            highlight: false
        }
    ];

    return (
        <section className="relative py-20 mb-40">
            {/* Background Image - Desktop */}
            <div
                className="hidden lg:block absolute inset-0"
                style={{
                    backgroundImage: "url('/backgrounds/bg5-desktop.jpeg')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    backgroundAttachment: 'fixed',
                    zIndex: 0
                }}
            ></div>

            {/* Background Image - Tablet */}
            <div
                className="hidden md:block lg:hidden absolute inset-0"
                style={{
                    backgroundImage: "url('/lvl_bg.png')",
                    backgroundSize: 'cover',
                    backgroundPosition: 'center center',
                    backgroundRepeat: 'no-repeat',
                    zIndex: 0
                }}
            ></div>

            {/* Background Image - Mobile */}
            <div className="md:hidden absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                <img
                    src="/backgrounds/bg6-mobile.jpeg"
                    alt="Background"
                    className="w-full h-full object-cover"
                style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                    zIndex: 0
                }}
                />
            </div>

            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black/60"></div>
            
            <div className="relative max-w-[1600px] mx-auto">
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
                        className="text-sm font-semibold tracking-wider text-red-500 uppercase"
                    >
                        {t('howToRent.sectionLabel')}
                    </motion.span>
                    <motion.h2
                        variants={fadeInUp}
                        className="mt-4 text-3xl md:text-5xl font-bold text-white leading-tight max-w-4xl mx-auto drop-shadow-lg px-4 md:px-0"
                    >
                        {t('howToRent.pageTitle')}
                    </motion.h2>
                </motion.div>

                {/* Customer Journey Narrative */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="lg:max-w-9xl mx-[30px] lg:mx-auto"
                >
                    {/* Journey Flow */}
                    <div className="relative">
                        {/* Connecting Line */}
                        <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500/50 via-red-500 to-red-500/50 transform -translate-y-1/2 z-0"></div>

                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-[150px] relative z-10">
                            {journeySteps.map((step, index) => (
                                <motion.div
                                    key={step.id}
                                    variants={fadeInUp}
                                    className="relative"
                                >
                                    {/* Step Card */}
                                    <div
                                        className={`bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 h-full lg:w-[140%] lg:-ml-[20%] cursor-pointer ${step.highlight ? 'ring-2 ring-red-500/50 shadow-2xl shadow-red-500/20' : ''}`}
                                        onClick={() => navigate('/cars')}
                                    >
                                        {/* Icon */}
                                        <div className="flex justify-center mb-6">
                                            <motion.div
                                                whileHover={{ scale: 1.1, rotate: 5 }}
                                                transition={{ duration: 0.2 }}
                                                className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${step.highlight ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-white/20'}`}
                                            >
                                                <IconRenderer icon={step.icon} className="w-8 h-8 text-white" />
                                            </motion.div>
                                        </div>

                                        {/* Content */}
                                        <div className="text-center">
                                            <h3 className={`text-xl font-bold mb-4 leading-tight ${step.highlight ? 'text-white' : 'text-white'}`}>
                                                {step.title}
                                            </h3>
                                            <p className="text-gray-200 text-sm leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Flow Arrow - Hidden on mobile, visible on lg+ */}
                                    {index < journeySteps.length - 1 && (
                                        <div className="hidden lg:block absolute top-1/2 -right-[75px] transform -translate-y-1/2 z-20">
                                            <motion.div
                                                initial={{ x: -10, opacity: 0 }}
                                                whileInView={{ x: 0, opacity: 1 }}
                                                transition={{ delay: 0.5 + index * 0.2 }}
                                                className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                                            >
                                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Closing Tagline */}
                    <motion.div
                        variants={fadeInUp}
                        className="text-center mt-12 lg:mt-16"
                    >
                        <div className="inline-flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 rounded-full px-4 py-3 md:px-8 md:py-4 shadow-2xl">
                            <span className="text-white font-bold text-sm md:text-lg">
                                {t('howToRent.tagline')}
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};