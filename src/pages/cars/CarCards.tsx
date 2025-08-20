import { motion } from 'framer-motion';
import { Filter, Fuel, HelpCircle, Leaf, Search, Settings, Star, Users } from 'lucide-react';
import React, { useState } from 'react';
import { cars } from '../../data/cars';
import { useCounter } from '../../hooks/useCounter';
import { useInView } from '../../hooks/useInView';
import { Car } from '../../types';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';


interface CarCardProps {
    car: Car;
    index: number;
}

export const CarCard: React.FC<CarCardProps> = ({ car, index }) => {
    const { ref, isInView } = useInView();
    const animatedPrice = useCounter(car.pricePerDay, 1500, 0);

    const renderTransmissionIcon = (transmission: string) => {
        switch (transmission.toLowerCase()) {
            case 'automatic':
                return (
                    <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        className="car-card__main-item-icon"
                    >
                        <path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M20 8.74196C20.883 8.35618 21.5 7.47514 21.5 6.44998C21.5 5.06927 20.3807 3.94998 19 3.94998C17.6193 3.94998 16.5 5.06927 16.5 6.44998C16.5 7.47514 17.117 8.35618 18 8.74196V10C18 10.5523 17.5523 11 17 11L13 11V8.84198C13.883 8.4562 14.5 7.57516 14.5 6.55C14.5 5.16929 13.3807 4.05 12 4.05C10.6193 4.05 9.5 5.16929 9.5 6.55C9.5 7.57516 10.117 8.4562 11 8.84198V11H6V8.79197C6.88295 8.40619 7.5 7.52515 7.5 6.49999C7.5 5.11928 6.38071 3.99999 5 3.99999C3.61929 3.99999 2.5 5.11928 2.5 6.49999C2.5 7.52515 3.11705 8.40619 4 8.79197L4 11L4 13L4 15.158C3.11705 15.5438 2.5 16.4248 2.5 17.45C2.5 18.8307 3.61929 19.95 5 19.95C6.38071 19.95 7.5 18.8307 7.5 17.45C7.5 16.4248 6.88295 15.5438 6 15.158V13H11V15.108C10.117 15.4938 9.5 16.3748 9.5 17.4C9.5 18.7807 10.6193 19.9 12 19.9C13.3807 19.9 14.5 18.7807 14.5 17.4C14.5 16.3748 13.883 15.4938 13 15.108V13H17C18.6569 13 20 11.6569 20 10V8.74196Z"
                            fill="currentColor"
                        />
                    </svg>
                );
            case 'manual':
                return <Settings className="w-5 h-5 text-gray-600" />;
            case 'hybrid':
                return <Leaf className="w-5 h-5 text-green-500" />;
            default:
                return <HelpCircle className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <motion.div
            ref={ref}
            variants={fadeInUp}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            transition={{ delay: index * 0.1 }}
        >
            <Card className="overflow-hidden flex flex-col">
                {/* Image */}
                <motion.img
                    whileHover={{ scale: 1.03 }}
                    transition={{ duration: 0.3 }}
                    src={car.image}
                    alt={car.name}
                    className="w-full h-40 object-contain bg-white"
                />

                {/* Content */}
                <div className="p-4 flex flex-col justify-between flex-1">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {car.name}
                        </h3>
                        {/* <p className="text-sm text-gray-500">{car.type}</p> */}
                    </div>

                    {/* Specs row and Price & CTA in the same row */}
                    <div className="flex items-center justify-between gap-4 text-sm text-gray-600 mt-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span>{car.seats}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {renderTransmissionIcon(car.transmission)}
                                <span>{car.transmission}</span>
                            </div>


                        </div>
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-gray-900">${car.pricePerDay}</span>
                            <span className="text-gray-600 text-sm">/day</span>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div >
    );
};