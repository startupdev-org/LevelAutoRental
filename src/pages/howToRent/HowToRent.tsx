import React, { useEffect, useState } from 'react';
import { HowToRentHero } from './sections/HowToRentHero';
import { ContractSection } from '../cars/sections/ContractSection';

export const HowToRent: React.FC = () => {
    const [isDesktop, setIsDesktop] = useState(false);

    useEffect(() => {
        // Check once on mount
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        handleResize();

        // Update on resize
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div 
            className="relative min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
                backgroundImage: isDesktop ? 'url(/LevelAutoRental/lvl_bg.png)' : 'url(/LevelAutoRental/backgrounds/bg10-mobile.jpeg)',
                backgroundPosition: isDesktop ? 'center -150px' : 'center center',
                backgroundSize: isDesktop ? '115%' : 'cover'
            }}
        >
            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/60 pointer-events-none"></div>

            {/* Content */}
            <div className="relative z-10">
                <HowToRentHero />
                <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 mt-[-100px] relative z-20 pb-20">
                    <ContractSection transparent={true} />
                </div>
            </div>

            {/* Bottom Gradient Fade */}
            <div className="absolute bottom-0 left-0 w-full h-40 bg-[linear-gradient(to_top,rgba(15,15,15,1),rgba(15,15,15,0))] z-20 pointer-events-none"></div>
        </div>
    );
};


