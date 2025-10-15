import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const PrivacyData: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">6. Privacy & Data Protection</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Your personal data will be handled in accordance with our privacy policy.</li>
            <li>We do not share your information with third parties except as required by law.</li>
        </ul>
    </motion.div>
);