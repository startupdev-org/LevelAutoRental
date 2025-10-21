import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../../utils/animations";
import { useTranslation } from 'react-i18next';

export const FAQIntro: React.FC = () => {
    const { t } = useTranslation();
    const [isDesktop, setIsDesktop] = useState<boolean>(
        typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches
    );

    useEffect(() => {
        if (typeof window === "undefined") return;

        const mediaQuery = window.matchMedia("(min-width: 768px)");
        const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);

        setIsDesktop(mediaQuery.matches);
        mediaQuery.addEventListener("change", handleChange);

        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    return (
        <section
            className="relative py-32 bg-cover bg-center bg-no-repeat"
            style={{
                backgroundImage: isDesktop ? 'url(/LevelAutoRental/lvl_bg.png)' : 'url(/LevelAutoRental/backgrounds/bg10-mobile.jpeg)',
                backgroundPosition: isDesktop ? 'center -400px' : 'center center'
            }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 w-full h-24 
                bg-[linear-gradient(to_top,rgba(15,15,15,1),rgba(15,15,15,0))] 
                z-10 pointer-events-none">
            </div>

            <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header Section */}
                <motion.div
                    variants={staggerContainer}
                    initial="initial"
                    whileInView="animate"
                    viewport={{ once: true }}
                    className="text-center mb-12"
                >
                    <motion.span
                        variants={fadeInUp}
                        className="text-sm font-semibold tracking-wider text-red-500 uppercase"
                    >
                        {t('pages.faq.hero.label')}
                    </motion.span>
                    <motion.h2
                        variants={fadeInUp}
                        className="mt-4 text-4xl md:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto drop-shadow-lg"
                    >
                        {t('pages.faq.hero.title')}
                    </motion.h2>
                    <motion.p
                        variants={fadeInUp}
                        className="mt-6 text-xl text-gray-100 max-w-3xl mx-auto leading-relaxed drop-shadow-md"
                    >
                        {t('pages.faq.hero.description')}
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
};
