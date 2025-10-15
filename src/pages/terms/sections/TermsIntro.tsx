import React from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../../utils/animations";
import { useTranslation } from "react-i18next"; // Optional

export const TermsIntro: React.FC = () => {
    // const { t } = useTranslation();

    return (
        // ✅ No outer min-h-screen wrapper here
        <section
            className="relative min-h-[600px] bg-fixed bg-cover bg-center bg-no-repeat flex items-center justify-center font-sans"
            style={{ backgroundImage: "url(/bg-hero.jpg)", backgroundPosition: "center -420px" }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/70" />

            {/* Content */}
            <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="relative z-10 text-center space-y-8 max-w-3xl px-4"
            >
                <motion.p
                    variants={fadeInUp}
                    className="text-sm font-semibold tracking-wider text-red-500 uppercase"
                >
                    Terms &amp; Conditions
                </motion.p>

                <motion.h1
                    variants={fadeInUp}
                    className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg"
                >
                    Car Rental Terms &amp; Conditions
                </motion.h1>

                <motion.p
                    variants={fadeInUp}
                    className="text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed"
                >
                    Please read these terms and conditions carefully before renting a vehicle from
                    LevelAutoRental. Your safety, privacy, and satisfaction are our top priorities.
                </motion.p>
            </motion.div>
        </section>
    );
};
