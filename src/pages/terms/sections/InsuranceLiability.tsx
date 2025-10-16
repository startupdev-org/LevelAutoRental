import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";
import { ShieldCheck } from "lucide-react";

export const InsuranceLiability: React.FC = () => (
    <motion.div
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-lg p-8 flex gap-6 border-2 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-theme-500"
    >
        <ShieldCheck className="w-10 h-10 text-theme-500 flex-shrink-0" />
        <div>
            <h2 className="text-2xl font-semibold text-theme-500 mb-2">2. Insurance & Liability</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
                <li>All vehicles include basic insurance coverage. Additional coverage is available upon request.</li>
                <li>The renter is responsible for any damage, theft, or loss not covered by insurance.</li>
                <li>In case of an accident, the renter must notify LevelAutoRental and local authorities immediately.</li>
            </ul>
        </div>
    </motion.div>
);