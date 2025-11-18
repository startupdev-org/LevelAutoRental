import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Plus, Trash2 } from 'lucide-react';
import { OrderDisplay } from '../../lib/orders';
import { Car } from '../../types';
import { generateContractFromOrder } from '../../lib/contract';
import { useNotification } from '../ui/NotificationToaster';
import { useTranslation } from 'react-i18next';

interface ContractCreationModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderDisplay;
    car: Car;
    orderNumber?: number;
    onContractCreated?: () => void;
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
    const [carColor, setCarColor] = useState(car.color || '');
    const [carRegistrationNumber, setCarRegistrationNumber] = useState((car as any).license || '');
    const [carMileage, setCarMileage] = useState((car as any).kilometers?.toString() || car.mileage?.toString() || '');
    const [carFuelType, setCarFuelType] = useState(car.fuel_type || '');
    
    // Payment details
    const [paymentMethod, setPaymentMethod] = useState('');
    const [depositAmount, setDepositAmount] = useState('');
    const [depositPaymentMethod, setDepositPaymentMethod] = useState('');
    
    // Locations
    const [pickupLocation, setPickupLocation] = useState('Chișinău, str. Mircea cel Bătrân 13/1');
    const [returnLocation, setReturnLocation] = useState('Chișinău, str. Mircea cel Bătrân 13/1');
    
    // Vehicle condition (for Anexa Nr.2)
    const [pickupOdometer, setPickupOdometer] = useState('');
    const [returnOdometer, setReturnOdometer] = useState('');
    const [pickupFuelLevel, setPickupFuelLevel] = useState('100');
    const [returnFuelLevel, setReturnFuelLevel] = useState('100');
    
    // Additional drivers
    const [additionalDrivers, setAdditionalDrivers] = useState<AdditionalDriver[]>([]);
    
    // Car value (for total loss clause)
    const [carValue, setCarValue] = useState('');

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
            showError('Please enter customer address');
            return;
        }
        if (!customerIdSeries.trim() || !customerIdNumber.trim()) {
            showError('Please enter customer ID series and number');
            return;
        }
        if (!customerIdnp.trim()) {
            showError('Please enter customer IDNP');
            return;
        }
        if (!carColor.trim()) {
            showError('Please enter car color');
            return;
        }
        if (!carRegistrationNumber.trim()) {
            showError('Please enter car registration number');
            return;
        }
        if (!carMileage.trim()) {
            showError('Please enter car mileage');
            return;
        }
        if (!paymentMethod.trim()) {
            showError('Please enter payment method');
            return;
        }
        if (!depositAmount.trim()) {
            showError('Please enter deposit amount');
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

            await generateContractFromOrder(
                order,
                car,
                contractNumber,
                {
                    customerAddress: customerAddress.trim(),
                    customerIdSeries: customerIdSeries.trim(),
                    customerIdNumber: customerIdNumber.trim(),
                    customerIdnp: customerIdnp.trim(),
                    pickupLocation: pickupLocation.trim() || 'Chișinău, str. Mircea cel Bătrân 13/1',
                    returnLocation: returnLocation.trim() || 'Chișinău, str. Mircea cel Bătrân 13/1',
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

            showSuccess('Contract created and saved successfully!');
            if (onContractCreated) {
                onContractCreated();
            }
            onClose();
        } catch (error) {
            console.error('Error creating contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            showError(`Failed to create contract: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    style={{ zIndex: 10002 }}
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto mx-2 sm:mx-4"
                    >
                        {/* Header */}
                        <div className="sticky top-0 border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-white">Create Contract</h2>
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
                                    <span className="text-sm sm:text-base">Customer Information</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Address (Domiciliat la) *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerAddress}
                                            onChange={(e) => setCustomerAddress(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter customer address"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            IDNP *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerIdnp}
                                            onChange={(e) => setCustomerIdnp(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter IDNP"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            ID Series *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerIdSeries}
                                            onChange={(e) => setCustomerIdSeries(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter ID series"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            ID Number *
                                        </label>
                                        <input
                                            type="text"
                                            value={customerIdNumber}
                                            onChange={(e) => setCustomerIdNumber(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter ID number"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Details */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Vehicle Details</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Color (Culoare) *
                                        </label>
                                        <input
                                            type="text"
                                            value={carColor}
                                            onChange={(e) => setCarColor(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter car color"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Registration Number (NR. DE INMATRICULARE) *
                                        </label>
                                        <input
                                            type="text"
                                            value={carRegistrationNumber}
                                            onChange={(e) => setCarRegistrationNumber(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter registration number"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Mileage (NR/KM LA BORD) *
                                        </label>
                                        <input
                                            type="number"
                                            value={carMileage}
                                            onChange={(e) => setCarMileage(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter mileage"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Fuel Type (Combustibil) *
                                        </label>
                                        <select
                                            value={carFuelType}
                                            onChange={(e) => setCarFuelType(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        >
                                            <option value="">Select fuel type</option>
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
                                    <span className="text-sm sm:text-base">Payment Details</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Payment Method (Mod achitare locatiune) *
                                        </label>
                                        <input
                                            type="text"
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="e.g., Cash, Card, Transfer"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Deposit Amount (DEPOZIT) MDL *
                                        </label>
                                        <input
                                            type="number"
                                            value={depositAmount}
                                            onChange={(e) => setDepositAmount(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter deposit amount"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Deposit Payment Method (Mod achitare garantie)
                                        </label>
                                        <input
                                            type="text"
                                            value={depositPaymentMethod}
                                            onChange={(e) => setDepositPaymentMethod(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="e.g., Cash, Card"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Car Value (for total loss clause)
                                        </label>
                                        <input
                                            type="number"
                                            value={carValue}
                                            onChange={(e) => setCarValue(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter car value in MDL"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Locations */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Pickup & Return Locations</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Pickup Location
                                        </label>
                                        <input
                                            type="text"
                                            value={pickupLocation}
                                            onChange={(e) => setPickupLocation(e.target.value)}
                                            placeholder="Chișinău, str. Mircea cel Bătrân 13/1"
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Return Location
                                        </label>
                                        <input
                                            type="text"
                                            value={returnLocation}
                                            onChange={(e) => setReturnLocation(e.target.value)}
                                            placeholder="Chișinău, str. Mircea cel Bătrân 13/1"
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Vehicle Condition (Anexa Nr.2) */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <span className="text-sm sm:text-base">Vehicle Condition (Anexa Nr.2)</span>
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Pickup Odometer (km)
                                        </label>
                                        <input
                                            type="number"
                                            value={pickupOdometer}
                                            onChange={(e) => setPickupOdometer(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter odometer reading"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1">
                                            Pickup Fuel Level (%)
                                        </label>
                                        <input
                                            type="number"
                                            value={pickupFuelLevel}
                                            onChange={(e) => setPickupFuelLevel(e.target.value)}
                                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            placeholder="Enter fuel level"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Drivers */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <div className="flex items-center justify-between mb-3 sm:mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <span className="text-sm sm:text-base">Additional Drivers (Soferi Aditionali)</span>
                                    </h3>
                                    <button
                                        onClick={handleAddDriver}
                                        className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center gap-2 text-xs sm:text-sm"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Add Driver
                                    </button>
                                </div>
                                {additionalDrivers.map((driver, index) => (
                                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-lg border border-white/10 mt-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                First Name
                                            </label>
                                            <input
                                                type="text"
                                                value={driver.firstName}
                                                onChange={(e) => handleDriverChange(index, 'firstName', e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                placeholder="First name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                Last Name
                                            </label>
                                            <input
                                                type="text"
                                                value={driver.lastName}
                                                onChange={(e) => handleDriverChange(index, 'lastName', e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                placeholder="Last name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-300 mb-1">
                                                IDNP
                                            </label>
                                            <input
                                                type="text"
                                                value={driver.idnp}
                                                onChange={(e) => handleDriverChange(index, 'idnp', e.target.value)}
                                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                                placeholder="IDNP"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <button
                                                onClick={() => handleRemoveDriver(index)}
                                                className="w-full px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-all flex items-center justify-center gap-2"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 border-t border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-end gap-3 sm:gap-4 bg-white/5 backdrop-blur-sm" style={{ backgroundColor: '#1C1C1C' }}>
                            <button
                                onClick={onClose}
                                disabled={isGenerating}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all font-semibold text-xs sm:text-sm disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateContract}
                                disabled={isGenerating}
                                className="px-4 sm:px-6 py-2 sm:py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all font-semibold flex items-center gap-2 text-xs sm:text-sm disabled:opacity-50"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Creating Contract...</span>
                                    </>
                                ) : (
                                    'Create Contract'
                                )}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

