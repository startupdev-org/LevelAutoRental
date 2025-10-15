import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const VehicleUse: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">3. Vehicle Use</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Vehicles must not be used for illegal activities, racing, or off-road driving.</li>
            <li>Smoking and transporting pets in vehicles is prohibited unless otherwise agreed.</li>
            <li>Vehicles must be returned with the same fuel level as at pickup.</li>
        </ul>
    </motion.div>
);