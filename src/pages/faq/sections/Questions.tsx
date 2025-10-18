import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";
import { fadeInUp, staggerContainer } from "../../../utils/animations";
import { useInView } from "../../../hooks/useInView";
// @ts-ignore
import './Accordion.css';

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

    const faqData: FAQSection[] = [
        {
            id: 1,
            title: "Booking & Reservations",
            items: [
                {
                    id: "booking-1",
                    question: "How do I book a car?",
                    answer:
                        "You can book a car directly through our website by selecting your pickup and return dates, choosing a vehicle, and completing the booking form.",
                },
                {
                    id: "booking-2",
                    question: "Can I modify or cancel my reservation?",
                    answer:
                        "Yes, you can modify or cancel your booking through your account dashboard. Please note that changes may be subject to availability and cancellation policies.",
                },
                {
                    id: "booking-3",
                    question: "Do I need to create an account to rent a car?",
                    answer:
                        "You can browse without an account, but creating one makes it easier to manage reservations, view history, and speed up future bookings.",
                },
                {
                    id: "booking-4",
                    question: "How far in advance should I book a car?",
                    answer:
                        "We recommend booking at least a few days in advance to secure your preferred car. During peak seasons, earlier bookings are strongly advised.",
                },
            ],
        },
        {
            id: 2,
            title: "Requirements & Policies",
            items: [
                {
                    id: "policy-1",
                    question: "What documents do I need to rent a car?",
                    answer:
                        "You'll need a valid driver's license, a government-issued ID (like a passport), and a credit or debit card in the driver's name.",
                },
                {
                    id: "policy-2",
                    question: "Is there an age requirement?",
                    answer:
                        "Yes, the minimum age is typically 21 years. Drivers under 25 may be subject to a young driver surcharge.",
                },
                {
                    id: "policy-3",
                    question: "Is insurance included?",
                    answer:
                        "Basic insurance is included in all rentals. You can choose additional coverage options for extra protection during the booking process.",
                },
                {
                    id: "policy-4",
                    question: "Can I add an additional driver?",
                    answer:
                        "Yes, additional drivers can be added at the time of booking or during pickup. All drivers must present a valid license and meet the age requirements.",
                },
            ],
        },
        {
            id: 3,
            title: "Payment & Fees",
            items: [
                {
                    id: "payment-1",
                    question: "What payment methods do you accept?",
                    answer:
                        "We accept major credit cards (Visa, MasterCard, American Express), debit cards, and in some locations, cash. Online payments are processed securely.",
                },
                {
                    id: "payment-2",
                    question: "Is a deposit required?",
                    answer:
                        "Yes, a refundable security deposit is required at pickup. The amount depends on the vehicle type and rental duration.",
                },
                {
                    id: "payment-3",
                    question: "Are there additional fees I should know about?",
                    answer:
                        "Additional fees may apply for late returns, extra mileage, additional drivers, fuel, or special equipment like GPS and child seats.",
                },
                {
                    id: "payment-4",
                    question: "Do you offer discounts?",
                    answer:
                        "Yes, we offer seasonal promotions, loyalty discounts, and corporate rates. Subscribe to our newsletter to stay updated.",
                },
            ],
        },
        {
            id: 4,
            title: "Pickup & Return",
            items: [
                {
                    id: "pickup-1",
                    question: "Where can I pick up my rental car?",
                    answer:
                        "You can pick up your car at our main office, airport locations, or selected partner stations. Pickup location is chosen during booking.",
                },
                {
                    id: "pickup-2",
                    question: "Can I return the car to a different location?",
                    answer:
                        "Yes, one-way rentals are available between certain locations. An additional fee may apply depending on the distance.",
                },
                {
                    id: "pickup-3",
                    question: "What happens if I return the car late?",
                    answer:
                        "Late returns may result in additional charges. We recommend contacting us if you anticipate being late to explore flexible options.",
                },
                {
                    id: "pickup-4",
                    question: "Do I need to refuel the car before returning it?",
                    answer:
                        "Cars should be returned with the same fuel level as when rented. Otherwise, a refueling charge will apply.",
                },
            ],
        },
    ];

    const handleToggle = (id: string) => {
        setActiveItem(activeItem === id ? null : id);
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
                        <div key={section.id} className="accordion-css my-8" data-accordion-close-siblings="true">
                            <motion.h1
                                variants={fadeInUp}
                                className="text-3xl sm:text-5xl md:text-6xl lg:text-5xl font-bold leading-tight drop-shadow-lg mb-10"
                            >
                                {section.title}
                            </motion.h1>

                            <ul className="accordion-css__list">
                                {section.items.map((item) => (
                                    <motion.li
                                        key={item.id}
                                        className="accordion-css__item"
                                        data-accordion-status={activeItem === item.id ? "active" : "not-active"}
                                        whileHover={{ y: -4, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                                        transition={{ type: "spring", stiffness: 300 }}
                                    >
                                        <div
                                            className="accordion-css__item-top"
                                            onClick={() => handleToggle(item.id)}
                                        >
                                            <h3
                                                className={`accordion-css__item-h3 ${"text-gray-800"}`}
                                            >
                                                {item.question}
                                            </h3>
                                            <div className="accordion-css__item-icon">
                                                <svg
                                                    className="accordion-css__item-icon-svg"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 36 36"
                                                    fill="none"
                                                >
                                                    <path
                                                        d="M28.5 22.5L18 12L7.5 22.5"
                                                        stroke={"currentColor"}
                                                        strokeWidth="3"
                                                        strokeMiterlimit="10"
                                                    />
                                                </svg>
                                            </div>
                                        </div>

                                        <div className="accordion-css__item-bottom">
                                            <div className="accordion-css__item-bottom-wrap">
                                                <div className="accordion-css__item-bottom-content">
                                                    <p className="accordion-css__item-p">{item.answer}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.li>
                                ))}


                            </ul>
                        </div>
                    ))}

                </motion.div>

                <motion.div
                    variants={fadeInUp}
                    className="mt-16 flex justify-center"
                >
                    <motion.div
                        className="bg-gradient-to-r from-red-500 to-red-600 rounded-2xl p-10 text-white shadow-lg max-w-2xl w-full"
                        whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.2)" }}
                        transition={{ type: "spring", stiffness: 300 }}
                    >
                        <h3 className="text-3xl sm:text-4xl font-bold mb-4 drop-shadow-md">
                            Still have questions?
                        </h3>
                        <p className="text-red-100 mb-6 text-lg sm:text-xl">
                            Can't find the answer you're looking for? Our support team is here
                            to help you with any specific questions about our services.
                        </p>
                        <motion.button
                            className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold shadow-md hover:bg-red-50 hover:scale-105 transition-transform duration-200"
                            whileHover={{ scale: 1.05 }}
                        >
                            Contact Support
                        </motion.button>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
};
