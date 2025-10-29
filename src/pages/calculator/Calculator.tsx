import React, { useState, useMemo } from 'react';
import { Calendar, Car, Clock, MapPin, Calculator as CalcIcon, Info, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cars } from '../../data/cars';

export const Calculator: React.FC = () => {
    const [selectedCarId, setSelectedCarId] = useState<number>(cars[0]?.id || 1);
    const [rentalDays, setRentalDays] = useState<number>(1);
    const [pickupLocation, setPickupLocation] = useState('Chisinau Airport');
    const [returnLocation, setReturnLocation] = useState('Chisinau Airport');
    
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
    const locations = ['Chisinau Airport', 'Chisinau Center', 'Chișinău Nord'];

    // Calculate base price with discounts
    const basePrice = useMemo(() => {
        if (!selectedCar) return 0;
        const pricePerDay = selectedCar.pricePerDay;
        
        if (rentalDays >= 8) {
            return pricePerDay * 0.96 * rentalDays; // -4%
        } else if (rentalDays >= 4) {
            return pricePerDay * 0.98 * rentalDays; // -2%
        }
        return pricePerDay * rentalDays;
    }, [selectedCar, rentalDays]);

    // Calculate additional services
    const additionalCosts = useMemo(() => {
        let total = 0;
        const baseCarPrice = selectedCar?.pricePerDay || 0;
        
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
        <div className="min-h-screen bg-gray-50 pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-theme-500 rounded-2xl mb-6">
                        <CalcIcon className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Calculator închiriere
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Calculați costul total al închirierii dumneavoastră cu toate opțiunile incluse
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                    {/* Left: Calculator Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="space-y-6"
                    >
                        {/* Car Selection */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Car className="w-5 h-5 text-theme-500" />
                                Selectați vehiculul
                            </h2>
                            <select
                                value={selectedCarId}
                                onChange={(e) => setSelectedCarId(Number(e.target.value))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-gray-900 font-medium"
                            >
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>
                                        {car.name} ({car.year}) - {car.pricePerDay} MDL/zi
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Rental Period */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-theme-500" />
                                Perioada închirierii
                            </h2>
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Număr de zile: <span className="text-theme-500">{rentalDays}</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="30"
                                    value={rentalDays}
                                    onChange={(e) => setRentalDays(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-theme-500"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-2">
                                    <span>1 zi</span>
                                    <span>30 zile</span>
                                </div>
                            </div>

                            {/* Discount indicator */}
                            {rentalDays >= 4 && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        {rentalDays >= 8 
                                            ? 'Discount aplicat: -4% pentru 8+ zile'
                                            : 'Discount aplicat: -2% pentru 4+ zile'
                                        }
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Locations */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-theme-500" />
                                Locații
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Preluare
                                    </label>
                                    <select
                                        value={pickupLocation}
                                        onChange={(e) => setPickupLocation(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none"
                                    >
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Returnare
                                    </label>
                                    <select
                                        value={returnLocation}
                                        onChange={(e) => setReturnLocation(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none"
                                    >
                                        {locations.map(loc => (
                                            <option key={loc} value={loc}>{loc}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Additional Options */}
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Info className="w-5 h-5 text-theme-500" />
                                Opțiuni suplimentare
                            </h2>
                            <div className="space-y-3">
                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={unlimitedKm}
                                            onChange={(e) => setUnlimitedKm(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Kilometraj nelimitat</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500">+50%</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={speedLimit}
                                            onChange={(e) => setSpeedLimit(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Fără limită de viteză</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500">+20%</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={insurance}
                                            onChange={(e) => setInsurance(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Asigurare anvelope</span>
                                    </div>
                                    <span className="text-sm font-bold text-theme-500">+20%</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={driver}
                                            onChange={(e) => setDriver(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Șofer personal</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">800 MDL/zi</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={priority}
                                            onChange={(e) => setPriority(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Priority Service</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">1000 MDL/zi</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={childSeat}
                                            onChange={(e) => setChildSeat(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Scaun auto copii</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">100 MDL/zi</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={sim}
                                            onChange={(e) => setSim(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">SIM cu internet</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">100 MDL/zi</span>
                                </label>

                                <label className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={assistance}
                                            onChange={(e) => setAssistance(e.target.checked)}
                                            className="w-5 h-5 rounded border-gray-300 text-theme-500 focus:ring-theme-500"
                                        />
                                        <span className="font-medium text-gray-900">Asistență rutieră</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">500 MDL/zi</span>
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
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                                {/* Header */}
                                <div className="bg-theme-500 text-white p-6">
                                    <h3 className="text-sm font-medium uppercase tracking-wide opacity-90 mb-2">Cost total</h3>
                                    <div className="text-4xl font-bold mb-2">
                                        {totalPrice.toFixed(0)} <span className="text-xl font-normal">MDL</span>
                                    </div>
                                    <div className="text-sm opacity-90">
                                        {priceInEUR} EUR / {priceInUSD} USD
                                    </div>
                                </div>

                                {/* Breakdown */}
                                <div className="p-6 space-y-4">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-3">Detalii preț</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Vehicul selectat</span>
                                                <span className="font-medium text-gray-900">{selectedCar?.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Preț pe zi</span>
                                                <span className="font-medium text-gray-900">{selectedCar?.pricePerDay} MDL</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Număr zile</span>
                                                <span className="font-medium text-gray-900">{rentalDays}</span>
                                            </div>
                                            {rentalDays >= 4 && (
                                                <div className="flex justify-between text-green-600">
                                                    <span>Discount</span>
                                                    <span className="font-medium">
                                                        {rentalDays >= 8 ? '-4%' : '-2%'}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-gray-200">
                                                <div className="flex justify-between font-medium">
                                                    <span className="text-gray-900">Preț bază</span>
                                                    <span className="text-gray-900">{basePrice.toFixed(0)} MDL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {additionalCosts > 0 && (
                                        <div className="pt-4 border-t border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-3">Servicii adiționale</h4>
                                            <div className="space-y-2 text-sm">
                                                {unlimitedKm && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Kilometraj nelimitat</span>
                                                        <span className="font-medium text-gray-900">
                                                            {((selectedCar?.pricePerDay || 0) * rentalDays * 0.5).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {speedLimit && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Fără limită viteză</span>
                                                        <span className="font-medium text-gray-900">
                                                            {((selectedCar?.pricePerDay || 0) * rentalDays * 0.2).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {insurance && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Asigurare</span>
                                                        <span className="font-medium text-gray-900">
                                                            {((selectedCar?.pricePerDay || 0) * rentalDays * 0.2).toFixed(0)} MDL
                                                        </span>
                                                    </div>
                                                )}
                                                {driver && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Șofer personal</span>
                                                        <span className="font-medium text-gray-900">{800 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {priority && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Priority Service</span>
                                                        <span className="font-medium text-gray-900">{1000 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {childSeat && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Scaun copii</span>
                                                        <span className="font-medium text-gray-900">{100 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {sim && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">SIM internet</span>
                                                        <span className="font-medium text-gray-900">{100 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                {assistance && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Asistență</span>
                                                        <span className="font-medium text-gray-900">{500 * rentalDays} MDL</span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-gray-200">
                                                    <div className="flex justify-between font-medium">
                                                        <span className="text-gray-900">Servicii</span>
                                                        <span className="text-gray-900">{additionalCosts.toFixed(0)} MDL</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contact */}
                                    <div className="pt-4 border-t border-gray-200">
                                        <a
                                            href="tel:+37362000112"
                                            className="block w-full bg-theme-500 hover:bg-theme-600 text-white font-semibold py-3.5 px-6 rounded-xl text-center transition-colors"
                                        >
                                            Rezervă acum
                                        </a>
                                        <a
                                            href="https://t.me/Level_Auto_Rental"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full mt-3 border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3.5 px-6 rounded-xl text-center transition-colors"
                                        >
                                            Contactează-ne
                                        </a>
                                    </div>
                                </div>
                            </div>

                            {/* Info box */}
                            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                                <div className="flex gap-3">
                                    <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-blue-900">
                                        <p className="font-medium mb-1">Prețurile sunt orientative</p>
                                        <p className="text-blue-700">
                                            Pentru o ofertă exactă și personalizată, vă rugăm să ne contactați direct.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

