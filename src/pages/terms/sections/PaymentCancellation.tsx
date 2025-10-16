import React from "react";
import { motion } from "framer-motion";
import { fadeInUp } from "../../../utils/animations";
import { CreditCard } from "lucide-react";

export const PaymentCancellation: React.FC = () => (
    <motion.div
        variants={fadeInUp}
        className="bg-white rounded-xl shadow-lg p-8 flex gap-6 border-2 border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-theme-500"
    >
        <CreditCard className="w-10 h-10 text-theme-500 flex-shrink-0" />
        <div>
            <h2 className="text-2xl font-semibold text-theme-500 mb-2">
                4. Payment & Cancellation
            </h2>
            <ul className="list-disc ml-6 text-gray-700 space-y-2">
                <li>Full payment is required at the start of the rental period.</li>
                <li>
                    Cancellations made 24 hours before pickup are eligible for a full
                    refund.
                </li>
                <li>
                    No-shows or late cancellations may incur a fee up to one day’s
                    rental cost.
                </li>
            </ul>
        </div>
    </motion.div>
);