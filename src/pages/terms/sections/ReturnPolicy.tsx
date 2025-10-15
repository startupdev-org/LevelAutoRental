import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const ReturnPolicy: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">5. Return Policy</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Vehicles must be returned at the agreed location and time.</li>
            <li>Late returns may result in additional charges.</li>
            <li>Vehicles will be inspected for damage and cleanliness upon return.</li>
        </ul>
    </motion.div>
);