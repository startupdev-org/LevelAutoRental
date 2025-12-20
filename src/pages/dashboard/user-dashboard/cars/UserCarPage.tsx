import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Car as CarIcon,
    ArrowRight,
    Users,
} from 'lucide-react';
import { FaGasPump } from "react-icons/fa6";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled, TbCar4WdFilled } from "react-icons/tb";
import { Car as CarType } from '../../../../types';
import { fetchCars } from '../../../../lib/db/cars/cars-page/cars';
import { LoadingState } from '../../../../components/ui/LoadingState';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { supabase } from '../../../../lib/supabase';
import { fetchImagesByCarName } from '../../../../lib/db/cars/cars';
import { UserCreateRentalRequestModal } from '../../../../components/modals/UserCreateRentalRequestModal/UserCreateRentalRequestModal';
import { useTranslation } from 'react-i18next';
import { formatPrice, getSelectedCurrency } from '../../../../utils/currency';


// Cars Management View Component
export const CarsView: React.FC = () => {

    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const [cars, setCars] = useState<CarType[]>([]);
    const [allCars, setAllCars] = useState<CarType[]>([]);

    // Modal state for rental request
    const [isRentalModalOpen, setIsRentalModalOpen] = useState(false);
    const [selectedCarForRental, setSelectedCarForRental] = useState<CarType | null>(null);


    const [page, setPage] = useState(1);
    const pageSize = 6;

    const [totalCars, setTotalCars] = useState(0);

    const [loading, setLoading] = useState(false);
    const [carsAvailability, setCarsAvailability] = useState<Map<string, { rentals: any[], borrowRequests: any[] }>>(new Map());
    const [carsImages, setCarsImages] = useState<Map<string, { mainImage: string, photoGallery: string[] }>>(new Map());



    async function handleFetchCarsWithSortByFilters() {
        setLoading(true); // start loading
        try {
            const allCars = await fetchCars();
            setAllCars(allCars);
            setTotalCars(allCars.length);

            // Apply client-side pagination
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedCars = allCars.slice(startIndex, endIndex);
            setCars(paginatedCars);

            // Batch fetch availability and images for current page cars only
            if (paginatedCars && paginatedCars.length > 0) {
                await Promise.all([
                    fetchCarsAvailability(paginatedCars),
                    fetchCarsImages(paginatedCars)
                ]);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false); // stop loading
        }
    }

    // Fetch cars on mount
    useEffect(() => {
        handleFetchCarsWithSortByFilters();
    }, []);

    // Handle page changes by slicing allCars
    useEffect(() => {
        if (allCars.length > 0) {
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedCars = allCars.slice(startIndex, endIndex);
            setCars(paginatedCars);
        }
    }, [page, allCars, pageSize]);

    const handleViewCarDetails = (car: CarType) => {
        navigate(`/cars/${car.id}`);
    };

    function handleOpenModal(car: CarType) {


        setSelectedCarForRental(car);

        setIsRentalModalOpen(true);

    };

    function handleCloseRentalModal() {

        setIsRentalModalOpen(false);
        setSelectedCarForRental(null);
    }


    // Batch fetch availability data for all cars
    const fetchCarsAvailability = async (cars: CarType[]) => {
        if (!cars || cars.length === 0) return;

        const carIds = cars.map(car => typeof car.id === 'number' ? car.id : parseInt(String(car.id), 10));

        try {
            // Batch fetch rentals for all cars
            const rentalsPromises = carIds.map(carId =>
                supabase
                    .from('Rentals')
                    .select('*')
                    .eq('car_id', carId)
                    .order('created_at', { ascending: false })
            );

            // Batch fetch borrow requests for all cars
            const borrowPromises = carIds.map(carId =>
                supabase
                    .from('BorrowRequest')
                    .select('*')
                    .eq('car_id', carId)
                    .in('status', ['APPROVED'])
                    .order('requested_at', { ascending: false })
            );

            const [rentalsResults, borrowResults] = await Promise.all([
                Promise.all(rentalsPromises),
                Promise.all(borrowPromises)
            ]);

            // Process and store availability data
            const availabilityMap = new Map<string, { rentals: any[], borrowRequests: any[] }>();

            carIds.forEach((carId, index) => {
                const carIdStr = carId.toString();
                const rentals = rentalsResults[index].data || [];
                const borrowRequests = borrowResults[index].data || [];

                availabilityMap.set(carIdStr, { rentals, borrowRequests });
            });

            setCarsAvailability(availabilityMap);
        } catch (error) {
            console.error('Error fetching cars availability:', error);
        }
    };

    // Batch fetch images for all cars
    const fetchCarsImages = async (cars: CarType[]) => {
        if (!cars || cars.length === 0) return;

        try {
            // Process all cars in parallel
            const imagePromises = cars.map(async (car) => {
                try {
                    let carName = (car as any).name;
                    if (!carName || carName.trim() === '') {
                        carName = `${car.make} ${car.model}`;
                    }

                    const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                    return {
                        carId: car.id.toString(),
                        mainImage: mainImage || car.image_url,
                        photoGallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery || []
                    };
                } catch (error) {
                    console.error(`Error fetching images for car ${car.id}:`, error);
                    return {
                        carId: car.id.toString(),
                        mainImage: car.image_url,
                        photoGallery: car.photo_gallery || []
                    };
                }
            });

            const imageResults = await Promise.all(imagePromises);

            // Store images data
            const imagesMap = new Map<string, { mainImage: string, photoGallery: string[] }>();
            imageResults.forEach(result => {
                imagesMap.set(result.carId, {
                    mainImage: result.mainImage || '',
                    photoGallery: result.photoGallery
                });
            });

            setCarsImages(imagesMap);
        } catch (error) {
            console.error('Error fetching cars images:', error);
        }
    };

    // Car Card Component (with batched data - no individual fetching)
    const CarCard: React.FC<{
        car: CarType;
        availabilityData?: { rentals: any[], borrowRequests: any[] };
        imageData?: { mainImage: string, photoGallery: string[] };
    }> = ({ car, availabilityData, imageData }) => {
        const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
        const [activePhotoIndex, setActivePhotoIndex] = useState(0);

        // Use batched data or fall back to car data
        const carWithImages = {
            ...car,
            image_url: imageData?.mainImage || car.image_url,
            photo_gallery: imageData?.photoGallery || car.photo_gallery || []
        };
        const carRentalsForCalendar = availabilityData?.rentals || [];
        const approvedBorrowRequests = availabilityData?.borrowRequests || [];

        // Calculate availability using batched data
        useEffect(() => {
            if (!availabilityData) return;

            const { rentals, borrowRequests } = availabilityData;

            // Convert rentals to borrow request format
            const rentalRequests = rentals.map((rental: any) => ({
                id: rental.id.toString(),
                user_id: rental.user_id,
                car_id: rental.car_id.toString(),
                start_date: rental.start_date,
                start_time: rental.start_time || '09:00:00',
                end_date: rental.end_date,
                end_time: rental.end_time || '17:00:00',
                status: 'APPROVED' as const,
                created_at: rental.created_at,
                updated_at: rental.updated_at,
            }));

            // Convert approved borrow requests to same format
            const approvedRequests = borrowRequests.map((req: any) => ({
                id: req.id.toString(),
                user_id: req.user_id,
                car_id: req.car_id.toString(),
                start_date: req.start_date,
                start_time: req.start_time || '09:00:00',
                end_date: req.end_date,
                end_time: req.end_time || '17:00:00',
                status: 'APPROVED' as const,
                created_at: req.requested_at || req.created_at,
                updated_at: req.updated_at,
            }));

            // Combine both types
            const allRequests = [...rentalRequests, ...approvedRequests];

            // Filter requests - only filter out ones with missing dates
            const filteredRequests = allRequests.filter((request: any) => {
                return request.start_date && request.end_date;
            });

            // Calculate nextAvailableDate from combined Rentals + APPROVED requests
            // This ensures consecutive rentals (including APPROVED) show the correct "Liber" date
            const currentTime = new Date();
            let latestReturnDate: Date | null = null;

            if (filteredRequests.length > 0) {
                // Sort all requests (rentals + approved) by start date
                const sortedRequests = [...filteredRequests].sort((a, b) => {
                    const startA = new Date(a.start_date || 0);
                    const startB = new Date(b.start_date || 0);
                    return startA.getTime() - startB.getTime();
                });

                // Find consecutive requests (no gap between them)
                let consecutiveEndDate: Date | null = null;

                for (let i = 0; i < sortedRequests.length; i++) {
                    const request = sortedRequests[i];
                    if (!request.end_date) continue;

                    // Parse end date
                    const endDateStr = request.end_date.includes('T')
                        ? request.end_date.split('T')[0]
                        : request.end_date.split(' ')[0];
                    const requestEndDate = new Date(endDateStr);

                    // Add end time
                    if (request.end_time) {
                        const [hours, minutes] = request.end_time.split(':').map(Number);
                        requestEndDate.setHours(hours || 17, minutes || 0, 0, 0);
                    } else {
                        requestEndDate.setHours(17, 0, 0, 0);
                    }

                    // Add 12 hours maintenance period after rental ends
                    requestEndDate.setHours(requestEndDate.getHours() + 12);

                    // Check if this request is consecutive with the previous one
                    if (i === 0) {
                        // First request - start the chain
                        consecutiveEndDate = requestEndDate;
                    } else {
                        const prevRequest = sortedRequests[i - 1];
                        if (!prevRequest.end_date) continue;

                        // Parse previous end date
                        const prevEndDateStr = prevRequest.end_date.includes('T')
                            ? prevRequest.end_date.split('T')[0]
                            : prevRequest.end_date.split(' ')[0];
                        const prevEndDate = new Date(prevEndDateStr);

                        if (prevRequest.end_time) {
                            const [prevHours, prevMinutes] = prevRequest.end_time.split(':').map(Number);
                            prevEndDate.setHours(prevHours || 17, prevMinutes || 0, 0, 0);
                        } else {
                            prevEndDate.setHours(17, 0, 0, 0);
                        }

                        // Add 12 hours maintenance period after previous rental ends
                        prevEndDate.setHours(prevEndDate.getHours() + 12);

                        // Parse current start date
                        const startDateStr = request.start_date.includes('T')
                            ? request.start_date.split('T')[0]
                            : request.start_date.split(' ')[0];
                        const requestStartDate = new Date(startDateStr);

                        if (request.start_time) {
                            const [startHours, startMinutes] = request.start_time.split(':').map(Number);
                            requestStartDate.setHours(startHours || 9, startMinutes || 0, 0, 0);
                        } else {
                            requestStartDate.setHours(9, 0, 0, 0);
                        }

                        // Check if requests are consecutive (same day or next day with no gap)
                        const timeDiff = requestStartDate.getTime() - prevEndDate.getTime();
                        const oneDayInMs = 24 * 60 * 60 * 1000;

                        // If start of next request is same day or next day (within 25 hours to account for time differences)
                        if (timeDiff >= 0 && timeDiff <= oneDayInMs + (60 * 60 * 1000)) {
                            // Consecutive - update the end date
                            consecutiveEndDate = requestEndDate;
                        } else {
                            // Gap found - use the previous consecutive end date
                            if (consecutiveEndDate && consecutiveEndDate > currentTime) {
                                latestReturnDate = consecutiveEndDate;
                            }
                            // Start new chain
                            consecutiveEndDate = requestEndDate;
                        }
                    }
                }

                // Use the last consecutive end date if it's later than any individual request
                if (consecutiveEndDate && consecutiveEndDate > currentTime) {
                    latestReturnDate = consecutiveEndDate;
                }
            }

            setNextAvailableDate(latestReturnDate);
        }, [availabilityData]);

        const getAvailabilityBadge = () => {
            // Helper function to format date as YYYY-MM-DD (local timezone)
            const formatDateLocal = (date: Date): string => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Check if a date/time is in a maintenance period (12 hours after rental ends)
            const isInMaintenancePeriod = (checkDate: Date): boolean => {
                if (carRentalsForCalendar.length === 0) return false;

                return carRentalsForCalendar.some(rental => {
                    if (!rental.end_date || !rental.end_time) return false;

                    // Parse rental end date and time
                    const endDateStr = rental.end_date.includes('T')
                        ? rental.end_date.split('T')[0]
                        : rental.end_date.split(' ')[0];
                    const endDate = new Date(endDateStr + 'T00:00:00');

                    const [endHours, endMinutes] = rental.end_time.split(':').map(Number);
                    endDate.setHours(endHours || 17, endMinutes || 0, 0, 0);

                    // Add 12 hours for maintenance period
                    const maintenanceEnd = new Date(endDate);
                    maintenanceEnd.setHours(maintenanceEnd.getHours() + 12);

                    // Check if checkDate is within maintenance period
                    const checkDateOnly = new Date(checkDate);
                    checkDateOnly.setHours(0, 0, 0, 0);
                    const endDateOnly = new Date(endDate);
                    endDateOnly.setHours(0, 0, 0, 0);
                    const maintenanceEndOnly = new Date(maintenanceEnd);
                    maintenanceEndOnly.setHours(0, 0, 0, 0);

                    // If maintenance spans multiple days, check if checkDate is within range
                    if (endDateOnly.getTime() === maintenanceEndOnly.getTime()) {
                        // Same day - check if checkDate is that day
                        return formatDateLocal(checkDateOnly) === formatDateLocal(endDateOnly);
                    } else {
                        // Spans multiple days
                        return checkDateOnly >= endDateOnly && checkDateOnly <= maintenanceEndOnly;
                    }
                });
            };

            // Check if date is in an actual approved/executed request (for blocking)
            // Only checks current/future bookings, not past ones
            const isDateInActualApprovedRequest = (dateString: string): boolean => {
                const checkDateStr = dateString.split('T')[0];
                const checkDate = new Date(checkDateStr + 'T00:00:00');
                checkDate.setHours(0, 0, 0, 0);

                // Don't check past dates - only current/future bookings
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (checkDate < today) {
                    return false;
                }

                // Check maintenance periods (12 hours after each rental)
                if (isInMaintenancePeriod(checkDate)) {
                    return true;
                }

                // Check approved/executed borrow requests
                if (approvedBorrowRequests.length > 0) {
                    const result = approvedBorrowRequests.some(request => {
                        if (!request.start_date || !request.end_date) return false;

                        const startDateStr = request.start_date.includes('T')
                            ? request.start_date.split('T')[0]
                            : request.start_date.split(' ')[0];
                        const startDate = new Date(startDateStr + 'T00:00:00');
                        startDate.setHours(0, 0, 0, 0);

                        const endDateStr = request.end_date.includes('T')
                            ? request.end_date.split('T')[0]
                            : request.end_date.split(' ')[0];
                        const endDate = new Date(endDateStr + 'T23:59:59');
                        endDate.setHours(23, 59, 59, 999);

                        // Only show if the booking is current or future (end date is today or later)
                        const isCurrentOrFuture = endDate >= today;
                        return isCurrentOrFuture && checkDate >= startDate && checkDate <= endDate;
                    });

                    if (result) return true;
                }

                // Check active rentals (which come from APPROVED requests)
                if (carRentalsForCalendar.length > 0) {
                    const result = carRentalsForCalendar.some(rental => {
                        if (!rental.start_date || !rental.end_date) return false;

                        const startDateStr = rental.start_date.includes('T')
                            ? rental.start_date.split('T')[0]
                            : rental.start_date.split(' ')[0];
                        const startDate = new Date(startDateStr + 'T00:00:00');
                        startDate.setHours(0, 0, 0, 0);

                        const endDateStr = rental.end_date.includes('T')
                            ? rental.end_date.split('T')[0]
                            : rental.end_date.split(' ')[0];
                        const endDate = new Date(endDateStr + 'T23:59:59');
                        endDate.setHours(23, 59, 59, 999);

                        // Only show if the rental is current or future (end date is today or later)
                        const isCurrentOrFuture = endDate >= today;
                        return isCurrentOrFuture && checkDate >= startDate && checkDate <= endDate;
                    });

                    return result;
                }

                return false;
            };

            // Find the first available date using the same logic as the calendar
            const findFirstAvailableDate = (): Date | null => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayString = formatDateLocal(today);

                // Always start checking from TODAY first
                let checkDate = new Date(today);

                // Check up to 60 days ahead
                for (let i = 0; i < 60; i++) {
                    const checkDateStr = formatDateLocal(checkDate);

                    // Use the same blocking logic as the calendar
                    const isPast = checkDateStr < todayString;

                    const isBeforeAvailable = nextAvailableDate
                        ? (() => {
                            const nextAvailDate = new Date(nextAvailableDate);
                            nextAvailDate.setHours(0, 0, 0, 0);
                            const dayDate = new Date(checkDateStr);
                            dayDate.setHours(0, 0, 0, 0);
                            // Only block if nextAvailableDate is today or past, and day is before it
                            return nextAvailDate <= today && dayDate < nextAvailDate;
                        })()
                        : false;

                    const isInActualRequest = isDateInActualApprovedRequest(checkDateStr);

                    // If date is not blocked, this is the first available date
                    if (!isPast && !isBeforeAvailable && !isInActualRequest) {
                        return checkDate;
                    }

                    // Move to next day
                    checkDate.setDate(checkDate.getDate() + 1);
                }

                return null;
            };

            const formatDateForDisplay = (date: Date): string => {
                const day = date.getDate();
                const monthNames = ['ianuarie', 'februarie', 'martie', 'aprilie', 'mai', 'iunie',
                    'iulie', 'august', 'septembrie', 'octombrie', 'noiembrie', 'decembrie'];
                const month = monthNames[date.getMonth()];

                // Format date in Romanian: "Liber de pe 30 noiembrie"
                return `Liber de pe ${day} ${month}`;
            };

            // Find the first available date using calendar logic (always starts from today)
            const firstAvailableDate = findFirstAvailableDate();

            // If first available date is today, show "Disponibil"
            // Otherwise show the date
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isAvailableToday = firstAvailableDate &&
                formatDateLocal(firstAvailableDate) === formatDateLocal(today);

            const availabilityText = firstAvailableDate
                ? (isAvailableToday
                    ? 'Disponibil'
                    : formatDateForDisplay(firstAvailableDate))
                : (car.status === 'available' || car.status === 'Available' ? 'Disponibil' : car.status || '');

            // Don't show badge if it says "Disponibil" (only show when there's a specific date)
            if (!availabilityText || availabilityText === 'Disponibil') return null;

            return (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-xs font-normal shadow-sm flex items-center gap-1.5">
                    <svg className="w-3 h-3 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="whitespace-nowrap">{availabilityText}</span>
                </div>
            );
        };

        return (
            <div className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-md rounded-3xl border border-white/20 overflow-hidden transition-all duration-300 group cursor-pointer hover:-translate-y-2 hover:shadow-2xl">
                {/* Advanced Photo Gallery Container */}
                <div
                    className="relative overflow-hidden cursor-pointer"
                    onMouseMove={(e) => {
                        if (carWithImages.photo_gallery && carWithImages.photo_gallery.length > 1) {
                            const container = e.currentTarget;
                            const rect = container.getBoundingClientRect();
                            const x = e.clientX - rect.left;
                            const width = rect.width;
                            const maxPhotos = 5;
                            const photosToShow = Math.min(carWithImages.photo_gallery.length, maxPhotos);
                            const photoIndex = Math.floor((x / width) * photosToShow);
                            const clampedIndex = Math.max(0, Math.min(photoIndex, photosToShow - 1));

                            setActivePhotoIndex(clampedIndex);

                            const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                            if (imageContainer) {
                                const translateX = -(clampedIndex * 100);
                                imageContainer.style.transform = `translateX(${translateX}%)`;
                            }
                        }
                    }}
                    onMouseLeave={(e) => {
                        if (carWithImages.photo_gallery && carWithImages.photo_gallery.length > 1) {
                            setActivePhotoIndex(0);
                            const imageContainer = e.currentTarget.querySelector('.photo-gallery') as HTMLElement;
                            if (imageContainer) {
                                imageContainer.style.transform = 'translateX(0%)';
                            }
                        }
                    }}
                >
                    <div className="flex transition-transform duration-300 ease-out group-hover:scale-105 photo-gallery">
                        {carWithImages.photo_gallery && carWithImages.photo_gallery.length > 1 ? (
                            (() => {
                                const maxPhotos = 5;
                                const photosToShow = carWithImages.photo_gallery.slice(0, maxPhotos);
                                const totalPhotos = carWithImages.photo_gallery.length;
                                const remainingPhotos = totalPhotos - maxPhotos;

                                return photosToShow.map((photo, index) => (
                                    <div
                                        key={index}
                                        className="relative w-full h-56 flex-shrink-0"
                                        style={{ minWidth: '100%' }}
                                    >
                                        <img
                                            src={photo}
                                            alt={`${carWithImages.make} ${carWithImages.model} - Photo ${index + 1}`}
                                            className="w-full h-56 object-cover object-center bg-black/10"
                                        />
                                        {(() => {
                                            const isLastVisiblePhoto = index === photosToShow.length - 1;

                                            if (isLastVisiblePhoto && remainingPhotos > 0) {
                                                return (
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                        <CarIcon className="w-8 h-8 mb-2" />
                                                        <span className="text-lg font-semibold">
                                                            +{remainingPhotos} mai multe
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            return null;
                                        })()}
                                    </div>
                                ));
                            })()
                        ) : (
                            carWithImages.image_url ? (
                                <img
                                    src={carWithImages.image_url}
                                    alt={carWithImages.make + ' ' + carWithImages.model}
                                    className="w-full h-56 object-cover object-center bg-black/10"
                                />
                            ) : (
                                <div className="w-full h-56 bg-black/10 flex flex-col items-center justify-center text-gray-300 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.03]"
                                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center mb-3 shadow-sm border border-white/10">
                                            <CarIcon className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fără fotografii</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />

                    {/* Availability Badge */}
                    {getAvailabilityBadge()}

                    {/* Photo Navigation Lines */}
                    {carWithImages.photo_gallery && carWithImages.photo_gallery.length > 1 && (
                        <div className="absolute bottom-3 left-0 right-0 flex justify-center space-x-1 px-4">
                            {Array.from({ length: Math.min(carWithImages.photo_gallery.length, 5) }).map((_, index) => (
                                <div
                                    key={index}
                                    className={`flex-1 h-0.5 rounded-full transition-colors duration-200 ${index === activePhotoIndex
                                        ? 'bg-white/90'
                                        : 'bg-white/30'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1 cursor-pointer" onClick={(e) => {
                    // Don't navigate if clicking on the rent button or its children
                    if (e.target instanceof HTMLElement && e.target.closest('button')) {
                        return;
                    }
                    handleViewCarDetails(carWithImages);
                }}>
                    {/* Car Name and Year */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white group-hover:text-gray-300 transition-colors duration-300">
                                {carWithImages.make} {carWithImages.model}
                            </h3>
                            <span className="text-lg font-bold text-gray-300">
                                {carWithImages.year}
                            </span>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                <Users className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">{carWithImages.seats} locuri</span>
                        </div>

                        {/* Transmission */}
                        <div className="flex items-center justify-end gap-2 text-gray-300">
                            <span className="text-sm font-medium">
                                {(() => {
                                    const trans = carWithImages.transmission?.trim() || '';
                                    if (trans.toLowerCase() === 'automatic' || trans === 'Automatic') {
                                        return 'Automată';
                                    }
                                    if (trans.toLowerCase() === 'manual' || trans === 'Manual') {
                                        return 'Manuală';
                                    }
                                    return trans || 'Automată';
                                })()}
                            </span>
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                {renderTransmissionIcon(carWithImages.transmission || 'Automatic')}
                            </div>
                        </div>

                        {/* Fuel Type */}
                        <div className="flex items-center gap-2 text-gray-300">
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                {/* @ts-ignore */}
                                <FaGasPump className="w-4 h-4 text-gray-300" />
                            </div>
                            <span className="text-sm font-medium">
                                {carWithImages.fuel_type === 'gasoline' ? 'Benzină' :
                                    carWithImages.fuel_type === 'diesel' ? 'Diesel' :
                                        carWithImages.fuel_type === 'petrol' ? t('car.fuel.benzina') :
                                            carWithImages.fuel_type === 'hybrid' ? 'Hibrid' :
                                                carWithImages.fuel_type === 'electric' ? 'Electric' : carWithImages.fuel_type}
                            </span>
                        </div>

                        {/* Body Type */}
                        <div className="flex items-center justify-end gap-2 text-gray-300">
                            <span className="text-sm font-medium capitalize">{carWithImages.body}</span>
                            <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                                {/* @ts-ignore */}
                                <TbCar4WdFilled className="w-4 h-4 text-gray-300" />
                            </div>
                        </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        {(() => {
                            const basePrice = carWithImages.price_over_30_days || 0;
                            const discount = (carWithImages as any).discount_percentage || 0;
                            const finalPrice = discount > 0
                                ? basePrice * (1 - discount / 100)
                                : basePrice;

                            return (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-lg font-bold text-white">{formatPrice(finalPrice, getSelectedCurrency(), i18n.language)}</span>
                                        <span className="text-gray-400 text-sm">/zi</span>
                                    </div>
                                    {discount > 0 && (
                                        <span className="text-sm text-red-300 line-through font-semibold decoration-red-400/60 md:hidden">{formatPrice(basePrice, getSelectedCurrency(), i18n.language)}</span>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Rent Button */}
                        <button
                            onClick={() => handleOpenModal(carWithImages)}
                            // disabled={carWithImages.status !== 'available'}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-semibold bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5`}
                        >
                            Închiriază
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderTransmissionIcon = (transmission: string | undefined) => {
        if (!transmission) return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
        switch (transmission.toLowerCase()) {
            case 'automatic':
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
            case 'manual':
                return React.createElement(TbManualGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
            default:
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-400" });
        }
    };


    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">All Cars</h2>
            </div>



            {loading ? (
                <LoadingState message='Loading cars...' />
            ) : (
                <>
                    {/* Cars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {cars.length > 0 ? (
                            cars.map((car) => (
                                <CarCard
                                    key={car.id}
                                    car={car}
                                    availabilityData={carsAvailability.get(car.id.toString())}
                                    imageData={carsImages.get(car.id.toString())}
                                />
                            ))
                        ) : (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={<CarIcon className="w-12 h-12 text-gray-400" />}
                                    title="No cars found"
                                    subtitle="No cars are available at the moment"
                                />
                            </div>
                        )}
                    </div>

                    {/* Modern Pagination */}
                    {totalCars > pageSize && (
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-6 border-t border-white/10 mt-8">
                            <div className="text-gray-400 text-sm">
                                Showing <span className="font-medium text-white">{Math.min((page - 1) * pageSize + 1, totalCars)}</span> to{' '}
                                <span className="font-medium text-white">{Math.min(page * pageSize, totalCars)}</span> of{' '}
                                <span className="font-medium text-white">{totalCars}</span> cars
                            </div>

                            <div className="flex items-center gap-1">
                                {/* Previous Button */}
                                <button
                                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={page === 1}
                                    className={`p-2 rounded-lg transition-all duration-200 ${page === 1
                                        ? "bg-white/5 text-gray-500 cursor-not-allowed opacity-50"
                                        : "bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95"
                                        }`}
                                    aria-label="Previous page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1 px-3">
                                    {(() => {
                                        const totalPages = Math.ceil(totalCars / pageSize);
                                        const pages = [];
                                        const maxVisiblePages = 5;

                                        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
                                        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

                                        // Adjust start page if we're near the end
                                        if (endPage - startPage + 1 < maxVisiblePages) {
                                            startPage = Math.max(1, endPage - maxVisiblePages + 1);
                                        }

                                        // Add pages
                                        for (let i = startPage; i <= endPage; i++) {
                                            pages.push(
                                                <button
                                                    key={i}
                                                    onClick={() => setPage(i)}
                                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${page === i
                                                        ? "bg-red-600 text-white shadow-lg"
                                                        : "bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white"
                                                        }`}
                                                >
                                                    {i}
                                                </button>
                                            );
                                        }

                                        return pages;
                                    })()}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => setPage((prev) => (prev * pageSize < totalCars ? prev + 1 : prev))}
                                    disabled={page * pageSize >= totalCars}
                                    className={`p-2 rounded-lg transition-all duration-200 ${page * pageSize >= totalCars
                                        ? "bg-white/5 text-gray-500 cursor-not-allowed opacity-50"
                                        : "bg-white/10 text-white hover:bg-white/20 hover:scale-105 active:scale-95"
                                        }`}
                                    aria-label="Next page"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Rental Request Modal */}
            {selectedCarForRental && (
                <UserCreateRentalRequestModal
                    isOpen={isRentalModalOpen}
                    onClose={handleCloseRentalModal}
                    car={selectedCarForRental}
                    initialCarId={selectedCarForRental?.id}
                />
            )}

        </div>
    );
};