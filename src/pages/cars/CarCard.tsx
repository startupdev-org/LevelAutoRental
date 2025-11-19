import { motion } from 'framer-motion';
import { Leaf, Image } from 'lucide-react';
import { FaGasPump } from "react-icons/fa6";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled, TbCar4WdFilled } from "react-icons/tb";
import { PiSpeedometerFill } from "react-icons/pi";
import { BiSolidHeart } from "react-icons/bi";
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { Car } from '../../types';
import { fadeInUp } from '../../utils/animations';
import { Card } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';


interface CarCardProps {
    car: Car;
    index: number;
}

export const CarCard: React.FC<CarCardProps> = ({ car, index }) => {
    const { ref, isInView } = useInView();
    const { t } = useTranslation();
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);

    // Load favorite state from localStorage
    const getFavorites = (): number[] => {
        try {
            const favorites = localStorage.getItem('carFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    };

    const [isFavorite, setIsFavorite] = useState(() => {
        const favorites = getFavorites();
        return favorites.includes(car.id);
    });

    // Save favorites to localStorage
    const saveFavorite = (carId: number, favorite: boolean) => {
        const favorites = getFavorites();
        if (favorite) {
            if (!favorites.includes(carId)) {
                favorites.push(carId);
            }
        } else {
            const index = favorites.indexOf(carId);
            if (index > -1) {
                favorites.splice(index, 1);
            }
        }
        localStorage.setItem('carFavorites', JSON.stringify(favorites));
    };

    // Handle favorite toggle
    const handleFavoriteToggle = () => {
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        saveFavorite(car.id, newFavoriteState);
    };

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
                className="overflow-hidden flex flex-col bg-white transition-all duration-300 border border-gray-300 group rounded-3xl !shadow-none cursor-pointer hover:-translate-y-2 hover:shadow-lg" hover={false}
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
                            const maxPhotos = 5;
                            const photosToShow = Math.min(car.photoGallery.length, maxPhotos);
                            const photoIndex = Math.floor((x / width) * photosToShow);
                            const clampedIndex = Math.max(0, Math.min(photoIndex, photosToShow - 1));

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
                            (() => {
                                const maxPhotos = 5;
                                const photosToShow = car.photoGallery.slice(0, maxPhotos);
                                const totalPhotos = car.photoGallery.length;
                                const remainingPhotos = totalPhotos - maxPhotos;

                                return photosToShow.map((photo, index) => (
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
                                            const isLastVisiblePhoto = index === photosToShow.length - 1;

                                            if (isLastVisiblePhoto && remainingPhotos > 0) {
                                                return (
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                        <Image className="w-8 h-8 mb-2" />
                                                        <span className="text-lg font-semibold">
                                                            {t('car.seeMorePhotos', { count: remainingPhotos })}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            if (isLastVisiblePhoto && remainingPhotos === 0) {
                                                return (
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                        <Image className="w-8 h-8 mb-2" />
                                                        <span className="text-lg font-semibold">{t('car.seeCar')}</span>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })()}
                                    </div>
                                ));
                            })()
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
                            {Array.from({ length: Math.min(car.photoGallery.length, 5) }).map((_, index) => (
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

                    {/* Availability Badge */}
                    {car.availability && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-xs font-normal shadow-sm flex items-center gap-1.5">
                            <svg className="w-3 h-3 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="whitespace-nowrap">{car.availability}</span>
                        </div>
                    )}

                    {/* Favorite Heart Icon - Top Right */}
                    <div
                        className={`absolute top-3 right-3 z-10 group/heart transition-opacity duration-300 cursor-pointer ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle();
                        }}
                    >
                        {React.createElement(BiSolidHeart as any, {
                            className: `transition-all duration-300 hover:scale-110 ${isFavorite
                                ? 'w-6 h-6 text-red-500'
                                : 'w-6 h-6 text-gray-400 group-hover/heart:text-red-500'
                                }`
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1" onClick={() => navigate(`/cars/${car.id}`)}>
                    {/* Car Name and Year */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                                {car.make}{' '}{car.model}
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

                        {/* Transmission */}
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

                        {/* Fuel Type */}
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(FaGasPump as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                            <span className="text-sm font-medium">
                                {car.fuel_type === 'gasoline' ? 'Benzină' :
                                    car.fuel_type === 'diesel' ? 'Diesel' :
                                        car.fuel_type === 'petrol' ? 'Benzină' :
                                            car.fuel_type === 'hybrid' ? 'Hibrid' :
                                                car.fuel_type === 'electric' ? 'Electric' : car.fuel_type}
                            </span>
                        </div>

                        {/* Drivetrain */}
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
                            <span className="text-xl font-bold text-gray-800">{car.price_per_day} MDL</span>
                            <span className="text-gray-500 text-sm">/zi</span>
                        </div>

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900 h-6 flex items-center justify-center">{car.rating}</span>
                            <img src="/LevelAutoRental/assets/star.png" alt="Rating" className="w-6 h-6 flex-shrink-0 ml-2" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};