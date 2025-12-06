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
              {/* Centered Text Content */}
              <div className="text-center space-y-10 max-w-4xl">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <p className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                      {t('pages.faq.hero.label')}
                    </p>
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight drop-shadow-lg">
                      {t('pages.faq.hero.title')}
                    </h1>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    );
};
