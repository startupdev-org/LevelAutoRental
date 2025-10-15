import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const RentalRequirements: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">1. Rental Requirements</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Drivers must be at least 21 years old and possess a valid driver’s license.</li>
            <li>International renters must provide a passport and a valid international driving permit.</li>
            <li>A credit card in the renter’s name is required for deposit and payment.</li>
        </ul>
    </motion.div>
);