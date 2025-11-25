import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import {
    Star,
    Calendar,
    ChevronRight,
    Phone,
    Send,
    Clock,
    X as XIcon,
    ChevronLeft,
    Maximize2,
    Users,
    Gauge,
    Fuel,
    Zap,
    Settings
} from 'lucide-react';
import { RiGasStationLine } from "react-icons/ri";
import { TbManualGearboxFilled, TbAutomaticGearboxFilled } from "react-icons/tb";
import { LiaCarSideSolid } from 'react-icons/lia';
import { BiSolidHeart } from "react-icons/bi";
import { CarNotFound } from '../sections/CarNotFound';
import { RentalRequestModal } from '../../../components/modals/RentalRequestModal';
import { ContractSection } from '../sections/ContractSection';
import { Car } from '../../../types';
import { fetchCarById } from '../../../lib/cars';
import { fetchImagesByCarName } from '../../../lib/db/cars/cars';
import { fetchRentals, BorrowRequest } from '../../../lib/orders';
import { supabase } from '../../../lib/supabase';
import { RentalOptionsSection } from '../sections/RentalOptionsSection';

export const CarDetails: React.FC = () => {
    const { carId } = useParams<{ carId: string }>();
    const navigate = useNavigate();

    // ───── STATE ─────
    const [car, setCar] = useState<Car | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | undefined>();
    const [isFavorite, setIsFavorite] = useState(false);

    const [pickupDate, setPickupDate] = useState<string>('');
    const [returnDate, setReturnDate] = useState<string>('');
    const [pickupTime, setPickupTime] = useState<string>('');
    const [returnTime, setReturnTime] = useState<string>('');

    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);
    const [showPickupTime, setShowPickupTime] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);

    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>(() => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return { pickup: today, return: tomorrow };
    });

    const [showRentalModal, setShowRentalModal] = useState(false);
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
    const [approvedBorrowRequests, setApprovedBorrowRequests] = useState<BorrowRequest[]>([]);
    const [carRentalsForCalendar, setCarRentalsForCalendar] = useState<any[]>([]);
    const [minDaysMessage, setMinDaysMessage] = useState<string>('');
    const [isClosingWithDelay, setIsClosingWithDelay] = useState(false);
    const [pickupCalendarInitialized, setPickupCalendarInitialized] = useState(false);
    const [returnCalendarInitialized, setReturnCalendarInitialized] = useState(false);

    // ───── REFS ─────
    const pickupCalendarRef = useRef<HTMLDivElement>(null);
    const returnCalendarRef = useRef<HTMLDivElement>(null);
    const pickupTimeRef = useRef<HTMLDivElement>(null);
    const returnTimeRef = useRef<HTMLDivElement>(null);
    const imageSliderRef = useRef<Slider>(null);

    // ───── HELPERS ─────
    const getFavorites = (): number[] => {
        try {
            const favorites = localStorage.getItem('carFavorites');
            return favorites ? JSON.parse(favorites) : [];
        } catch {
            return [];
        }
    };

    const saveFavorite = (carId: number, favorite: boolean) => {
        const favorites = getFavorites();
        if (favorite) {
            if (!favorites.includes(carId)) favorites.push(carId);
        } else {
            const index = favorites.indexOf(carId);
            if (index > -1) favorites.splice(index, 1);
        }
        localStorage.setItem('carFavorites', JSON.stringify(favorites));
    };

    const handleFavoriteToggle = () => {
        if (!car) return;
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        saveFavorite(car.id, newFavoriteState);
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    // Helper function to format date as YYYY-MM-DD in local timezone (not UTC)
    const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const generateCalendarDays = (date: Date): (string | null)[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days: (string | null)[] = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            if (currentDate.getMonth() === month) {
                days.push(currentDate.toISOString().split('T')[0]);
            } else {
                days.push(null);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    const generateHours = (minHour?: number): string[] => {
        const hours: string[] = [];
        const startHour = minHour !== undefined ? minHour : 0;
        for (let h = startHour; h < 24; h++) {
            hours.push(`${String(h).padStart(2, '0')}:00`);
        }
        return hours;
    };

    // Check if a date is within an approved/executed borrow request or active rental period (for showing X overlay)
    // Check if a date/time is in a maintenance period (12 hours after rental ends)
    const isInMaintenancePeriod = (checkDate: Date, checkTime?: string): boolean => {
        if (carRentalsForCalendar.length === 0) return false;
        
        return carRentalsForCalendar.some(rental => {
            if (!rental.end_date || !rental.end_time) return false;
            
            // Parse rental end date and time
            const endDateStr = rental.end_date.includes('T')
                ? rental.end_date.split('T')[0]
                : rental.end_date.split(' ')[0];
            const rentalEndDate = new Date(endDateStr);
            
            // Parse end time
            const [endHours, endMinutes] = rental.end_time.split(':').map(Number);
            rentalEndDate.setHours(endHours || 17, endMinutes || 0, 0, 0);
            
            // Calculate maintenance period: 12 hours after rental ends
            const maintenanceEndDate = new Date(rentalEndDate);
            maintenanceEndDate.setHours(maintenanceEndDate.getHours() + 12);
            
            // If checkTime is provided, check the exact datetime
            if (checkTime) {
                const [checkHours, checkMinutes] = checkTime.split(':').map(Number);
                const checkDateTime = new Date(checkDate);
                checkDateTime.setHours(checkHours || 0, checkMinutes || 0, 0, 0);
                
                // Check if the datetime falls within maintenance period
                return checkDateTime >= rentalEndDate && checkDateTime < maintenanceEndDate;
            } else {
                // If no time provided, check if the date overlaps with maintenance period
                // Maintenance period spans from rental end to 12 hours later
                const checkDateStart = new Date(checkDate);
                checkDateStart.setHours(0, 0, 0, 0);
                const checkDateEnd = new Date(checkDate);
                checkDateEnd.setHours(23, 59, 59, 999);
                
                // Check if maintenance period overlaps with the check date
                return maintenanceEndDate > checkDateStart && rentalEndDate < checkDateEnd;
            }
        });
    };

    // Find the earliest future approved/executed rental start date
    const getEarliestFutureRentalStart = (): string | null => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let earliestStart: Date | null = null;
        
        // Check approved/executed borrow requests
        approvedBorrowRequests.forEach(request => {
            if (!request.start_date) return;
            
            const startDateStr = request.start_date.includes('T')
                ? request.start_date.split('T')[0]
                : request.start_date.split(' ')[0];
            const startDate = new Date(startDateStr + 'T00:00:00');
            startDate.setHours(0, 0, 0, 0);
            
            // Only consider future rentals
            if (startDate > today) {
                if (!earliestStart || startDate < earliestStart) {
                    earliestStart = startDate;
                }
            }
        });
        
        // Check active rentals
        carRentalsForCalendar.forEach(rental => {
            if (!rental.start_date) return;
            
            const startDateStr = rental.start_date.includes('T')
                ? rental.start_date.split('T')[0]
                : rental.start_date.split(' ')[0];
            const startDate = new Date(startDateStr + 'T00:00:00');
            startDate.setHours(0, 0, 0, 0);
            
            // Only consider future rentals
            if (startDate > today) {
                if (!earliestStart || startDate < earliestStart) {
                    earliestStart = startDate;
                }
            }
        });
        
        return earliestStart ? formatDateLocal(earliestStart) : null;
    };

    // Check if date is in an actual approved/executed request (for showing X mark)
    // Only shows X marks for current/future bookings, not past ones
    const isDateInActualApprovedRequest = (dateString: string): boolean => {
        const checkDateStr = dateString.split('T')[0];
        const checkDate = new Date(checkDateStr + 'T00:00:00');
        checkDate.setHours(0, 0, 0, 0);
        
        // Don't show X marks for past dates - only current/future bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (checkDate < today) {
            return false;
        }
        
        // Check maintenance periods (12 hours after each rental)
        // Only for current/future maintenance periods
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
                
                // Only show X if the booking is current or future (end date is today or later)
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
                
                // Only show X if the rental is current or future (end date is today or later)
                const isCurrentOrFuture = endDate >= today;
                return isCurrentOrFuture && checkDate >= startDate && checkDate <= endDate;
            });
            
            return result;
        }
        
        return false;
    };

    // Check if date is blocked by future rental limit (disable but don't show X)
    const isDateBlockedByFutureRental = (dateString: string): boolean => {
        const earliestFutureStart = getEarliestFutureRentalStart();
        return earliestFutureStart !== null && dateString >= earliestFutureStart;
    };

    // Combined check for blocking (includes both actual requests and future rental limit)
    const isDateInApprovedRequest = (dateString: string): boolean => {
        return isDateInActualApprovedRequest(dateString) || isDateBlockedByFutureRental(dateString);
    };

    // ───── EFFECTS ─────
    
    // Sync slider when image viewer opens
    useEffect(() => {
        if (showImageViewer && imageSliderRef.current) {
            imageSliderRef.current.slickGoTo(currentImageIndex);
        }
    }, [showImageViewer, currentImageIndex]);
    // Fetch car and images from storage
    useEffect(() => {
        if (!carId) {
            return;
        }
        const fetchCar = async () => {
            const fetchedCar = await fetchCarById(Number(carId));
            if (!fetchedCar) {
                return;
            }
            
            // Fetch images from storage for this car
            let carName = (fetchedCar as any).name;
            if (!carName || carName.trim() === '') {
                carName = `${fetchedCar.make} ${fetchedCar.model}`;
            }
            
            const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
            
            // Update car with images from storage
            const carWithImages = {
                ...fetchedCar,
                image_url: mainImage || fetchedCar.image_url,
                photo_gallery: photoGallery.length > 0 ? photoGallery : fetchedCar.photo_gallery,
            };
            
            setCar(carWithImages);
        };
        fetchCar();
    }, [carId, navigate]);

    // Update favorite & selected image when car loads
    useEffect(() => {
        if (car) {
            const favorites = getFavorites();
            setIsFavorite(favorites.includes(car.id));
            setSelectedImage(car.image_url || '');
        }
    }, [car]);

    // Fetch rentals and calculate next available date
    useEffect(() => {
        const fetchCarAvailability = async () => {
            if (!car || !carId) return;
            
            try {
                const rentals = await fetchRentals();
                const now = new Date();
                
                // Filter rentals for this car that are active, contract, or current/future
                const carRentals = rentals.filter(rental => {
                    const rentalCarId = typeof rental.car_id === 'number' 
                        ? rental.car_id 
                        : parseInt(rental.car_id?.toString() || '0', 10);
                    const rentalStatus = (rental as any).status || rental.rental_status || '';
                    
                    // Include ACTIVE, CONTRACT, or any rental that hasn't ended yet
                    if (rentalCarId !== car.id) return false;
                    
                    if (rentalStatus === 'ACTIVE' || rentalStatus === 'CONTRACT') {
                        return true;
                    }
                    
                    // Also include rentals that haven't ended yet (for calendar marking)
                    if (rental.end_date) {
                        const endDate = new Date(rental.end_date);
                        if (rental.end_time) {
                            const [hours, minutes] = rental.end_time.split(':').map(Number);
                            endDate.setHours(hours || 17, minutes || 0, 0, 0);
                        } else {
                            endDate.setHours(23, 59, 59, 999);
                        }
                        return endDate >= now;
                    }
                    
                    return false;
                });
                
                // Store rentals for calendar marking
                setCarRentalsForCalendar(carRentals);
            } catch (error) {
                console.error('Error fetching car availability:', error);
            }
        };
        
        fetchCarAvailability();
    }, [car, carId]);

    // Fetch approved and executed borrow requests for this car
    useEffect(() => {
        const fetchApprovedRequests = async () => {
            if (!car || !carId) return;
            
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
                // Note: Requires RLS policy allowing SELECT on APPROVED/EXECUTED status
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
                
                
                // Combine both types
                const allRequests = [...rentalRequests, ...approvedRequests];
                
                // Filter requests - only filter out ones with missing dates
                // Don't filter by date for APPROVED/EXECUTED requests - they should all show X marks
                const filteredRequests = allRequests.filter((request: any) => {
                    // Only exclude if dates are missing
                    return request.start_date && request.end_date;
                });
                
                setApprovedBorrowRequests(filteredRequests);
                
                // Calculate nextAvailableDate from combined Rentals + APPROVED requests
                // Show availability after the first booking if there's a gap of 2+ days before the next booking
                const currentTime = new Date();
                let latestReturnDate: Date | null = null;
                
                if (filteredRequests.length > 0) {
                    // Sort all requests (rentals + approved) by start date
                    const sortedRequests = [...filteredRequests].sort((a, b) => {
                        const startA = new Date(a.start_date || 0);
                        const startB = new Date(b.start_date || 0);
                        return startA.getTime() - startB.getTime();
                    });
                    
                    // Find the first current/future booking
                    for (let i = 0; i < sortedRequests.length; i++) {
                        const request = sortedRequests[i];
                        if (!request.start_date || !request.end_date) continue;
                        
                        // Parse start date
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
                        
                        // Parse end date
                        const endDateStr = request.end_date.includes('T')
                            ? request.end_date.split('T')[0]
                            : request.end_date.split(' ')[0];
                        const requestEndDate = new Date(endDateStr);
                        
                        if (request.end_time) {
                            const [hours, minutes] = request.end_time.split(':').map(Number);
                            requestEndDate.setHours(hours || 17, minutes || 0, 0, 0);
                        } else {
                            requestEndDate.setHours(17, 0, 0, 0);
                        }
                        
                        // Add 12 hours maintenance period after rental ends
                        requestEndDate.setHours(requestEndDate.getHours() + 12);
                        
                        // Check if this is a current/future booking
                        const isCurrentOrFuture = requestEndDate > currentTime;
                        
                        if (isCurrentOrFuture) {
                            // Check if there's a next booking
                            if (i < sortedRequests.length - 1) {
                                const nextRequest = sortedRequests[i + 1];
                                if (nextRequest.start_date) {
                                    const nextStartDateStr = nextRequest.start_date.includes('T')
                                        ? nextRequest.start_date.split('T')[0]
                                        : nextRequest.start_date.split(' ')[0];
                                    const nextStartDate = new Date(nextStartDateStr);
                                    
                                    if (nextRequest.start_time) {
                                        const [nextHours, nextMinutes] = nextRequest.start_time.split(':').map(Number);
                                        nextStartDate.setHours(nextHours || 9, nextMinutes || 0, 0, 0);
                                    } else {
                                        nextStartDate.setHours(9, 0, 0, 0);
                                    }
                                    
                                    // Calculate gap between end of current booking and start of next
                                    const gapMs = nextStartDate.getTime() - requestEndDate.getTime();
                                    const gapDays = gapMs / (1000 * 60 * 60 * 24);
                                    
                                    // Minimum rental is 2 days, so if gap is 2+ days, car is available after first booking
                                    if (gapDays >= 2) {
                                        latestReturnDate = requestEndDate;
                                        break; // Use first booking's end date
                                    }
                                    // If gap is less than 2 days, continue to check consecutive bookings
                                } else {
                                    // No next booking, use this one's end date
                                    latestReturnDate = requestEndDate;
                                    break;
                                }
                            } else {
                                // This is the last booking, use its end date
                                latestReturnDate = requestEndDate;
                                break;
                            }
                        } else {
                            // Past booking - check if it hasn't ended yet
                            if (requestEndDate > currentTime) {
                                if (!latestReturnDate || requestEndDate < latestReturnDate) {
                                    latestReturnDate = requestEndDate;
                                }
                            }
                        }
                    }
                    
                    // If we didn't find a booking with a gap, find consecutive bookings
                    if (!latestReturnDate) {
                        let consecutiveEndDate: Date | null = null;
                        
                        for (let i = 0; i < sortedRequests.length; i++) {
                            const request = sortedRequests[i];
                            if (!request.end_date) continue;
                            
                            const endDateStr = request.end_date.includes('T')
                                ? request.end_date.split('T')[0]
                                : request.end_date.split(' ')[0];
                            const requestEndDate = new Date(endDateStr);
                            
                            if (request.end_time) {
                                const [hours, minutes] = request.end_time.split(':').map(Number);
                                requestEndDate.setHours(hours || 17, minutes || 0, 0, 0);
                            } else {
                                requestEndDate.setHours(17, 0, 0, 0);
                            }
                            
                            requestEndDate.setHours(requestEndDate.getHours() + 12);
                            
                            if (i === 0) {
                                consecutiveEndDate = requestEndDate;
                            } else {
                                const prevRequest = sortedRequests[i - 1];
                                if (prevRequest.end_date) {
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
                                    
                                    prevEndDate.setHours(prevEndDate.getHours() + 12);
                                    
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
                                    
                                    const timeDiff = requestStartDate.getTime() - prevEndDate.getTime();
                                    const oneDayInMs = 24 * 60 * 60 * 1000;
                                    
                                    if (timeDiff >= 0 && timeDiff <= oneDayInMs + (60 * 60 * 1000)) {
                                        consecutiveEndDate = requestEndDate;
                                    } else {
                                        if (consecutiveEndDate && consecutiveEndDate > currentTime) {
                                            latestReturnDate = consecutiveEndDate;
                                            break;
                                        }
                                        consecutiveEndDate = requestEndDate;
                                    }
                                }
                            }
                        }
                        
                        if (consecutiveEndDate && consecutiveEndDate > currentTime) {
                            latestReturnDate = consecutiveEndDate;
                        }
                    }
                }
                
                setNextAvailableDate(latestReturnDate);
            } catch (error) {
                console.error('Error fetching approved borrow requests:', error);
            }
        };
        
        fetchApprovedRequests();
    }, [car, carId]);

    // Scroll to top on car change
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [carId, car?.image_url]);

    // Define gallery early
    const gallery = (car?.photo_gallery ?? [car?.image_url]).filter((url): url is string => typeof url === 'string' && url.length > 0);

    // Keyboard navigation for image viewer
    useEffect(() => {
        if (!showImageViewer || gallery.length === 0) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowImageViewer(false);
            } else if (e.key === 'ArrowLeft' && gallery.length > 1) {
                setCurrentImageIndex((prev) => 
                    prev > 0 ? prev - 1 : gallery.length - 1
                );
            } else if (e.key === 'ArrowRight' && gallery.length > 1) {
                setCurrentImageIndex((prev) => 
                    prev < gallery.length - 1 ? prev + 1 : 0
                );
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showImageViewer, gallery.length]);

    // Sync calendar months with selected dates
    // Check if all dates in a month are blocked (have x marks)
    const isMonthFullyBooked = (monthDate: Date, isReturnCalendar: boolean = false): boolean => {
        const days = generateCalendarDays(monthDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get only dates that belong to the current month (not null)
        const monthDays = days.filter(day => day !== null) as string[];
        
        // Check if all dates in the month are blocked
        const allBlocked = monthDays.every(dayString => {
            const todayString = formatDateLocal(today);
            // Only block dates that are strictly in the past (not today)
            const isPast = dayString < todayString;
            // Check if date is before next available date
            // Only block if nextAvailableDate is today or in the past (car is currently booked)
            // If nextAvailableDate is in the future, don't block dates before it (there's a gap)
            const isBeforeAvailable = nextAvailableDate 
                ? (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const nextAvailDate = new Date(nextAvailableDate);
                    nextAvailDate.setHours(0, 0, 0, 0);
                    const dayDate = new Date(dayString);
                    dayDate.setHours(0, 0, 0, 0);
                    // Only block if nextAvailableDate is today or past, and day is before it
                    return nextAvailDate <= today && dayDate < nextAvailDate;
                })()
                : false;
            const isInApprovedRequest = isDateInApprovedRequest(dayString);
            
            // For return calendar, also check if date is before pickup
            const isBeforePickup = isReturnCalendar && pickupDate && dayString <= pickupDate;
            
            return isPast || isBeforeAvailable || isInApprovedRequest || isBeforePickup;
        });
        
        return allBlocked && monthDays.length > 0;
    };

    useEffect(() => {
        if (pickupDate) setCalendarMonth(prev => ({ ...prev, pickup: new Date(pickupDate) }));
    }, [pickupDate]);

    useEffect(() => {
        if (returnDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(returnDate) }));
        } else if (pickupDate) {
            // Always show the same month as pickup date for return calendar
            // This ensures the calendar doesn't jump to next month when pickup is selected
            const pickup = new Date(pickupDate);
            setCalendarMonth(prev => ({ ...prev, return: new Date(pickup) }));
        }
    }, [returnDate, pickupDate]);

    // Auto-advance to next month if current month is fully booked when calendar first opens
    useEffect(() => {
        if (showPickupCalendar && !pickupCalendarInitialized) {
            if (isMonthFullyBooked(calendarMonth.pickup, false)) {
                const nextMonth = new Date(calendarMonth.pickup);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCalendarMonth(prev => ({ ...prev, pickup: nextMonth }));
            }
            setPickupCalendarInitialized(true);
        } else if (!showPickupCalendar) {
            // Reset when calendar closes so it can auto-advance again on next open
            setPickupCalendarInitialized(false);
        }
    }, [showPickupCalendar, calendarMonth.pickup, nextAvailableDate, approvedBorrowRequests, pickupCalendarInitialized]);

    useEffect(() => {
        if (showReturnCalendar && !returnCalendarInitialized) {
            if (isMonthFullyBooked(calendarMonth.return, true)) {
                const nextMonth = new Date(calendarMonth.return);
                nextMonth.setMonth(nextMonth.getMonth() + 1);
                setCalendarMonth(prev => ({ ...prev, return: nextMonth }));
            }
            setReturnCalendarInitialized(true);
        } else if (!showReturnCalendar) {
            // Reset when calendar closes so it can auto-advance again on next open
            setReturnCalendarInitialized(false);
        }
    }, [showReturnCalendar, calendarMonth.return, nextAvailableDate, approvedBorrowRequests, pickupDate, returnCalendarInitialized]);

    // Click outside for calendars & time selectors
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            // Don't close if we're in the middle of a delayed close
            if (isClosingWithDelay) return;
            
            const target = event.target as HTMLElement;
            // Check if click is on a button that toggles the calendar - if so, don't close
            const clickedButton = target.closest('button[data-calendar-toggle]');
            if (clickedButton) {
                // Don't close if clicking on the toggle button - let the button's onClick handle it
                return;
            }
            
            // Only close if clicking outside the calendar container and the calendar is open
            if (showPickupCalendar && pickupCalendarRef.current && !pickupCalendarRef.current.contains(target as Node))
                setShowPickupCalendar(false);
            if (showReturnCalendar && returnCalendarRef.current && !returnCalendarRef.current.contains(target as Node))
                setShowReturnCalendar(false);
            if (showPickupTime && pickupTimeRef.current && !pickupTimeRef.current.contains(target as Node))
                setShowPickupTime(false);
            if (showReturnTime && returnTimeRef.current && !returnTimeRef.current.contains(target as Node))
                setShowReturnTime(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [showPickupCalendar, showReturnCalendar, showPickupTime, showReturnTime, isClosingWithDelay]);

    // ───── DERIVED DATA ─────
    // gallery is defined earlier before useEffect hooks

    if (!carId || car === null) {
        // Show placeholder / not found component while loading or if invalid
        return <CarNotFound />;
    }

    // rental calculation, etc.
    const calculateRental = () => {
        if (!pickupDate || !returnDate || !pickupTime || !returnTime) return null;
        const pickupDateTime = new Date(`${pickupDate}T${pickupTime}`);
        const returnDateTime = new Date(`${returnDate}T${returnTime}`);
        const diffMs = returnDateTime.getTime() - pickupDateTime.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const days = Math.floor(diffHours / 24);
        const hours = diffHours % 24;
        
        // Minimum rental is 2 days - return null if less than 2 days
        if (days < 2) return null;

        const rentalDays = days;
        const totalDays = days + hours / 24;
        const basePricePerDay = (car as any).pricePerDay || car.price_per_day || 0;
        const carDiscount = (car as any).discount_percentage || car.discount_percentage || 0;
        const pricePerDay = carDiscount > 0 ? basePricePerDay * (1 - carDiscount / 100) : basePricePerDay;

        let basePrice = rentalDays >= 8 ? pricePerDay * 0.96 * rentalDays
            : rentalDays >= 4 ? pricePerDay * 0.98 * rentalDays
                : pricePerDay * rentalDays;

        if (hours > 0) basePrice += (hours / 24) * pricePerDay;

        const totalPrice = Math.round(basePrice);
        const finalPricePerDay = totalDays > 0 ? Math.round(totalPrice / totalDays) : pricePerDay;

        return { days, hours, pricePerDay: finalPricePerDay, totalPrice };
    };

    const rentalCalculation = calculateRental();
    const isBookingComplete = pickupDate && returnDate && pickupTime && returnTime;

    const handleBooking = () => {
        if (!isBookingComplete) return;
        setShowRentalModal(true);
    };

    // Remove duplicate gallery definition if it exists later
    // const gallery = (car?.photo_gallery ?? [car?.image_url]).filter(Boolean);

    return (
        <div id='individual-car-page' className="min-h-screen bg-gray-50">
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-12 mt-20">
                {/* Main Layout */}
                <div className="flex flex-col lg:grid lg:grid-cols-[1fr_460px] gap-12">
                    {/* LEFT: Car Details */}
                    <div className="lg:col-start-1">
                        {/* Car Title & Rating - Mobile */}
                        <div className="mb-8 lg:hidden">
                            <h1 className="text-3xl font-bold text-gray-900 mb-3">{car.make + ' ' + car.model}</h1>
                            <div className="flex items-center gap-3 text-sm">
                                <div className="flex items-center gap-1.5">
                                    <Star className="w-4 h-4 text-gray-400 fill-current" />
                                    <span className="font-semibold text-gray-900">{car.rating}</span>
                                </div>
                                <span className="text-gray-400">·</span>
                                <span className="text-gray-600">{car.reviews} recenzii</span>
                            </div>
                        </div>

                        {/* Image Gallery */}
                        <div className="relative rounded-lg overflow-hidden bg-white shadow-sm mb-6 border border-gray-200">
                            <div 
                                className="relative w-full h-[450px] md:h-[600px] overflow-hidden"
                                onTouchStart={(e) => {
                                    if (gallery.length > 1) {
                                        const touch = e.touches[0];
                                        const container = e.currentTarget;
                                        const rect = container.getBoundingClientRect();
                                        const x = touch.clientX - rect.left;
                                        const width = rect.width;
                                        const photoIndex = Math.floor((x / width) * gallery.length);
                                        const clampedIndex = Math.max(0, Math.min(photoIndex, gallery.length - 1));
                                        
                                        setCurrentImageIndex(clampedIndex);
                                        setSelectedImage(gallery[clampedIndex] || '');
                                        
                                        const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                                        if (imageContainer) {
                                            const translateX = -(clampedIndex * 100);
                                            imageContainer.style.transform = `translateX(${translateX}%)`;
                                        }
                                    }
                                }}
                                onTouchMove={(e) => {
                                    if (gallery.length > 1) {
                                        const touch = e.touches[0];
                                        const container = e.currentTarget;
                                        const rect = container.getBoundingClientRect();
                                        const x = touch.clientX - rect.left;
                                        const width = rect.width;
                                        const photoIndex = Math.floor((x / width) * gallery.length);
                                        const clampedIndex = Math.max(0, Math.min(photoIndex, gallery.length - 1));
                                        
                                        setCurrentImageIndex(clampedIndex);
                                        setSelectedImage(gallery[clampedIndex] || '');
                                        
                                        const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                                        if (imageContainer) {
                                            const translateX = -(clampedIndex * 100);
                                            imageContainer.style.transform = `translateX(${translateX}%)`;
                                        }
                                    }
                                }}
                                onMouseMove={(e) => {
                                    if (gallery.length > 1) {
                                        const container = e.currentTarget;
                                        const rect = container.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const width = rect.width;
                                        const photoIndex = Math.floor((x / width) * gallery.length);
                                        const clampedIndex = Math.max(0, Math.min(photoIndex, gallery.length - 1));
                                        
                                        setCurrentImageIndex(clampedIndex);
                                        setSelectedImage(gallery[clampedIndex] || '');
                                        
                                        const imageContainer = container.querySelector('.photo-gallery') as HTMLElement;
                                        if (imageContainer) {
                                            const translateX = -(clampedIndex * 100);
                                            imageContainer.style.transform = `translateX(${translateX}%)`;
                                        }
                                    }
                                }}
                                onClick={() => {
                                    const index = gallery.findIndex(img => img === selectedImage);
                                    setCurrentImageIndex(index >= 0 ? index : 0);
                                    setShowImageViewer(true);
                                }}
                            >
                                <div className="flex transition-transform duration-300 ease-out photo-gallery h-full">
                                    {gallery.map((photo, index) => (
                                        <div
                                            key={index}
                                            className="relative w-full h-full flex-shrink-0"
                                            style={{ minWidth: '100%' }}
                                        >
                                            <img
                                                src={photo}
                                                alt={`${car.make} ${car.model} - Photo ${index + 1}`}
                                                className="w-full h-full object-cover cursor-pointer select-none"
                                                draggable={false}
                                            />
                                </div>
                                    ))}
                                </div>
                                
                                {/* Expand Icon */}
                                <div className="absolute bottom-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 cursor-pointer z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const index = gallery.findIndex(img => img === selectedImage);
                                        setCurrentImageIndex(index >= 0 ? index : 0);
                                        setShowImageViewer(true);
                                    }}
                                    title="View fullscreen"
                                >
                                    <Maximize2 className="w-5 h-5" />
                                </div>
                            </div>

                            {/* Availability Badge */}
                            {(() => {
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
                                
                                // Check if there are any current/future bookings
                                const hasBookings = approvedBorrowRequests.length > 0 || carRentalsForCalendar.length > 0;
                                
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
                                
                                if (!availabilityText) return null;
                                
                                return (
                                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white rounded-xl px-3 py-1.5 text-xs font-normal shadow-sm flex items-center gap-1.5">
                                        <svg className="w-3 h-3 flex-shrink-0 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="whitespace-nowrap">{availabilityText}</span>
                                    </div>
                                );
                            })()}

                        </div>

                        {/* Thumbnails */}
                        {gallery.length > 1 && (
                            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-10">
                                {gallery.map((src, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            setSelectedImage(src || '');
                                            setCurrentImageIndex(i);
                                            
                                            // Update transform
                                            const imageContainer = document.querySelector('.photo-gallery') as HTMLElement;
                                            if (imageContainer) {
                                                const translateX = -(i * 100);
                                                imageContainer.style.transform = `translateX(${translateX}%)`;
                                            }
                                        }}
                                        className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedImage === src
                                            ? 'border-theme-500 ring-2 ring-theme-100'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <img
                                            src={src || ''}
                                            alt={`${car.make} ${car.model}-${i}`}
                                            className="w-full h-20 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Mobile Booking Widget - Above Specifications */}
                        <div className="lg:hidden mb-6">
                            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6">
                                {/* Price Display */}
                                <div className="mb-4">
                                    {(() => {
                                        const basePrice = (car as any).pricePerDay || car.price_per_day || 0;
                                        const discount = (car as any).discount_percentage || car.discount_percentage || 0;
                                        const finalPrice = discount > 0
                                            ? basePrice * (1 - discount / 100)
                                            : basePrice;

                                        return (
                                            <>
                                                <div className="text-4xl font-bold text-gray-900 mb-2">
                                                    {finalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MDL <span className="text-lg font-normal text-gray-600">pe zi</span>
                                                </div>
                                                {discount > 0 && (
                                                    <div className="text-sm text-gray-400 line-through mb-1">
                                                        {basePrice.toLocaleString('ro-RO')} MDL
                                                    </div>
                                                )}
                                                <div className="text-base text-gray-500">
                                                    {(finalPrice / 19.82).toFixed(2)} EUR / {(finalPrice / 17.00).toFixed(2)} USD pe zi
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Phone Button */}
                                <a
                                    href="tel:+37362000112"
                                    className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>+373 (62) 000-112</span>
                                </a>

                                {/* Telegram Button */}
                                <a
                                    href="https://t.me/Level_Auto_Rental"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Scrie-ne pe Telegram</span>
                                </a>

                                {/* Help Text */}
                                <p className="text-center text-base text-gray-500 mb-4">
                                    Ne puteți scrie sau apela, vă vom ajuta
                                </p>

                                {/* Date Inputs */}
                                <div className="grid grid-cols-[7fr_3fr] gap-3 mb-3">
                                    {/* Pickup Date */}
                                    <div className="relative" ref={pickupCalendarRef}>
                                        <button
                                            data-calendar-toggle="pickup"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setShowPickupCalendar(prev => !prev);
                                                setShowReturnCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${pickupDate
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{pickupDate ? formatDate(pickupDate) : 'Data închirierii'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[120%]"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* Instruction Message */}
                                                    <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-xs text-gray-600">
                                                            {!pickupDate 
                                                                ? 'Selectează data de început' 
                                                                : 'Clic pentru a schimba data de început'}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.pickup).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const todayString = formatDateLocal(today);
                                                            // Only block dates that are strictly in the past (not today)
                                                            const isPast = dayString < todayString;
                                                            
                                                            // Check if date is before next available date
                                                            // Only block if nextAvailableDate is today or in the past (car is currently booked)
                                                            // If nextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const nextAvailDate = new Date(nextAvailableDate);
                                                                    nextAvailDate.setHours(0, 0, 0, 0);
                                                                    const dayDate = new Date(dayString);
                                                                    dayDate.setHours(0, 0, 0, 0);
                                                                    // Only block if nextAvailableDate is today or past, and day is before it
                                                                    return nextAvailDate <= today && dayDate < nextAvailDate;
                                                                })()
                                                                : false;
                                                            const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                            // For pickup date, don't block by future rentals - allow selecting any future date
                                                            const isBlocked = isPast || isBeforeAvailable || isInActualRequest;
                                                            const isSelected = dayString === pickupDate;
                                                            // Check if this is the return date (visible in pickup calendar)
                                                            const isReturnDate = returnDate && dayString === returnDate;
                                                            // Check if date is in range between pickup and return (only if return date is selected)
                                                            const isInRange = pickupDate && returnDate && 
                                                                dayString > pickupDate && 
                                                                dayString < returnDate;

                                                            // Get message for blocked dates
                                                            const getBlockedMessage = () => {
                                                                return 'Această dată nu este disponibilă.';
                                                            };

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors relative ${
                                                                        isBlocked 
                                                                            ? 'text-gray-300 cursor-not-allowed' 
                                                                            : 'text-gray-700 cursor-pointer'
                                                                    } ${isSelected
                                                                        ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                        : isReturnDate
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : isInRange
                                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                                : !isBlocked
                                                                                    ? 'hover:bg-gray-100'
                                                                                    : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (!isBlocked) {
                                                                            // Check if pickup date is being changed (different from current selection)
                                                                            const isChangingPickupDate = pickupDate && pickupDate !== day;
                                                                            
                                                                            // If user is reselecting/changing the pickup date, clear all other inputs first
                                                                            if (isChangingPickupDate) {
                                                                                setReturnDate('');
                                                                                setPickupTime('');
                                                                                setReturnTime('');
                                                                            }
                                                                            
                                                                            setPickupDate(day);
                                                                            
                                                                            // If not changing, only clear return date if it's invalid (before pickup or less than 2 days)
                                                                            if (!isChangingPickupDate && returnDate && day >= returnDate) {
                                                                                const returnDay = new Date(returnDate);
                                                                                const pickupDay = new Date(day);
                                                                                const diffTime = returnDay.getTime() - pickupDay.getTime();
                                                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                                // Clear return date if less than 2 days
                                                                                if (diffDays < 2) {
                                                                                    setReturnDate('');
                                                                                }
                                                                            }
                                                                            // Close calendar after 0.3s delay so user can see what they clicked
                                                                            setIsClosingWithDelay(true);
                                                                            setTimeout(() => {
                                                                                setShowPickupCalendar(false);
                                                                                setIsClosingWithDelay(false);
                                                                                if (!pickupTime) {
                                                                                    setShowPickupTime(true);
                                                                                }
                                                                            }, 300);
                                                                        } else {
                                                                            // Show message for blocked dates
                                                                            alert(getBlockedMessage());
                                                                        }
                                                                    }}
                                                                    title={isBlocked ? getBlockedMessage() : ''}
                                                                >
                                                                    <span className="relative z-0">{dayDate.getDate()}</span>
                                                                    {isInActualRequest && (
                                                                        <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-base z-10 pointer-events-none" style={{ fontSize: '14px' }}>
                                                                            ✕
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="relative" ref={pickupTimeRef}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (!pickupDate) return; // Disable if pickup date not selected
                                                setShowPickupTime(prev => !prev);
                                                setShowReturnTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                            }}
                                            disabled={!pickupDate}
                                            title={!pickupDate ? 'Selectează mai întâi data de început' : ''}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                                !pickupDate
                                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : pickupTime
                                                        ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                            }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>{pickupTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {(() => {
                                                            // Calculate minimum hour if nextAvailableDate is set and matches selected date
                                                            let minHour: number | undefined = undefined;
                                                            
                                                            // Check if selected date is today - if so, start from 2 hours from now
                                                            if (pickupDate) {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const todayString = formatDateLocal(today);
                                                                
                                                                if (pickupDate === todayString) {
                                                                    // Selected date is today - start from 2 hours from now
                                                                    const now = new Date();
                                                                    const currentHour = now.getHours();
                                                                    // Calculate hour 2 hours from now
                                                                    let targetHour = currentHour + 2;
                                                                    // If current time + 2 hours exceeds 24, cap at 23
                                                                    if (targetHour >= 24) {
                                                                        targetHour = 23;
                                                                    }
                                                                    minHour = targetHour;
                                                                } else if (nextAvailableDate) {
                                                                    // Check if nextAvailableDate matches selected date
                                                                    const nextAvailableDateStr = nextAvailableDate.toISOString().split('T')[0];
                                                                    if (pickupDate === nextAvailableDateStr) {
                                                                        // Car becomes free on this date, only show hours from that time onwards
                                                                        const availableHour = nextAvailableDate.getHours();
                                                                        const availableMinutes = nextAvailableDate.getMinutes();
                                                                        // If there are minutes (e.g., 18:30), show from next hour (19:00)
                                                                        // If it's exactly on the hour (e.g., 18:00), show from that hour
                                                                        minHour = availableMinutes > 0 ? availableHour + 1 : availableHour;
                                                                    }
                                                                }
                                                            }
                                                            
                                                            // Filter out hours that are in maintenance periods
                                                            const availableHours = generateHours(minHour).filter((hour) => {
                                                                if (!pickupDate) return true;
                                                                const checkDate = new Date(pickupDate);
                                                                return !isInMaintenancePeriod(checkDate, hour);
                                                            });
                                                            
                                                            return availableHours.map((hour) => (
                                                                <button
                                                                    key={hour}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPickupTime(hour);
                                                                        // Close time picker after 0.3s delay so user can see what they clicked
                                                                        setIsClosingWithDelay(true);
                                                                        setTimeout(() => {
                                                                            setShowPickupTime(false);
                                                                            setIsClosingWithDelay(false);
                                                                            if (!returnDate) {
                                                                                setShowReturnCalendar(true);
                                                                            }
                                                                        }, 300);
                                                                    }}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${
                                                                        pickupTime === hour
                                                                            ? 'bg-theme-500 text-white font-medium'
                                                                            : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    {hour}
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[7fr_3fr] gap-3 mb-4">
                                    {/* Return Date */}
                                    <div className="relative" ref={returnCalendarRef}>
                                        <button
                                            data-calendar-toggle="return"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (!pickupDate || !pickupTime) return; // Disable if pickup date or time not selected
                                                setShowReturnCalendar(prev => !prev);
                                                setShowPickupCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            disabled={!pickupDate || !pickupTime}
                                            title={!pickupDate || !pickupTime ? (!pickupDate ? 'Selectează mai întâi data de început' : 'Selectează mai întâi ora de început') : ''}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                                !pickupDate || !pickupTime
                                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : returnDate
                                                        ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                            }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{returnDate ? formatDate(returnDate) : 'Data returnării'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-[120%]"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* Instruction Message */}
                                                    <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-xs text-gray-600">
                                                            {!pickupDate 
                                                                ? 'Selectează mai întâi data de început' 
                                                                : !returnDate
                                                                    ? 'Selectează data de returnare'
                                                                    : 'Clic pentru a schimba data de returnare'}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.return).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const todayString = formatDateLocal(today);
                                                            // Only block dates that are strictly in the past (not today)
                                                            const isPast = dayString < todayString;
                                                            
                                                            // Check if date is before next available date
                                                            // Only block if nextAvailableDate is today or in the past (car is currently booked)
                                                            // If nextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const nextAvailDate = new Date(nextAvailableDate);
                                                                    nextAvailDate.setHours(0, 0, 0, 0);
                                                                    const dayDate = new Date(dayString);
                                                                    dayDate.setHours(0, 0, 0, 0);
                                                                    // Only block if nextAvailableDate is today or past, and day is before it
                                                                    return nextAvailDate <= today && dayDate < nextAvailDate;
                                                                })()
                                                                : false;
                                                            const isBeforePickup = pickupDate && dayString <= pickupDate;
                                                            // Minimum rental is 2 days - block dates that are less than 2 days after pickup
                                                            const isLessThanMinDays = pickupDate && (() => {
                                                                const pickup = new Date(pickupDate);
                                                                const returnDay = new Date(dayString);
                                                                const diffTime = returnDay.getTime() - pickup.getTime();
                                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                return diffDays < 2;
                                                            })();
                                                            const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                            // Only block by future rental if pickup date is before the future rental start
                                                            // If pickup is after future rental, allow return dates after it too
                                                            const isBlockedByFuture = pickupDate ? (() => {
                                                                const earliestStart = getEarliestFutureRentalStart();
                                                                if (!earliestStart) return false;
                                                                
                                                                const pickupDateObj = new Date(pickupDate);
                                                                pickupDateObj.setHours(0, 0, 0, 0);
                                                                const earliestStartDate = new Date(earliestStart);
                                                                earliestStartDate.setHours(0, 0, 0, 0);
                                                                const returnDateObj = new Date(dayString);
                                                                returnDateObj.setHours(0, 0, 0, 0);
                                                                
                                                                // If pickup is after or equal to future rental start, don't block return dates
                                                                if (pickupDateObj >= earliestStartDate) {
                                                                    return false;
                                                                }
                                                                
                                                                // If pickup is before future rental start, block return dates on/after future rental start
                                                                return returnDateObj >= earliestStartDate;
                                                            })() : isDateBlockedByFutureRental(dayString);
                                                            const isBlocked = isPast || isBeforeAvailable || isBeforePickup || isInActualRequest || isBlockedByFuture;
                                                            const isSelected = dayString === returnDate;
                                                            // Check if this is the pickup date (visible in return calendar)
                                                            const isPickupDate = pickupDate && dayString === pickupDate;
                                                            // Check if date is in range between pickup and return
                                                            const isInRange = pickupDate && returnDate && 
                                                                dayString > pickupDate && 
                                                                dayString < returnDate;

                                                            // Get message for blocked dates
                                                            const getBlockedMessage = () => {
                                                                if (isBlockedByFuture) {
                                                                    const earliestStart = getEarliestFutureRentalStart();
                                                                    if (earliestStart) {
                                                                        const date = new Date(earliestStart);
                                                                        const formattedDate = date.toLocaleDateString('ro-RO', { 
                                                                            day: 'numeric', 
                                                                            month: 'long', 
                                                                            year: 'numeric' 
                                                                        });
                                                                        return `Nu puteți selecta această dată. Mașina este deja rezervată începând cu ${formattedDate}.`;
                                                                    }
                                                                }
                                                                return 'Această dată nu este disponibilă.';
                                                            };

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors relative ${
                                                                        isLessThanMinDays
                                                                            ? 'text-black opacity-50 cursor-not-allowed' 
                                                                            : isBlocked 
                                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                                : 'text-gray-700 cursor-pointer'
                                                                    } ${isSelected
                                                                        ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                        : isPickupDate
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : isInRange
                                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                                : !isBlocked && !isLessThanMinDays
                                                                                    ? 'hover:bg-gray-100'
                                                                                    : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (isLessThanMinDays) {
                                                                            setMinDaysMessage('Perioada minimă de închiriere este de 2 zile');
                                                                            setTimeout(() => setMinDaysMessage(''), 3000);
                                                                            return;
                                                                        }
                                                                        if (!isBlocked) {
                                                                            setReturnDate(day);
                                                                            // Close calendar after 0.3s delay so user can see what they clicked
                                                                            setIsClosingWithDelay(true);
                                                                            setTimeout(() => {
                                                                                setShowReturnCalendar(false);
                                                                                setIsClosingWithDelay(false);
                                                                                if (!returnTime) {
                                                                                    setShowReturnTime(true);
                                                                                }
                                                                            }, 300);
                                                                        } else {
                                                                            // Show message for blocked dates
                                                                            alert(getBlockedMessage());
                                                                        }
                                                                    }}
                                                                    title={isBlocked ? getBlockedMessage() : ''}
                                                                >
                                                                    <span className="relative z-0">{dayDate.getDate()}</span>
                                                                    {isInActualRequest && (
                                                                        <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-base z-10 pointer-events-none" style={{ fontSize: '14px' }}>
                                                                            ✕
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {minDaysMessage && (
                                                        <div className="mt-3 px-2 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                                                            <p className="text-xs text-blue-700">
                                                                {minDaysMessage}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Return Time */}
                                    <div className="relative" ref={returnTimeRef}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (!pickupDate || !pickupTime || !returnDate) return; // Disable if previous inputs not selected
                                                setShowReturnTime(prev => !prev);
                                                setShowPickupTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                            }}
                                            disabled={!pickupDate || !pickupTime || !returnDate}
                                            title={!pickupDate || !pickupTime || !returnDate ? (!pickupDate ? 'Selectează mai întâi data de început' : !pickupTime ? 'Selectează mai întâi ora de început' : 'Selectează mai întâi data de returnare') : ''}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                                !pickupDate || !pickupTime || !returnDate
                                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : returnTime
                                                        ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                            }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>{returnTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {generateHours().map((hour) => (
                                                            <button
                                                                key={hour}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReturnTime(hour);
                                                                    // Close time picker after 0.3s delay so user can see what they clicked
                                                                    setIsClosingWithDelay(true);
                                                                    setTimeout(() => {
                                                                        setShowReturnTime(false);
                                                                        setIsClosingWithDelay(false);
                                                                    }, 300);
                                                                }}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${returnTime === hour
                                                                    ? 'bg-theme-500 text-white font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {hour}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Choose Dates Button */}
                                <div className="mb-4">
                                    {isBookingComplete ? (
                                        <button
                                            onClick={handleBooking}
                                            className="w-full font-semibold py-3 px-4 rounded-xl transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer text-sm"
                                        >
                                            Închiriază
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="w-full font-semibold py-3 px-4 rounded-xl transition-colors bg-gray-200 text-gray-400 cursor-not-allowed text-sm"
                                        >
                                            Alegeți datele
                                        </button>
                                    )}
                                </div>

                                {/* Pricing Tiers */}
                                <div className="border-t border-gray-200 pt-4">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Costul închirierii</h3>

                                    <div className="space-y-3">
                                        {/* 1 day */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-base text-gray-600">De la 1 zi</span>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {car.price_per_day.toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base text-gray-600">De la 4 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-2%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.98).toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 8 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-base text-gray-600">De la 8 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-4%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.96).toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Car Specifications */}
                        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-6">
                            {/* Section Header */}
                            <div className="mb-8">
                                <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                    Specificații
                                </span>
                                <h2 className="mt-3 text-3xl font-bold text-gray-800 leading-tight">
                                    Caracteristici vehicul
                                </h2>
                            </div>
                            
                            {/* Main Specs Grid - Compact Layout */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        <Users className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Locuri</div>
                                        <div className="text-sm font-bold text-gray-800">{car.seats}</div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        {(() => {
                                            const trans = car.transmission?.trim() || '';
                                            const isManual = trans.toLowerCase() === 'manual' || trans === 'Manual';
                                            const IconComponent = isManual ? TbManualGearboxFilled : TbAutomaticGearboxFilled;
                                            return React.createElement(IconComponent as any, { className: "w-5 h-5 text-white" });
                                        })()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Transmisie</div>
                                        <div className="text-sm font-bold text-gray-800">
                                            {(() => {
                                                const trans = car.transmission?.trim() || '';
                                                if (trans.toLowerCase() === 'automatic' || trans === 'Automatic') {
                                                    return 'Automată';
                                                }
                                                if (trans.toLowerCase() === 'manual' || trans === 'Manual') {
                                                    return 'Manuală';
                                                }
                                                return trans || 'Automată';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        {React.createElement(RiGasStationLine as any, { className: "w-5 h-5 text-white" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Combustibil</div>
                                        <div className="text-sm font-bold text-gray-800">
                                            {car.fuel_type === 'gasoline' ? 'Benzină' :
                                                car.fuel_type === 'diesel' ? 'Diesel' :
                                                    car.fuel_type === 'petrol' ? 'Benzină' :
                                                        car.fuel_type === 'hybrid' ? 'Hibrid' :
                                                            car.fuel_type === 'electric' ? 'Electric' : car.fuel_type}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-300 hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 shadow-md bg-gradient-to-b from-red-500 to-red-600">
                                        {React.createElement(LiaCarSideSolid as any, { className: "w-5 h-5 text-white" })}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Caroserie</div>
                                        <div className="text-sm font-bold text-gray-800">{car.body}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Specs */}
                            {(car.power || car.acceleration || car.fuel_consumption) && (
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <h3 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide flex items-center gap-2">
                                        <Gauge className="w-4 h-4 text-gray-500" />
                                        Specificații tehnice
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {car.power && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Zap className="w-4 h-4 text-theme-600" />
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Putere</div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{car.power}</div>
                                            </div>
                                        )}
                                        {car.acceleration && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Gauge className="w-4 h-4 text-theme-600" />
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Accelerație</div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{car.acceleration}</div>
                                            </div>
                                        )}
                                        {car.fuel_consumption && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Fuel className="w-4 h-4 text-theme-600" />
                                                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Consum</div>
                                                </div>
                                                <div className="text-lg font-bold text-gray-900">{car.fuel_consumption} L/100km</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Features & Equipment */}
                        {car.features && car.features.length > 0 && (
                            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8 mb-6">
                                <div className="mb-6">
                                    <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                        Echipament
                                    </span>
                                    <h2 className="mt-3 text-3xl font-bold text-gray-800 leading-tight">
                                        Echipament inclus
                                    </h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {car.features.map((feature, i) => (
                                        <div 
                                            key={i} 
                                            className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-300 hover:shadow-md transition-all group"
                                        >
                                            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0 group-hover:scale-125 transition-transform"></div>
                                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Rental Options */}
                        <RentalOptionsSection />

                        {/* Contract Section */}
                        <ContractSection />

                    </div>

                    {/* RIGHT: Booking Widget */}
                    <aside className="hidden lg:block lg:col-start-2">
                        <div
                            className="sticky"
                            style={{ top: 'calc(6rem + env(safe-area-inset-top))' }}
                        >
                            {/* Booking Card */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                                {/* Price Display */}
                                <div className="mb-4">
                                    {(() => {
                                        const basePrice = (car as any).pricePerDay || car.price_per_day || 0;
                                        const discount = (car as any).discount_percentage || car.discount_percentage || 0;
                                        const finalPrice = discount > 0
                                            ? basePrice * (1 - discount / 100)
                                            : basePrice;

                                        return (
                                            <>
                                                <div className="text-4xl font-bold text-gray-900 mb-2">
                                                    {finalPrice.toLocaleString('ro-RO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MDL <span className="text-lg font-normal text-gray-600">pe zi</span>
                                                </div>
                                                {discount > 0 && (
                                                    <div className="text-sm text-gray-400 line-through mb-1">
                                                        {basePrice.toLocaleString('ro-RO')} MDL
                                                    </div>
                                                )}
                                                <div className="text-base text-gray-500">
                                                    {(finalPrice / 19.82).toFixed(2)} EUR / {(finalPrice / 17.00).toFixed(2)} USD pe zi
                                                </div>
                                            </>
                                        );
                                    })()}
                                </div>

                                {/* Title */}
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                    Închiriere {car.make} {car.model}, {car.year} an
                                </h2>

                                {/* Phone Button */}
                                <a
                                    href="tel:+37362000112"
                                    className="flex items-center justify-center gap-3 w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Phone className="w-5 h-5" />
                                    <span>+373 (62) 000-112</span>
                                </a>

                                {/* Telegram Button */}
                                <a
                                    href="https://t.me/Level_Auto_Rental"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-3 w-full border-2 border-gray-300 hover:border-gray-400 text-gray-900 font-medium py-3.5 px-6 rounded-xl mb-3 transition-colors"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Scrie-ne pe Telegram</span>
                                </a>

                                {/* Help Text */}
                                <p className="text-center text-base text-gray-500 mb-6">
                                    Ne puteți scrie sau apela, vă vom ajuta
                                </p>

                                {/* Date Inputs */}
                                <div className="grid grid-cols-[7fr_3fr] gap-3 mb-3">
                                    {/* Pickup Date */}
                                    <div className="relative" ref={pickupCalendarRef}>
                                        <button
                                            data-calendar-toggle="pickup"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                setShowPickupCalendar(prev => !prev);
                                                setShowReturnCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${pickupDate
                                                ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                                }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{pickupDate ? formatDate(pickupDate) : 'Data primirii'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.pickup);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* Instruction Message */}
                                                    <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-xs text-gray-600">
                                                            {!pickupDate 
                                                                ? 'Selectează data de început' 
                                                                : 'Clic pentru a schimba data de început'}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.pickup).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const todayString = formatDateLocal(today);
                                                            // Only block dates that are strictly in the past (not today)
                                                            const isPast = dayString < todayString;
                                                            
                                                            // Check if date is before next available date
                                                            // Only block if nextAvailableDate is today or in the past (car is currently booked)
                                                            // If nextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const nextAvailDate = new Date(nextAvailableDate);
                                                                    nextAvailDate.setHours(0, 0, 0, 0);
                                                                    const dayDate = new Date(dayString);
                                                                    dayDate.setHours(0, 0, 0, 0);
                                                                    // Only block if nextAvailableDate is today or past, and day is before it
                                                                    return nextAvailDate <= today && dayDate < nextAvailDate;
                                                                })()
                                                                : false;
                                                            const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                            // For pickup date, don't block by future rentals - allow selecting any future date
                                                            const isBlocked = isPast || isBeforeAvailable || isInActualRequest;
                                                            const isSelected = dayString === pickupDate;
                                                            // Check if this is the return date (visible in pickup calendar)
                                                            const isReturnDate = returnDate && dayString === returnDate;
                                                            // Check if date is in range between pickup and return (only if return date is selected)
                                                            const isInRange = pickupDate && returnDate && 
                                                                dayString > pickupDate && 
                                                                dayString < returnDate;

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors relative ${
                                                                        isBlocked 
                                                                            ? 'text-gray-300 cursor-not-allowed' 
                                                                            : 'text-gray-700'
                                                                    } ${isSelected
                                                                        ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                        : isReturnDate
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : isInRange
                                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                                : !isBlocked
                                                                                    ? 'hover:bg-gray-100'
                                                                                    : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (!isBlocked) {
                                                                            // Check if pickup date is being changed (not just set for the first time)
                                                                            const isChangingPickupDate = pickupDate && pickupDate !== day;
                                                                            
                                                                            setPickupDate(day);
                                                                            
                                                                            // If user is reselecting/changing the pickup date, clear all other inputs
                                                                            if (isChangingPickupDate) {
                                                                                setReturnDate('');
                                                                                setPickupTime('');
                                                                                setReturnTime('');
                                                                            } else {
                                                                                // Only clear return date if it's invalid (before pickup or less than 2 days)
                                                                                if (returnDate && day >= returnDate) {
                                                                                    const returnDay = new Date(returnDate);
                                                                                    const pickupDay = new Date(day);
                                                                                    const diffTime = returnDay.getTime() - pickupDay.getTime();
                                                                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                                    // Clear return date if less than 2 days
                                                                                    if (diffDays < 2) {
                                                                                        setReturnDate('');
                                                                                    }
                                                                                }
                                                                            }
                                                                            // Close calendar after 0.3s delay so user can see what they clicked
                                                                            setIsClosingWithDelay(true);
                                                                            setTimeout(() => {
                                                                                setShowPickupCalendar(false);
                                                                                setIsClosingWithDelay(false);
                                                                                if (!pickupTime) {
                                                                                    setShowPickupTime(true);
                                                                                }
                                                                            }, 300);
                                                                        }
                                                                    }}
                                                                >
                                                                    <span className="relative z-0">{dayDate.getDate()}</span>
                                                                    {isInActualRequest && (
                                                                        <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-base z-10 pointer-events-none" style={{ fontSize: '14px' }}>
                                                                            ✕
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Pickup Time */}
                                    <div className="relative" ref={pickupTimeRef}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (!pickupDate) return; // Disable if pickup date not selected
                                                setShowPickupTime(prev => !prev);
                                                setShowReturnTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                            }}
                                            disabled={!pickupDate}
                                            title={!pickupDate ? 'Selectează mai întâi data de început' : ''}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                                !pickupDate
                                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : pickupTime
                                                        ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                            }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>{pickupTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showPickupTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {(() => {
                                                            // Calculate minimum hour if nextAvailableDate is set and matches selected date
                                                            let minHour: number | undefined = undefined;
                                                            
                                                            // Check if selected date is today - if so, start from 2 hours from now
                                                            if (pickupDate) {
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                const todayString = formatDateLocal(today);
                                                                
                                                                if (pickupDate === todayString) {
                                                                    // Selected date is today - start from 2 hours from now
                                                                    const now = new Date();
                                                                    const currentHour = now.getHours();
                                                                    // Calculate hour 2 hours from now
                                                                    let targetHour = currentHour + 2;
                                                                    // If current time + 2 hours exceeds 24, cap at 23
                                                                    if (targetHour >= 24) {
                                                                        targetHour = 23;
                                                                    }
                                                                    minHour = targetHour;
                                                                } else if (nextAvailableDate) {
                                                                    // Check if nextAvailableDate matches selected date
                                                                    const nextAvailableDateStr = nextAvailableDate.toISOString().split('T')[0];
                                                                    if (pickupDate === nextAvailableDateStr) {
                                                                        // Car becomes free on this date, only show hours from that time onwards
                                                                        const availableHour = nextAvailableDate.getHours();
                                                                        const availableMinutes = nextAvailableDate.getMinutes();
                                                                        // If there are minutes (e.g., 18:30), show from next hour (19:00)
                                                                        // If it's exactly on the hour (e.g., 18:00), show from that hour
                                                                        minHour = availableMinutes > 0 ? availableHour + 1 : availableHour;
                                                                    }
                                                                }
                                                            }
                                                            
                                                            // Filter out hours that are in maintenance periods
                                                            const availableHours = generateHours(minHour).filter((hour) => {
                                                                if (!pickupDate) return true;
                                                                const checkDate = new Date(pickupDate);
                                                                return !isInMaintenancePeriod(checkDate, hour);
                                                            });
                                                            
                                                            return availableHours.map((hour) => (
                                                                <button
                                                                    key={hour}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setPickupTime(hour);
                                                                        // Close time picker after 0.3s delay so user can see what they clicked
                                                                        setIsClosingWithDelay(true);
                                                                        setTimeout(() => {
                                                                            setShowPickupTime(false);
                                                                            setIsClosingWithDelay(false);
                                                                            if (!returnDate) {
                                                                                setShowReturnCalendar(true);
                                                                            }
                                                                        }, 300);
                                                                    }}
                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                    className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${
                                                                        pickupTime === hour
                                                                            ? 'bg-theme-500 text-white font-medium'
                                                                            : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                                >
                                                                    {hour}
                                                                </button>
                                                            ));
                                                        })()}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                <div className="grid grid-cols-[7fr_3fr] gap-3 mb-4">
                                    {/* Return Date */}
                                    <div className="relative" ref={returnCalendarRef}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (!pickupDate || !pickupTime) return; // Disable if pickup date or time not selected
                                                setShowReturnCalendar(!showReturnCalendar);
                                                setShowPickupCalendar(false);
                                                setShowPickupTime(false);
                                                setShowReturnTime(false);
                                            }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            disabled={!pickupDate || !pickupTime}
                                            title={!pickupDate || !pickupTime ? (!pickupDate ? 'Selectează mai întâi data de început' : 'Selectează mai întâi ora de început') : ''}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                                !pickupDate || !pickupTime
                                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : returnDate
                                                        ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                            }`}
                                        >
                                            <Calendar className="w-4 h-4" />
                                            <span>{returnDate ? formatDate(returnDate) : 'Data returnării'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnCalendar && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() - 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                            </svg>
                                                        </button>
                                                        <div className="text-sm font-medium text-gray-700">
                                                            {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                        </div>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const newDate = new Date(calendarMonth.return);
                                                                newDate.setMonth(newDate.getMonth() + 1);
                                                                setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                            }}
                                                            className="p-1 hover:bg-gray-100 rounded transition-colors"
                                                        >
                                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    {/* Instruction Message */}
                                                    <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                                        <p className="text-xs text-gray-600">
                                                            {!pickupDate 
                                                                ? 'Selectează mai întâi data de început' 
                                                                : !returnDate
                                                                    ? 'Selectează data de returnare'
                                                                    : 'Clic pentru a schimba data de returnare'}
                                                        </p>
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                        {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                            <div key={day} className="text-gray-500 font-medium">{day}</div>
                                                        ))}
                                                    </div>
                                                    <div className="grid grid-cols-7 gap-1">
                                                        {generateCalendarDays(calendarMonth.return).map((day, index) => {
                                                            if (!day) return <div key={index}></div>;

                                                            const dayDate = new Date(day);
                                                            const dayString = day;
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const todayString = formatDateLocal(today);
                                                            // Only block dates that are strictly in the past (not today)
                                                            const isPast = dayString < todayString;
                                                            
                                                            // Check if date is before next available date
                                                            // Only block if nextAvailableDate is today or in the past (car is currently booked)
                                                            // If nextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                            const isBeforeAvailable = nextAvailableDate 
                                                                ? (() => {
                                                                    const today = new Date();
                                                                    today.setHours(0, 0, 0, 0);
                                                                    const nextAvailDate = new Date(nextAvailableDate);
                                                                    nextAvailDate.setHours(0, 0, 0, 0);
                                                                    const dayDate = new Date(dayString);
                                                                    dayDate.setHours(0, 0, 0, 0);
                                                                    // Only block if nextAvailableDate is today or past, and day is before it
                                                                    return nextAvailDate <= today && dayDate < nextAvailDate;
                                                                })()
                                                                : false;
                                                            const isBeforePickup = pickupDate && dayString <= pickupDate;
                                                            // Minimum rental is 2 days - block dates that are less than 2 days after pickup
                                                            const isLessThanMinDays = pickupDate && (() => {
                                                                const pickup = new Date(pickupDate);
                                                                const returnDay = new Date(dayString);
                                                                const diffTime = returnDay.getTime() - pickup.getTime();
                                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                return diffDays < 2;
                                                            })();
                                                            const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                            // Only block by future rental if pickup date is before the future rental start
                                                            // If pickup is after future rental, allow return dates after it too
                                                            const isBlockedByFuture = pickupDate ? (() => {
                                                                const earliestStart = getEarliestFutureRentalStart();
                                                                if (!earliestStart) return false;
                                                                
                                                                const pickupDateObj = new Date(pickupDate);
                                                                pickupDateObj.setHours(0, 0, 0, 0);
                                                                const earliestStartDate = new Date(earliestStart);
                                                                earliestStartDate.setHours(0, 0, 0, 0);
                                                                const returnDateObj = new Date(dayString);
                                                                returnDateObj.setHours(0, 0, 0, 0);
                                                                
                                                                // If pickup is after or equal to future rental start, don't block return dates
                                                                if (pickupDateObj >= earliestStartDate) {
                                                                    return false;
                                                                }
                                                                
                                                                // If pickup is before future rental start, block return dates on/after future rental start
                                                                return returnDateObj >= earliestStartDate;
                                                            })() : isDateBlockedByFutureRental(dayString);
                                                            const isBlocked = isPast || isBeforeAvailable || isBeforePickup || isInActualRequest || isBlockedByFuture;
                                                            const isSelected = dayString === returnDate;
                                                            // Check if this is the pickup date (visible in return calendar)
                                                            const isPickupDate = pickupDate && dayString === pickupDate;
                                                            // Check if date is in range between pickup and return
                                                            const isInRange = pickupDate && returnDate && 
                                                                dayString > pickupDate && 
                                                                dayString < returnDate;

                                                            // Get message for blocked dates
                                                            const getBlockedMessage = () => {
                                                                if (isBlockedByFuture) {
                                                                    const earliestStart = getEarliestFutureRentalStart();
                                                                    if (earliestStart) {
                                                                        const date = new Date(earliestStart);
                                                                        const formattedDate = date.toLocaleDateString('ro-RO', { 
                                                                            day: 'numeric', 
                                                                            month: 'long', 
                                                                            year: 'numeric' 
                                                                        });
                                                                        return `Nu puteți selecta această dată. Mașina este deja rezervată începând cu ${formattedDate}.`;
                                                                    }
                                                                }
                                                                return 'Această dată nu este disponibilă.';
                                                            };

                                                            return (
                                                                <div
                                                                    key={index}
                                                                    className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors relative ${
                                                                        isLessThanMinDays
                                                                            ? 'text-black opacity-50 cursor-not-allowed' 
                                                                            : isBlocked 
                                                                                ? 'text-gray-300 cursor-not-allowed' 
                                                                                : 'text-gray-700 cursor-pointer'
                                                                    } ${isSelected
                                                                        ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                        : isPickupDate
                                                                            ? 'bg-theme-500 text-white hover:bg-theme-600 font-medium'
                                                                            : isInRange
                                                                                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                                : !isBlocked && !isLessThanMinDays
                                                                                    ? 'hover:bg-gray-100'
                                                                                    : ''
                                                                    }`}
                                                                    onClick={() => {
                                                                        if (isLessThanMinDays) {
                                                                            setMinDaysMessage('Perioada minimă de închiriere este de 2 zile');
                                                                            setTimeout(() => setMinDaysMessage(''), 3000);
                                                                            return;
                                                                        }
                                                                        if (!isBlocked) {
                                                                            setReturnDate(day);
                                                                            // Close calendar after 0.3s delay so user can see what they clicked
                                                                            setIsClosingWithDelay(true);
                                                                            setTimeout(() => {
                                                                                setShowReturnCalendar(false);
                                                                                setIsClosingWithDelay(false);
                                                                                if (!returnTime) {
                                                                                    setShowReturnTime(true);
                                                                                }
                                                                            }, 300);
                                                                        } else {
                                                                            // Show message for blocked dates
                                                                            alert(getBlockedMessage());
                                                                        }
                                                                    }}
                                                                    title={isBlocked ? getBlockedMessage() : ''}
                                                                >
                                                                    <span className="relative z-0">{dayDate.getDate()}</span>
                                                                    {isInActualRequest && (
                                                                        <span className="absolute inset-0 flex items-center justify-center text-red-600 font-bold text-base z-10 pointer-events-none" style={{ fontSize: '14px' }}>
                                                                            ✕
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    {minDaysMessage && (
                                                        <div className="mt-3 px-2 py-1.5 bg-blue-50 rounded-xl border border-blue-100">
                                                            <p className="text-xs text-blue-700">
                                                                {minDaysMessage}
                                                            </p>
                                                        </div>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Return Time */}
                                    <div className="relative" ref={returnTimeRef}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                if (!pickupDate || !pickupTime || !returnDate) return; // Disable if previous inputs not selected
                                                setShowReturnTime(prev => !prev);
                                                setShowPickupTime(false);
                                                setShowPickupCalendar(false);
                                                setShowReturnCalendar(false);
                                            }}
                                            onMouseDown={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                            }}
                                            onTouchStart={(e) => {
                                                e.stopPropagation();
                                            }}
                                            disabled={!pickupDate || !pickupTime || !returnDate}
                                            title={!pickupDate || !pickupTime || !returnDate ? (!pickupDate ? 'Selectează mai întâi data de început' : !pickupTime ? 'Selectează mai întâi ora de început' : 'Selectează mai întâi data de returnare') : ''}
                                            className={`w-full flex items-center justify-center gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                                !pickupDate || !pickupTime || !returnDate
                                                    ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                                                    : returnTime
                                                        ? 'border-gray-300 text-gray-900 hover:border-gray-400'
                                                        : 'border-gray-300 text-gray-400 hover:border-gray-400'
                                            }`}
                                        >
                                            <Clock className="w-4 h-4" />
                                            <span>{returnTime || '__ : __'}</span>
                                        </button>
                                        <AnimatePresence>
                                            {showReturnTime && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute z-50 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 max-h-[300px] overflow-y-auto w-full"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    onTouchStart={(e) => e.stopPropagation()}
                                                >
                                                    <div className="flex flex-col gap-1">
                                                        {generateHours().map((hour) => (
                                                            <button
                                                                key={hour}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setReturnTime(hour);
                                                                    // Close time picker after 0.3s delay so user can see what they clicked
                                                                    setIsClosingWithDelay(true);
                                                                    setTimeout(() => {
                                                                        setShowReturnTime(false);
                                                                        setIsClosingWithDelay(false);
                                                                    }, 300);
                                                                }}
                                                                onMouseDown={(e) => e.stopPropagation()}
                                                                className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${returnTime === hour
                                                                    ? 'bg-theme-500 text-white font-medium'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                                    }`}
                                                            >
                                                                {hour}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>

                                {/* Rental Calculation Display */}
                                {rentalCalculation && (
                                    <div className="mb-4 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                        <div className="text-sm text-gray-600 mb-2">
                                            Preț pentru {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                            {rentalCalculation.hours > 0 && `, ${rentalCalculation.hours} ${rentalCalculation.hours === 1 ? 'oră' : 'ore'}`}
                                        </div>
                                        <div className="text-2xl font-bold text-gray-900">
                                            {rentalCalculation.totalPrice.toLocaleString('ro-RO')} MDL
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">Total</span>
                                            <span className="text-lg font-bold text-gray-900">
                                                {rentalCalculation.totalPrice.toLocaleString('ro-RO')} MDL
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Choose Dates Button + Heart */}
                                <div className="flex gap-3 mb-6">
                                    {isBookingComplete ? (
                                        <button
                                            onClick={handleBooking}
                                            className="flex-1 font-semibold py-3.5 px-6 rounded-xl transition-colors bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                        >
                                            Închiriază
                                        </button>
                                    ) : (
                                        <button
                                            disabled
                                            className="flex-1 font-semibold py-3.5 px-6 rounded-xl transition-colors bg-gray-200 text-gray-400 cursor-not-allowed"
                                        >
                                            Alegeți datele
                                        </button>
                                    )}
                                    <button
                                        onClick={handleFavoriteToggle}
                                        className="w-14 h-14 flex items-center justify-center border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                                    >
                                        {React.createElement(BiSolidHeart as any, {
                                            className: `w-6 h-6 transition-all duration-300 ${isFavorite
                                                ? 'text-red-500'
                                                : 'text-gray-600 hover:text-red-500'
                                                }`
                                        })}
                                    </button>
                                </div>

                                {/* Pricing Tiers */}
                                <div className="border-t border-gray-200 pt-6">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Costul închirierii</h3>

                                    <div className="space-y-3">
                                        {/* 1 day */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-gray-600">De la 1 zi</span>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {car.price_per_day.toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 4 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">De la 4 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-2%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.98).toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* 8 days */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-600">De la 8 zile</span>
                                                <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded">-4%</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-gray-900">
                                                    {Math.round(car.price_per_day * 0.96).toLocaleString('ro-RO')} MDL <span className="text-sm font-normal text-gray-600">pe zi</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>

            </div>

            {/* Rental Request Modal */}
            {car && rentalCalculation && (
                <RentalRequestModal
                    isOpen={showRentalModal}
                    onClose={() => setShowRentalModal(false)}
                    car={car}
                    pickupDate={pickupDate}
                    returnDate={returnDate}
                    pickupTime={pickupTime}
                    returnTime={returnTime}
                    rentalCalculation={rentalCalculation}
                    approvedBorrowRequests={approvedBorrowRequests}
                    carRentalsForCalendar={carRentalsForCalendar}
                />
            )}

            {/* Image Gallery Modal - Same design as admin page */}
            {showImageViewer && createPortal(
                <AnimatePresence>
                    {showImageViewer && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[99999] flex items-center justify-center"
                            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
                            onClick={() => setShowImageViewer(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                    setShowImageViewer(false);
                                } else if (e.key === 'ArrowLeft' && gallery.length > 1) {
                                    const prevIndex = currentImageIndex > 0 ? currentImageIndex - 1 : gallery.length - 1;
                                    setCurrentImageIndex(prevIndex);
                                    imageSliderRef.current?.slickGoTo(prevIndex);
                                } else if (e.key === 'ArrowRight' && gallery.length > 1) {
                                    const nextIndex = currentImageIndex < gallery.length - 1 ? currentImageIndex + 1 : 0;
                                    setCurrentImageIndex(nextIndex);
                                    imageSliderRef.current?.slickGoTo(nextIndex);
                                }
                            }}
                            tabIndex={0}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full h-full flex flex-col md:items-center md:justify-center"
                                onKeyDown={(e) => e.stopPropagation()}
                            >
                                {/* Header Bar */}
                                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        {gallery.length > 1 && (
                                            <span className="text-white/70 text-sm font-medium">
                                                {currentImageIndex + 1} of {gallery.length}
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowImageViewer(false)}
                                        className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors"
                                    >
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main Image Display with smooth slider */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-2 relative">
                                    {gallery.length > 0 && (
                                        <div className="w-full h-full max-w-full max-h-[75vh] flex items-center justify-center md:max-w-6xl md:mx-auto">
                                            <style>{`
                                                .image-viewer-slider .slick-list {
                                                    height: 100%;
                                                    overflow: visible;
                                                }
                                                .image-viewer-slider .slick-track {
                                                    height: 100%;
                                                    display: flex;
                                                    align-items: center;
                                                    transition: transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
                                                }
                                                .image-viewer-slider .slick-slide {
                                                    height: auto;
                                                    transition: opacity 0.3s ease;
                                                    padding: 0 10px;
                                                }
                                                @media (min-width: 768px) {
                                                    .image-viewer-slider .slick-slide {
                                                        padding: 0 5px;
                                                    }
                                                }
                                                .image-viewer-slider .slick-slide > div {
                                                    height: 100%;
                                                    display: flex;
                                                    align-items: center;
                                                    justify-content: center;
                                                    width: 100%;
                                                }
                                                .image-viewer-slider .slick-arrow {
                                                    display: none !important;
                                                }
                                                @media (min-width: 768px) {
                                                    .image-viewer-slider .slick-slide > div {
                                                        justify-content: center !important;
                                                    }
                                                }
                                            `}</style>
                                            <Slider
                                                ref={imageSliderRef}
                                                initialSlide={currentImageIndex}
                                                afterChange={(index) => setCurrentImageIndex(index)}
                                                infinite={gallery.length > 1}
                                                speed={400}
                                                slidesToShow={1}
                                                slidesToScroll={1}
                                                swipeToSlide={true}
                                                touchMove={true}
                                                draggable={true}
                                                fade={false}
                                                arrows={false}
                                                cssEase="cubic-bezier(0.25, 0.46, 0.45, 0.94)"
                                                useCSS={true}
                                                useTransform={true}
                                                className="image-viewer-slider w-full h-full md:w-full"
                                            >
                                                {gallery
                                                    .filter((url): url is string => typeof url === 'string' && url.length > 0)
                                                    .map((url, index) => (
                                                        <div key={index} className="flex items-center justify-center h-full w-full">
                                                            <img
                                                                src={url}
                                                                alt={`${car.make} ${car.model} - Image ${index + 1}`}
                                                                className="max-w-full max-h-[75vh] object-contain rounded-xl select-none md:max-w-[90vw]"
                                                                style={{ margin: '0 auto' }}
                                                                draggable={false}
                                                            />
                                                        </div>
                                                    ))}
                                            </Slider>
                                        </div>
                                    )}
                                </div>

                                {/* Photo Grid */}
                                {gallery.length > 1 && (
                                    <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
                                        <div className="px-6 py-4 md:px-3 md:py-2">
                                            <div className="grid grid-cols-6 gap-3 md:gap-1.5 max-w-4xl mx-auto">
                                                {gallery.map((url, index) => (
                                                    <button
                                                        key={index}
                                                        onClick={() => setCurrentImageIndex(index)}
                                                        className={`relative transition-all ${currentImageIndex === index
                                                            ? 'opacity-100'
                                                            : 'opacity-50 hover:opacity-80'
                                                            }`}
                                                    >
                                                        <img
                                                            src={url}
                                                            alt={`Thumbnail ${index + 1}`}
                                                            className={`w-full h-20 object-cover rounded-lg transition-all ${currentImageIndex === index
                                                                ? 'border-2 border-white'
                                                                : 'border border-white/20'
                                                                }`}
                                                        />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};
