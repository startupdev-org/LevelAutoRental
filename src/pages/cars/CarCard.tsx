import { motion } from 'framer-motion';
import { Filter, HelpCircle, Leaf, Search, Star, Users, Circle, Zap, Image } from 'lucide-react';
import { FaGasPump } from "react-icons/fa6";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled, TbCar4WdFilled } from "react-icons/tb";
import { PiTireFill, PiSpeedometerFill } from "react-icons/pi";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cars } from '../../data/cars';
import { useCounter } from '../../hooks/useCounter';
import { useInView } from '../../hooks/useInView';
import { Car } from '../../types';
import { fadeInUp, staggerContainer } from '../../utils/animations';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { redirect, useNavigate } from 'react-router-dom';


interface CarCardProps {
    car: Car;
    index: number;
}

export const CarCard: React.FC<CarCardProps> = ({ car, index }) => {
    const { ref, isInView } = useInView();
    const { t } = useTranslation();
    const animatedPrice = useCounter(car.pricePerDay, 1500, 0);
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [isFavorite, setIsFavorite] = useState(false);

    const navigate = useNavigate();

    const renderTransmissionIcon = (transmission: string | undefined) => {
        if (!transmission) return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
        switch (transmission.toLowerCase()) {
            case 'automatic':
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
            case 'manual':
                return React.createElement(TbManualGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
            case 'hybrid':
                return <Leaf className="w-5 h-5 text-green-500" />;
            default:
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
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
            <Card
                className="overflow-hidden flex flex-col bg-white transition-all duration-300 border border-gray-300 group rounded-2xl !shadow-none cursor-pointer hover:-translate-y-2 hover:shadow-lg" hover={false}
            >
                {/* Image Container */}
                <div
                    className="relative overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/cars/${car.id}`)}
                    onMouseMove={(e) => {
                        if (car.photoGallery && car.photoGallery.length > 1) {
                            const container = e.currentTarget;
                            const rect = container.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            const photoIndex = Math.floor((x / width) * car.photoGallery.length);
                            const clampedIndex = Math.max(0, Math.min(photoIndex, car.photoGallery.length - 1));

                            setActivePhotoIndex(clampedIndex);

                            const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                            if (imageContainer) {
                                const translateX = -(clampedIndex * 100);
                                imageContainer.style.transform = `translateX(${translateX}%)`;
                            }
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (car.photoGallery && car.photoGallery.length > 1) {
                            setActivePhotoIndex(0);
                            const imageContainer = e.currentTarget.querySelector('.photo-gallery') as HTMLElement;
                            if (imageContainer) {
                                imageContainer.style.transform = 'translateX(0%)';
                            }
                        }
                    }}
                >
                    <div className="flex transition-transform duration-300 ease-out group-hover:scale-105 photo-gallery">
                        {car.photoGallery && car.photoGallery.length > 1 ? (
                            car.photoGallery.map((photo, index) => (
                                <div
                                    key={index}
                                    className="relative w-full h-56 flex-shrink-0"
                                    style={{ minWidth: '100%' }}
                                >
                                    <img
                                        src={photo}
                                        alt={`${car.name} - Photo ${index + 1}`}
                                        className="w-full h-56 object-cover object-center bg-gray-100"
                                    />
                                    {(() => {
                                        const totalPhotos = car.photoGallery?.length ?? 0;
                                        const remainingPhotos = totalPhotos - (index + 1);
                                        const isLastPhoto = remainingPhotos === 0;
                                        
                                        return isLastPhoto && (
                                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                <Image className="w-8 h-8 mb-2" />
                                                <span className="text-lg font-semibold">{t('car.seeCar')}</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                            ))
                        ) : (
                            <img
                                src={car.image}
                                alt={car.name}
                                className="w-full h-56 object-cover object-center bg-gray-100"
                            />
                        )}
                    </div>

                    {/* Photo Navigation Lines */}
                    {car.photoGallery && car.photoGallery.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1 px-4">
                            {car.photoGallery.map((_, index) => (
                                <div
                                    key={index}
                                    className={`flex-1 h-0.5 rounded-full transition-colors duration-200 ${index === activePhotoIndex
                                        ? 'bg-white/90'
                                        : 'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Free for Rent Badge */}
                    {car.availability && (
                        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-gray-800 rounded-full px-3 py-1 text-xs font-semibold shadow-sm flex items-center gap-2 transition-opacity duration-300 group-hover:opacity-0">
                            <svg className="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {car.availability}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1" onClick={() => navigate(`/cars/${car.id}`)}>
                    {/* Car Name and Year */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                                {car.name}
                            </h3>
                            <span className="text-lg font-bold text-gray-600">
                                {car.year}
                            </span>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(PiSpeedometerFill as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                            <span className="text-sm font-medium">{t('car.mileageLimit')}</span>
                        </div>

                        <div className="flex items-center justify-end gap-2 text-gray-600">
                            <span className="text-sm font-medium">
                                {(() => {
                                    const trans = car.transmission?.trim() || '';
                                    if (trans.toLowerCase() === 'automatic' || trans === 'Automatic') {
                                        return 'Automată';
                                    }
                                    if (trans.toLowerCase() === 'manual' || trans === 'Manual') {
                                        return 'Manuală';
                                    }
                                    return trans || 'Automată';
                                })()}
                            </span>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {renderTransmissionIcon(car.transmission || 'Automatic')}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(FaGasPump as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                            <span className="text-sm font-medium">
                                {car.fuelType === 'gasoline' ? 'Benzină' :
                                    car.fuelType === 'diesel' ? 'Diesel' :
                                        car.fuelType === 'petrol' ? 'Benzină' :
                                            car.fuelType === 'hybrid' ? 'Hibrid' :
                                                car.fuelType === 'electric' ? 'Electric' : car.fuelType}
                            </span>
                        </div>

                        <div className="flex items-center justify-end gap-2 text-gray-600">
                            <span className="text-sm font-medium">{car.drivetrain || ''}</span>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(TbCar4WdFilled as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                        </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-baseline gap-1">
                            <span className="text-xl font-bold text-gray-800">{car.pricePerDay} MDL</span>
                            <span className="text-gray-500 text-sm">/zi</span>
                        </div>

                        {/* Rating and Favorite Section */}
                        <div className="flex items-center gap-3">
                            {/* Favorite Heart Icon */}
                            <div
                                className="cursor-pointer transition-colors duration-200 hover:scale-110"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFavorite(!isFavorite);
                                }}
                            >
                                {isFavorite ? (
                                    <svg className="w-5 h-5 text-red-500 fill-current" viewBox="0 0 24 24">
                                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-500 hover:text-red-500 fill-none stroke-current" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                    </svg>
                                )}
                            </div>

                            {/* Star Rating */}
                            <div className="flex items-center gap-1 text-gray-600">
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                <span className="text-sm font-semibold">{car.rating}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};