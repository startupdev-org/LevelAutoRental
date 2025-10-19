import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fadeInUp, staggerContainer } from "../../../utils/animations";
import { useInView } from "../../../hooks/useInView";
import { useTranslation } from 'react-i18next';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface FAQSection {
    id: number;
    title: string;
    items: FAQItem[];
}

export const Questions: React.FC = () => {
    const [activeItem, setActiveItem] = useState<string | null>(null);
    const { ref, isInView } = useInView();
    const { t } = useTranslation();

    const faqData: FAQSection[] = [
        {
            id: 1,
            title: t('faq.sections.booking.title'),
            items: [
                {
                    id: "booking-1",
                    question: t('faq.sections.booking.questions.how-to-book'),
                    answer: t('faq.sections.booking.answers.how-to-book'),
                },
                {
                    id: "booking-2",
                    question: t('faq.sections.booking.questions.modify-cancel'),
                    answer: t('faq.sections.booking.answers.modify-cancel'),
                },
                {
                    id: "booking-3",
                    question: t('faq.sections.booking.questions.account-required'),
                    answer: t('faq.sections.booking.answers.account-required'),
                },
                {
                    id: "booking-4",
                    question: t('faq.sections.booking.questions.advance-booking'),
                    answer: t('faq.sections.booking.answers.advance-booking'),
                },
            ],
        },
        {
            id: 2,
            title: t('faq.sections.requirements.title'),
            items: [
                {
                    id: "policy-1",
                    question: t('faq.sections.requirements.questions.documents'),
                    answer: t('faq.sections.requirements.answers.documents'),
                },
                {
                    id: "policy-2",
                    question: t('faq.sections.requirements.questions.age-requirement'),
                    answer: t('faq.sections.requirements.answers.age-requirement'),
                },
                {
                    id: "policy-3",
                    question: t('faq.sections.requirements.questions.insurance'),
                    answer: t('faq.sections.requirements.answers.insurance'),
                },
                {
                    id: "policy-4",
                    question: t('faq.sections.requirements.questions.additional-driver'),
                    answer: t('faq.sections.requirements.answers.additional-driver'),
                },
            ],
        },
        {
            id: 3,
            title: t('faq.sections.payment.title'),
            items: [
                {
                    id: "payment-1",
                    question: t('faq.sections.payment.questions.payment-methods'),
                    answer: t('faq.sections.payment.answers.payment-methods'),
                },
                {
                    id: "payment-2",
                    question: t('faq.sections.payment.questions.deposit'),
                    answer: t('faq.sections.payment.answers.deposit'),
                },
                {
                    id: "payment-3",
                    question: t('faq.sections.payment.questions.additional-fees'),
                    answer: t('faq.sections.payment.answers.additional-fees'),
                },
                {
                    id: "payment-4",
                    question: t('faq.sections.payment.questions.discounts'),
                    answer: t('faq.sections.payment.answers.discounts'),
                },
            ],
        },
        {
            id: 4,
            title: t('faq.sections.pickup.title'),
            items: [
                {
                    id: "pickup-1",
                    question: t('faq.sections.pickup.questions.pickup-location'),
                    answer: t('faq.sections.pickup.answers.pickup-location'),
                },
                {
                    id: "pickup-2",
                    question: t('faq.sections.pickup.questions.different-return'),
                    answer: t('faq.sections.pickup.answers.different-return'),
                },
                {
                    id: "pickup-3",
                    question: t('faq.sections.pickup.questions.late-return'),
                    answer: t('faq.sections.pickup.answers.late-return'),
                },
                {
                    id: "pickup-4",
                    question: t('faq.sections.pickup.questions.refuel'),
                    answer: t('faq.sections.pickup.answers.refuel'),
                },
            ],
        },
    ];

    const handleToggle = (id: string) => {
        setActiveItem(activeItem === id ? null : id);
    };

    return (
        <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-b from-white via-gray-50 to-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    ref={ref}
                    variants={staggerContainer}
                    initial="initial"
                    animate={isInView ? "animate" : "initial"}
                    className="space-y-16"
                >
                    {faqData.map((section) => (
                        <motion.div 
                            key={section.id} 
                            variants={fadeInUp}
                            className="space-y-8"
                        >
                            <div className="text-center mb-12">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                    {section.title}
                                </h2>
                                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full"></div>
                            </div>

                            <div className="grid gap-4">
                                {section.items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
                                        whileHover={{ y: -2 }}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div
                                            className="p-6 cursor-pointer flex items-center justify-between group"
                                            onClick={() => handleToggle(item.id)}
                                        >
                                            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 group-hover:text-red-600 transition-colors duration-200 pr-4">
                                                {item.question}
                                            </h3>
                                            <div className="flex-shrink-0">
                                                <div className={`w-8 h-8 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-all duration-300 ${activeItem === item.id ? 'bg-red-100' : ''}`}>
                                                    <ChevronDown 
                                                        className={`w-5 h-5 text-gray-600 group-hover:text-red-600 transition-all duration-300 ${activeItem === item.id ? 'rotate-180 text-red-600' : ''}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {activeItem === item.id && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                                    className="overflow-hidden"
                                                >
                                                    <div className="px-6 pb-6">
                                                        <div className="pt-4 border-t border-gray-100">
                                                            <p className="text-gray-700 leading-relaxed text-base sm:text-lg">
                                                                {item.answer}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}

                </motion.div>

                <motion.div
                    variants={fadeInUp}
                    className="mt-20 flex justify-center"
                >
                    <motion.div
                        className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl max-w-4xl w-full text-center"
                        whileHover={{ y: -5, boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
                            {t('faq.contact.title')}
                        </h3>
                        <p className="text-gray-300 mb-8 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto">
                            {t('faq.contact.description')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('faq.contact.contact-support')}
                            </motion.button>
                            <motion.button
                                className="bg-white/10 hover:bg-white/20 text-white px-8 py-4 rounded-xl font-semibold border border-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('faq.contact.call-us')}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
};
