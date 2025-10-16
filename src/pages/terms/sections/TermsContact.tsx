import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";
import { Mail } from "lucide-react";

export const TermsContact: React.FC = () => (
    <motion.div
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-lg p-8 flex gap-6 border-2 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-theme-500"
    >
        <Mail className="w-10 h-10 text-theme-500 flex-shrink-0" />
        <div>
            <h2 className="text-2xl font-semibold text-theme-500 mb-2">7. Contact</h2>
            <p className="text-gray-700">
                For any questions regarding these terms, please contact us at{" "}
                <a href="mailto:info@levelautorental.com" className="text-theme-500 underline">
                    info@levelautorental.com
                </a>.
            </p>
        </div>
    </motion.div>
);