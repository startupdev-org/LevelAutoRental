import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";
import { Undo2 } from "lucide-react";

export const ReturnPolicy: React.FC = () => (
    <motion.div
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-lg p-8 flex gap-6 border-2 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-theme-500"
    >
        <Undo2 className="w-10 h-10 text-theme-500 flex-shrink-0" />
        <div>
            <h2 className="text-2xl font-semibold text-theme-500 mb-2">5. Return Policy</h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
                <li>Vehicles must be returned at the agreed location and time.</li>
                <li>Late returns may result in additional charges.</li>
                <li>Vehicles will be inspected for damage and cleanliness upon return.</li>
            </ul>
        </div>
    </motion.div>
);