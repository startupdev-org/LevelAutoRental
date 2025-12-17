import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Car as CarIcon, Eye, ArrowRight, Users, CheckCircle } from 'lucide-react';
import { FaGasPump } from "react-icons/fa6";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled, TbCar4WdFilled } from "react-icons/tb";
import { Car } from '../../../types';
import { fetchCarsWithPhotos } from '../../../lib/db/cars/cars-page/cars';

interface CarSelectionSectionProps {
    car?: any;
    selectedCar: any;
    handleSetSelectedCar: (car: any) => void;
}

const renderTransmissionIcon = (transmission: string | undefined) => {
    if (!transmission) return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-4 h-4 text-gray-400" });
    switch (transmission.toLowerCase()) {
        case 'automatic':
            return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-4 h-4 text-gray-400" });
        case 'manual':
            return React.createElement(TbManualGearboxFilled as any, { className: "w-4 h-4 text-gray-400" });
        default:
            return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-4 h-4 text-gray-400" });
    }
};

const CarCard: React.FC<{
    car: Car;
    isSelected: boolean;
    onSelect: () => void;
}> = ({ car, isSelected, onSelect }) => {
    return (
        <motion.div
            onClick={onSelect}
            className={`bg-gradient-to-br rounded-3xl border overflow-hidden transition-all duration-300 group cursor-pointer hover:-translate-y-2 hover:shadow-2xl relative ${
                isSelected
                    ? 'from-theme-500/20 to-theme-500/10 border-theme-500 shadow-lg shadow-theme-500/20'
                    : 'from-white/5 to-white/10 border-white/20 hover:-translate-y-1 hover:shadow-xl'
            }`}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            {/* Selection Indicator */}
            {isSelected && (
                <div className="absolute top-4 right-4 z-10">
                    <div className="bg-theme-500 rounded-full p-2">
                        <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}

            {/* Car Image */}
            <div className="relative overflow-hidden">
                {car.image_url ? (
                    <img
                        src={car.image_url}
                        alt={`${car.make} ${car.model}`}
                        className="w-full h-56 object-cover object-center bg-black/10 transition-transform duration-300 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-56 bg-black/10 flex flex-col items-center justify-center text-gray-300 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.03]"
                            style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}>
                        </div>
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3 shadow-sm border border-white/10">
                                <CarIcon className="w-8 h-8 text-gray-300" />
                            </div>
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fără fotografii</span>
                        </div>
                    </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Content */}
            <div className="p-5 flex flex-col justify-between flex-1">
                {/* Car Name and Year */}
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-white group-hover:text-gray-300 transition-colors duration-300">
                            {car.make} {car.model}
                        </h3>
                        <span className="text-lg font-bold text-gray-300">
                            {car.year}
                        </span>
                    </div>
                </div>

                {/* Specifications Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            <Users className="w-4 h-4 text-gray-300" />
                        </div>
                        <span className="text-sm font-medium">{car.seats} locuri</span>
                    </div>

                    {/* Transmission */}
                    <div className="flex items-center justify-end gap-2 text-gray-300">
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
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            {renderTransmissionIcon(car.transmission || 'Automatic')}
                        </div>
                    </div>

                    {/* Fuel Type */}
                    <div className="flex items-center gap-2 text-gray-300">
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            {/* @ts-ignore */}
                            <FaGasPump className="w-4 h-4 text-gray-300" />
                        </div>
                        <span className="text-sm font-medium">
                            {car.fuel_type === 'gasoline' ? 'Benzină' :
                                car.fuel_type === 'diesel' ? 'Diesel' :
                                    car.fuel_type === 'petrol' ? t('car.fuel.benzina') :
                                        car.fuel_type === 'hybrid' ? 'Hibrid' :
                                            car.fuel_type === 'electric' ? 'Electric' : car.fuel_type}
                        </span>
                    </div>

                    {/* Body Type */}
                    <div className="flex items-center justify-end gap-2 text-gray-300">
                        <span className="text-sm font-medium capitalize">{car.body}</span>
                        <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                            {/* @ts-ignore */}
                            <TbCar4WdFilled className="w-4 h-4 text-gray-300" />
                        </div>
                    </div>
                </div>

                {/* Price */}
                <div className="flex items-center justify-center pt-4 border-t border-white/20">
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-white">
                            {(() => {
                                const basePrice = car.price_over_30_days || 0;
                                return basePrice.toFixed(0);
                            })()} MDL
                        </span>
                        <span className="text-gray-400 text-sm">/zi</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export const CarSelectionSection: React.FC<CarSelectionSectionProps> = ({
    car,
    selectedCar,
    handleSetSelectedCar
}) => {
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCarsWithPhotos();
                setCars(fetchedCars);
            } catch (error) {
                console.error('Error fetching cars:', error);
            } finally {
                setLoading(false);
            }
        };

        loadCars();
    }, []);

    // Update selectedCar when car prop changes (for pre-selected car)
    useEffect(() => {
        if (car && !selectedCar) {
            handleSetSelectedCar(car);
        }
    }, [car, selectedCar, handleSetSelectedCar]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="inline-flex items-center gap-2 text-white/70">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white/70 rounded-full animate-spin"></div>
                    Se încarcă mașinile...
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Selected Car Display */}
            {selectedCar && (
                <div className="bg-white/5 border border-white/20 rounded-xl p-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center">
                            <CarIcon className="w-8 h-8 text-gray-300" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-lg font-bold text-white">
                                {selectedCar.make} {selectedCar.model} ({selectedCar.year})
                            </h4>
                            <p className="text-gray-400 text-sm">
                                {selectedCar.price_over_30_days || 0} MDL/zi • {selectedCar.seats} locuri
                            </p>
                        </div>
                        <div className="text-right">
                            <button
                                onClick={() => onCarSelect(null)}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all text-sm font-medium"
                            >
                                Schimbă
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Car Selection Modal */}
            <AnimatePresence>
                {!selectedCar && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white/5 border border-white/20 rounded-xl p-6"
                    >
                        <div className="mb-6">
                            <h3 className="text-xl font-bold text-white mb-2">Selectați mașina</h3>
                            <p className="text-gray-400 text-sm">Alegeți vehiculul dorit pentru calcularea prețului</p>
                        </div>

                        {cars.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {cars.map((car) => (
                                    <CarCard
                                        key={car.id}
                                        car={car}
                                        isSelected={selectedCar?.id === car.id}
                                        onSelect={() => handleSetSelectedCar(car)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <CarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-400">Nu sunt disponibile mașini în acest moment</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CarSelectionSection;
