import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Mail } from "lucide-react";
import { BiSolidPhoneCall } from "react-icons/bi";
import { fadeInUp, staggerContainer } from "../../../utils/animations";
import { useInView } from "../../../hooks/useInView";
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
    const navigate = useNavigate();

    const faqData: FAQSection[] = [
        {
            id: 1,
            title: t('pages.faq.sections.booking.title'),
            items: [
                {
                    id: "booking-1",
                    question: t('pages.faq.sections.booking.questions.how-to-book'),
                    answer: t('pages.faq.sections.booking.answers.how-to-book'),
                },
                {
                    id: "booking-2",
                    question: t('pages.faq.sections.booking.questions.modify-cancel'),
                    answer: t('pages.faq.sections.booking.answers.modify-cancel'),
                },
                {
                    id: "booking-3",
                    question: t('pages.faq.sections.booking.questions.account-required'),
                    answer: t('pages.faq.sections.booking.answers.account-required'),
                },
                {
                    id: "booking-4",
                    question: t('pages.faq.sections.booking.questions.advance-booking'),
                    answer: t('pages.faq.sections.booking.answers.advance-booking'),
                },
            ],
        },
        {
            id: 2,
            title: t('pages.faq.sections.requirements.title'),
            items: [
                {
                    id: "policy-1",
                    question: t('pages.faq.sections.requirements.questions.documents'),
                    answer: t('pages.faq.sections.requirements.answers.documents'),
                },
                {
                    id: "policy-2",
                    question: t('pages.faq.sections.requirements.questions.age-requirement'),
                    answer: t('pages.faq.sections.requirements.answers.age-requirement'),
                },
                {
                    id: "policy-3",
                    question: t('pages.faq.sections.requirements.questions.insurance'),
                    answer: t('pages.faq.sections.requirements.answers.insurance'),
                },
                {
                    id: "policy-4",
                    question: t('pages.faq.sections.requirements.questions.additional-driver'),
                    answer: t('pages.faq.sections.requirements.answers.additional-driver'),
                },
            ],
        },
        {
            id: 3,
            title: t('pages.faq.sections.payment.title'),
            items: [
                {
                    id: "payment-1",
                    question: t('pages.faq.sections.payment.questions.payment-methods'),
                    answer: t('pages.faq.sections.payment.answers.payment-methods'),
                },
                {
                    id: "payment-2",
                    question: t('pages.faq.sections.payment.questions.deposit'),
                    answer: t('pages.faq.sections.payment.answers.deposit'),
                },
                {
                    id: "payment-3",
                    question: t('pages.faq.sections.payment.questions.additional-fees'),
                    answer: t('pages.faq.sections.payment.answers.additional-fees'),
                },
                {
                    id: "payment-4",
                    question: t('pages.faq.sections.payment.questions.discounts'),
                    answer: t('pages.faq.sections.payment.answers.discounts'),
                },
            ],
        },
        {
            id: 4,
            title: t('pages.faq.sections.pickup.title'),
            items: [
                {
                    id: "pickup-1",
                    question: t('pages.faq.sections.pickup.questions.pickup-location'),
                    answer: t('pages.faq.sections.pickup.answers.pickup-location'),
                },
                {
                    id: "pickup-2",
                    question: t('pages.faq.sections.pickup.questions.different-return'),
                    answer: t('pages.faq.sections.pickup.answers.different-return'),
                },
                {
                    id: "pickup-3",
                    question: t('pages.faq.sections.pickup.questions.late-return'),
                    answer: t('pages.faq.sections.pickup.answers.late-return'),
                },
                {
                    id: "pickup-4",
                    question: t('pages.faq.sections.pickup.questions.refuel'),
                    answer: t('pages.faq.sections.pickup.answers.refuel'),
                },
            ],
        },
    ];

    const handleToggle = (id: string) => {
        setActiveItem(activeItem === id ? null : id);
    };

    return (
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    ref={ref}
                    variants={staggerContainer}
                    initial="initial"
                    animate={isInView ? "animate" : "initial"}
                    className="space-y-20"
                >
                    {faqData.map((section) => (
                        <motion.div
                            key={section.id}
                            variants={fadeInUp}
                            className="space-y-8"
                        >
                            {/* Section Header */}
                            <div className="text-center mb-12">
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                                    {section.title}
                                </h2>
                                <div className="w-24 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full"></div>
                            </div>

                            {/* FAQ Items */}
                            <div className="grid gap-6">
                                {section.items.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
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
                                                <motion.div 
                                                    className={`w-10 h-10 rounded-full bg-gray-100 group-hover:bg-red-100 flex items-center justify-center transition-all duration-300 ${activeItem === item.id ? 'bg-red-100' : ''}`}
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.95 }}
                                                >
                                                    <ChevronDown
                                                        className={`w-5 h-5 text-gray-600 group-hover:text-red-600 transition-all duration-300 ${activeItem === item.id ? 'rotate-180 text-red-600' : ''}`}
                                                    />
                                                </motion.div>
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
                                                            <div className="text-gray-700 leading-relaxed text-base sm:text-lg prose prose-gray max-w-none">
                                                                {item.answer.includes('•') ? (
                                                                    <div className="space-y-3">
                                                                        {item.answer.split('•').filter(item => item.trim()).map((point, index) => (
                                                                            <div key={index} className="flex items-start">
                                                                                <span className="text-red-500 font-bold mr-3 flex-shrink-0 -mt-0.5">•</span>
                                                                                <div className="flex-1">
                                                                                    {point.trim().split('\\n').map((line, lineIndex) => (
                                                                                        <div key={lineIndex} className="mb-1">
                                                                                            {line.includes('**') ? (
                                                                                                <span dangerouslySetInnerHTML={{
                                                                                                    __html: line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
                                                                                                }} />
                                                                                            ) : (
                                                                                                <span>{line}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                ) : (
                                                                    <p>{item.answer}</p>
                                                                )}
                                                            </div>
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

                {/* Contact Section */}
                <motion.div
                    variants={fadeInUp}
                    className="mt-20 flex justify-center"
                >
                    <motion.div
                        className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-gray-100 max-w-4xl w-full relative overflow-hidden"
                        whileHover={{ y: -5, boxShadow: "0 25px 50px rgba(0,0,0,0.15)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        {/* Background Pattern */}
                        <div className="absolute inset-0 opacity-5">
                        </div>
                        
                        <div className="relative z-10">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 shadow-lg">
                                    {BiSolidPhoneCall({ className: "w-8 h-8 text-white" })}
                                </div>
                            </div>
                            
                            {/* Title */}
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 text-center text-gray-900">
                                {t('pages.faq.contact.title')}
                            </h3>
                            
                            {/* Description */}
                            <p className="text-gray-600 mb-8 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto text-center leading-relaxed">
                                {t('pages.faq.contact.description')}
                            </p>
                            
                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <motion.button
                                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg transition-all duration-300 flex items-center justify-center gap-3 group"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => navigate('/contact')}
                                >
                                    <Mail className="w-5 h-5 group-hover:animate-pulse" />
                                    {t('pages.faq.contact.contact-support')}
                                </motion.button>
                                <motion.button
                                    className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-8 py-4 rounded-xl font-semibold border border-gray-200 transition-all duration-300 flex items-center justify-center gap-3 group"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => window.open('tel:+37362000112', '_self')}
                                >
                                    {BiSolidPhoneCall({ className: "w-5 h-5 group-hover:animate-pulse" })}
                                    {t('pages.faq.contact.call-us')}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
