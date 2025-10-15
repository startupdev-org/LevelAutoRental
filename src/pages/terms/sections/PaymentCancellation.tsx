import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";

export const PaymentCancellation: React.FC = () => (
    <motion.div variants={fadeInUp}>
        <h2 className="text-2xl font-semibold text-theme-500 mb-2">4. Payment & Cancellation</h2>
        <ul className="list-disc ml-6 text-gray-700 space-y-2">
            <li>Full payment is required at the start of the rental period.</li>
            <li>Cancellations made 24 hours before pickup are eligible for a full refund.</li>
            <li>No-shows or late cancellations may incur a fee up to one day’s rental cost.</li>
        </ul>
    </motion.div>
);