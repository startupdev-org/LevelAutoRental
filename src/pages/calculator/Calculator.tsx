import React, { useState, useMemo, useEffect } from 'react';
import { Calendar, Car, MapPin, Info, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cars } from '../../data/cars';
import { useTranslation } from 'react-i18next';

export const Calculator: React.FC = () => {
    const { t, i18n } = useTranslation();
    const [isDesktop, setIsDesktop] = useState(false);
    const [selectedCarId, setSelectedCarId] = useState<number>(cars[0]?.id || 1);
    const [rentalDays, setRentalDays] = useState<number>(1);
    const [pickupLocation, setPickupLocation] = useState('');
    const [returnLocation, setReturnLocation] = useState('');

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

    const locations = useMemo(() => [
        t('calculator.locations.chisinauAirport', 'Chisinau Airport'),
        t('calculator.locations.chisinauCenter', 'Chisinau Center'),
        t('calculator.locations.chisinauNord', 'Chișinău Nord')
    ], [t]);

    useEffect(() => {
        // Update default locations when language changes
        const defaultLocation = locations[0];
        if (!pickupLocation) setPickupLocation(defaultLocation);
        if (!returnLocation) setReturnLocation(defaultLocation);
    }, [locations, pickupLocation, returnLocation]);
    
    // Additional options
    const [unlimitedKm, setUnlimitedKm] = useState(false);
    const [speedLimit, setSpeedLimit] = useState(false);
    const [driver, setDriver] = useState(false);
    const [priority, setPriority] = useState(false);
    const [insurance, setInsurance] = useState(false);
    const [childSeat, setChildSeat] = useState(false);
    const [sim, setSim] = useState(false);
    const [assistance, setAssistance] = useState(false);

    const selectedCar = cars.find(c => c.id === selectedCarId);

    // Calculate base price (no rental duration discounts)
    const basePrice = useMemo(() => {
        if (!selectedCar) return 0;
        // Get price with car discount applied first
        const basePricePerDay = (selectedCar as any).pricePerDay || selectedCar.price_per_day || 0;
        const carDiscount = (selectedCar as any).discount_percentage || selectedCar.discount_percentage || 0;
        const pricePerDay = carDiscount > 0 
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;
        
        // No rental duration discounts - use base price for all ranges
        return pricePerDay * rentalDays;
    }, [selectedCar, rentalDays]);

    // Calculate additional services
    const additionalCosts = useMemo(() => {
        let total = 0;
        // Use discounted price for additional services calculation
        const basePricePerDay = selectedCar ? ((selectedCar as any).pricePerDay || selectedCar.price_per_day || 0) : 0;
        const carDiscount = selectedCar ? ((selectedCar as any).discount_percentage || selectedCar.discount_percentage || 0) : 0;
        const baseCarPrice = carDiscount > 0 
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;
        
        if (unlimitedKm) total += baseCarPrice * rentalDays * 0.5;
        if (speedLimit) total += baseCarPrice * rentalDays * 0.2;
        if (insurance) total += baseCarPrice * rentalDays * 0.2;
        if (driver) total += 800 * rentalDays;
        if (priority) total += 1000 * rentalDays;
        if (childSeat) total += 100 * rentalDays;
        if (sim) total += 100 * rentalDays;
        if (assistance) total += 500 * rentalDays;
        
        return total;
    }, [unlimitedKm, speedLimit, insurance, driver, priority, childSeat, sim, assistance, selectedCar, rentalDays]);

    const totalPrice = basePrice + additionalCosts;
    const priceInEUR = (totalPrice / 19.8).toFixed(2);
    const priceInUSD = (totalPrice / 17.5).toFixed(2);

    return (
        <section
            key={i18n.language}
            className="relative py-60 bg-cover bg-center bg-no-repeat bg-fixed"
            style={{
                backgroundImage: isDesktop ? 'url(/LevelAutoRental/lvl_bg.png)' : 'url(/LevelAutoRental/backgrounds/bg10-mobile.jpeg)',
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
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        {/* Car Selection */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Car className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.selectVehicle')}
                            </h2>
                            <select
                                value={selectedCarId}
                                onChange={(e) => setSelectedCarId(Number(e.target.value))}
                                className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-white font-medium transition-all hover:bg-white/15 shadow-sm"
                            >
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>
                                        {car.name} ({car.year}) - {car.pricePerDay} MDL{t('calculator.perDay')}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Rental Period */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Calendar className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.rentalPeriod')}
                            </h2>
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <label className="block text-sm font-semibold text-white">
                                        {t('calculator.numberOfDays')}
                                    </label>
                                    <span className="text-2xl font-bold text-theme-500">{rentalDays}</span>
                                </div>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={rentalDays}
                                    onChange={(e) => setRentalDays(Number(e.target.value))}
                                    className="w-full h-3 bg-white/20 rounded-full appearance-none cursor-pointer accent-theme-500"
                                    style={{
                                        background: `linear-gradient(to right, #F52C2D 0%, #F52C2D ${((rentalDays - 1) / 29) * 100}%, rgba(255,255,255,0.2) ${((rentalDays - 1) / 29) * 100}%, rgba(255,255,255,0.2) 100%)`
                                    }}
                                />
                                <div className="flex justify-between text-xs text-gray-300 mt-3 font-medium">
                                    <span>1 {t('calculator.day')}</span>
                                    <span>30 {t('calculator.days')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <MapPin className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.locations.title')}
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        {t('calculator.pickup')}
                                    </label>
                                    <select
                                        value={pickupLocation}
                                        onChange={(e) => setPickupLocation(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-white font-medium transition-all hover:bg-white/15 shadow-sm"
                                    >
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-white mb-3">
                                        {t('calculator.return')}
                                    </label>
                                    <select
                                        value={returnLocation}
                                        onChange={(e) => setReturnLocation(e.target.value)}
                                        className="w-full px-4 py-3.5 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-white font-medium transition-all hover:bg-white/15 shadow-sm"
                                    >
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Additional Options */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-xl hover:bg-white/15 transition-all duration-300">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white/10 rounded-lg">
                                    <Info className="w-5 h-5 text-theme-500" />
                                </div>
                                {t('calculator.additionalOptions')}
                            </h2>
                            <div className="space-y-2">
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
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        unlimitedKm ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.unlimitedMileage')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500 bg-theme-500/20 px-3 py-1 rounded-lg">+50%</span>
                                </label>

                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={speedLimit}
                                                onChange={(e) => setSpeedLimit(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                speedLimit
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        speedLimit ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.noSpeedLimit')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500 bg-theme-500/20 px-3 py-1 rounded-lg">+20%</span>
                                </label>

                                <label className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 cursor-pointer transition-all duration-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <input
                                                type="checkbox"
                                                checked={insurance}
                                                onChange={(e) => setInsurance(e.target.checked)}
                                                className="sr-only"
                                            />
                                            <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
                                                insurance
                                                    ? 'bg-theme-500 border-theme-500'
                                                    : 'border-white/30 bg-white/10 group-hover:border-theme-400'
                                            }`}>
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        insurance ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.tireInsurance')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500 bg-theme-500/20 px-3 py-1 rounded-lg">+20%</span>
                                </label>

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
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        driver ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        priority ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.priorityService')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">1000 MDL{t('calculator.perDay')}</span>
                                </label>

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
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        childSeat ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        sim ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                                <svg
                                                    className={`w-3 h-3 text-white transition-opacity duration-200 ${
                                                        assistance ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
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
                                        <span className="font-medium text-white group-hover:text-gray-100">{t('calculator.roadsideAssistance')}</span>
                                    </div>
                                    <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg">500 MDL{t('calculator.perDay')}</span>
                                </label>
                            </div>
                        </div>
                    </motion.div>

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
                                        {totalPrice.toFixed(0)} <span className="text-2xl font-semibold">MDL</span>
                                    </div>
                                    <div className="text-sm opacity-95 font-medium">
                                        {priceInEUR} EUR / {priceInUSD} USD
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="p-6 space-y-5 bg-white/5">
                                    <div>
                                        <h4 className="font-bold text-white mb-4 text-lg">{t('calculator.priceDetails')}</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-200">{t('calculator.selectedVehicle')}</span>
                                                <span className="font-medium text-white">{selectedCar?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-200">{t('calculator.pricePerDay')}</span>
                                                <span className="font-medium text-white">{selectedCar?.pricePerDay} MDL</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-200">{t('calculator.numberDays')}</span>
                                                <span className="font-medium text-white">{rentalDays}</span>
                                            </div>
                                            <div className="pt-2 border-t border-white/20">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-white">{t('calculator.basePrice')}</span>
                                                    <span className="text-white">{basePrice.toFixed(0)} MDL</span>
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
                                                            {((selectedCar?.pricePerDay || 0) * rentalDays * 0.5).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {speedLimit && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.noSpeedLimitShort')}</span>
                                                        <span className="font-medium text-white">
                                                            {((selectedCar?.pricePerDay || 0) * rentalDays * 0.2).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {insurance && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-200">{t('calculator.insurance')}</span>
                                                        <span className="font-medium text-white">
                                                            {((selectedCar?.pricePerDay || 0) * rentalDays * 0.2).toFixed(0)} MDL
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
                                                <div className="pt-2 border-t border-white/20">
                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-white">{t('calculator.services')}</span>
                                                        <span className="text-white">{additionalCosts.toFixed(0)} MDL</span>
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
    );
};

