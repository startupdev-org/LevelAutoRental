import React from 'react';
import { HowToRentHero } from './sections/HowToRentHero';
import { ContractSection } from '../cars/sections/ContractSection';

export const HowToRent: React.FC = () => {

    return (
        <div className="relative min-h-screen">
            {/* Background Image - Desktop */}
            <div
                className="hidden md:block absolute inset-0"
                style={{
                    backgroundImage: 'url(/lvl_bg.png)',
                    backgroundPosition: 'center -150px',
                    backgroundSize: '115%',
                    backgroundAttachment: 'fixed',
                    zIndex: 0
                }}
            ></div>

            {/* Background Image - Mobile */}
            <div className="md:hidden absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                <img
                    src="/backgrounds/bg10-mobile.jpeg"
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


