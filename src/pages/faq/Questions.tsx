import React, { useState } from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { useInView } from '../../hooks/useInView';

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}

interface FAQSection {
    title: string;
    items: FAQItem[];
}

export const Questions: React.FC = () => {
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const { ref, isInView } = useInView();

    const faqData: FAQSection[] = [
        {
            title: "Booking & Reservations",
            items: [
                {
                    id: "booking-1",
                    question: "How do I book a car?",
                    answer: "You can book a car directly through our website by selecting your pickup and return dates, choosing a vehicle, and completing the booking form."
                },
                {
                    id: "booking-2",
                    question: "Can I modify or cancel my reservation?",
                    answer: "Yes, you can modify or cancel your booking through your account dashboard. Please note that changes may be subject to availability and cancellation policies."
                },
                {
                    id: "booking-3",
                    question: "Do I need to create an account to rent a car?",
                    answer: "You can browse without an account, but creating one makes it easier to manage reservations, view history, and speed up future bookings."
                },
                {
                    id: "booking-4",
                    question: "How far in advance should I book a car?",
                    answer: "We recommend booking at least a few days in advance to secure your preferred car. During peak seasons, earlier bookings are strongly advised."
                }
            ]
        },
        {
            title: "Requirements & Policies",
            items: [
                {
                    id: "policy-1",
                    question: "What documents do I need to rent a car?",
                    answer: "You'll need a valid driver's license, a government-issued ID (like a passport), and a credit or debit card in the driver's name."
                },
                {
                    id: "policy-2",
                    question: "Is there an age requirement?",
                    answer: "Yes, the minimum age is typically 21 years. Drivers under 25 may be subject to a young driver surcharge."
                },
                {
                    id: "policy-3",
                    question: "Is insurance included?",
                    answer: "Basic insurance is included in all rentals. You can choose additional coverage options for extra protection during the booking process."
                },
                {
                    id: "policy-4",
                    question: "Can I add an additional driver?",
                    answer: "Yes, additional drivers can be added at the time of booking or during pickup. All drivers must present a valid license and meet the age requirements."
                }
            ]
        },
        {
            title: "Payment & Fees",
            items: [
                {
                    id: "payment-1",
                    question: "What payment methods do you accept?",
                    answer: "We accept major credit cards (Visa, MasterCard, American Express), debit cards, and in some locations, cash. Online payments are processed securely."
                },
                {
                    id: "payment-2",
                    question: "Is a deposit required?",
                    answer: "Yes, a refundable security deposit is required at pickup. The amount depends on the vehicle type and rental duration."
                },
                {
                    id: "payment-3",
                    question: "Are there additional fees I should know about?",
                    answer: "Additional fees may apply for late returns, extra mileage, additional drivers, fuel, or special equipment like GPS and child seats."
                },
                {
                    id: "payment-4",
                    question: "Do you offer discounts?",
                    answer: "Yes, we offer seasonal promotions, loyalty discounts, and corporate rates. Subscribe to our newsletter to stay updated."
                }
            ]
        },
        {
            title: "Pickup & Return",
            items: [
                {
                    id: "pickup-1",
                    question: "Where can I pick up my rental car?",
                    answer: "You can pick up your car at our main office, airport locations, or selected partner stations. Pickup location is chosen during booking."
                },
                {
                    id: "pickup-2",
                    question: "Can I return the car to a different location?",
                    answer: "Yes, one-way rentals are available between certain locations. An additional fee may apply depending on the distance."
                },
                {
                    id: "pickup-3",
                    question: "What happens if I return the car late?",
                    answer: "Late returns may result in additional charges. We recommend contacting us if you anticipate being late to explore flexible options."
                },
                {
                    id: "pickup-4",
                    question: "Do I need to refuel the car before returning it?",
                    answer: "Cars should be returned with the same fuel level as when rented. Otherwise, a refueling charge will apply."
                }
            ]
        }
    ];

    const toggleItem = (itemId: string) => {
        const newExpandedItems = new Set(expandedItems);
        if (newExpandedItems.has(itemId)) {
            newExpandedItems.delete(itemId);
        } else {
            newExpandedItems.add(itemId);
        }
        setExpandedItems(newExpandedItems);
    };

    return (
        <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
            <div className="max-w-7xl mx-auto px-4 mt-10 sm:px-6 lg:px-8">

                <motion.div
                    ref={ref}
                    variants={staggerContainer}
                    initial="initial"
                    animate={isInView ? "animate" : "initial"}
                    className="space-y-16"
                >
                    {faqData.map((section) => (
                        <motion.div
                            key={section.title}
                            variants={fadeInUp}
                            className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-theme-500 to-theme-600 px-8 py-6">
                                <h2 className="text-2xl font-bold text-white">
                                    {section.title}
                                </h2>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {section.items.map((item) => (
                                    <div key={item.id} className="group">
                                        <button
                                            onClick={() => toggleItem(item.id)}
                                            className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-gray-50 transition-all duration-200 group-hover:bg-gray-50"
                                        >
                                            <span className="text-lg font-semibold text-gray-800 pr-4 group-hover:text-theme-600 transition-colors duration-200">
                                                {item.question}
                                            </span>
                                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-theme-100 flex items-center justify-center group-hover:bg-theme-200 transition-colors duration-200">
                                                {expandedItems.has(item.id) ? (
                                                    <ChevronUp className="w-4 h-4 text-theme-600" />
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-theme-600" />
                                                )}
                                            </div>
                                        </button>
                                        <AnimatePresence>
                                            {expandedItems.has(item.id) && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0, y: -8, scale: 0.98 }}
                                                    animate={{ height: "auto", opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ height: 0, opacity: 0, y: -8, scale: 0.98 }}
                                                    transition={{
                                                        duration: 0.5,
                                                        ease: [0.25, 0.1, 0.25, 1],
                                                        opacity: { duration: 0.4 },
                                                        y: { duration: 0.5 },
                                                        scale: { duration: 0.5 }
                                                    }}
                                                    className="px-8 pb-6 bg-blue-50/50 overflow-hidden origin-top"
                                                >
                                                    <motion.p
                                                        initial={{ opacity: 0, y: 8 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: 0.15, duration: 0.4, ease: "easeOut" }}
                                                        className="text-gray-600 leading-relaxed"
                                                    >
                                                        {item.answer}
                                                    </motion.p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>


                <motion.div
                    variants={fadeInUp}
                    className="mt-16 text-center"
                >
                    <div className="bg-gradient-to-r from-theme-500 to-theme-600 rounded-2xl p-8 text-white">
                        <h3 className="text-2xl font-bold mb-4">Still have questions?</h3>
                        <p className="text-theme-100 mb-6 max-w-2xl mx-auto">
                            Can't find the answer you're looking for? Our support team is here to help you with any specific questions about our services.
                        </p>
                        <button className="bg-white text-theme-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200">
                            Contact Support
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};  