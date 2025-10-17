import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { fadeInUp, staggerContainer } from "../../../utils/animations";

export const TermsIntro: React.FC = () => {
    const [isDesktop, setIsDesktop] = useState<boolean>(
        typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches
    );

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

    return (
        <section
            className={`
        relative min-h-[400px] sm:min-h-[600px]
        flex items-center justify-center font-sans
        bg-gray-900 text-white
        ${isDesktop ? "bg-fixed bg-cover bg-center bg-no-repeat" : ""}
      `}
            style={{
                backgroundImage: isDesktop ? "url(/LevelAutoRental/bg-hero.jpg)" : "none",
                backgroundPosition: "center -420px",
            }}
        >
            {/* Overlay (desktop only) */}
            {isDesktop && <div className="absolute inset-0 bg-black/70" />}

            <motion.div
                variants={staggerContainer}
                initial="initial"
                whileInView="animate"
                viewport={{ once: true }}
                className="relative z-10 text-center space-y-6 sm:space-y-8 max-w-3xl px-4"
            >
                <motion.p
                    variants={fadeInUp}
                    className="text-xs sm:text-sm font-semibold tracking-wider text-red-500 uppercase"
                >
                    Terms &amp; Conditions
                </motion.p>

                <motion.h1
                    variants={fadeInUp}
                    className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow-lg"
                >
                    Car Rental Terms &amp; Conditions
                </motion.h1>

                <motion.p
                    variants={fadeInUp}
                    className="text-sm sm:text-lg text-gray-300 max-w-2xl mx-auto leading-relaxed"
                >
                    Please read these terms and conditions carefully before renting a vehicle from
                    LevelAutoRental. Your safety, privacy, and satisfaction are our top priorities.
                </motion.p>
            </motion.div>
        </section>
    );
};
