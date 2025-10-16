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
            <TermsIntro />
            <section className="bg-gradient-to-b from-gray-50 via-white to-gray-100 min-h-screen py-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
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