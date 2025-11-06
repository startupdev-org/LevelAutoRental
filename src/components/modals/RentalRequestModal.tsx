import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Car, Gauge, Zap, UserRound, Star, Shield, Baby, Wifi, Wrench, Check } from 'lucide-react';
import { Input } from '../ui/Input';

interface RentalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    car: {
        id: number;
        name: string;
        pricePerDay: number;
    };
    pickupDate: string;
    returnDate: string;
    pickupTime: string;
    returnTime: string;
    rentalCalculation: {
        days: number;
        hours: number;
        pricePerDay: number;
        totalPrice: number;
    } | null;
}

export const RentalRequestModal: React.FC<RentalRequestModalProps> = ({
    isOpen,
    onClose,
    car,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    rentalCalculation
}) => {
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        birthDate: '',
        phone: '',
        email: '',
        comment: ''
    });

    const [options, setOptions] = useState({
        pickupAtAddress: false,
        returnAtAddress: false,
        unlimitedKm: false,
        speedLimitIncrease: false,
        personalDriver: false,
        priorityService: false,
        tireInsurance: false,
        childSeat: false,
        simCard: false,
        roadsideAssistance: false
    });

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    // Calculate base price with discount (same logic as Calculator page)
    const calculateBasePrice = () => {
        if (!rentalCalculation) return 0;
        const pricePerDay = car.pricePerDay;
        const rentalDays = rentalCalculation.days;
        const totalDays = rentalDays + (rentalCalculation.hours / 24);
        
        // Apply discount based on days (same as Calculator)
        if (rentalDays >= 8) {
            return pricePerDay * 0.96 * totalDays; // -4% discount
        } else if (rentalDays >= 4) {
            return pricePerDay * 0.98 * totalDays; // -2% discount
        }
        return pricePerDay * totalDays;
    };

    const calculateTotalCost = () => {
        if (!rentalCalculation) return 0;

        // Use the same calculation logic as Calculator page
        const basePrice = calculateBasePrice();
        const baseCarPrice = car.pricePerDay;
        const totalDays = rentalCalculation.days + (rentalCalculation.hours / 24);
        let additionalCost = 0;

        // Percentage-based options (calculated as percentage of base car price * days, like Calculator)
        if (options.unlimitedKm) {
            additionalCost += baseCarPrice * totalDays * 0.5; // 50% of daily rate
        }
        if (options.speedLimitIncrease) {
            additionalCost += baseCarPrice * totalDays * 0.2; // 20% of daily rate
        }
        if (options.tireInsurance) {
            additionalCost += baseCarPrice * totalDays * 0.2; // 20% of daily rate
        }

        // Fixed daily costs (same as Calculator)
        if (options.personalDriver) {
            additionalCost += 800 * rentalCalculation.days;
        }
        if (options.priorityService) {
            additionalCost += 1000 * rentalCalculation.days;
        }
        if (options.childSeat) {
            additionalCost += 100 * rentalCalculation.days;
        }
        if (options.simCard) {
            additionalCost += 100 * rentalCalculation.days;
        }
        if (options.roadsideAssistance) {
            additionalCost += 500 * rentalCalculation.days;
        }

        // Pickup/return at address costs are calculated separately (not included in base)
        // They would be calculated based on location, so we don't add them here

        return Math.round(basePrice + additionalCost);
    };

    const basePrice = calculateBasePrice();
    const totalCost = calculateTotalCost();
    const pricePerDay = rentalCalculation ? Math.round(totalCost / (rentalCalculation.days + (rentalCalculation.hours / 24))) : 0;
    
    // Calculate discount info
    const discountPercentage = rentalCalculation && rentalCalculation.days >= 8 
        ? 4 
        : rentalCalculation && rentalCalculation.days >= 4 
        ? 2 
        : 0;
    
    const originalPrice = rentalCalculation 
        ? car.pricePerDay * (rentalCalculation.days + (rentalCalculation.hours / 24))
        : 0;

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleOptionChange = (option: string, value: boolean) => {
        setOptions(prev => ({ ...prev, [option]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Rental request submitted:', {
            car,
            dates: { pickupDate, returnDate, pickupTime, returnTime },
            formData,
            options,
            totalCost
        });
        // Here you would typically send the data to your backend
        // For now, we'll just close the modal
        onClose();
    };

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                firstName: '',
                lastName: '',
                birthDate: '',
                phone: '',
                email: '',
                comment: ''
            });
            setOptions({
                pickupAtAddress: false,
                returnAtAddress: false,
                unlimitedKm: false,
                speedLimitIncrease: false,
                personalDriver: false,
                priorityService: false,
                tireInsurance: false,
                childSeat: false,
                simCard: false,
                roadsideAssistance: false
            });
        }
    }, [isOpen]);

    if (!rentalCalculation) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-3xl md:rounded-3xl rounded-t-3xl shadow-2xl max-w-5xl w-full max-h-[95vh] md:max-h-[92vh] overflow-hidden md:my-4">
                            {/* Header */}
                            <div className="sticky top-0 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-4 md:px-8 py-4 md:py-6 flex items-center justify-between rounded-t-3xl z-10 backdrop-blur-sm">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Cerere de închiriere</h2>
                                    <p className="text-xs md:text-sm text-gray-500">{car.name}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 md:p-2.5 hover:bg-white rounded-xl transition-all hover:shadow-md flex-shrink-0"
                                >
                                    <X className="w-5 h-5 md:w-6 md:h-6 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(95vh-320px)] md:max-h-[calc(92vh-240px)]">
                                <form onSubmit={handleSubmit} className="px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8 pb-32">
                                    {/* Rental Period */}
                                    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
                                                <Calendar className="w-4 md:w-5 h-4 md:h-5 text-theme-500" />
                                            </div>
                                            Perioada închirierii
                                        </h3>
                                        <div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 mb-4 md:mb-5">
                                            <Clock className="w-4 h-4 text-gray-600" />
                                            <span className="text-xs md:text-sm font-semibold text-gray-900">
                                                {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                                {rentalCalculation.hours > 0 && `, ${rentalCalculation.hours} ${rentalCalculation.hours === 1 ? 'oră' : 'ore'}`}
                                            </span>
                                        </div>
                                        
                                        {/* Discount indicator */}
                                        {discountPercentage > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="mb-4 md:mb-5 p-3 md:p-4 bg-theme-50 border border-theme-200 rounded-xl"
                                            >
                                                <div className="flex items-center gap-2 md:gap-3 text-gray-900 text-xs md:text-sm font-semibold">
                                                    <div className="p-1 md:p-1.5 bg-theme-500 rounded-lg flex-shrink-0">
                                                        <Check className="w-3 md:w-4 h-3 md:h-4 text-white" />
                                                    </div>
                                                    <span>
                                                        {discountPercentage === 4 
                                                            ? 'Reducere de 4% pentru 8+ zile'
                                                            : 'Reducere de 2% pentru 4+ zile'
                                                        }
                                                    </span>
                                                </div>
                                            </motion.div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                                            <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                                                <div className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 md:mb-2">Data preluării</div>
                                                <div className="text-sm md:text-base font-bold text-gray-900">{formatDate(pickupDate)}</div>
                                                <div className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">ora {pickupTime}</div>
                                            </div>
                                            <div className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
                                                <div className="text-[10px] md:text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 md:mb-2">Data returnării</div>
                                                <div className="text-sm md:text-base font-bold text-gray-900">{formatDate(returnDate)}</div>
                                                <div className="text-xs md:text-sm text-gray-600 mt-0.5 md:mt-1">ora {returnTime}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Contact Information */}
                                    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
                                                <UserRound className="w-4 md:w-5 h-4 md:h-5 text-theme-500" />
                                            </div>
                                            Date de contact
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Prenume</label>
                                                <input
                                                    type="text"
                                                    value={formData.firstName}
                                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Nume</label>
                                                <input
                                                    type="text"
                                                    value={formData.lastName}
                                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Data nașterii</label>
                                                <input
                                                    type="text"
                                                    value={formData.birthDate}
                                                    onChange={(e) => handleInputChange('birthDate', e.target.value)}
                                                    placeholder="__.__.____"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm text-gray-600 font-medium">
                                                        🇲🇩 +373
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                                        placeholder="000 00 000"
                                                        className="w-full pl-24 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">E-mail <span className="text-gray-400 font-normal">(opțional)</span></label>
                                                <input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                                    placeholder="email@mail.com"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rental Options */}
                                    <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 shadow-sm">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4 md:mb-6 flex items-center gap-2 md:gap-3">
                                            <div className="p-1.5 md:p-2 bg-gray-100 rounded-lg">
                                                <Car className="w-4 md:w-5 h-4 md:h-5 text-theme-500" />
                                            </div>
                                            Opțiuni de închiriere
                                        </h3>
                                        
                                        {/* Pickup and Return */}
                                        <div className="space-y-2 mb-5 md:mb-6">
                                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Preluarea și returnarea automobilului</h4>
                                            <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={options.pickupAtAddress}
                                                            onChange={(e) => handleOptionChange('pickupAtAddress', e.target.checked)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                            options.pickupAtAddress
                                                                ? 'bg-theme-500 border-theme-500'
                                                                : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                        }`}>
                                                            <svg
                                                                className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                    options.pickupAtAddress ? 'opacity-100' : 'opacity-0'
                                                                }`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-xs md:text-sm">Preluarea la adresă</div>
                                                        <div className="text-[10px] md:text-xs text-gray-600 mt-0.5">Cost separat</div>
                                                    </div>
                                                </div>
                                            </label>
                                            <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                <div className="flex items-center gap-3 md:gap-4">
                                                    <div className="relative flex-shrink-0">
                                                        <input
                                                            type="checkbox"
                                                            checked={options.returnAtAddress}
                                                            onChange={(e) => handleOptionChange('returnAtAddress', e.target.checked)}
                                                            className="sr-only"
                                                        />
                                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                            options.returnAtAddress
                                                                ? 'bg-theme-500 border-theme-500'
                                                                : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                        }`}>
                                                            <svg
                                                                className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                    options.returnAtAddress ? 'opacity-100' : 'opacity-0'
                                                                }`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900 text-xs md:text-sm">Returnarea la adresă</div>
                                                        <div className="text-[10px] md:text-xs text-gray-600 mt-0.5">Cost separat</div>
                                                    </div>
                                                </div>
                                            </label>
                                        </div>

                                        {/* Limits */}
                                        <div className="mb-5 md:mb-6">
                                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Limite</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.unlimitedKm}
                                                                onChange={(e) => handleOptionChange('unlimitedKm', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.unlimitedKm
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.unlimitedKm ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Kilometraj nelimitat</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-theme-500 bg-theme-50 px-2 md:px-3 py-1 rounded-lg">+50%</span>
                                                </label>

                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.speedLimitIncrease}
                                                                onChange={(e) => handleOptionChange('speedLimitIncrease', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.speedLimitIncrease
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.speedLimitIncrease ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Creșterea limitei de viteză</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-theme-500 bg-theme-50 px-2 md:px-3 py-1 rounded-lg">+20%</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* VIP Services */}
                                        <div className="mb-5 md:mb-6">
                                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Servicii VIP</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.personalDriver}
                                                                onChange={(e) => handleOptionChange('personalDriver', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.personalDriver
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.personalDriver ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Șofer personal</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">800 MDL/zi</span>
                                                </label>

                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.priorityService}
                                                                onChange={(e) => handleOptionChange('priorityService', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.priorityService
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.priorityService ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Priority Service</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">1 000 MDL/zi</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Insurance */}
                                        <div className="mb-5 md:mb-6">
                                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Asigurare</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.tireInsurance}
                                                                onChange={(e) => handleOptionChange('tireInsurance', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.tireInsurance
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.tireInsurance ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Asigurare anvelope & parbriz</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-theme-500 bg-theme-50 px-2 md:px-3 py-1 rounded-lg">+20%</span>
                                                </label>
                                            </div>
                                        </div>

                                        {/* Additional */}
                                        <div>
                                            <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Suplimentar</h4>
                                            <div className="space-y-2">
                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.childSeat}
                                                                onChange={(e) => handleOptionChange('childSeat', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.childSeat
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.childSeat ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Scaun auto pentru copii</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">100 MDL/zi</span>
                                                </label>

                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.simCard}
                                                                onChange={(e) => handleOptionChange('simCard', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.simCard
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.simCard ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Cartelă SIM cu internet</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">100 MDL/zi</span>
                                                </label>

                                                <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 cursor-pointer transition-all duration-200 group">
                                                    <div className="flex items-center gap-3 md:gap-4">
                                                        <div className="relative flex-shrink-0">
                                                            <input
                                                                type="checkbox"
                                                                checked={options.roadsideAssistance}
                                                                onChange={(e) => handleOptionChange('roadsideAssistance', e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                                options.roadsideAssistance
                                                                    ? 'bg-theme-500 border-theme-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-theme-400'
                                                            }`}>
                                                                <svg
                                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                                        options.roadsideAssistance ? 'opacity-100' : 'opacity-0'
                                                                    }`}
                                                                    fill="currentColor"
                                                                    viewBox="0 0 20 20"
                                                                >
                                                                    <path
                                                                        fillRule="evenodd"
                                                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                        clipRule="evenodd"
                                                                    />
                                                                </svg>
                                                            </div>
                                                        </div>
                                                        <span className="font-medium text-gray-900 text-xs md:text-sm">Asistență rutieră</span>
                                                    </div>
                                                    <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">500 MDL/zi</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Comment */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Comentariu <span className="text-gray-400 font-normal">(opțional)</span></label>
                                        <textarea
                                            value={formData.comment}
                                            onChange={(e) => handleInputChange('comment', e.target.value)}
                                            rows={3}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 resize-none transition-colors hover:border-gray-400"
                                            placeholder="Adăugați un comentariu (opțional)"
                                        />
                                    </div>
                                </form>
                            </div>

                            {/* Sticky Footer with Cost Summary */}
                            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 md:px-8 py-4 md:py-5 rounded-b-3xl shadow-lg">
                                {/* Cost Summary */}
                                <div className="bg-gray-50 rounded-lg p-4 md:p-5 border border-gray-200 mb-3 md:mb-4">
                                    <div className="space-y-1.5 md:space-y-2 mb-2 md:mb-3">
                                        <div className="flex justify-between items-center gap-2">
                                            <span className="text-xs md:text-sm text-gray-600">Preț pentru {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                                {rentalCalculation.hours > 0 && `, ${rentalCalculation.hours} ${rentalCalculation.hours === 1 ? 'oră' : 'ore'}`}
                                            </span>
                                            <span className="text-xs md:text-sm text-gray-900 whitespace-nowrap">{pricePerDay.toLocaleString('ro-RO')} MDL/zi</span>
                                        </div>
                                        {discountPercentage > 0 && (
                                            <div className="flex justify-between items-center text-green-600">
                                                <span className="text-xs md:text-sm font-medium">Reducere</span>
                                                <span className="text-xs md:text-sm font-bold">
                                                    -{discountPercentage}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center pt-2 md:pt-3 border-t border-gray-200">
                                        <span className="text-sm md:text-base font-bold text-gray-900">Total</span>
                                        <span className="text-xl md:text-2xl font-bold text-gray-900">{totalCost.toLocaleString('ro-RO')} MDL</span>
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex flex-col gap-1.5 md:gap-2">
                                    <button
                                        type="submit"
                                        onClick={handleSubmit}
                                        style={{ backgroundColor: '#F4A6A6' }}
                                        className="w-full font-semibold text-sm md:text-base py-3 md:py-3 px-4 md:px-6 rounded-xl transition-all hover:bg-[#F29999] text-white"
                                    >
                                        Trimite cererea
                                    </button>
                                    <p className="text-[10px] md:text-xs text-center text-gray-500 leading-relaxed">
                                        Făcând clic pe butonul «Trimite cererea», sunteți de acord cu termenii de utilizare și politica de confidențialitate
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

