import { motion } from 'framer-motion';
import { Leaf, Image } from 'lucide-react';
import { FaGasPump } from "react-icons/fa6";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled, TbCar4WdFilled } from "react-icons/tb";
import { PiSpeedometerFill } from "react-icons/pi";
import { BiSolidHeart } from "react-icons/bi";
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useInView } from '../../hooks/useInView';
import { Car } from '../../types';
import { fadeInUp } from '../../utils/animations';
import { Card } from '../ui/Card';
import { useNavigate } from 'react-router-dom';
import { fetchImagesByCarName } from '../../lib/db/cars/cars';
import { supabase } from '../../lib/supabase';


interface CarCardProps {
    car: Car;
    index: number;
}

export const CarCard: React.FC<CarCardProps> = ({ car, index }) => {
    const { ref, isInView } = useInView();
    const { t } = useTranslation();
    const [activePhotoIndex, setActivePhotoIndex] = useState(0);
    const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
    const [carWithImages, setCarWithImages] = useState<Car>(car);
    const [approvedBorrowRequests, setApprovedBorrowRequests] = useState<any[]>([]);
    const [carRentalsForCalendar, setCarRentalsForCalendar] = useState<any[]>([]);

    // Load favorite state from localStorage
    const getFavorites = (): number[] => {
        try {
            const favorites = localStorage.getItem('carFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    };

    const [isFavorite, setIsFavorite] = useState(() => {
        const favorites = getFavorites();
        return favorites.includes(carWithImages.id);
    });

    // Save favorites to localStorage
    const saveFavorite = (carId: number, favorite: boolean) => {
        const favorites = getFavorites();
        if (favorite) {
            if (!favorites.includes(carId)) {
                favorites.push(carId);
            }
        } else {
            const index = favorites.indexOf(carId);
            if (index > -1) {
                favorites.splice(index, 1);
            }
        }
        localStorage.setItem('carFavorites', JSON.stringify(favorites));
    };

    // Handle favorite toggle
    const handleFavoriteToggle = () => {
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        saveFavorite(carWithImages.id, newFavoriteState);
    };

    // Fetch car images from storage
    useEffect(() => {
        const fetchCarImages = async () => {
            if (!car) return;
            
            try {
                // Fetch images from storage for this car
                let carName = (car as any).name;
                if (!carName || carName.trim() === '') {
                    carName = `${car.make} ${car.model}`;
                }
                
                const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                
                // Update car with images from storage
                const updatedCar = {
                    ...car,
                    image_url: mainImage || car.image_url,
                    photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                };
                
                setCarWithImages(updatedCar);
            } catch (error) {
                console.error('Error fetching car images:', error);
                // Fallback to original car if image fetch fails
                setCarWithImages(car);
            }
        };
        
        fetchCarImages();
    }, [car]);

    // Fetch rentals and calculate next available date - same logic as CarDetails
    useEffect(() => {
        const fetchCarAvailability = async () => {
            if (!car) return;
            
            try {
                const carIdNum = typeof car.id === 'number' ? car.id : parseInt(String(car.id), 10);
                
                // Query Rentals table for all current/future rentals (not just CONTRACT/ACTIVE)
                // Get all rentals for this car, we'll filter for current/future ones
                const rentalsResult = await supabase
                    .from('Rentals')
                    .select('*')
                    .eq('car_id', carIdNum)
                    .order('created_at', { ascending: false });
                
                // Filter for rentals that are current or future (haven't ended yet)
                const now = new Date();
                const rentalsData = (rentalsResult.data || []).filter((rental: any) => {
                    if (!rental.end_date) return false;
                    
                    // Parse end date
                    const endDateStr = rental.end_date.includes('T')
                        ? rental.end_date.split('T')[0]
                        : rental.end_date.split(' ')[0];
                    const endDate = new Date(endDateStr);
                    
                    // Add end time if available
                    if (rental.end_time) {
                        const [hours, minutes] = rental.end_time.split(':').map(Number);
                        endDate.setHours(hours || 17, minutes || 0, 0, 0);
                    } else {
                        endDate.setHours(23, 59, 59, 999);
                    }
                    
                    // Include if rental hasn't ended yet
                    return endDate >= now;
                });
                
                // Query BorrowRequest table for APPROVED requests
                let approvedData: any[] = [];
                
                try {
                    const approvedResult = await supabase
                        .from('BorrowRequest')
                        .select('*')
                        .eq('car_id', carIdNum)
                        .in('status', ['APPROVED', 'EXECUTED'])
                        .order('requested_at', { ascending: false });
                    
                    if (approvedResult.data && approvedResult.data.length > 0) {
                        approvedData = approvedResult.data;
                    }
                } catch (error) {
                    // Silently fail if query doesn't work (RLS might still be blocking)
                }
                
                // Convert rentals to borrow request format
                const rentalRequests = rentalsData.map((rental: any) => ({
                    id: rental.id.toString(),
                    user_id: rental.user_id,
                    car_id: rental.car_id.toString(),
                    start_date: rental.start_date,
                    start_time: rental.start_time || '09:00:00',
                    end_date: rental.end_date,
                    end_time: rental.end_time || '17:00:00',
                    status: 'EXECUTED' as const,
                    created_at: rental.created_at,
                    updated_at: rental.updated_at,
                }));
                
                // Convert approved borrow requests to same format
                const approvedRequests = approvedData.map((req: any) => ({
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
                
                // Store for blocking logic
                setCarRentalsForCalendar(rentalRequests);
                setApprovedBorrowRequests(approvedRequests);
                
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
            } catch (error) {
                console.error('Error fetching car availability:', error);
            }
        };
        
        fetchCarAvailability();
    }, [car]);

    const navigate = useNavigate();

    const renderTransmissionIcon = (transmission: string | undefined) => {
        if (!transmission) return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
        switch (transmission.toLowerCase()) {
            case 'automatic':
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
            case 'manual':
                return React.createElement(TbManualGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
            case 'hybrid':
                return <Leaf className="w-5 h-5 text-green-500" />;
            default:
                return React.createElement(TbAutomaticGearboxFilled as any, { className: "w-5 h-5 text-gray-600" });
        }
    };

    return (
        <motion.div
            ref={ref}
            variants={fadeInUp}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            transition={{ delay: index * 0.1 }}
        >
            <Card
                className="overflow-hidden flex flex-col bg-white transition-all duration-300 border border-gray-300 group rounded-3xl !shadow-none cursor-pointer hover:-translate-y-2 hover:shadow-lg" hover={false}
            >
                {/* Image Container */}
                <div
                    className="relative overflow-hidden cursor-pointer"
                    onClick={() => navigate(`/cars/${carWithImages.id}`)}
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
                                            className="w-full h-56 object-cover object-center bg-gray-100"
                                        />
                                        {(() => {
                                            const isLastVisiblePhoto = index === photosToShow.length - 1;

                                            if (isLastVisiblePhoto && remainingPhotos > 0) {
                                                return (
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                        <Image className="w-8 h-8 mb-2" />
                                                        <span className="text-lg font-semibold">
                                                            {t('car.seeMorePhotos', { count: remainingPhotos })}
                                                        </span>
                                                    </div>
                                                );
                                            }

                                            if (isLastVisiblePhoto && remainingPhotos === 0) {
                                                return (
                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                        <Image className="w-8 h-8 mb-2" />
                                                        <span className="text-lg font-semibold">{t('car.seeCar')}</span>
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
                                    className="w-full h-56 object-cover object-center bg-gray-100"
                                />
                            ) : (
                                <div className="w-full h-56 bg-gray-50 flex flex-col items-center justify-center text-gray-300 relative overflow-hidden">
                                    <div className="absolute inset-0 opacity-[0.03]"
                                        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '16px 16px' }}>
                                    </div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-3 shadow-sm border border-gray-100">
                                            <Image className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">Fără fotografii</span>
                                    </div>
                                </div>
                            )
                        )}
                    </div>

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

                    {/* Availability Badge */}
                    {(() => {
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
                            
                            // Check active rentals (which come from EXECUTED requests)
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
                            : (carWithImages.status === 'available' || carWithImages.status === 'Available' ? 'Disponibil' : carWithImages.status || '');
                        
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
                    })()}



                    {/* Favorite Heart Icon - Top Right */}
                    <div
                        className={`absolute top-3 right-3 z-10 group/heart transition-opacity duration-300 cursor-pointer ${isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleFavoriteToggle();
                        }}
                    >
                        {React.createElement(BiSolidHeart as any, {
                            className: `transition-all duration-300 hover:scale-110 ${isFavorite
                                ? 'w-6 h-6 text-red-500'
                                : 'w-6 h-6 text-gray-400 group-hover/heart:text-red-500'
                                }`
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col justify-between flex-1" onClick={() => navigate(`/cars/${carWithImages.id}`)}>
                    {/* Car Name and Year */}
                    <div className="mb-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-gray-700 transition-colors duration-300">
                                {carWithImages.make}{' '}{carWithImages.model}
                            </h3>
                            <span className="text-lg font-bold text-gray-600">
                                {carWithImages.year}
                            </span>
                        </div>
                    </div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(PiSpeedometerFill as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                            <span className="text-sm font-medium">{t('car.mileageLimit')}</span>
                        </div>

                        {/* Transmission */}
                        <div className="flex items-center justify-end gap-2 text-gray-600">
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
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {renderTransmissionIcon(carWithImages.transmission || 'Automatic')}
                            </div>
                        </div>

                        {/* Fuel Type */}
                        <div className="flex items-center gap-2 text-gray-600">
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(FaGasPump as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                            <span className="text-sm font-medium">
                                {carWithImages.fuel_type === 'gasoline' ? 'Benzină' :
                                    carWithImages.fuel_type === 'diesel' ? 'Diesel' :
                                        carWithImages.fuel_type === 'petrol' ? 'Benzină' :
                                            carWithImages.fuel_type === 'hybrid' ? 'Hibrid' :
                                                carWithImages.fuel_type === 'electric' ? 'Electric' : carWithImages.fuel_type}
                            </span>
                        </div>

                        {/* Drivetrain */}
                        <div className="flex items-center justify-end gap-2 text-gray-600">
                            <span className="text-sm font-medium">{carWithImages.drivetrain || ''}</span>
                            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                {React.createElement(TbCar4WdFilled as any, { className: "w-4 h-4 text-gray-600" })}
                            </div>
                        </div>
                    </div>

                    {/* Price and CTA */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        {(() => {
                            const basePrice = (carWithImages as any).pricePerDay || carWithImages.price_per_day || 0;
                            const discount = (carWithImages as any).discount_percentage || carWithImages.discount_percentage || 0;
                            const finalPrice = discount > 0
                                ? basePrice * (1 - discount / 100)
                                : basePrice;

                            return (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl font-bold text-gray-800">{finalPrice.toFixed(0)} MDL</span>
                                        <span className="text-gray-500 text-sm">/zi</span>
                                    </div>
                                    {discount > 0 && (
                                        <span className="text-sm text-red-300 line-through font-semibold decoration-red-400/60">{basePrice} MDL</span>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Rating */}
                        <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900 h-6 flex items-center justify-center">{carWithImages.rating}</span>
                            <img src="/assets/star.png" alt="Rating" className="w-6 h-6 flex-shrink-0 ml-2 relative bottom-0.5" />
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
};