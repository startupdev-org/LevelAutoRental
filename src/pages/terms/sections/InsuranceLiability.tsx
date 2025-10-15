import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const InsuranceLiability: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">2. Insurance & Liability</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>All vehicles include basic insurance coverage. Additional coverage is available upon request.</li>
            <li>The renter is responsible for any damage, theft, or loss not covered by insurance.</li>
            <li>In case of an accident, the renter must notify LevelAutoRental and local authorities immediately.</li>
        </ul>
    </motion.div>
);