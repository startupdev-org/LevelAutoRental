import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Car as CarIcon, DollarSign, User, Mail, Download, FileText, Phone, Loader2, XCircle, RefreshCw, Plus } from 'lucide-react';
import { OrderDisplay } from '../../lib/orders';
import { cars as staticCars } from '../../data/cars';
import { generateContractFromOrder } from '../../lib/contract';
import { ContractCreationModal } from './ContractCreationModal';
import { fetchCars } from '../../lib/cars';
import { Car } from '../../types';
import { useTranslation } from 'react-i18next';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderDisplay | null;
    orderNumber?: number;
    onCancel?: (order: OrderDisplay) => void;
    onRedo?: (order: OrderDisplay) => void;
    isProcessing?: boolean;
    cars?: Car[]; // Optional prop to pass cars from parent
    onOpenContractModal?: () => void; // Callback to open contract modal from parent
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen,
    onClose,
    order,
    orderNumber,
    onCancel,
    onRedo,
    isProcessing = false,
    cars: carsProp,
    onOpenContractModal,
}) => {
    const { t } = useTranslation();
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [requestOptions, setRequestOptions] = useState<any>(null);
    
    // If parent provides onOpenContractModal, use it; otherwise use local state
    const handleOpenContractModal = () => {
        if (onOpenContractModal) {
            onOpenContractModal();
        } else {
            setShowContractModal(true);
        }
    };
    const [cars, setCars] = useState<Car[]>(carsProp || []);

    // Fetch cars if not provided as prop
    useEffect(() => {
        if (!carsProp && isOpen) {
            const loadCars = async () => {
                try {
                    const fetchedCars = await fetchCars();
                    setCars(fetchedCars.length > 0 ? fetchedCars : staticCars);
                } catch (error) {
                    console.error('Error loading cars:', error);
                    setCars(staticCars);
                }
            };
            loadCars();
        } else if (carsProp) {
            setCars(carsProp);
        }
    }, [carsProp, isOpen]);

    // Fetch original request options if request_id exists
    useEffect(() => {
        const fetchRequestOptions = async () => {
            if (!order) {
                setRequestOptions(null);
                return;
            }
            
            const requestId = (order as any).request_id;
            console.log('OrderDetailsModal: Checking for request_id. Order:', {
                id: order.id,
                request_id: requestId,
                orderKeys: Object.keys(order),
                fullOrder: order
            });
            
            if (!requestId) {
                console.log('OrderDetailsModal: No request_id found in order. Trying to find request by matching data...');
                
                // Try to find the request by matching user_id, car_id, and dates
                try {
                    const { supabase } = await import('../../lib/supabase');
                    const { data: matchingRequests, error: searchError } = await supabase
                        .from('BorrowRequest')
                        .select('id, options, user_id, car_id, start_date, end_date')
                        .eq('user_id', order.userId)
                        .eq('car_id', order.carId)
                        .eq('start_date', order.pickupDate)
                        .eq('end_date', order.returnDate)
                        .limit(1);
                    
                    if (!searchError && matchingRequests && matchingRequests.length > 0) {
                        const matchingRequest = matchingRequests[0];
                        console.log('OrderDetailsModal: Found matching request:', matchingRequest);
                        
                        if (matchingRequest.options) {
                            let parsedOptions: any = {};
                            if (typeof matchingRequest.options === 'string') {
                                try {
                                    parsedOptions = JSON.parse(matchingRequest.options);
                                } catch (e) {
                                    parsedOptions = {};
                                }
                            } else {
                                parsedOptions = matchingRequest.options;
                            }
                            
                            if (parsedOptions && typeof parsedOptions === 'object' && Object.keys(parsedOptions).length > 0) {
                                console.log('OrderDetailsModal: Using options from matching request:', parsedOptions);
                                setRequestOptions(parsedOptions);
                                return;
                            }
                        }
                    }
                } catch (error) {
                    console.error('OrderDetailsModal: Error searching for matching request:', error);
                }
                
                setRequestOptions(null);
                return;
            }

            try {
                const { supabase } = await import('../../lib/supabase');
                console.log('OrderDetailsModal: Fetching request options for request_id:', requestId);
                
                const { data: request, error } = await supabase
                    .from('BorrowRequest')
                    .select('options, id, status')
                    .eq('id', requestId)
                    .single();

                if (error) {
                    console.error('OrderDetailsModal: Error fetching request:', error);
                    setRequestOptions(null);
                    return;
                }

                console.log('OrderDetailsModal: Fetched request:', request);

                if (request && request.options) {
                    let parsedOptions: any = {};
                    if (typeof request.options === 'string') {
                        try {
                            parsedOptions = JSON.parse(request.options);
                        } catch (e) {
                            console.error('OrderDetailsModal: Error parsing options string:', e);
                            parsedOptions = {};
                        }
                    } else {
                        parsedOptions = request.options;
                    }
                    
                    // Check if options is not empty (not just {})
                    if (parsedOptions && typeof parsedOptions === 'object' && Object.keys(parsedOptions).length > 0) {
                        console.log('OrderDetailsModal: Parsed options from request:', parsedOptions);
                        setRequestOptions(parsedOptions);
                    } else {
                        console.log('OrderDetailsModal: Request has empty options object');
                        setRequestOptions(null);
                    }
                } else {
                    console.log('OrderDetailsModal: Request has no options field');
                    setRequestOptions(null);
                }
            } catch (error) {
                console.error('OrderDetailsModal: Error fetching request options:', error);
                setRequestOptions(null);
            }
        };

        if (isOpen && order) {
            fetchRequestOptions();
        }
    }, [isOpen, order]);

    if (!order) return null;

    // Find car by matching carId (handle both string and number types)
    const car = cars.find(c => {
        if (!order.carId) return false;
        
        // Normalize both IDs to numbers for comparison
        const carIdNum = typeof c.id === 'number' ? c.id : parseInt(c.id.toString(), 10);
        const orderCarIdNum = typeof order.carId === 'number' 
            ? order.carId 
            : parseInt(order.carId.toString(), 10);
        
        // Compare as numbers
        if (!isNaN(carIdNum) && !isNaN(orderCarIdNum) && carIdNum === orderCarIdNum) {
            return true;
        }
        
        // Fallback: compare as strings
        const carIdStr = c.id.toString();
        const orderCarIdStr = order.carId.toString();
        return carIdStr === orderCarIdStr;
    });
    
    // Debug logging
    if (!car && order.carId && cars.length > 0) {
        console.warn('OrderDetailsModal: Car not found', {
            orderCarId: order.carId,
            orderCarIdType: typeof order.carId,
            orderCarIdValue: order.carId,
            availableCarIds: cars.map(c => ({ id: c.id, idType: typeof c.id, idValue: c.id })),
            carsLength: cars.length,
            orderCarName: order.carName
        });
    }
    const startDate = new Date(order.pickupDate);
    const endDate = new Date(order.returnDate);

    // Parse times and combine with dates for accurate calculation
    const formatTime = (timeString: string): string => {
        if (!timeString) return '09:00';
        // If already in HH:MM format, ensure it's padded
        if (timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':');
            return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
        }
        return '09:00';
    };

    const pickupTime = formatTime(order.pickupTime);
    const returnTime = formatTime(order.returnTime);
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
    const hours = diffHours >= 0 ? diffHours : 0;

    // Calculate pricing using same system as RequestDetailsModal
    const rentalDays = days; // Use full days for discount calculation
    const totalDays = days + (hours / 24); // Use total days for final calculation

    // Base price calculation with discounts
    let basePrice = 0;
    let discountPercent = 0;

    if (!car) {
        // If no car, use simple calculation
        basePrice = 0;
    } else {
        if (rentalDays >= 8) {
            discountPercent = 4;
            basePrice = car.price_per_day * 0.96 * rentalDays; // -4%
        } else if (rentalDays >= 4) {
            discountPercent = 2;
            basePrice = car.price_per_day * 0.98 * rentalDays; // -2%
        } else {
            basePrice = car.price_per_day * rentalDays;
        }

        // Add hours portion (hours are charged at full price, no discount)
        if (hours > 0) {
            const hoursPrice = (hours / 24) * car.price_per_day;
            basePrice += hoursPrice;
        }
    }

    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ro-RO', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; border: string }> = {
            'PENDING': { bg: 'bg-yellow-500/20', text: 'text-yellow-300', border: 'border-yellow-500/50' },
            'APPROVED': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
            'REJECTED': { bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/50' },
            'ACTIVE': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
            'COMPLETED': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
            'CANCELLED': { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/50' },
        };

        const styles = statusMap[status] || statusMap['PENDING'];
        const capitalizedStatus = status.charAt(0) + status.slice(1).toLowerCase();
        return (
            <span className={`px-3 py-1.5 rounded-lg text-sm font-semibold border backdrop-blur-sm ${styles.bg} ${styles.text} ${styles.border}`}>
                {capitalizedStatus}
            </span>
        );
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const downloadContract = async () => {
        // If contract URL exists, download from bucket
        if (order.contract_url) {
            try {
                const link = document.createElement('a');
                link.href = order.contract_url;
                link.download = `Contract_Locatiune_${order.id}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } catch (error) {
                console.error('Error downloading contract from URL:', error);
                alert('Failed to download contract. Please try again.');
            }
            return;
        }

        // Otherwise, generate new contract (fallback)
        if (!car) {
            alert('Car information not found. Cannot generate contract.');
            return;
        }

        setIsGeneratingContract(true);
        try {
            const contractNumber = orderNumber
                ? `CT-${orderNumber.toString().padStart(4, '0')}-${new Date().getFullYear()}`
                : undefined;

            await generateContractFromOrder(
                order,
                car,
                contractNumber,
                {
                    // customerPhone: order.customerPhone,
                    // Additional data can be added here if available
                    // customerAddress, customerIdNumber, etc.
                }
            );
        } catch (error) {
            console.error('Error generating contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate contract: ${errorMessage}\n\nPlease check the browser console for more details.`);
        } finally {
            setIsGeneratingContract(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            {createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    style={{ zIndex: 10000 }}
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
                                <h2 className="text-xl sm:text-2xl font-bold text-white">{t('admin.orders.orderDetails')}</h2>
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
                                    <User className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-sm sm:text-base">{t('admin.orders.customerInformation')}</span>
                                </h3>
                                <div className="flex items-start gap-3 sm:gap-4">
                                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-base sm:text-xl font-bold flex-shrink-0">
                                        {order.customerName ? getInitials(order.customerName) : 'C'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-base sm:text-lg truncate">
                                            {order.customerName || t('admin.orders.unknownCustomer')}
                                        </p>
                                        {order.customerEmail && (
                                            <div className="flex items-center gap-2 mt-2 text-gray-300">
                                                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm truncate">{order.customerEmail}</span>
                                            </div>
                                        )}
                                        {order.customerPhone && (
                                            <a
                                                href={`tel:${order.customerPhone.replace(/\s/g, '')}`}
                                                className="flex items-center gap-2 mt-2 text-gray-300 hover:text-white transition-colors cursor-pointer"
                                            >
                                                <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                                <span className="text-xs sm:text-sm">{order.customerPhone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Rental Period */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                        <span className="text-sm sm:text-base">{t('admin.orders.rentalPeriod')}</span>
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        {(car?.image_url || (car as any)?.image || order.avatar) && (
                                            <img
                                                src={car?.image_url || (car as any)?.image || order.avatar}
                                                alt={car?.name || (car ? `${car.make} ${car.model}`.trim() : '') || order.carName || t('admin.orders.unknownCar')}
                                                className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded-md border border-white/10"
                                            />
                                        )}
                                        <span className="text-white font-semibold text-xs sm:text-sm">
                                            {car?.name || (car ? `${car.make} ${car.model}`.trim() : '') || (order.carName && order.carName !== 'Unknown Car' ? order.carName : '') || t('admin.orders.unknownCar')}
                                        </span>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                        <p className="text-gray-400 text-xs sm:text-sm mb-2">{t('admin.orders.pickup')}</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-white font-semibold text-sm sm:text-base">{formatDate(order.pickupDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm sm:text-base">{order.pickupTime}</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                        <p className="text-gray-400 text-xs sm:text-sm mb-2">{t('admin.orders.return')}</p>
                                        <div className="flex items-center gap-2 mb-1">
                                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-white font-semibold text-sm sm:text-base">{formatDate(order.returnDate)}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-300 text-sm sm:text-base">{order.returnTime}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-xs sm:text-sm">{t('admin.orders.duration')}: <span className="text-white font-semibold">{days} {t('admin.orders.days')}{hours > 0 ? `, ${hours} ${t('admin.requestDetails.hours') || 'ore'}` : ''}</span></p>
                                </div>
                            </div>

                            {/* Financial Details */}
                            {(() => {
                                // Calculate additional costs from features/options if available
                                // Check both options (from requests) and features (from rentals)
                                let parsedOptions: any = {};
                                
                                // First, try to get options from the original request (if request_id exists)
                                if (requestOptions && Object.keys(requestOptions).length > 0) {
                                    console.log('OrderDetailsModal: Using options from request:', requestOptions);
                                    parsedOptions = requestOptions;
                                }
                                // Then try to get options directly (for requests)
                                else if ((order as any).options && Object.keys((order as any).options).length > 0) {
                                    console.log('OrderDetailsModal: Using options from order:', (order as any).options);
                                    if (typeof (order as any).options === 'string') {
                                        try {
                                            parsedOptions = JSON.parse((order as any).options);
                                        } catch (e) {
                                            parsedOptions = {};
                                        }
                                    } else {
                                        parsedOptions = (order as any).options;
                                    }
                                }
                                // If no options, try to parse features array (for rentals)
                                // But skip car features like "Motor V6 3.0" - only look for service options
                                else if (!parsedOptions || Object.keys(parsedOptions).length === 0) {
                                    console.log('OrderDetailsModal: No options found, checking features');
                                    const features = (order as any).features;
                                    if (features) {
                                        console.log('OrderDetailsModal: Found features:', features);
                                        if (Array.isArray(features)) {
                                            // Convert feature names to option keys
                                            // Features might be stored as option keys (e.g., "personalDriver") or as display names
                                            features.forEach((feature: string) => {
                                            // First check if it's already an option key (camelCase)
                                            const featureKey = feature.replace(/\s+/g, '');
                                            const optionKeyMap: Record<string, string> = {
                                                'unlimitedKm': 'unlimitedKm',
                                                'unlimitedkm': 'unlimitedKm',
                                                'speedLimitIncrease': 'speedLimitIncrease',
                                                'speedlimitincrease': 'speedLimitIncrease',
                                                'tireInsurance': 'tireInsurance',
                                                'tireinsurance': 'tireInsurance',
                                                'personalDriver': 'personalDriver',
                                                'personaldriver': 'personalDriver',
                                                'priorityService': 'priorityService',
                                                'priorityservice': 'priorityService',
                                                'childSeat': 'childSeat',
                                                'childseat': 'childSeat',
                                                'simCard': 'simCard',
                                                'simcard': 'simCard',
                                                'roadsideAssistance': 'roadsideAssistance',
                                                'roadsideassistance': 'roadsideAssistance',
                                            };
                                            
                                            const normalizedKey = featureKey.charAt(0).toLowerCase() + featureKey.slice(1);
                                            if (optionKeyMap[featureKey] || optionKeyMap[normalizedKey]) {
                                                // It's already an option key, use it directly
                                                const key = optionKeyMap[featureKey] || optionKeyMap[normalizedKey] || featureKey;
                                                parsedOptions[key] = true;
                                            } else {
                                                    // Try to match by name
                                                    const featureLower = feature.toLowerCase();
                                                    if (featureLower.includes('unlimited') || featureLower.includes('kilometraj')) {
                                                        parsedOptions.unlimitedKm = true;
                                                    } else if (featureLower.includes('speed') || featureLower.includes('viteză') || featureLower.includes('limita')) {
                                                        parsedOptions.speedLimitIncrease = true;
                                                    } else if (featureLower.includes('tire') || featureLower.includes('anvelope') || featureLower.includes('parbriz')) {
                                                        parsedOptions.tireInsurance = true;
                                                    } else if (featureLower.includes('driver') || featureLower.includes('șofer') || featureLower.includes('sofer')) {
                                                        parsedOptions.personalDriver = true;
                                                    } else if (featureLower.includes('priority')) {
                                                        parsedOptions.priorityService = true;
                                                    } else if (featureLower.includes('child') || featureLower.includes('copil') || featureLower.includes('scaun')) {
                                                        parsedOptions.childSeat = true;
                                                    } else if (featureLower.includes('sim') || featureLower.includes('card')) {
                                                        parsedOptions.simCard = true;
                                                    } else if (featureLower.includes('roadside') || featureLower.includes('asistență') || featureLower.includes('rutieră') || featureLower.includes('asistenta')) {
                                                        parsedOptions.roadsideAssistance = true;
                                                    }
                                                }
                                            });
                                        } else if (typeof features === 'string') {
                                            try {
                                                parsedOptions = JSON.parse(features);
                                            } catch (e) {
                                                parsedOptions = {};
                                            }
                                        } else {
                                            parsedOptions = features;
                                        }
                                    }
                                }

                                console.log('OrderDetailsModal: Final parsedOptions:', parsedOptions);
                                
                                let additionalCosts = 0;
                                const baseCarPrice = car?.price_per_day || 0;

                                // Percentage-based options (use totalDays including hours)
                                if (parsedOptions.unlimitedKm) {
                                    console.log('OrderDetailsModal: Found unlimitedKm option');
                                    additionalCosts += baseCarPrice * totalDays * 0.5; // 50%
                                }
                                if (parsedOptions.speedLimitIncrease) {
                                    additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
                                }
                                if (parsedOptions.tireInsurance) {
                                    additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
                                }

                                // Fixed daily costs (use rentalDays - full days only)
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
                                
                                console.log('OrderDetailsModal: Calculated additionalCosts:', additionalCosts, 'from options:', parsedOptions);

                                // Use the stored total_amount from database as source of truth
                                const storedTotal = order.total_amount ? parseFloat(order.total_amount.toString()) : null;
                                
                                // Calculate the actual additional costs from the difference
                                // This ensures the total matches what's in the database
                                let actualAdditionalCosts = 0;
                                if (storedTotal && storedTotal > basePrice) {
                                    // There's a difference - this is the additional services cost
                                    actualAdditionalCosts = storedTotal - basePrice;
                                    
                                    // If we calculated additional costs from options, use those for individual display
                                    // But ensure the total matches the stored total
                                    if (Object.keys(parsedOptions).length > 0 && additionalCosts > 0) {
                                        // We have individual services, use calculated costs
                                        // But adjust if there's a discrepancy
                                        if (Math.abs(additionalCosts - actualAdditionalCosts) > 1) {
                                            // There's a significant difference, use the actual difference
                                            // This might happen if calculation logic changed or services were manually adjusted
                                            actualAdditionalCosts = storedTotal - basePrice;
                                        }
                                    }
                                } else if (additionalCosts > 0) {
                                    // No stored total or it matches base price, but we calculated services
                                    actualAdditionalCosts = additionalCosts;
                                }
                                
                                const displayTotal = storedTotal || (basePrice + actualAdditionalCosts);

                                // Service names mapping
                                const serviceNames: Record<string, string> = {
                                    unlimitedKm: 'Kilometraj nelimitat',
                                    speedLimitIncrease: 'Creșterea limitei de viteză',
                                    tireInsurance: 'Asigurare anvelope & parbriz',
                                    personalDriver: 'Șofer personal',
                                    priorityService: 'Priority Service',
                                    childSeat: 'Scaun copil',
                                    simCard: 'Cartelă SIM cu internet',
                                    roadsideAssistance: 'Asistență rutieră'
                                };

                                return (
                                <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                        <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="text-sm sm:text-base">{t('admin.requestDetails.priceDetails')}</span>
                                    </h3>
                                        <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                                <span className="text-gray-300 text-xs sm:text-sm">{t('admin.requestDetails.pricePerDay')}</span>
                                                <span className="text-white font-semibold text-sm sm:text-base">{car ? `${car.price_per_day.toLocaleString()} MDL` : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                                <span className="text-gray-300 text-xs sm:text-sm">{t('admin.requestDetails.numberOfDays')}</span>
                                                <span className="text-white font-semibold text-sm sm:text-base">
                                                    {rentalDays} {t('admin.requestDetails.days')}{hours > 0 ? `, ${hours} ${t('admin.requestDetails.hours')}` : ''}
                                                </span>
                                            </div>
                                            {discountPercent > 0 && (
                                                <div className="flex justify-between items-center text-emerald-400">
                                                    <span className="text-xs sm:text-sm">{t('admin.requestDetails.discount')}</span>
                                                    <span className="font-semibold text-sm sm:text-base">-{discountPercent}%</span>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-white/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white font-medium text-sm sm:text-base">{t('admin.requestDetails.basePrice')}</span>
                                                    <span className="text-white font-semibold text-sm sm:text-base">{Math.round(basePrice).toLocaleString()} MDL</span>
                                                </div>
                                            </div>
                                            {/* Show services section if we have additional costs */}
                                            {actualAdditionalCosts > 0 && (
                                                <div className="pt-3 border-t border-white/10">
                                                    <h4 className="text-sm font-bold text-white mb-3">{t('admin.requestDetails.additionalServices')}</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {/* Show individual services if we have parsed options with service keys */}
                                                        {Object.keys(parsedOptions).length > 0 && (
                                                            parsedOptions.unlimitedKm || 
                                                            parsedOptions.speedLimitIncrease || 
                                                            parsedOptions.tireInsurance || 
                                                            parsedOptions.personalDriver || 
                                                            parsedOptions.priorityService || 
                                                            parsedOptions.childSeat || 
                                                            parsedOptions.simCard || 
                                                            parsedOptions.roadsideAssistance
                                                        ) ? (
                                                            <>
                                                                {parsedOptions.unlimitedKm && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.unlimitedKm}</span>
                                                                        <span className="text-white font-medium">
                                                                            {Math.round(baseCarPrice * totalDays * 0.5).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.speedLimitIncrease && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.speedLimitIncrease}</span>
                                                                        <span className="text-white font-medium">
                                                                            {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.tireInsurance && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.tireInsurance}</span>
                                                                        <span className="text-white font-medium">
                                                                            {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.personalDriver && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.personalDriver}</span>
                                                                        <span className="text-white font-medium">
                                                                            {(800 * rentalDays).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.priorityService && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.priorityService}</span>
                                                                        <span className="text-white font-medium">
                                                                            {(1000 * rentalDays).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.childSeat && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.childSeat}</span>
                                                                        <span className="text-white font-medium">
                                                                            {(100 * rentalDays).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.simCard && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.simCard}</span>
                                                                        <span className="text-white font-medium">
                                                                            {(100 * rentalDays).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {parsedOptions.roadsideAssistance && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-300">{serviceNames.roadsideAssistance}</span>
                                                                        <span className="text-white font-medium">
                                                                            {(500 * rentalDays).toLocaleString()} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        ) : null}
                                                    </div>
                                                    <div className="pt-2 border-t border-white/10 mt-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-300 text-sm">{t('admin.requestDetails.totalServices')}</span>
                                                            <span className="text-white font-semibold text-sm">{Math.round(actualAdditionalCosts).toLocaleString()} MDL</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="pt-2 border-t border-white/10">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white font-semibold text-base sm:text-lg">{t('admin.requestDetails.total')}</span>
                                                    <span className="text-emerald-400 font-bold text-lg sm:text-xl">{displayTotal.toLocaleString()} MDL</span>
                                                </div>
                                        </div>
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Contract Download/Create */}
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                    <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="text-sm sm:text-base">{t('admin.orders.contract')}</span>
                                </h3>
                                {order.status === 'CONTRACT' ? (
                                    <>
                                        <button
                                            onClick={handleOpenContractModal}
                                            disabled={!car}
                                            className="w-full px-4 py-2.5 sm:py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span>{t('admin.orders.createContract')}</span>
                                        </button>
                                        <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                                            {t('admin.orders.createContractDescription')}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                <button
                                    onClick={downloadContract}
                                    disabled={isGeneratingContract || !car}
                                    className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingContract ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t('admin.orders.generatingContract')}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4" />
                                            <span>{t('admin.orders.downloadContractPDF')}</span>
                                        </>
                                    )}
                                </button>
                                {order.contract_url && (
                                    <button
                                        onClick={handleOpenContractModal}
                                        className="w-full px-4 py-2.5 sm:py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold mt-2"
                                    >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>{t('admin.orders.recreateContract')}</span>
                                    </button>
                                )}
                                <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                                    {order.contract_url 
                                        ? t('admin.orders.downloadExistingOrRecreate')
                                        : t('admin.orders.generatesCompleteContract')}
                                </p>
                                    </>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {order && (onCancel || onRedo) && (
                                <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                    <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">{t('admin.orders.actions')}</h3>
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                                        {order.status !== 'CANCELLED' && onCancel && (
                                            <button
                                                onClick={() => {
                                                    if (order && window.confirm(t('admin.orders.confirmCancelOrder'))) {
                                                        onCancel(order);
                                                        onClose();
                                                    }
                                                }}
                                                disabled={isProcessing}
                                                className="flex-1 px-4 py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>{t('admin.orders.processing')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        <span>{t('admin.orders.cancelOrder')}</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                        {order.status === 'CANCELLED' && onRedo && (
                                            <button
                                                onClick={() => {
                                                    if (order && window.confirm(t('admin.orders.confirmRestoreOrder'))) {
                                                        onRedo(order);
                                                        onClose();
                                                    }
                                                }}
                                                disabled={isProcessing}
                                                className="flex-1 px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isProcessing ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span>{t('admin.orders.processing')}</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <RefreshCw className="w-4 h-4" />
                                                        <span>{t('admin.orders.redoOrder')}</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
            )}
            {car && order && (
                <ContractCreationModal
                    isOpen={showContractModal}
                    onClose={() => setShowContractModal(false)}
                    order={order}
                    car={car}
                    orderNumber={orderNumber}
                    onContractCreated={() => {
                        setShowContractModal(false);
                        // Optionally reload orders or refresh data
                    }}
                />
            )}
        </>
    );
};

