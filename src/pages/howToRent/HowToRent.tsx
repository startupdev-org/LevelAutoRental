import React from 'react';
import { HowToRent as HowToRentSection } from '../home/sections/HowToRent';
import { HowToRentIntro } from './sections/TermsIntro';

export const HowToRent: React.FC = () => {
    return (
        <>
            <HowToRentIntro />
            <section className="bg-gradient-to-b from-gray-50 via-white to-gray-100 min-h-screen py-20">
                <HowToRentSection />
            </section>
        </>
    );
};


