import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { Car, Rental } from '../../types';
import { generateContractFromOrder } from '../../lib/contract';
import { useNotification } from '../ui/NotificationToaster';
import { useTranslation } from 'react-i18next';

interface ContractCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Rental;
    car: Car;
    orderNumber?: number;
    onContractCreated?: (contractUrl?: string | null) => void;
}

interface AdditionalDriver {
    firstName: string;
    lastName: string;
    idnp: string;
}

export const ContractCreationModal: React.FC<ContractCreationModalProps> = ({
    isOpen,
    onClose,
    order,
    car,
    orderNumber,
    onContractCreated
}) => {
    const { t } = useTranslation();
    const { showSuccess, showError } = useNotification();
    const [isGenerating, setIsGenerating] = useState(false);

    // Customer information
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerIdSeries, setCustomerIdSeries] = useState('');
    const [customerIdNumber, setCustomerIdNumber] = useState('');
    const [customerIdnp, setCustomerIdnp] = useState('');

    // Vehicle details
    const [carColor, setCarColor] = useState((car as any).color || '');
    const [carRegistrationNumber, setCarRegistrationNumber] = useState((car as any).license || '');
    const [carMileage, setCarMileage] = useState((car as any).kilometers?.toString() || car.mileage?.toString() || '');
    const [carFuelType, setCarFuelType] = useState(car.fuel_type || '');

    // Payment details
    const [paymentMethod, setPaymentMethod] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [depositPaymentMethod, setDepositPaymentMethod] = useState('');

    // Locations
    const [pickupLocation, setPickupLocation] = useState('');
    const [returnLocation, setReturnLocation] = useState('');

    // Vehicle condition (for Anexa Nr.2)
    const [pickupOdometer, setPickupOdometer] = useState('');
    const [returnOdometer, setReturnOdometer] = useState('');
    const [pickupFuelLevel, setPickupFuelLevel] = useState('100');
    const [returnFuelLevel, setReturnFuelLevel] = useState('100');

    // Additional drivers
    const [additionalDrivers, setAdditionalDrivers] = useState<AdditionalDriver[]>([]);

    // Car value (for total loss clause)
    const [carValue, setCarValue] = useState('');

    // Calculate price breakdown - same logic as RequestDetailsModal
    const calculatePriceBreakdown = () => {
        const formatTime = (timeString: string): string => {
            if (!timeString) return '00:00';
            // Convert to 24-hour format if needed
            if (timeString.includes('AM') || timeString.includes('PM')) {
                const [time, period] = timeString.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
            }
            // If already in HH:MM format, ensure it's padded
            if (timeString.includes(':')) {
                const [hours, minutes] = timeString.split(':');
                return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
            }
            return '00:00';
        };

        const startDate = new Date((order as any).pickupDate || (order as any).start_date);
        const endDate = new Date((order as any).returnDate || (order as any).end_date);

        // Parse times and combine with dates for accurate calculation
        const pickupTime = formatTime((order as any).pickupTime || (order as any).start_time || '09:00');
        const returnTime = formatTime((order as any).returnTime || (order as any).end_time || '17:00');
        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [returnHour, returnMin] = returnTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(pickupHour, pickupMin, 0, 0);

        const endDateTime = new Date(endDate);
        // If return time is 00:00, treat it as end of previous day (23:59:59)
        if (returnHour === 0 && returnMin === 0) {
            endDateTime.setHours(23, 59, 59, 999);
        } else {
            endDateTime.setHours(returnHour, returnMin, 0, 0);
        }

        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0; // Ensure hours is never negative

        // Calculate pricing using same system as RequestDetailsModal
        const rentalDays = days; // Use full days for discount calculation
        const totalDays = days + (hours / 24); // Use total days for final calculation

        // Get price per day based on rental duration ranges (4-tier pricing)
        let basePricePerDay = 0;

        if (rentalDays >= 2 && rentalDays <= 4) {
            basePricePerDay = car.price_2_4_days || 0;
        } else if (rentalDays >= 5 && rentalDays <= 15) {
            basePricePerDay = car.price_5_15_days || 0;
        } else if (rentalDays >= 16 && rentalDays <= 30) {
            basePricePerDay = car.price_16_30_days || 0;
        } else if (rentalDays > 30) {
            basePricePerDay = car.price_over_30_days || 0;
        }

        const pricePerDay = basePricePerDay;

        // Base price calculation using 4-tier pricing (no additional period-based discounts)
        let basePrice = pricePerDay * rentalDays;

        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }

        // Calculate additional costs from options (same as Calculator.tsx)
        const options = (order as any).options;
        let parsedOptions: any = {};

        if (options) {
            if (typeof options === 'string') {
                try {
                    parsedOptions = JSON.parse(options);
                } catch (e) {
                    parsedOptions = {};
                }
            } else {
                parsedOptions = options;
            }
        }

        let additionalCosts = 0;
        const baseCarPrice = pricePerDay;

        // Percentage-based options (calculated as percentage of base car price * totalDays)
        // These should be calculated on the total rental period (days + hours)
        if (parsedOptions.unlimitedKm) {
            additionalCosts += baseCarPrice * totalDays * 0.5; // 50%
        }
        if (parsedOptions.speedLimitIncrease) {
            additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
        }
        if (parsedOptions.tireInsurance) {
            additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
        }

        // Fixed daily costs
        if (parsedOptions.personalDriver) {
            additionalCosts += 800 * rentalDays;
        }
        if (parsedOptions.priorityService) {
            additionalCosts += 1000 * rentalDays;
        }
        if (parsedOptions.childSeat) {
            additionalCosts += 100 * rentalDays;
        }
        if (parsedOptions.simCard) {
            additionalCosts += 100 * rentalDays;
        }
        if (parsedOptions.roadsideAssistance) {
            additionalCosts += 500 * rentalDays;
        }

        // Total price = base price + additional costs (same as RequestDetailsModal)
        const totalPrice = basePrice + additionalCosts;

        return {
            pricePerDay,
            days,
            hours,
            rentalDays,
            basePrice,
            additionalServices: additionalCosts,
            total: totalPrice
        };
    };

    const priceBreakdown = calculatePriceBreakdown();

    const handleAddDriver = () => {
        setAdditionalDrivers([...additionalDrivers, { firstName: '', lastName: '', idnp: '' }]);
    };

    const handleRemoveDriver = (index: number) => {
        setAdditionalDrivers(additionalDrivers.filter((_, i) => i !== index));
    };

    const handleDriverChange = (index: number, field: keyof AdditionalDriver, value: string) => {
        const updated = [...additionalDrivers];
        updated[index] = { ...updated[index], [field]: value };
        setAdditionalDrivers(updated);
    };

    const handleCreateContract = async () => {
        // Validate required fields
        if (!customerAddress.trim()) {
            showError('Introduceți adresa clientului');
            return;
        }
        if (!customerIdSeries.trim() || !customerIdNumber.trim()) {
            showError('Introduceți seria și numărul CI');
            return;
        }
        if (!customerIdnp.trim()) {
            showError('Introduceți IDNP-ul clientului');
            return;
        }
        if (!carColor.trim()) {
            showError('Introduceți culoarea mașinii');
            return;
        }
        if (!carRegistrationNumber.trim()) {
            showError('Introduceți numărul de înmatriculare');
            return;
        }
        if (!carMileage.trim()) {
            showError('Introduceți kilometrajul');
            return;
        }
        if (!paymentMethod.trim()) {
            showError('Introduceți metoda de plată');
            return;
        }
        if (!depositAmount.trim()) {
            showError('Introduceți suma depozitului');
            return;
        }

        setIsGenerating(true);
        try {
            const contractNumber = orderNumber
                ? `CT-${orderNumber.toString().padStart(4, '0')}-${new Date().getFullYear()}`
                : undefined;

            // Calculate deposit amount
            const deposit = parseFloat(depositAmount) || 0;

            // Filter out empty additional drivers
            const validDrivers = additionalDrivers.filter(
                d => d.firstName.trim() && d.lastName.trim()
            );

            const contractUrlResult = await generateContractFromOrder(
                order,
                car,
                contractNumber,
                {
                    customerAddress: customerAddress.trim(),
                    customerIdSeries: customerIdSeries.trim(),
                    customerIdNumber: customerIdNumber.trim(),
                    customerIdnp: customerIdnp.trim(),
                    pickupLocation: pickupLocation.trim() || '',
                    returnLocation: returnLocation.trim() || '',
                    deposit: deposit,
                    paymentMethod: paymentMethod.trim(),
                    depositPaymentMethod: depositPaymentMethod.trim(),
                    additionalDrivers: validDrivers.length > 0 ? validDrivers : undefined,
                    vehicleMileage: parseInt(carMileage) || undefined,
                    vehicleFuelLevel: parseInt(pickupFuelLevel) || 100,
                    vehicleRegistrationNumber: carRegistrationNumber.trim(),
                    carValue: carValue ? parseFloat(carValue) : undefined,
                    // Pass car details that will be used in contract
                    carColor: carColor.trim(), // Pass the trimmed color value
                    carFuelType: carFuelType.trim(), // Pass the trimmed fuel type value
                } as any
            );

            showSuccess('Contractul a fost creat și salvat cu succes!');
            if (onContractCreated) {
                // Pass the contract URL if it's a string, otherwise pass undefined
                const contractUrl = typeof contractUrlResult === 'string' ? contractUrlResult : undefined;
                onContractCreated(contractUrl);
            }
            onClose();
        } catch (error) {
            console.error('Error creating contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Eroare necunoscută';
            showError(`Nu s-a putut crea contractul: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            style={{ zIndex: 10000 }}
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
            >
                        {/* Header */}
                        <div className="sticky top-0 border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">Creează Contract</h2>
                                <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                    {t('admin.orders.orderNumber')}{orderNumber ? orderNumber.toString().padStart(4, '0') : 'N/A'}
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                            {/* Customer Information */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Informații Client</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Adresă (Domiciliat la) *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți adresa clientului"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            IDNP *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerIdnp}
                                            onChange={(e) => setCustomerIdnp(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți IDNP"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Serie CI *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerIdSeries}
                                            onChange={(e) => setCustomerIdSeries(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți seria CI"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Număr CI *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerIdNumber}
                                            onChange={(e) => setCustomerIdNumber(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți numărul CI"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Detalii Vehicul</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Culoare *
                                        </label>
                                        <input
                                            type="text"
                                            value={carColor}
                                            onChange={(e) => setCarColor(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți culoarea mașinii"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Număr de înmatriculare *
                                        </label>
                                        <input
                                            type="text"
                                            value={carRegistrationNumber}
                                            onChange={(e) => setCarRegistrationNumber(e.target.value.toUpperCase())}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți numărul de înmatriculare"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Kilometraj (NR/KM LA BORD) *
                                        </label>
                                        <input
                                            type="number"
                                            value={carMileage}
                                            onChange={(e) => setCarMileage(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți kilometrajul"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Tip combustibil *
                                        </label>
                                        <select
                                            value={carFuelType}
                                            onChange={(e) => setCarFuelType(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="">Selectați tipul de combustibil</option>
                                            <option value="gasoline">Benzina</option>
                                            <option value="diesel">Motorina</option>
                                            <option value="hybrid">Hibrid</option>
                                            <option value="electric">Electric</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Detalii Plată</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Metodă de plată (Mod achitare locațiune) *
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="ex: Numerar, Card, Transfer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Sumă depozit (DEPOZIT) MDL *
                                        </label>
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți suma depozitului"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Metodă de plată depozit (Mod achitare garanție)
                                        </label>
                                        <input
                                            type="text"
                                            value={depositPaymentMethod}
                                            onChange={(e) => setDepositPaymentMethod(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="ex: Numerar, Card"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Valoare mașină (pentru clauza de pierdere totală)
                                        </label>
                                        <input
                                            type="number"
                                            value={carValue}
                                            onChange={(e) => setCarValue(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți valoarea mașinii în MDL"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Locations */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Locații Preluare și Returnare</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Locație preluare
                                        </label>
                                        <input
                                            type="text"
                                            value={pickupLocation}
                                            onChange={(e) => setPickupLocation(e.target.value)}
                                            placeholder="Chișinău, str. Mircea cel Bătrân 13/1"
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Locație returnare
                                        </label>
                                        <input
                                            type="text"
                                            value={returnLocation}
                                            onChange={(e) => setReturnLocation(e.target.value)}
                                            placeholder="Chișinău, str. Mircea cel Bătrân 13/1"
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Condition (Anexa Nr.2) */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Starea Vehiculului (Anexa Nr.2)</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Kilometraj preluare (km)
                                        </label>
                                        <input
                                            type="number"
                                            value={pickupOdometer}
                                            onChange={(e) => setPickupOdometer(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți kilometrajul"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                            Nivel combustibil preluare (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={pickupFuelLevel}
                                            onChange={(e) => setPickupFuelLevel(e.target.value)}
                                            className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Introduceți nivelul combustibilului"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Drivers */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <span className="text-sm sm:text-base">Șoferi Adiționali</span>
                                    </h3>
                                    <button
                                        onClick={handleAddDriver}
                                        className="px-2.5 sm:px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                                    >
                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Adaugă Șofer</span>
                                        <span className="sm:hidden">Adaugă</span>
                                    </button>
                                </div>
                                {additionalDrivers.map((driver, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-white/5 rounded-lg border border-white/10 mt-3 sm:mt-4">
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                                Prenume
                                            </label>
                                            <input
                                                type="text"
                                                value={driver.firstName}
                                                onChange={(e) => handleDriverChange(index, 'firstName', e.target.value)}
                                                className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                placeholder="Prenume"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                                Nume
                                            </label>
                                            <input
                                                type="text"
                                                value={driver.lastName}
                                                onChange={(e) => handleDriverChange(index, 'lastName', e.target.value)}
                                                className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                placeholder="Nume"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                                IDNP
                                            </label>
                                            <input
                                                type="text"
                                                value={driver.idnp}
                                                onChange={(e) => handleDriverChange(index, 'idnp', e.target.value)}
                                                className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                placeholder="IDNP"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => handleRemoveDriver(index)}
                                                className="w-full px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-all flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm"
                                            >
                                                <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                <span className="hidden sm:inline">Șterge</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm" style={{ backgroundColor: '#1C1C1C' }}>
                            <button
                                onClick={onClose}
                                disabled={isGenerating}
                                className="px-3 sm:px-4 md:px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all font-semibold text-xs sm:text-sm disabled:opacity-50"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={handleCreateContract}
                                disabled={isGenerating}
                                className="px-3 sm:px-4 md:px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                        <span>Se creează contractul...</span>
                                    </>
                                ) : (
                                    'Creează Contract'
                                )}
                            </button>
                        </div>
            </div>
        </div>,
        document.body
    );
};

