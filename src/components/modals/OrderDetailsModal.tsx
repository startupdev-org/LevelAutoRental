import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Car as DollarSign, FileText, Plus, Download, RefreshCw, Loader2 } from 'lucide-react';
import { Rental, OrderDisplay } from '../../lib/orders';
import { generateContractFromOrder } from '../../lib/contract';
import { Car } from '../../types';
import { useTranslation } from 'react-i18next';
import { calculateRentalDuration } from '../../utils/date';
import { fetchCars } from '../../lib/cars';
import { fetchImagesByCarName } from '../../lib/db/cars/cars';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: OrderDisplay | null;
    onCancel?: (order: OrderDisplay) => void;
    onRedo?: (order: OrderDisplay) => void;
    isProcessing?: boolean;
    onOpenContractModal?: () => void; // Callback to open contract modal from parent
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen,
    onClose,
    order,
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
    const [cars, setCars] = useState<Car[]>([]);
    const [car, setCar] = useState<Car | undefined>(undefined);

    // Fetch cars when modal opens
    useEffect(() => {
        const loadCars = async () => {
            if (!isOpen) {
                return; // Don't load if modal is closed
            }
            
            try {
                // Fetch cars from database
                const fetchedCars = await fetchCars();
                
                if (fetchedCars.length === 0) {
                    setCars([]);
                    return;
                }
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );
                
                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
                setCars([]);
            }
        };
        
        loadCars();
    }, [isOpen]);

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

    // Find car by matching carId (handle both string and number types)
    useEffect(() => {
        if (!order) {
            setCar(undefined);
            return;
        }
        
        const findCar = async () => {
            // First, try to find in cars array
            let foundCar = cars.find(c => {
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
    
            // If car not found in cars array, fetch from database
            if (!foundCar && order.carId) {
                console.warn('OrderDetailsModal: Car not found in cars array, fetching from database', {
            orderCarId: order.carId,
            orderCarName: order.carName
        });
                
                try {
                    const { supabase } = await import('../../lib/supabase');
                    const carIdMatch = typeof order.carId === 'number' 
                        ? order.carId 
                        : parseInt(order.carId.toString(), 10);
                    
                    const { data: carData, error } = await supabase
                        .from('Cars')
                        .select('*')
                        .eq('id', carIdMatch)
                        .single();
                    
                    if (!error && carData) {
                        // Map database row to Car type
                        foundCar = {
                            id: carData.id,
                            make: carData.make,
                            model: carData.model,
                            name: carData.name || undefined,
                            year: carData.year || new Date().getFullYear(),
                            price_per_day: carData.price_per_day,
                            discount_percentage: carData.discount_percentage || undefined,
                            category: carData.category as 'suv' | 'sports' | 'luxury' || undefined,
                            image_url: carData.image_url || undefined,
                            photo_gallery: carData.photo_gallery || undefined,
                            seats: carData.seats || undefined,
                            transmission: carData.transmission as 'Automatic' | 'Manual' || undefined,
                            body: carData.body as 'Coupe' | 'Sedan' | 'SUV' || undefined,
                            fuel_type: carData.fuel_type as 'gasoline' | 'hybrid' | 'electric' | 'diesel' | 'petrol' || undefined,
                            features: carData.features || undefined,
                            rating: carData.rating || undefined,
                            reviews: carData.reviews || undefined,
                            status: carData.status || undefined,
                            drivetrain: carData.drivetrain || undefined,
                        } as Car & { name?: string };
                        
                        // Fetch images from storage for this car
                        if (foundCar) {
                            const carName = (foundCar as any).name || `${foundCar.make} ${foundCar.model}`;
                            const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                            foundCar.image_url = mainImage || foundCar.image_url;
                            foundCar.photo_gallery = photoGallery.length > 0 ? photoGallery : foundCar.photo_gallery;
                        }
                    }
                } catch (err) {
                    console.error(`OrderDetailsModal: Error fetching car ${order.carId} from database:`, err);
                }
            }
            
            setCar(foundCar);
        };
        
        findCar();
    }, [order, cars, order?.carId]);

    if (!order) return null;

    const { days, hours, totalHours } = calculateRentalDuration(
        order.pickupDate,
        order.pickupTime,
        order.returnDate,
        order.returnTime
    );

    // Now use days, hours for pricing
    const rentalDays = days;
    const totalDays = days + hours / 24;

    // Base price calculation with discounts (same as RequestDetailsModal)
    let basePrice = 0;
    let discountPercent = 0;

    if (!car) {
        // If no car found, try to get price from order
        const orderPricePerDay = (order as any).price_per_day || (order as any).car?.price_per_day || 0;
        if (orderPricePerDay > 0) {
            if (rentalDays >= 8) {
                discountPercent = 4;
                basePrice = orderPricePerDay * 0.96 * rentalDays; // -4%
            } else if (rentalDays >= 4) {
                discountPercent = 2;
                basePrice = orderPricePerDay * 0.98 * rentalDays; // -2%
            } else {
                basePrice = orderPricePerDay * rentalDays;
            }
            // Add hours portion
            if (hours > 0) {
                const hoursPrice = (hours / 24) * orderPricePerDay;
                basePrice += hoursPrice;
            }
        }
    } else {
        // Calculate with car price
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

        return;
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
                                            {t('admin.orders.orderNumber')}{order.id ? order.id.toString().padStart(4, '0') : 'N/A'}
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

                                    {/* Rental Period */}
                                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="text-sm sm:text-base">{t('admin.orders.rentalPeriod')}</span>
                                            </h3>
                                            <div className="flex items-center gap-2">
                                                {(car?.image_url || (car as any)?.image || (order as any).car?.image_url) && (
                                                    <img
                                                        src={car?.image_url || (car as any)?.image || (order as any).car?.image_url}
                                                        alt={(car ? `${car.make} ${car.model}`.trim() : '') || ((order as any).car?.make + ' ' + (order as any).car?.model) || t('admin.orders.unknownCar')}
                                                        className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded-md border border-white/10"
                                                    />
                                                )}
                                                <span className="text-white font-semibold text-xs sm:text-sm">
                                                    {(car ? `${car.make} ${car.model}`.trim() : '') || (((order as any).car?.make + ' ' + (order as any).car?.model && (order as any).car?.make + ' ' + (order as any).car?.model !== 'Unknown Car' ? (order as any).car?.make + ' ' + (order as any).car?.model : '')) || order.carName || t('admin.orders.unknownCar')}
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

                                        // Calculate additional costs (same logic as RequestDetailsModal)
                                        let additionalCosts = 0;
                                        const baseCarPrice = car?.price_per_day || (order as any).price_per_day || (order as any).car?.price_per_day || 0;

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
                                                        <span className="text-white font-semibold text-sm sm:text-base">{car ? `${car.price_per_day} MDL` : ((order as any).car ? `${(order as any).car.price_per_day} MDL` : 'N/A')}</span>
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
                                                    {additionalCosts > 0 && (
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
                                                                    <span className="text-white font-semibold text-sm">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="pt-2 border-t border-white/10">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-white font-semibold text-base sm:text-lg">{t('admin.requestDetails.total')}</span>
                                                            <span className="text-emerald-400 font-bold text-lg sm:text-xl">{Math.round(totalPrice).toLocaleString()} MDL</span>
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
                                        {((order as any).rental_status || order.status) === 'CONTRACT' ? (
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
                                                {order.contract_url ? (
                                                    <>
                                                        <a
                                                            href={order.contract_url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                                                >
                                                            <Download className="w-4 h-4" />
                                                            <span>{t('admin.orders.downloadContractPDF')}</span>
                                                        </a>
                                                    <button
                                                        onClick={handleOpenContractModal}
                                                        className="w-full px-4 py-2.5 sm:py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold mt-2"
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        <span>{t('admin.orders.recreateContract')}</span>
                                                    </button>
                                                <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                                                            {t('admin.orders.downloadExistingOrRecreate')}
                                                        </p>
                                                    </>
                                                ) : (
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
                                                            {t('admin.orders.generatesCompleteContract')}
                                                        </p>
                                                    </>
                                                )}
                                            </>

                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

