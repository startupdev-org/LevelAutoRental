import React from "react";
import { TermsIntro } from "./sections/TermsIntro";
import { RentalRequirements } from "./sections/RentalRequirements";
import { InsuranceLiability } from "./sections/InsuranceLiability";
import { VehicleUse } from "./sections/VehicleUse";
import { PaymentCancellation } from "./sections/PaymentCancellation";
import { ReturnPolicy } from "./sections/ReturnPolicy";
import { PrivacyData } from "./sections/PrivacyData";
import { TermsContact } from "./sections/TermsContact";

export const Terms: React.FC = () => {
    return (
        <>
            {/* Hero / Intro Section */}
            <TermsIntro />

            {/* Main Terms Content */}
            <section className="bg-gradient-to-b from-gray-50 via-white to-gray-100 min-h-screen py-12 sm:py-16 md:py-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 space-y-10 sm:space-y-12 md:space-y-16">

                    {/* Individual sections */}
                    <RentalRequirements />
                    <InsuranceLiability />
                    <VehicleUse />
                    <PaymentCancellation />
                    <ReturnPolicy />
                    <PrivacyData />
                    <TermsContact />

                </div>
            </section>
        </>
    );
};
