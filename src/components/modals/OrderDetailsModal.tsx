import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Car as DollarSign, FileText, Download, Loader2, AlertTriangle } from 'lucide-react';
import { Rental, OrderDisplay } from '../../types';
import { generateContractFromOrder } from '../../lib/contract';
import { Car } from '../../types';
import { useTranslation } from 'react-i18next';
import { calculateRentalDuration } from '../../utils/date';
import { fetchCars } from '../../lib/cars';
import { fetchImagesByCarName } from '../../lib/db/cars/cars';

interface OrderDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: Rental | OrderDisplay | null;
    onCancel?: (order: OrderDisplay) => void;
    onRedo?: (order: OrderDisplay) => void;
    isProcessing?: boolean;
    onOpenContractModal?: () => void; // Callback to open contract modal from parent
    showOrderNumber?: boolean; // Whether to show the order number for admins/users
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen,
    onClose,
    order,
    onCancel,
    onRedo,
    isProcessing,
    onOpenContractModal,
    showOrderNumber = true, // Default to showing order number for backward compatibility
}) => {
    const { t } = useTranslation();
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [requestOptions, setRequestOptions] = useState<any>(null);
    const [currentOrder, setCurrentOrder] = useState<Rental | OrderDisplay | null>(order);
    const displayOrder = currentOrder || order;

    // Refresh order data when modal opens or order prop changes
    useEffect(() => {
        setCurrentOrder(order);
        // If order doesn't have contract_url but should (based on rental_status), try to refresh
        if (displayOrder && !displayOrder.contract_url && ((displayOrder as any).rental_status === 'ACTIVE' || (displayOrder as any).status === 'PROCESSED')) {
            refreshOrderData();
        }
    }, [order, isOpen, displayOrder]);

    const refreshOrderData = async () => {
        if (!order || !(order as any).id) return;

        try {
            // Import the fetch function
            const { fetchRentalsOnly } = await import('../../lib/orders');
            const cars = await fetchCars();

            const refreshedOrders = await fetchRentalsOnly(cars);
            const refreshedOrder = refreshedOrders.find(o => o.id === (order as any).id);

            if (refreshedOrder) {
                console.log('Refreshed order data:', refreshedOrder);
                setCurrentOrder(refreshedOrder);
            }
        } catch (error) {
            console.error('Error refreshing order data:', error);
        }
    };

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
            if (!displayOrder) {
                setRequestOptions(null);
                return;
            }
            const requestId = (displayOrder as any).request_id;
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
                        .eq('user_id', order.user_id)
                        .eq('car_id', (order as Rental).car_id || (order as OrderDisplay).carId)
                        .eq('start_date', startDate)
                        .eq('end_date', endDate)
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
            const carId = (order as Rental).car_id || (order as OrderDisplay).carId;
            let foundCar = cars.find(c => {
                if (!carId) return false;

                // Normalize both IDs to numbers for comparison
                const carIdNum = typeof c.id === 'number' ? c.id : parseInt(c.id.toString(), 10);
                const orderCarIdNum = typeof carId === 'number'
                    ? carId
                    : parseInt(carId.toString(), 10);

                // Compare as numbers
                if (!isNaN(carIdNum) && !isNaN(orderCarIdNum) && carIdNum === orderCarIdNum) {
                    return true;
                }

                // Fallback: compare as strings
                const carIdStr = c.id.toString();
                const orderCarIdStr = carId.toString();
                return carIdStr === orderCarIdStr;
            });

            // If car not found in cars array, fetch from database
            if (!foundCar && carId) {
                console.warn('OrderDetailsModal: Car not found in cars array, fetching from database', {
                    orderCarId: carId,
                    orderCarName: order.carName
                });

                try {
                    const { supabase } = await import('../../lib/supabase');
                    const carIdMatch = typeof carId === 'number'
                        ? carId
                        : parseInt(carId.toString(), 10);

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
                    console.error(`OrderDetailsModal: Error fetching car ${carId} from database:`, err);
                }
            }

            setCar(foundCar);
        };

        findCar();
    }, [order, cars, order?.car_id]);

    console.log('OrderDetailsModal checking conditions - order:', !!order, 'isOpen:', isOpen);
    if (!order) {
        console.log('OrderDetailsModal: No order, returning null');
        return null;
    }

    // Handle both Rental and OrderDisplay formats
    const startDate = (order as Rental).start_date || (order as OrderDisplay).pickupDate;
    const startTime = (order as Rental).start_time || (order as OrderDisplay).pickupTime;
    const endDate = (order as Rental).end_date || (order as OrderDisplay).returnDate;
    const endTime = (order as Rental).end_time || (order as OrderDisplay).returnTime;

    const { days, hours, totalHours } = calculateRentalDuration(
        startDate,
        startTime,
        endDate,
        endTime
    );

    // Now use days, hours for pricing
    const rentalDays = days;
    const totalDays = days + hours / 24;

    // Base price calculation using price ranges (no period discounts)
    let basePrice = 0;
    let pricePerDay = 0;

    if (!car) {
        // If no car found, try to get price from order using price ranges
        const orderCar = (order as any).car;
        if (orderCar) {
            // Determine price per day based on rental duration
            if (rentalDays >= 2 && rentalDays <= 4) {
                pricePerDay = orderCar.price_2_4_days || 0;
            } else if (rentalDays >= 5 && rentalDays <= 15) {
                pricePerDay = orderCar.price_5_15_days || 0;
            } else if (rentalDays >= 16 && rentalDays <= 30) {
                pricePerDay = orderCar.price_16_30_days || 0;
            } else if (rentalDays > 30) {
                pricePerDay = orderCar.price_over_30_days || 0;
            }

            // Apply car discount if exists
            const carDiscount = orderCar.discount_percentage || 0;
            if (carDiscount > 0) {
                pricePerDay = pricePerDay * (1 - carDiscount / 100);
            }

            basePrice = pricePerDay * rentalDays;

            // Add hours portion
            if (hours > 0) {
                const hoursPrice = (hours / 24) * pricePerDay;
                basePrice += hoursPrice;
            }
        }
    } else {
        // Calculate with car price ranges
        // Determine price per day based on rental duration
        if (rentalDays >= 2 && rentalDays <= 4) {
            pricePerDay = car.price_2_4_days || 0;
        } else if (rentalDays >= 5 && rentalDays <= 15) {
            pricePerDay = car.price_5_15_days || 0;
        } else if (rentalDays >= 16 && rentalDays <= 30) {
            pricePerDay = car.price_16_30_days || 0;
        } else if (rentalDays > 30) {
            pricePerDay = car.price_over_30_days || 0;
        }

        // Apply car discount if exists
        const carDiscount = (car as any).discount_percentage || car.discount_percentage || 0;
        if (carDiscount > 0) {
            pricePerDay = pricePerDay * (1 - carDiscount / 100);
        }

        basePrice = pricePerDay * rentalDays;

        // Add hours portion (hours are charged at full price, no discount)
        if (hours > 0) {
            const hoursPrice = (hours / 24) * pricePerDay;
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

    const formatTime = (timeString: string) => {
        try {
            // If time is in HH:MM:SS format, extract HH:MM
            if (timeString && timeString.includes(':')) {
                const parts = timeString.split(':');
                if (parts.length >= 2) {
                    return `${parts[0]}:${parts[1]}`;
                }
            }
            return timeString;
        } catch {
            return timeString;
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
        const displayOrder = currentOrder || order;
        if (displayOrder?.contract_url) {
            // Create a temporary link to download the file
            const link = document.createElement('a');
            link.href = displayOrder.contract_url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };


    if (!isOpen) {
        console.log('OrderDetailsModal: Not open, returning null');
        return null;
    }
    console.log('OrderDetailsModal: Rendering modal for order:', order?.id);

    console.log('OrderDetailsModal: About to render portal');

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
                                        <h2 className="text-xl sm:text-2xl font-bold text-white">{t('admin.orders.orderDetails')}</h2>
                                        {showOrderNumber && (
                                            <p className="text-gray-400 text-xs sm:text-sm mt-1">
                                                {t('admin.orders.orderNumber')}{order.id ? order.id.toString().padStart(4, '0') : 'N/A'}
                                            </p>
                                        )}
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
                                                    {(car ? `${car.make} ${car.model}`.trim() : '') || (((order as any).car?.make + ' ' + (order as any).car?.model && (order as any).car?.make + ' ' + (order as any).car?.model !== 'Unknown Car' ? (order as any).car?.make + ' ' + (order as any).car?.model : '')) || t('admin.orders.unknownCar')}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                                <p className="text-gray-400 text-xs sm:text-sm mb-2">{t('admin.orders.pickup')}</p>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-white font-semibold text-sm sm:text-base">{formatDate(startDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm sm:text-base">{formatTime(startTime)}</span>
                                                </div>
                                            </div>
                                            <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                                <p className="text-gray-400 text-xs sm:text-sm mb-2">{t('admin.orders.return')}</p>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-white font-semibold text-sm sm:text-base">{formatDate(endDate)}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                                    <span className="text-gray-300 text-sm sm:text-base">{formatTime(endTime)}</span>
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

                                        // Use the rental's stored total_amount instead of recalculating
                                        // This ensures consistency with the request's pricing
                                        const usingStoredTotal = !!(order as any).total_amount || !!(order as any).amount;
                                        const storedAmount = (order as any).total_amount || (order as any).amount;
                                        const calculatedAmount = basePrice + additionalCosts;

                                        console.log('OrderDetailsModal pricing:', {
                                            orderId: order?.id,
                                            total_amount: (order as any).total_amount,
                                            amount: (order as any).amount,
                                            storedAmount,
                                            calculatedAmount,
                                            basePrice,
                                            additionalCosts,
                                            usingStoredTotal
                                        });

                                        const totalPrice = usingStoredTotal && storedAmount > 0 ?
                                            storedAmount :
                                            calculatedAmount;

                                        // Service names mapping
                                        const serviceNames: Record<string, string> = {
                                            unlimitedKm: 'Kilometraj nelimitat',
                                            speedLimitIncrease: 'Creșterea limitei de viteză',
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
                                                    {/* Always show detailed pricing breakdown */}
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-300 text-xs sm:text-sm">{t('admin.requestDetails.pricePerDay')}</span>
                                                        <span className="text-white font-semibold text-sm sm:text-base">{pricePerDay > 0 ? `${Math.round(pricePerDay)} MDL` : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-gray-300 text-xs sm:text-sm">{t('admin.requestDetails.numberOfDays')}</span>
                                                        <span className="text-white font-semibold text-sm sm:text-base">
                                                            {rentalDays} {t('admin.requestDetails.days')}{hours > 0 ? `, ${hours} ${t('admin.requestDetails.hours')}` : ''}
                                                        </span>
                                                    </div>
                                                    <div className="pt-2 border-t border-white/10">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-white font-medium text-sm sm:text-base">{t('admin.requestDetails.basePrice')}</span>
                                                            <span className="text-white font-semibold text-sm sm:text-base">{Math.round(basePrice).toLocaleString()} MDL</span>
                                                        </div>
                                                    </div>

                                                    {/* Show services section if we have additional costs or stored total */}
                                                    {(additionalCosts > 0 || usingStoredTotal) && (
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

                                    {/* Contract Download - Show first */}
                                    {displayOrder?.contract_url && (
                                        <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 mb-4">
                                            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                                <span className="text-sm sm:text-base">{t('admin.orders.contract')}</span>
                                            </h3>
                                            <a
                                                href={displayOrder.contract_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                                            >
                                                <Download className="w-4 h-4" />
                                                <span>{t('admin.orders.downloadContractPDF')}</span>
                                            </a>
                                            <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                                                Descarcă contractul de închiriere
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons - Show after contract */}
                                    {showOrderNumber && (displayOrder as any)?.status !== 'COMPLETED' && (
                                        <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                            <span className="text-sm sm:text-base">Acțiuni</span>
                                        </h3>

                                        <div className="space-y-3">
                                            {/* Create Contract Button - for CONTRACT status */}
                                            {(displayOrder as any)?.status === 'CONTRACT' && (
                                                <button
                                                    onClick={handleOpenContractModal}
                                                    className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50"
                                                    disabled={isGeneratingContract}
                                                >
                                                    {isGeneratingContract ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <FileText className="w-4 h-4" />
                                                    )}
                                                    <span>Creează Contract</span>
                                                </button>
                                            )}

                                            {/* Cancel Order Button - for ACTIVE and CONTRACT status */}
                                            {((displayOrder as any)?.status === 'ACTIVE' || (displayOrder as any)?.status === 'CONTRACT') && onCancel && (
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Ești sigur că vrei să anulezi această comandă? Această acțiune va anula și cererea corespunzătoare.')) {
                                                            onCancel(displayOrder as OrderDisplay);
                                                        }
                                                    }}
                                                    className="w-full px-4 py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                                                >
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span>Anulează Comanda</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    )}
                                </div>
            </div>
        </div>,
        document.body
    );
};

