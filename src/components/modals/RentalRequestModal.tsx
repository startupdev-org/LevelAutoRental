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
    // Country codes for phone selector
    const COUNTRY_CODES = [
        { code: '+373', flag: '🇲🇩', country: 'Moldova' },
        { code: '+40', flag: '🇷🇴', country: 'Romania' },
        { code: '+380', flag: '🇺🇦', country: 'Ukraine' },
        { code: '+7', flag: '🇷🇺', country: 'Russia' },
        { code: '+1', flag: '🇺🇸', country: 'USA' },
        { code: '+44', flag: '🇬🇧', country: 'UK' },
        { code: '+49', flag: '🇩🇪', country: 'Germany' },
        { code: '+33', flag: '🇫🇷', country: 'France' },
        { code: '+39', flag: '🇮🇹', country: 'Italy' },
        { code: '+34', flag: '🇪🇸', country: 'Spain' },
        { code: '+32', flag: '🇧🇪', country: 'Belgium' },
        { code: '+31', flag: '🇳🇱', country: 'Netherlands' },
        { code: '+41', flag: '🇨🇭', country: 'Switzerland' },
        { code: '+43', flag: '🇦🇹', country: 'Austria' },
        { code: '+48', flag: '🇵🇱', country: 'Poland' },
        { code: '+420', flag: '🇨🇿', country: 'Czech Republic' },
        { code: '+36', flag: '🇭🇺', country: 'Hungary' },
        { code: '+359', flag: '🇧🇬', country: 'Bulgaria' },
        { code: '+30', flag: '🇬🇷', country: 'Greece' },
        { code: '+90', flag: '🇹🇷', country: 'Turkey' },
    ];

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        phone: '',
        email: '',
        comment: ''
    });

    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);

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

    // Calculate base price with discount (same logic as Calculator page and Admin)
    const calculateBasePrice = () => {
        if (!rentalCalculation) return 0;
        const pricePerDay = car.pricePerDay;
        const rentalDays = rentalCalculation.days; // Use full days for discount calculation
        const totalDays = rentalDays + (rentalCalculation.hours / 24); // Use total days for final calculation
        
        // Base price calculation (same as Calculator.tsx and Admin)
        let basePrice = 0;
        
        if (rentalDays >= 8) {
            basePrice = pricePerDay * 0.96 * rentalDays; // -4% discount
        } else if (rentalDays >= 4) {
            basePrice = pricePerDay * 0.98 * rentalDays; // -2% discount
        } else {
            basePrice = pricePerDay * rentalDays;
        }
        
        // Add hours portion if there are extra hours
        if (rentalCalculation.hours > 0) {
            const hoursPrice = (rentalCalculation.hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }
        
        return basePrice;
    };

    const calculateTotalCost = () => {
        if (!rentalCalculation) return 0;

        // Use the same calculation logic as Calculator page and Admin
        const basePrice = calculateBasePrice();
        const baseCarPrice = car.pricePerDay;
        const rentalDays = rentalCalculation.days; // Use full days for additional costs calculation
        let additionalCost = 0;

        // Percentage-based options (calculated as percentage of base car price * days, like Calculator and Admin)
        if (options.unlimitedKm) {
            additionalCost += baseCarPrice * rentalDays * 0.5; // 50% of daily rate
        }
        if (options.speedLimitIncrease) {
            additionalCost += baseCarPrice * rentalDays * 0.2; // 20% of daily rate
        }
        if (options.tireInsurance) {
            additionalCost += baseCarPrice * rentalDays * 0.2; // 20% of daily rate
        }

        // Fixed daily costs (same as Calculator and Admin)
        if (options.personalDriver) {
            additionalCost += 800 * rentalDays;
        }
        if (options.priorityService) {
            additionalCost += 1000 * rentalDays;
        }
        if (options.childSeat) {
            additionalCost += 100 * rentalDays;
        }
        if (options.simCard) {
            additionalCost += 100 * rentalDays;
        }
        if (options.roadsideAssistance) {
            additionalCost += 500 * rentalDays;
        }

        // Pickup/return at address costs are calculated separately (not included in base)
        // They would be calculated based on location, so we don't add them here

        return Math.round(basePrice + additionalCost);
    };

    const basePrice = calculateBasePrice();
    const totalCost = calculateTotalCost();
    
    // Calculate additional costs separately for display
    const baseCarPrice = car.pricePerDay;
    const rentalDays = rentalCalculation?.days || 0;
    let additionalCosts = 0;
    
    // Percentage-based options (calculated as percentage of base car price * days)
    if (options.unlimitedKm) {
        additionalCosts += baseCarPrice * rentalDays * 0.5; // 50%
    }
    if (options.speedLimitIncrease) {
        additionalCosts += baseCarPrice * rentalDays * 0.2; // 20%
    }
    if (options.tireInsurance) {
        additionalCosts += baseCarPrice * rentalDays * 0.2; // 20%
    }
    
    // Fixed daily costs
    if (options.personalDriver) {
        additionalCosts += 800 * rentalDays;
    }
    if (options.priorityService) {
        additionalCosts += 1000 * rentalDays;
    }
    if (options.childSeat) {
        additionalCosts += 100 * rentalDays;
    }
    if (options.simCard) {
        additionalCosts += 100 * rentalDays;
    }
    if (options.roadsideAssistance) {
        additionalCosts += 500 * rentalDays;
    }
    
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
        // Include country code in phone number
        const fullPhoneNumber = `${selectedCountryCode.code} ${formData.phone}`.trim();
        console.log('Rental request submitted:', {
            car,
            dates: { pickupDate, returnDate, pickupTime, returnTime },
            formData: {
                ...formData,
                phone: fullPhoneNumber
            },
            options,
            totalCost
        });
        // Here you would typically send the data to your backend
        // For now, we'll just close the modal
        onClose();
    };

    // Close country code dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.country-code-dropdown-container')) {
                setShowCountryCodeDropdown(false);
            }
        };

        if (showCountryCodeDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryCodeDropdown]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                firstName: '',
                lastName: '',
                age: '',
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
                            <div className="overflow-y-auto max-h-[calc(95vh-200px)] md:max-h-[calc(92vh-200px)]">
                                <form onSubmit={handleSubmit} className="px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
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
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Vârstă</label>
                                                <input
                                                    type="number"
                                                    value={formData.age}
                                                    onChange={(e) => handleInputChange('age', e.target.value)}
                                                    placeholder="18"
                                                    min="18"
                                                    max="100"
                                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 focus:border-gray-900 transition-colors hover:border-gray-400"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Telefon</label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 country-code-dropdown-container">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                                                            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                                        >
                                                            <span>{selectedCountryCode.flag}</span>
                                                            <span>{selectedCountryCode.code}</span>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {showCountryCodeDropdown && (
                                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 min-w-[200px]">
                                                                {COUNTRY_CODES.map((country) => (
                                                                    <button
                                                                        key={country.code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedCountryCode(country);
                                                                            setShowCountryCodeDropdown(false);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <span>{country.flag}</span>
                                                                        <span className="flex-1 text-left">{country.country}</span>
                                                                        <span className="text-gray-500">{country.code}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
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

                                    {/* Price Summary */}
                                    <div className="bg-gray-50 rounded-lg p-4 md:p-5 border border-gray-200 mt-6">
                                        <h3 className="text-base md:text-lg font-bold text-gray-900 mb-4">Detalii preț</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Preț pe zi</span>
                                                <span className="text-gray-900 font-medium">{car.pricePerDay.toLocaleString('ro-RO')} MDL</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600">Număr zile</span>
                                                <span className="text-gray-900 font-medium">{rentalCalculation.days}</span>
                                            </div>
                                            {discountPercentage > 0 && (
                                                <div className="flex items-center justify-between text-sm text-green-600">
                                                    <span>Reducere</span>
                                                    <span className="font-medium">-{discountPercentage}%</span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-gray-200">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-900 font-medium">Preț de bază</span>
                                                    <span className="text-gray-900 font-medium">{Math.round(basePrice).toLocaleString('ro-RO')} MDL</span>
                                                </div>
                                            </div>
                                            
                                            {additionalCosts > 0 && (
                                                <>
                                                    <div className="pt-3 border-t border-gray-200">
                                                        <h4 className="text-sm font-bold text-gray-900 mb-3">Servicii suplimentare</h4>
                                                        <div className="space-y-2 text-sm">
                                                            {options.unlimitedKm && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Kilometraj nelimitat</span>
                                                                    <span className="text-gray-900 font-medium">
                                                                        {Math.round(car.pricePerDay * rentalCalculation.days * 0.5).toLocaleString('ro-RO')} MDL
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {options.speedLimitIncrease && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Creșterea limitei de viteză</span>
                                                                    <span className="text-gray-900 font-medium">
                                                                        {Math.round(car.pricePerDay * rentalCalculation.days * 0.2).toLocaleString('ro-RO')} MDL
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {options.tireInsurance && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Asigurare anvelope & parbriz</span>
                                                                    <span className="text-gray-900 font-medium">
                                                                        {Math.round(car.pricePerDay * rentalCalculation.days * 0.2).toLocaleString('ro-RO')} MDL
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {options.personalDriver && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Șofer personal</span>
                                                                    <span className="text-gray-900 font-medium">{800 * rentalCalculation.days} MDL</span>
                                                                </div>
                                                            )}
                                                            {options.priorityService && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Priority Service</span>
                                                                    <span className="text-gray-900 font-medium">{1000 * rentalCalculation.days} MDL</span>
                                                                </div>
                                                            )}
                                                            {options.childSeat && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Scaun auto pentru copii</span>
                                                                    <span className="text-gray-900 font-medium">{100 * rentalCalculation.days} MDL</span>
                                                                </div>
                                                            )}
                                                            {options.simCard && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Cartelă SIM cu internet</span>
                                                                    <span className="text-gray-900 font-medium">{100 * rentalCalculation.days} MDL</span>
                                                                </div>
                                                            )}
                                                            {options.roadsideAssistance && (
                                                                <div className="flex justify-between">
                                                                    <span className="text-gray-600">Asistență rutieră</span>
                                                                    <span className="text-gray-900 font-medium">{500 * rentalCalculation.days} MDL</span>
                                                                </div>
                                                            )}
                                                            <div className="pt-2 border-t border-gray-200">
                                                                <div className="flex justify-between font-medium">
                                                                    <span className="text-gray-900">Total servicii</span>
                                                                    <span className="text-gray-900">{Math.round(additionalCosts).toLocaleString('ro-RO')} MDL</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                            
                                            <div className="pt-3 border-t border-gray-200 flex items-center justify-between">
                                                <span className="text-gray-900 font-bold text-lg">Total</span>
                                                <span className="text-gray-900 font-bold text-xl">{totalCost.toLocaleString('ro-RO')} MDL</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Submit Button */}
                                    <div className="flex flex-col gap-1.5 md:gap-2 mt-6">
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
                                </form>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

