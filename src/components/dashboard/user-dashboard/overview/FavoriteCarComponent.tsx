import { motion } from 'framer-motion';
import { Leaf, Image, ArrowRight } from 'lucide-react';
import { FaGasPump } from "react-icons/fa6";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled, TbCar4WdFilled } from "react-icons/tb";
import { PiSpeedometerFill } from "react-icons/pi";
import { BiSolidHeart } from "react-icons/bi";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../../../hooks/useInView';
import { FavoriteCar } from '../../../../types';
import { fadeInUp } from '../../../../utils/animations';
import { useNavigate } from 'react-router-dom';
import { fetchImagesByCarName } from '../../../../lib/db/cars/cars';

interface FavoriteCarComponentProps {
    favoriteCars?: FavoriteCar[] | null;
}

export default function FavoriteCarComponent({ favoriteCars }: FavoriteCarComponentProps) {
    const { ref, isInView } = useInView();
    const { t } = useTranslation();
    const [carsWithImages, setCarsWithImages] = useState<FavoriteCar[]>(favoriteCars || []);
    const [activePhotoIndices, setActivePhotoIndices] = useState<Map<number, number>>(new Map());

    // Load favorite state from localStorage
    const getFavorites = (): number[] => {
        try {
            const favorites = localStorage.getItem('carFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    };

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

    // Handle favorite toggle with confirmation
    const handleFavoriteToggle = (carId: number, carName: string) => {
        const confirmed = window.confirm(`Ești sigur că vrei să scoți "${carName}" din favorite?`);
        if (confirmed) {
            saveFavorite(carId, false);
            // Remove the car from the displayed list
            setCarsWithImages(prev => prev.filter(car => car.car?.id !== carId));
            // Clean up active photo index for this car
            setActivePhotoIndices(prev => {
                const newMap = new Map(prev);
                newMap.delete(carId);
                return newMap;
            });
        }
    };

    // Fetch car images from storage
    useEffect(() => {
        const fetchCarsImages = async () => {
            if (!favoriteCars || favoriteCars.length === 0) return;

            try {
                const updatedCars = await Promise.all(
                    favoriteCars.map(async (favoriteCar) => {
                        if (!favoriteCar.car) return favoriteCar;

                        try {
                            // Fetch images from storage for this car
                            let carName = favoriteCar.car.name;
                            if (!carName || carName.trim() === '') {
                                carName = `${favoriteCar.car.make} ${favoriteCar.car.model}`;
                            }

                            const { mainImage, photoGallery } = await fetchImagesByCarName(carName);

                            // Update car with images from storage
                            return {
                                ...favoriteCar,
                                car: {
                                    ...favoriteCar.car,
                                    image_url: mainImage || favoriteCar.car.image_url,
                                    photo_gallery: photoGallery.length > 0 ? photoGallery : favoriteCar.car.photo_gallery,
                                }
                            };
                        } catch (error) {
                            console.error(`Error fetching images for car ${favoriteCar.car?.id}:`, error);
                            return favoriteCar;
                        }
                    })
                );

                setCarsWithImages(updatedCars);
            } catch (error) {
                console.error('Error fetching cars images:', error);
                // Fallback to original cars if image fetch fails
                setCarsWithImages(favoriteCars);
            }
        };

        fetchCarsImages();
    }, [favoriteCars]);

    const navigate = useNavigate();

    // Function to render individual car card
    const renderCarCard = (favoriteCar: FavoriteCar, index: number) => {
        const carId = favoriteCar.car?.id || index;
        const activePhotoIndex = activePhotoIndices.get(carId) || 0;

        return (
            <div
                key={favoriteCar.car?.id || index}
                className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden transition-all duration-300 group cursor-pointer hover:-translate-y-2 hover:shadow-2xl"
            >
                {/* Image Container */}
                <div
                    className="relative overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/cars/${favoriteCar.car?.id}`)}
                    onMouseMove={(e) => {
                        if (favoriteCar.car?.photo_gallery && favoriteCar.car.photo_gallery.length > 1) {
                            const container = e.currentTarget;
                            const rect = container.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            const maxPhotos = 5;
                            const photosToShow = Math.min(favoriteCar.car.photo_gallery.length, maxPhotos);
                            const photoIndex = Math.floor((x / width) * photosToShow);
                            const clampedIndex = Math.max(0, Math.min(photoIndex, photosToShow - 1));

                            setActivePhotoIndices(prev => new Map(prev.set(carId, clampedIndex)));

                            const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                            if (imageContainer) {
                                const translateX = -(clampedIndex * 100);
                                imageContainer.style.transform = `translateX(${translateX}%)`;
                            }
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (favoriteCar.car?.photo_gallery && favoriteCar.car.photo_gallery.length > 1) {
                            setActivePhotoIndices(prev => new Map(prev.set(carId, 0)));
                            const imageContainer = e.currentTarget.querySelector('.photo-gallery') as HTMLElement;
                            if (imageContainer) {
                                imageContainer.style.transform = 'translateX(0%)';
                            }
                        }
                    }}
                >
                    <div className="flex transition-transform duration-300 ease-out group-hover:scale-105 photo-gallery">
                        {favoriteCar.car?.photo_gallery && favoriteCar.car.photo_gallery.length > 1 ? (
                            (() => {
                                const maxPhotos = 5;
                                const photosToShow = favoriteCar.car.photo_gallery.slice(0, maxPhotos);
                                const totalPhotos = favoriteCar.car.photo_gallery.length;
                                const remainingPhotos = totalPhotos - maxPhotos;

                                return photosToShow.map((photo, index) => (
                                    <div
                                        key={index}
                                        className="relative w-full h-56 flex-shrink-0"
                                        style={{ minWidth: '100%' }}
                                    >
                                        <img
                                            src={photo}
                                            alt={`${favoriteCar.car?.make} ${favoriteCar.car?.model} - Photo ${index + 1}`}
                                            className="w-full h-56 object-cover object-center bg-black/10"
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
                            favoriteCar.car?.image_url ? (
                                <img
                                    src={favoriteCar.car.image_url}
                                    alt={favoriteCar.car.make + ' ' + favoriteCar.car.model}
                                    className="w-full h-56 object-cover object-center bg-black/10"
                                />
                            ) : (
                                <div className="w-full h-56 bg-black/10 flex flex-col items-center justify-center text-gray-300 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.03]"
                                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3 shadow-sm border border-white/10">
                                            <Image className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fără fotografii</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    {/* Photo Navigation Lines */}
                    {favoriteCar.car?.photo_gallery && favoriteCar.car.photo_gallery.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1 px-4">
                            {Array.from({ length: Math.min(favoriteCar.car.photo_gallery.length, 5) }).map((_, index) => (
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

                    {/* Favorite Heart Icon - Top Right */}
                    <div
                        className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg border border-white/20 cursor-pointer hover:bg-red-600 transition-colors duration-200"
                        onClick={(e) => {
                            e.stopPropagation(); // Prevent card click navigation
                            handleFavoriteToggle(favoriteCar.car?.id || 0, `${favoriteCar.car?.make} ${favoriteCar.car?.model}`);
                        }}
                        title="Scoate din favorite"
                    >
                        <BiSolidHeart className="text-white w-5 h-5" />
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1" onClick={() => navigate(`/cars/${favoriteCar.car?.id}`)}>
                    {/* Car Name and Year */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white group-hover:text-gray-300 transition-colors duration-300">
                                {favoriteCar.car?.make}{' '}{favoriteCar.car?.model}
                            </h3>
                            <span className="text-lg font-bold text-gray-300">
                                {favoriteCar.car?.year}
                            </span>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <PiSpeedometerFill className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">{t('car.mileageLimit')}</span>
                        </div>

                        {/* Transmission */}
                        <div className="flex items-center justify-end gap-2 text-gray-300">
                            <span className="text-sm font-medium">
                                {(() => {
                                    const trans = favoriteCar.car?.transmission?.trim() || '';
                                    if (trans.toLowerCase() === 'automatic' || trans === 'Automatic') {
                                        return 'Automată';
                                    }
                                    if (trans.toLowerCase() === 'manual' || trans === 'Manual') {
                                        return 'Manuală';
                                    }
                                    return trans || 'Automată';
                                })()}
                            </span>
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                {renderTransmissionIcon(favoriteCar.car?.transmission || 'Automatic')}
                            </div>
                        </div>

                        {/* Fuel Type */}
                        <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <FaGasPump className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">
                                {favoriteCar.car?.fuel_type === 'gasoline' ? 'Benzină' :
                                    favoriteCar.car?.fuel_type === 'diesel' ? 'Diesel' :
                                        favoriteCar.car?.fuel_type === 'petrol' ? 'Benzină' :
                                            favoriteCar.car?.fuel_type === 'hybrid' ? 'Hibrid' :
                                                favoriteCar.car?.fuel_type === 'electric' ? 'Electric' : favoriteCar.car?.fuel_type}
                            </span>
                        </div>

                        {/* Drivetrain */}
                        <div className="flex items-center justify-end gap-2 text-gray-300">
                            <span className="text-sm font-medium">{favoriteCar.car?.drivetrain || ''}</span>
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <TbCar4WdFilled className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        {(() => {
                            const basePrice = (favoriteCar.car as any).pricePerDay || favoriteCar.car?.price_per_day || 0;
                            const discount = (favoriteCar.car as any).discount_percentage || favoriteCar.car?.discount_percentage || 0;
                            const finalPrice = discount > 0
                                ? basePrice * (1 - discount / 100)
                                : basePrice;

                            return (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-white">{finalPrice.toFixed(0)} MDL</span>
                                        <span className="text-gray-400 text-sm">/zi</span>
                                    </div>
                                    {discount > 0 && (
                                        <span className="text-sm text-red-300 line-through font-semibold decoration-red-400/60">{basePrice} MDL</span>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-white h-6 flex items-center justify-center">{favoriteCar.car?.rating}</span>
                            <img src="/LevelAutoRental/assets/star.png" alt="Rating" className="w-6 h-6 flex-shrink-0 ml-2 relative bottom-0.5" />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransmissionIcon = (transmission: string | undefined) => {
        if (!transmission) return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
        switch (transmission.toLowerCase()) {
            case 'automatic':
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
            case 'manual':
                return React.createElement(TbManualGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
            case 'hybrid':
                return <Leaf className="w-5 h-5 text-green-500" />;
            default:
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
        }
    };

    if (!carsWithImages || carsWithImages.length === 0) {
        return (
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
                <div className="text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
                        <BiSolidHeart className="text-red-400" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-3">{t('dashboard.overview.favoriteCars')}</h3>
                    <p className="text-gray-400 text-lg mb-6 max-w-md mx-auto">
                        {t('dashboard.overview.noFavoriteCars')}
                    </p>
                    <button
                        onClick={() => navigate('/cars')}
                        className="inline-flex items-center gap-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 px-6 py-3 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    >
                        <span>{t('dashboard.overview.startBorrowing')}</span>
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            ref={ref}
            variants={fadeInUp}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            transition={{ delay: 0.1 }}
        >
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white">{t('dashboard.overview.favoriteCars')}</h3>
                </div>

            {/* Grid container for multiple favorite cars */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {carsWithImages.map((favoriteCar, index) => renderCarCard(favoriteCar, index))}
            </div>
        </motion.div>
    );
}
