import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CalendarPage from '../../../dashboard/calendar/CalendarPage';

export const CalendarView: React.FC = () => {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Calendar Card */}
            <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">{t('admin.orders.bookingCalendar')}</h2>
                </div>
                <div className="p-6">
                    <CalendarPage viewMode='admin' />
                </div>
            </motion.div>
        </motion.div>
    );
};

