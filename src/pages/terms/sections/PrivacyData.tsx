import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";
import { Lock } from "lucide-react";

export const PrivacyData: React.FC = () => (
    <motion.div
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-lg p-8 flex gap-6 border-2 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-theme-500"
    >
        <Lock className="w-10 h-10 text-theme-500 flex-shrink-0" />
        <div>
            <h2 className="text-2xl font-semibold text-theme-500 mb-2">
                6. Privacy & Data Protection
            </h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
                <li>Your personal data will be handled in accordance with our privacy policy.</li>
                <li>We do not share your information with third parties except as required by law.</li>
            </ul>
        </div>
    </motion.div>
);