import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Calendar, Car, Info, Check, ChevronDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useExchangeRates } from '../../hooks/useExchangeRates';
import { fetchCarsWithPhotos } from '../../lib/db/cars/cars-page/cars';

export const Calculator: React.FC = () => {
    const { t, i18n } = useTranslation();
    const { eur: eurRate, usd: usdRate } = useExchangeRates();
    const [isDesktop, setIsDesktop] = useState(false);
    const [cars, setCars] = useState<any[]>([]);
    const [carsLoading, setCarsLoading] = useState(true);
    const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
    const [pickupDate, setPickupDate] = useState<string>('');
    const [returnDate, setReturnDate] = useState<string>('');

    // Calendar state
    const [showCalendarModal, setShowCalendarModal] = useState(false);
    const [activeCalendarType, setActiveCalendarType] = useState<'pickup' | 'return'>('pickup');
    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>(() => ({
        pickup: new Date(),
        return: new Date()
    }));

    useEffect(() => {
        // Check once on mount
        const handleResize = () => {
            setIsDesktop(window.innerWidth >= 768);
        };
        handleResize();

        // Update on resize
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Fetch cars on component mount
    useEffect(() => {
        const loadCars = async () => {
            try {
                setCarsLoading(true);
                const fetchedCars = await fetchCarsWithPhotos();
                setCars(fetchedCars);
                if (fetchedCars.length > 0) {
                    setSelectedCarId(fetchedCars[0].id);
                }
            } catch (error) {
                console.error('Error fetching cars for calculator:', error);
            } finally {
                setCarsLoading(false);
            }
        };

        loadCars();
    }, []);

    // Sync calendar months with selected dates
    useEffect(() => {
        if (pickupDate) setCalendarMonth(prev => ({ ...prev, pickup: new Date(pickupDate) }));
    }, [pickupDate]);

    useEffect(() => {
        if (returnDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(returnDate) }));
        } else if (pickupDate) {
            const pickup = new Date(pickupDate);
            setCalendarMonth(prev => ({ ...prev, return: new Date(pickup) }));
        }
    }, [returnDate, pickupDate]);


    
    // Additional options
    const [unlimitedKm, setUnlimitedKm] = useState(false);
    const [airportDelivery, setAirportDelivery] = useState(false);
    const [driver, setDriver] = useState(false);
    const [priority, setPriority] = useState(false);
    const [childSeat, setChildSeat] = useState(false);
    const [sim, setSim] = useState(false);
    const [assistance, setAssistance] = useState(false);

    const selectedCar = selectedCarId ? cars.find(c => c.id === selectedCarId) : null;

    // Get price per day based on rental duration
    const getPricePerDay = (days: number): number => {
        if (!selectedCar) return 0;

        if (days >= 2 && days <= 4) {
            return selectedCar.price_2_4_days || 0;
        } else if (days >= 5 && days <= 15) {
            return selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0;
        } else if (days >= 16 && days <= 30) {
            return selectedCar.price_16_30_days || selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0;
        } else if (days > 30) {
            return selectedCar.price_over_30_days || selectedCar.price_16_30_days || selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0;
        }

        return selectedCar.price_2_4_days || 0;
    };

    // Calculate rental days from dates
    const rentalDays = useMemo(() => {
        if (!pickupDate || !returnDate) return 1;
        const pickup = new Date(pickupDate);
        const returnD = new Date(returnDate);
        const diffTime = returnD.getTime() - pickup.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(1, diffDays); // Minimum 1 day
    }, [pickupDate, returnDate]);

    // Calculate base price using tiered pricing
    const basePrice = useMemo(() => {
        if (!selectedCar) return 0;
        const pricePerDay = getPricePerDay(rentalDays);
        return pricePerDay * rentalDays;
    }, [selectedCar, rentalDays, getPricePerDay]);

    // Get current pricing tier info
    const currentPricingTier = useMemo(() => {
        if (!selectedCar) return null;

        let tier = '';
        let price = 0;
        let tierKey = '';

        if (rentalDays >= 2 && rentalDays <= 4) {
            tier = `${rentalDays} ${rentalDays === 1 ? t('calculator.day') : t('calculator.days')}`;
            price = selectedCar.price_2_4_days || 0;
            tierKey = '2-4';
        } else if (rentalDays >= 5 && rentalDays <= 15) {
            tier = `${rentalDays} ${rentalDays === 1 ? t('calculator.day') : t('calculator.days')}`;
            price = selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0;
            tierKey = '5-15';
        } else if (rentalDays >= 16 && rentalDays <= 30) {
            tier = `${rentalDays} ${rentalDays === 1 ? t('calculator.day') : t('calculator.days')}`;
            price = selectedCar.price_16_30_days || selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0;
            tierKey = '16-30';
        } else if (rentalDays > 30) {
            tier = `${rentalDays} ${rentalDays === 1 ? t('calculator.day') : t('calculator.days')}`;
            price = selectedCar.price_over_30_days || selectedCar.price_16_30_days || selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0;
            tierKey = '30+';
        } else {
            tier = `${rentalDays} ${rentalDays === 1 ? t('calculator.day') : t('calculator.days')}`;
            price = selectedCar.price_2_4_days || 0;
            tierKey = '2-4';
        }

        return { tier, price, tierKey };
    }, [selectedCar, rentalDays, t]);

    // Calendar functions
    const formatDate = (dateString: string): string => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('ro-RO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateLocal = (dateString: string): string => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const generateCalendarDays = (date: Date): (string | null)[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (string | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dateString = formatDateLocal(new Date(year, month, day));
            days.push(dateString);
        }

        return days;
    };

    // Calculate additional services
    const additionalCosts = useMemo(() => {
        let total = 0;
        // Use current pricing tier for additional services
        const baseCarPrice = getPricePerDay(rentalDays);
        
        if (unlimitedKm) total += baseCarPrice * rentalDays * 0.5;
        if (driver) total += 800 * rentalDays;
        if (priority) total += 1000 * rentalDays;
        if (childSeat) total += 100 * rentalDays;
        if (sim) total += 100 * rentalDays;
        if (assistance) total += 500 * rentalDays;
        // airportDelivery has no cost specified in the prompt
        
        return total;
    }, [unlimitedKm, driver, priority, childSeat, sim, assistance, selectedCar, rentalDays, airportDelivery, getPricePerDay]);

    const totalPrice = carsLoading ? 0 : basePrice + additionalCosts;
    const priceInEUR = carsLoading ? '0.00' : (totalPrice / eurRate).toFixed(2);
    const priceInUSD = carsLoading ? '0.00' : (totalPrice / usdRate).toFixed(2);

    return (
        <React.Fragment>
            <section
            key={i18n.language}
            className="relative py-60 bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
                backgroundImage: isDesktop ? 'url(/lvl_bg.png)' : 'url(/backgrounds/bg10-mobile.jpeg)',
                backgroundPosition: isDesktop ? 'center -150px' : 'center center',
                backgroundSize: isDesktop ? '115%' : 'cover'
            }}
        >
            {/* Background Overlay */}
            <div className="absolute inset-0 bg-black/60"></div>

            {/* Bottom Gradient Fade (in front of everything) */}
            <div className="absolute bottom-0 left-0 w-full h-40 
                bg-[linear-gradient(to_top,rgba(15,15,15,1),rgba(15,15,15,0))] 
                z-50 pointer-events-none">
            </div>

            <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
                {/* Calculator Content */}
                <div className="grid lg:grid-cols-[1fr_420px] gap-8">
                    {/* Left: Calculator Form */}
                    <div className="space-y-6">
                        {/* Car Selection */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Car className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.selectVehicle')}
                            </h2>
                            <div className="relative">
                            <select
                                value={selectedCarId || ''}
                                onChange={(e) => setSelectedCarId(Number(e.target.value))}
                                    className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-white font-medium transition-all hover:bg-white/15 shadow-sm appearance-none pr-10"
                            >
                                {carsLoading ? (
                                    <option disabled>Loading cars...</option>
                                ) : cars.length === 0 ? (
                                    <option disabled>No cars available</option>
                                ) : (
                                    cars.map(car => (
                                        <option key={car.id} value={car.id} className="bg-gray-800 text-white">
                                            {car.make} {car.model} ({car.year}) - {car.price_2_4_days || car.price_over_30_days || 0} MDL{t('calculator.perDay')}
                                    </option>
                                    ))
                                )}
                            </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                    <ChevronDown className="w-5 h-5 text-white/70" />
                                </div>
                            </div>
                        </motion.div>

                        {/* Rental Period */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.rentalPeriod')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        {t('calculator.pickupDate', 'Pickup Date')} *
                                    </label>
                                        <button
                                            onClick={() => {
                                                setActiveCalendarType('pickup');
                                                setShowCalendarModal(true);
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3.5 px-4 transition-colors text-sm font-medium ${pickupDate
                                                ? 'border-white/30 text-white hover:bg-white/10'
                                                : 'border-white/20 text-white/70 hover:bg-white/5'
                                            } bg-white/5 backdrop-blur-md`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{pickupDate ? formatDate(pickupDate) : t('calculator.selectPickupDate', 'Select pickup date')}</span>
                                        </button>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        {t('calculator.returnDate', 'Return Date')} *
                                    </label>
                                        <button
                                            onClick={() => {
                                                if (!pickupDate) return;
                                                setActiveCalendarType('return');
                                                setShowCalendarModal(true);
                                            }}
                                            disabled={!pickupDate}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3.5 px-4 transition-colors text-sm font-medium ${returnDate
                                                ? 'border-white/30 text-white hover:bg-white/10'
                                                : 'border-white/20 text-white/70 hover:bg-white/5'
                                            } bg-white/5 backdrop-blur-md ${!pickupDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{returnDate ? formatDate(returnDate) : t('calculator.selectReturnDate', 'Select return date')}</span>
                                        </button>
                                    </div>
                                </div>
                        </motion.div>
                        {rentalDays > 0 && (
                                <div className="mt-4 p-3 bg-theme-500/20 border border-theme-500/30 rounded-xl">
                                    <div className="text-sm text-white text-center">
                                        <span className="font-semibold">{t('calculator.totalDays', 'Total Days:')}</span> {rentalDays} {rentalDays === 1 ? t('calculator.day') : t('calculator.days')}
                                    </div>
                                </div>
                            )}

                        {/* Pricing Tiers */}
                        {selectedCar && !carsLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300"
                            >
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded-lg">
                                        <Info className="w-5 h-5 text-theme-500" />
                                    </div>
                                    {t('calculator.pricingTiers', 'Pricing Tiers')}
                                </h2>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        currentPricingTier?.tierKey === '2-4'
                                            ? 'border-theme-500 bg-theme-500/20'
                                            : 'border-white/20 bg-white/5'
                                    }`}>
                                        <div className="text-xs font-semibold text-white/70 uppercase mb-2">2-4 {t('calculator.days', 'days')}</div>
                                        <div className="text-lg font-bold text-white">{selectedCar.price_2_4_days || 0} MDL</div>
                                        <div className="text-xs text-white/60">{t('calculator.perDay')}</div>
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        currentPricingTier?.tierKey === '5-15'
                                            ? 'border-theme-500 bg-theme-500/20'
                                            : 'border-white/20 bg-white/5'
                                    }`}>
                                        <div className="text-xs font-semibold text-white/70 uppercase mb-2">5-15 {t('calculator.days', 'days')}</div>
                                        <div className="text-lg font-bold text-white">{selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0} MDL</div>
                                        <div className="text-xs text-white/60">{t('calculator.perDay')}</div>
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        currentPricingTier?.tierKey === '16-30'
                                            ? 'border-theme-500 bg-theme-500/20'
                                            : 'border-white/20 bg-white/5'
                                    }`}>
                                        <div className="text-xs font-semibold text-white/70 uppercase mb-2">16-30 {t('calculator.days', 'days')}</div>
                                        <div className="text-lg font-bold text-white">{selectedCar.price_16_30_days || selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0} MDL</div>
                                        <div className="text-xs text-white/60">{t('calculator.perDay')}</div>
                                    </div>

                                    <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                                        currentPricingTier?.tierKey === '30+'
                                            ? 'border-theme-500 bg-theme-500/20'
                                            : 'border-white/20 bg-white/5'
                                    }`}>
                                        <div className="text-xs font-semibold text-white/70 uppercase mb-2">30+ {t('calculator.days', 'days')}</div>
                                        <div className="text-lg font-bold text-white">{selectedCar.price_over_30_days || selectedCar.price_16_30_days || selectedCar.price_5_15_days || selectedCar.price_2_4_days || 0} MDL</div>
                                        <div className="text-xs text-white/60">{t('calculator.perDay')}</div>
                                    </div>
                                </div>

                                {currentPricingTier && (
                                    <div className="mt-4 p-3 bg-theme-500/20 border border-theme-500/30 rounded-xl">
                                        <div className="text-sm text-white text-center">
                                            <span className="font-semibold">{t('calculator.currentTier', 'Current:')}</span> {currentPricingTier.tier} - {currentPricingTier.price} MDL/{t('calculator.perDay')}
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}


                        {/* Additional Options */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300"
                        >
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Info className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.additionalOptions')}
                            </h2>
                            
                            <div className="space-y-8">
                                {/* Limite */}
                                <div>
                                    <h3 className="text-white/90 font-bold mb-4 ml-1 text-lg">{t('calculator.limits', 'Limite')}</h3>
                                    <div className="space-y-3">
                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={unlimitedKm}
                                                onChange={(e) => setUnlimitedKm(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                unlimitedKm
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        unlimitedKm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                            </div>
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.unlimitedMileage')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500 bg-theme-500/20 px-3 py-1 rounded-lg">+50%</span>
                                </label>
                                    </div>
                                    </div>

                                {/* Servicii VIP */}
                                <div>
                                    <h3 className="text-white/90 font-bold mb-4 ml-1 text-lg">{t('calculator.vipServices', 'Servicii VIP')}</h3>
                                    <div className="space-y-3">
                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={driver}
                                                onChange={(e) => setDriver(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                driver
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        driver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                            </div>
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.personalDriver')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">800 MDL{t('calculator.perDay')}</span>
                                </label>

                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={priority}
                                                onChange={(e) => setPriority(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                priority
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        priority ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                            </div>
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.priorityService')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">1000 MDL{t('calculator.perDay')}</span>
                                </label>
                                    </div>
                                </div>


                                {/* Suplimentar */}
                                <div>
                                    <h3 className="text-white/90 font-bold mb-4 ml-1 text-lg">{t('calculator.extra', 'Suplimentar')}</h3>
                                    <div className="space-y-3">
                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={childSeat}
                                                onChange={(e) => setChildSeat(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                childSeat
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        childSeat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                            </div>
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.childCarSeat')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">100 MDL{t('calculator.perDay')}</span>
                                </label>

                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={sim}
                                                onChange={(e) => setSim(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                sim
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        sim ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                            </div>
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.simWithInternet')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">100 MDL{t('calculator.perDay')}</span>
                                </label>

                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={assistance}
                                                onChange={(e) => setAssistance(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                assistance
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        assistance ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                            </div>
                                        </div>
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.roadsideAssistance')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">500 MDL{t('calculator.perDay')}</span>
                                </label>
                                    </div>
                                </div>

                                {/* Livrare */}
                                <div>
                                    <h3 className="text-white/90 font-bold mb-4 ml-1 text-lg">{t('calculator.delivery', 'Livrare')}</h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <input
                                                        type="checkbox"
                                                        checked={airportDelivery}
                                                        onChange={(e) => setAirportDelivery(e.target.checked)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                        airportDelivery
                                                            ? 'bg-theme-500 border-theme-500'
                                                            : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                                    }`}>
                                                        <Check className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                            airportDelivery ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                                        }`} />
                                                    </div>
                                                </div>
                                                <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.airportDelivery', 'Livrare aeroport')}</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right: Price Summary (Sticky) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="sticky top-24">
                            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-2xl overflow-hidden">
                                {/* Header */}
                                <div className="bg-gradient-to-br from-theme-500 to-theme-600 text-white p-8">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider opacity-90 mb-3">{t('calculator.totalCost')}</h3>
                                    <div className="text-5xl font-bold mb-3">
                                        {carsLoading ? '...' : totalPrice.toFixed(0)} <span className="text-2xl font-semibold">MDL</span>
                                    </div>
                                    <div className="text-sm opacity-95 font-medium">
                                        {carsLoading ? '... EUR / ... USD' : `${priceInEUR} EUR / ${priceInUSD} USD`}
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="p-6 space-y-5 bg-white/5">
                                    <div>
                                        <h4 className="font-bold text-white mb-4 text-lg">{t('calculator.priceDetails')}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-200">{t('calculator.selectedVehicle')}</span>
                                                <span className="font-medium text-white">
                                                    {carsLoading ? 'Loading...' : selectedCar ? `${selectedCar.make} ${selectedCar.model}` : 'No car selected'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-200">{t('calculator.pricePerDay')}</span>
                                                <span className="font-medium text-white">
                                                    {carsLoading ? '...' : currentPricingTier ? `${currentPricingTier.price} MDL (${currentPricingTier.tier})` : 'N/A'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-200">{t('calculator.rentalPeriod')}</span>
                                                <span className="font-medium text-white">{pickupDate && returnDate ? `${pickupDate} - ${returnDate}` : 'Select dates'}</span>
                                            </div>
                                            <div className="pt-2 border-t border-white/20">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-white">{t('calculator.basePrice')}</span>
                                                    <span className="text-white">{carsLoading ? '...' : basePrice.toFixed(0)} MDL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {additionalCosts > 0 && (
                                        <div className="pt-5 border-t border-white/20">
                                            <h4 className="font-bold text-white mb-4 text-lg">{t('calculator.additionalServices')}</h4>
                                            <div className="space-y-2 text-sm">
                                                {unlimitedKm && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.unlimitedMileage')}</span>
                                                        <span className="font-medium text-white">
                                                            {(((selectedCar?.price_2_4_days || selectedCar?.price_over_30_days || 0)) * rentalDays * 0.5).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {insurance && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.insurance')}</span>
                                                        <span className="font-medium text-white">
                                                            {(((selectedCar?.price_2_4_days || selectedCar?.price_over_30_days || 0)) * rentalDays * 0.2).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {driver && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.personalDriver')}</span>
                                                        <span className="font-medium text-white">{800 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {priority && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.priorityService')}</span>
                                                        <span className="font-medium text-white">{1000 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {childSeat && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.childSeat')}</span>
                                                        <span className="font-medium text-white">{100 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {sim && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.simInternet')}</span>
                                                        <span className="font-medium text-white">{100 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {assistance && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.assistance')}</span>
                                                        <span className="font-medium text-white">{500 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {airportDelivery && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.airportDelivery', 'Livrare aeroport')}</span>
                                                        <span className="font-medium text-white">0 MDL</span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-white/20">
                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-white">{t('calculator.services')}</span>
                                                        <span className="text-white">{carsLoading ? '...' : additionalCosts.toFixed(0)} MDL</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact */}
                                    <div className="pt-5 border-t border-white/20">
                                        <a
                                            href="tel:+37362000112"
                                            className="block w-full bg-theme-500 hover:bg-theme-600 text-white font-bold py-4 px-6 rounded-xl text-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                                        >
                                            {t('calculator.bookNow')}
                                        </a>
                                        <a
                                            href="https://t.me/Level_Auto_Rental"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full mt-3 border-2 border-white/30 hover:border-white/50 hover:bg-white/10 text-white font-semibold py-4 px-6 rounded-xl text-center transition-all duration-200"
                                        >
                                            {t('calculator.contactUs')}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Info box */}
                            <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4">
                                <div className="flex gap-3 items-start">
                                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">i</span>
                                    </div>
                                    <div className="flex-1 text-white">
                                        <p className="font-bold text-sm mb-1">{t('calculator.pricesAreIndicative')}</p>
                                        <p className="text-white/90 text-xs leading-relaxed">
                                            {t('calculator.pricesDescription')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>

        {/* Calendar Modal */}
        <AnimatePresence>
            {showCalendarModal && (
                <React.Fragment key="calendar-modal-container">
                    {/* Backdrop */}
                    <motion.div
                        key="calendar-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                        onClick={() => setShowCalendarModal(false)}
                    />

                    {/* Modal */}
                    <motion.div
                        key="calendar-modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-2xl border border-gray-300 shadow-2xl max-w-md w-full max-h-[95vh] overflow-hidden">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 py-6 flex items-center justify-between rounded-t-2xl z-10">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">
                                        {activeCalendarType === 'pickup'
                                            ? t('calculator.selectPickupDate', 'Select Pickup Date')
                                            : t('calculator.selectReturnDate', 'Select Return Date')
                                        }
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setShowCalendarModal(false)}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-600" />
                                </button>
                            </div>

                            {/* Calendar Content */}
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <button
                                        onClick={() => {
                                            const currentMonth = activeCalendarType === 'pickup' ? calendarMonth.pickup : calendarMonth.return;
                                            const newDate = new Date(currentMonth);
                                            newDate.setMonth(newDate.getMonth() - 1);
                                            setCalendarMonth(prev => ({
                                                ...prev,
                                                [activeCalendarType]: newDate
                                            }));
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                        </svg>
                                    </button>
                                    <div className="text-lg font-semibold text-gray-800">
                                        {(activeCalendarType === 'pickup' ? calendarMonth.pickup : calendarMonth.return).toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                    </div>
                                    <button
                                        onClick={() => {
                                            const currentMonth = activeCalendarType === 'pickup' ? calendarMonth.pickup : calendarMonth.return;
                                            const newDate = new Date(currentMonth);
                                            newDate.setMonth(newDate.getMonth() + 1);
                                            setCalendarMonth(prev => ({
                                                ...prev,
                                                [activeCalendarType]: newDate
                                            }));
                                        }}
                                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="mb-4 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-sm text-gray-600 text-center">
                                        {activeCalendarType === 'pickup'
                                            ? (!pickupDate
                                                ? t('calculator.selectPickupInstruction', 'Select pickup date')
                                                : t('calculator.changePickupInstruction', 'Click to change pickup date'))
                                            : (!returnDate
                                                ? t('calculator.selectReturnInstruction', 'Select return date')
                                                : t('calculator.changeReturnInstruction', 'Click to change return date'))
                                        }
                                    </p>
                                </div>

                                <div className="grid grid-cols-7 gap-1 text-sm text-center mb-3">
                                    {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                        <div key={day} className="text-gray-500 font-medium py-2">{day}</div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays(activeCalendarType === 'pickup' ? calendarMonth.pickup : calendarMonth.return).map((day, index) => {
                                        if (!day) return <div key={index} className="h-10"></div>;

                                        const dayDate = new Date(day);
                                        const dayString = day;
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        const todayString = formatDateLocal(today);
                                        const isPast = dayString < todayString;
                                        const isBeforePickup = activeCalendarType === 'return' && pickupDate && dayString <= pickupDate;
                                        const isSelected = dayString === (activeCalendarType === 'pickup' ? pickupDate : returnDate);
                                        const isPickupDate = activeCalendarType === 'return' && pickupDate && dayString === pickupDate;
                                        const isReturnDate = activeCalendarType === 'pickup' && returnDate && dayString === returnDate;
                                        const isInRange = pickupDate && returnDate &&
                                            dayString > pickupDate &&
                                            dayString < returnDate;

                                        return (
                                            <button
                                                key={index}
                                                className={`h-10 w-10 flex items-center justify-center text-sm rounded-lg transition-colors relative ${
                                                    isPast || isBeforePickup
                                                        ? 'text-gray-300 cursor-not-allowed hover:bg-gray-50'
                                                        : 'text-gray-700 cursor-pointer hover:bg-gray-100'
                                                } ${isSelected
                                                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                    : isPickupDate || isReturnDate
                                                        ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                        : isInRange
                                                            ? 'bg-red-100 text-gray-900 hover:bg-red-200'
                                                            : !(isPast || isBeforePickup)
                                                                ? 'hover:bg-gray-100'
                                                                : ''
                                                }`}
                                                onClick={() => {
                                                    if (!(isPast || isBeforePickup)) {
                                                        if (activeCalendarType === 'pickup') {
                                                            const isChangingPickupDate = pickupDate && pickupDate !== day;
                                                            if (isChangingPickupDate) {
                                                                setReturnDate('');
                                                            }
                                                            setPickupDate(day);
                                                        } else {
                                                            setReturnDate(day);
                                                        }
                                                        setShowCalendarModal(false);
                                                    }
                                                }}
                                                disabled={isPast || isBeforePickup}
                                                title={isPast ? t('calculator.dateUnavailable', 'Date unavailable') :
                                                       isBeforePickup ? t('calculator.beforePickup', 'Cannot be before pickup date') : ''}
                                            >
                                                {dayDate.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>
        </React.Fragment>
    );
};

