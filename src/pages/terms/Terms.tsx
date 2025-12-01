import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../utils/animations";
import { useTranslation } from "react-i18next";
import { FileText, Cookie, Shield, MapPin, CreditCard, Bell } from "lucide-react";

export const Terms: React.FC = () => {
    const { t } = useTranslation();
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const getSectionContent = (sectionKey: string) => {
        const isList = sectionKey !== 'intro';
        return {
            icon: sectionKey === 'intro' ? FileText : 
                  sectionKey === 'cookies' ? Cookie :
                  sectionKey === 'personal-data' ? Shield :
                  sectionKey === 'location' ? MapPin :
                  sectionKey === 'payment' ? CreditCard : Bell,
            title: t(`pages.terms.sections.${sectionKey}.title`),
            description: isList ? null : t(`pages.terms.sections.${sectionKey}.description`),
            bullets: isList ? [
                t(`pages.terms.sections.${sectionKey}.bullet1`),
                t(`pages.terms.sections.${sectionKey}.bullet2`),
                t(`pages.terms.sections.${sectionKey}.bullet3`),
                t(`pages.terms.sections.${sectionKey}.bullet4`)
            ].filter(Boolean) : null,
            key: sectionKey
        };
    };

    const sections = ['intro', 'cookies', 'personal-data', 'location', 'payment', 'notifications'].map(getSectionContent);

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section
                className="relative h-[500px] bg-fixed bg-cover bg-center bg-no-repeat pt-36 font-sans text-white"
                style={{
                    backgroundImage: isDesktop ? 'url(/lvl_bg.png)' : 'url(/backgrounds/bg10-mobile.jpeg)',
                    backgroundPosition: isDesktop ? 'center -400px' : 'center center',
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
                        <div className="text-center space-y-10 max-w-4xl">
                            <div className="space-y-8">
                                <div className="space-y-6">
                                    <p className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                        {t('pages.terms.hero.label')}
                                    </p>
                                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                                        {t('pages.terms.hero.title')}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content Section */}
            <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div
                        variants={staggerContainer}
                        initial="initial"
                        whileInView="animate"
                        viewport={{ once: true }}
                        className="space-y-8"
                    >
                        {sections.map((section) => (
                            <motion.div
                                key={section.key}
                                variants={fadeInUp}
                                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-8 hover:shadow-lg transition-all duration-300"
                            >
                                <div className="flex items-start gap-3 md:gap-6">
                                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                        <section.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 break-words">
                                            {section.title}
                                        </h2>
                                        {section.description ? (
                                            <p className="text-gray-600 leading-relaxed text-sm md:text-base break-words hyphens-auto">
                                                {section.description}
                                            </p>
                                        ) : section.bullets ? (
                                            <ul className="space-y-3">
                                                {section.bullets.map((bullet, index) => (
                                                    <li key={index} className="flex items-start gap-2 md:gap-3">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                        <span className="text-gray-600 leading-relaxed text-sm md:text-base break-words hyphens-auto flex-1 min-w-0">{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : null}
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
