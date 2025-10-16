import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";
import { Car } from "lucide-react";

export const VehicleUse: React.FC = () => (
    <motion.div
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-lg p-8 flex gap-6 border-2 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-theme-500"
    >
        <Car className="w-10 h-10 text-theme-500 flex-shrink-0" />
        <div>
            <h2 className="text-2xl font-semibold text-theme-500 mb-2">3. Vehicle Use</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
                <li>Vehicles must not be used for illegal activities, racing, or off-road driving.</li>
                <li>Smoking and transporting pets in vehicles is prohibited unless otherwise agreed.</li>
                <li>Vehicles must be returned with the same fuel level as at pickup.</li>
            </ul>
        </div>
    </motion.div>
);