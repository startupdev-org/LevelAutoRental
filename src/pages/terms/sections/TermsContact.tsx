import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const TermsContact: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">7. Contact</h2>
        <p className="text-gray-700">
            For any questions regarding these terms, please contact us at <a href="mailto:info@levelautorental.com" className="text-theme-500 underline">info@levelautorental.com</a>.
        </p>
    </motion.div>
);