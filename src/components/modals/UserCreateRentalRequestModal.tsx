import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Calendar,
    Clock,
    Save,
    CheckCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Car as CarType, User } from '../../types';
import { OrderDisplay } from '../../lib/orders';
import { getLoggedUser } from '../../lib/db/user/profile';
import { OptionsState, RentalOption, rentalOptions } from '../../constants/rentalOptions';
import { OptionItem } from '../dashboard/user/orders-requests/OptionItem';
import { CarsFilterList } from '../dashboard/user-dashboard/orders/CarsSection';
import { createUserBorrowRequest } from '../../lib/orders';


// Country codes for phone selector
const COUNTRY_CODES = [
    { code: '+373', flag: '🇲🇩', country: 'Moldova' },
    { code: '+40', flag: '🇷🇴', country: 'Romania' },
    { code: '+380', flag: '🇺🇦', country: 'Ukraine' },
    { code: '+7', flag: '🇷🇺', country: 'Russia' },
    { code: '+1', flag: '🇺🇸', country: 'USA' },
    { code: '+44', flag: '🇬🇧', country: 'UK' },
    { code: '+49', flag: '🇩🇪', country: 'Germany' },
    { code: '+33', flag: '🇫🇷', country: 'France' },
    { code: '+39', flag: '🇮🇹', country: 'Italy' },
    { code: '+34', flag: '🇪🇸', country: 'Spain' },
    { code: '+32', flag: '🇧🇪', country: 'Belgium' },
    { code: '+31', flag: '🇳🇱', country: 'Netherlands' },
    { code: '+41', flag: '🇨🇭', country: 'Switzerland' },
    { code: '+43', flag: '🇦🇹', country: 'Austria' },
    { code: '+48', flag: '🇵🇱', country: 'Poland' },
    { code: '+420', flag: '🇨🇿', country: 'Czech Republic' },
    { code: '+36', flag: '🇭🇺', country: 'Hungary' },
    { code: '+359', flag: '🇧🇬', country: 'Bulgaria' },
    { code: '+30', flag: '🇬🇷', country: 'Greece' },
    { code: '+90', flag: '🇹🇷', country: 'Turkey' },
];

interface PriceSummaryResult {
    pricePerDay: number;
    rentalDays: number;
    hours: number;
    basePrice: number;
    additionalCosts: number;
    totalPrice: number;
    baseCarPrice: number;
}

export interface CreateRentalModalProps {
    onClose: () => void;
    car?: CarType;
    initialCarId?: string;
    propApprovedBorrowRequests?: any[];
    effectiveCarRentalsForCalendar?: any[];
    effectiveNextAvailableDate?: Date | null;
}

export const UserCreateRentalModal: React.FC<CreateRentalModalProps> = ({
    onClose,
    car,
    initialCarId,
    approvedBorrowRequests: propApprovedBorrowRequests,
    carRentalsForCalendar: propCarRentalsForCalendar,
    nextAvailableDate: propNextAvailableDate
}) => {

    const { t } = useTranslation();
    const today = new Date();
    const possbileReturnDate = new Date();
    possbileReturnDate.setDate(today.getDate() + 3);


    const [initialLoading, setInitialLoading] = useState(false);

    const [user, setUser] = useState<User | null>(null);

    const categories: RentalOption["category"][] = ["Limits", "VIP Services", "Insurance", "Additional", "Delivery"];


    const defaultFormData: Partial<OrderDisplay> & {
        firstName?: string;
        lastName?: string;
        age?: string;
        comment?: string;
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
    } = {
        customerName: '',
        firstName: user?.first_name,
        lastName: user?.last_name,
        customerEmail: user?.email || '',
        customerPhone: user?.phone_number,
        carId: initialCarId || '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        status: 'ACTIVE',
        amount: 0,
        userId: '',
        age: '',
        comment: '',
    };

    const [selectedCar, setSelectedCar] = useState<CarType | null>(car || null);


    function handleSetSelectedCar(car: CarType | null) {
        setSelectedCar(car);
        setFormData(prev => ({
            ...prev,
            carId: car ? car.id.toString() : '',
        }));
    }

    // Update selectedCar and formData when car prop changes
    useEffect(() => {
        if (car) {
            setSelectedCar(car);
            setFormData(prev => ({
                ...prev,
                carId: car.id.toString(),
            }));
        }
    }, [car]);


    useEffect(() => {
        async function loadUser() {
            setInitialLoading(true)
            const u = await getLoggedUser();
            setUser(u);
            setInitialLoading(false)
        }
        loadUser();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                customerName: `${user.first_name ?? ""} ${user.last_name ?? ""}`,
                firstName: user.first_name ?? undefined,
                lastName: user.last_name ?? undefined,
                customerEmail: user.email ?? undefined,
                customerPhone: user.phone_number ?? undefined,
                userId: user.id
            }));
        }
    }, [user]);

    // Update selectedCar when car prop changes
    useEffect(() => {
        if (car) {
            setSelectedCar(car);
            setFormData(prev => ({
                ...prev,
                carId: car.id.toString(),
            }));
        }
        // Reset success state when car changes
        setSubmitSuccess(false);
    }, [car]);

    const [formData, setFormData] = useState(defaultFormData);

    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);

    // Calendar state
    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);
    const [showPickupTime, setShowPickupTime] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>({
        pickup: today,
        return: possbileReturnDate
    });
    const [nextAvailableDateState, setNextAvailableDate] = useState<Date | null>(null);
    const [approvedBorrowRequestsState, setApprovedBorrowRequests] = useState<any[]>([]);
    const [carRentalsForCalendarState, setCarRentalsForCalendar] = useState<any[]>([]);
    const [pickupCalendarInitialized, setPickupCalendarInitialized] = useState(false);
    const [returnCalendarInitialized, setReturnCalendarInitialized] = useState(false);
    const [isClosingWithDelay, setIsClosingWithDelay] = useState(false);
    const [minDaysMessage, setMinDaysMessage] = useState<string>('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Use props if provided, otherwise use internal state
    const effectiveApprovedBorrowRequests = propApprovedBorrowRequests || approvedBorrowRequestsState;
    const effectiveCarRentalsForCalendar = propCarRentalsForCalendar || carRentalsForCalendarState;
    const effectiveNextAvailableDate = propNextAvailableDate !== undefined ? propNextAvailableDate : nextAvailableDateState;

    // Refs for click outside detection
    const pickupCalendarRef = React.useRef<HTMLDivElement>(null);
    const returnCalendarRef = React.useRef<HTMLDivElement>(null);
    const pickupTimeRef = React.useRef<HTMLDivElement>(null);
    const returnTimeRef = React.useRef<HTMLDivElement>(null);

    // Helper functions
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
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

    // Helper function to format date as YYYY-MM-DD in local timezone (not UTC)
    const formatDateLocal = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const generateHours = (minHour?: number): string[] => {
        const hours: string[] = [];
        const startHour = minHour !== undefined ? minHour : 0;
        for (let h = startHour; h < 24; h++) {
            hours.push(`${String(h).padStart(2, '0')}:00`);
        }
        return hours;
    };

    // Check if a date/time is in a maintenance period (12 hours after rental ends)
    const isInMaintenancePeriod = (checkDate: Date, checkTime?: string): boolean => {
        if (effectiveCarRentalsForCalendar.length === 0) return false;

        return effectiveCarRentalsForCalendar.some(rental => {
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
        effectiveApprovedBorrowRequests.forEach(request => {
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
        effectiveCarRentalsForCalendar.forEach(rental => {
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
        if (effectiveApprovedBorrowRequests.length > 0) {
            const result = effectiveApprovedBorrowRequests.some(request => {
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
        if (effectiveCarRentalsForCalendar.length > 0) {
            const result = effectiveCarRentalsForCalendar.some(rental => {
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
            // Only block if effectiveNextAvailableDate is today or in the past (car is currently booked)
            // If effectiveNextAvailableDate is in the future, don't block dates before it (there's a gap)
            const isBeforeAvailable = effectiveNextAvailableDate
                ? (() => {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const nextAvailDate = new Date(effectiveNextAvailableDate);
                    nextAvailDate.setHours(0, 0, 0, 0);
                    const dayDate = new Date(dayString);
                    dayDate.setHours(0, 0, 0, 0);
                    // Only block if effectiveNextAvailableDate is today or past, and day is before it
                    return nextAvailDate <= today && dayDate < nextAvailDate;
                })()
                : false;
            const isInApprovedRequest = isDateInApprovedRequest(dayString);

            // For return calendar, also check if date is before pickup
            const isBeforePickup = isReturnCalendar && formData.startDate && dayString <= formData.startDate;

            return isPast || isBeforeAvailable || isInApprovedRequest || isBeforePickup;
        });

        return allBlocked && monthDays.length > 0;
    };

    const [options, setOptions] = useState<OptionsState>({
        pickupAtAddress: false,
        returnAtAddress: false,
        unlimitedKm: false,
        speedLimitIncrease: false,
        personalDriver: false,
        priorityService: false,
        tireInsurance: false,
        childSeat: false,
        simCard: false,
        roadsideAssistance: false,
        airportDelivery: false
    });

    const calculateAmount = () => {
        if (!formData.startDate || !formData.endDate || !formData.carId || !car) return 0;

        // Calculate days and hours
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const startTime = formData.startTime || '09:00';
        const endTime = formData.endTime || '17:00';

        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMin, 0, 0);

        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHour, endMin, 0, 0);

        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;
        const rentalDays = days;
        const totalDays = days + (hours / 24);

        // Get price per day based on rental duration ranges (4-tier pricing)
        const carDiscount = car?.discount_percentage || selectedCar?.discount_percentage || 0;
        let basePricePerDay = 0;

        if (rentalDays >= 2 && rentalDays <= 4) {
            basePricePerDay = car?.price_2_4_days || selectedCar?.price_2_4_days || 0;
        } else if (rentalDays >= 5 && rentalDays <= 15) {
            basePricePerDay = car?.price_5_15_days || selectedCar?.price_5_15_days || 0;
        } else if (rentalDays >= 16 && rentalDays <= 30) {
            basePricePerDay = car?.price_16_30_days || selectedCar?.price_16_30_days || 0;
        } else if (rentalDays > 30) {
            basePricePerDay = car?.price_over_30_days || selectedCar?.price_over_30_days || 0;
        }

        const pricePerDay = carDiscount > 0
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;

        // Base price calculation using 4-tier pricing (no additional period-based discounts)
        let basePrice = pricePerDay * rentalDays;

        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }

        // Calculate additional costs from options
        let additionalCosts = 0;
        const baseCarPrice = pricePerDay;

        // Percentage-based options (calculated on totalDays)
        if (options.unlimitedKm) {
            additionalCosts += baseCarPrice * totalDays * 0.5; // 50%
        }
        if (options.speedLimitIncrease) {
            additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
        }
        if (options.tireInsurance) {
            additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
        }

        // Fixed daily costs
        if (options.personalDriver) {
            additionalCosts += 800 * rentalDays;
        }
        if (options.priorityService) {
            additionalCosts += 1000 * rentalDays;
        }
        if (options.childSeat) {
            additionalCosts += 100 * rentalDays;
        }
        if (options.simCard) {
            additionalCosts += 100 * rentalDays;
        }
        if (options.roadsideAssistance) {
            additionalCosts += 500 * rentalDays;
        }

        // Total price = base price + additional costs
        return Math.round(basePrice + additionalCosts);
    };

    function calculatePriceSummary(
        car: any,
        selectedCar: any,
        formData: any,
        options: OptionsState
    ): PriceSummaryResult | null {
        if (!car && !selectedCar) return null;

        // First, calculate rental duration to determine pricing tier
        const startDate = new Date(formData.startDate || '');
        const endDate = new Date(formData.endDate || '');
        const [startHour, startMin] = (formData.startTime || '09:00').split(':').map(Number);
        const [endHour, endMin] = (formData.endTime || '17:00').split(':').map(Number);

        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMin, 0, 0);

        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHour, endMin, 0, 0);

        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;
        const rentalDays = days;
        const totalDays = days + hours / 24;

        // Get price per day based on rental duration ranges (4-tier pricing)
        const carDiscount = car?.discount_percentage || selectedCar?.discount_percentage || 0;
        let basePricePerDay = 0;

        if (rentalDays >= 2 && rentalDays <= 4) {
            basePricePerDay = car?.price_2_4_days || selectedCar?.price_2_4_days || 0;
        } else if (rentalDays >= 5 && rentalDays <= 15) {
            basePricePerDay = car?.price_5_15_days || selectedCar?.price_5_15_days || 0;
        } else if (rentalDays >= 16 && rentalDays <= 30) {
            basePricePerDay = car?.price_16_30_days || selectedCar?.price_16_30_days || 0;
        } else if (rentalDays > 30) {
            basePricePerDay = car?.price_over_30_days || selectedCar?.price_over_30_days || 0;
        }

        const pricePerDay = carDiscount > 0
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;

        let basePrice = pricePerDay * rentalDays;

        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }

        let additionalCosts = 0;
        const baseCarPrice = pricePerDay;

        if (options.unlimitedKm) additionalCosts += baseCarPrice * totalDays * 0.5;
        if (options.speedLimitIncrease) additionalCosts += baseCarPrice * totalDays * 0.2;
        if (options.tireInsurance) additionalCosts += baseCarPrice * totalDays * 0.2;
        if (options.personalDriver) additionalCosts += 800 * rentalDays;
        if (options.priorityService) additionalCosts += 1000 * rentalDays;
        if (options.childSeat) additionalCosts += 100 * rentalDays;
        if (options.simCard) additionalCosts += 100 * rentalDays;
        if (options.roadsideAssistance) additionalCosts += 500 * rentalDays;

        const totalPrice = basePrice + additionalCosts;

        return {
            pricePerDay,
            rentalDays,
            hours,
            basePrice,
            additionalCosts,
            totalPrice,
            baseCarPrice,
        };
    }


    useEffect(() => {
        const amount = calculateAmount();
        setFormData(prev => ({ ...prev, amount }));
    }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime, formData.carId, options]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.country-code-dropdown-container')) {
                setShowCountryCodeDropdown(false);
            }
            if (pickupCalendarRef.current && !pickupCalendarRef.current.contains(event.target as Node)) {
                setShowPickupCalendar(false);
            }
            if (returnCalendarRef.current && !returnCalendarRef.current.contains(event.target as Node)) {
                setShowReturnCalendar(false);
            }
            if (pickupTimeRef.current && !pickupTimeRef.current.contains(event.target as Node)) {
                setShowPickupTime(false);
            }
            if (returnTimeRef.current && !returnTimeRef.current.contains(event.target as Node)) {
                setShowReturnTime(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryCodeDropdown]);

    // Sync calendar month with selected dates
    useEffect(() => {
        if (formData.startDate) {
            setCalendarMonth(prev => ({ ...prev, pickup: new Date(formData.startDate || '') }));
        }
    }, [formData.startDate]);

    useEffect(() => {
        if (formData.endDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(formData.endDate || '') }));
        } else if (formData.startDate) {
            const nextMonth = new Date(formData.startDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setCalendarMonth(prev => ({ ...prev, return: nextMonth }));
        }
    }, [formData.endDate, formData.startDate]);

    // Sync calendar months with selected dates (same as CarDetails)
    useEffect(() => {
        if (formData.startDate) setCalendarMonth(prev => ({ ...prev, pickup: new Date(formData.startDate || '') }));
    }, [formData.startDate]);

    useEffect(() => {
        if (formData.endDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(formData.endDate || '') }));
        } else if (formData.startDate) {
            // Always show the same month as pickup date for return calendar
            // This ensures the calendar doesn't jump to next month when pickup is selected
            const pickup = new Date(formData.startDate);
            setCalendarMonth(prev => ({ ...prev, return: new Date(pickup) }));
        }
    }, [formData.endDate, formData.startDate]);

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
    }, [showPickupCalendar, calendarMonth.pickup, effectiveNextAvailableDate, effectiveApprovedBorrowRequests, pickupCalendarInitialized]);

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
    }, [showReturnCalendar, calendarMonth.return, effectiveNextAvailableDate, effectiveApprovedBorrowRequests, formData.startDate, returnCalendarInitialized]);

    // Click outside for calendars & time selectors (same as CarDetails)
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('form data: ', formData)
        if (!formData.firstName || !formData.lastName || !formData.age || !formData.customerPhone || !formData.carId || !formData.startDate || !formData.endDate) {
            alert(t('admin.requests.fillRequiredFields'));
            return;
        }

        // Combine firstName and lastName into customerName
        const customerName = `${formData.firstName} ${formData.lastName}`;

        // Include country code in phone number
        const fullPhoneNumber = `${selectedCountryCode.code} ${formData.customerPhone}`.trim();

        // Calculate total amount
        const totalAmount = calculateAmount();

        // Prepare data with all fields including options - map to correct database column names
        const rentalData = {
            car_id: parseInt(formData.carId || '0'),
            user_id: formData.userId || '',
            start_date: formData.startDate,
            start_time: formData.startTime,
            end_date: formData.endDate,
            end_time: formData.endTime,
            status: 'PENDING',
            customer_name: customerName,
            customer_first_name: formData.firstName,
            customer_last_name: formData.lastName,
            customer_email: formData.customerEmail,
            customer_phone: fullPhoneNumber,
            customer_age: formData.age ? parseInt(formData.age) : null,
            comment: formData.comment || null,
            options: options,
            total_amount: totalAmount,
        };

        handleSaveRental(rentalData);
    };

    async function handleSaveRental(rentalData: any) {
        console.log('saving the rentals request with the following info: ', rentalData)

        try {
            const result = await createUserBorrowRequest(
                rentalData.car_id.toString(),
                rentalData.start_date,
                rentalData.start_time,
                rentalData.end_date,
                rentalData.end_time,
                rentalData.customer_first_name,
                rentalData.customer_last_name,
                rentalData.customer_email,
                rentalData.customer_phone,
                rentalData.customer_age?.toString(),
                rentalData.comment,
                rentalData.options,
                rentalData.total_amount,
                rentalData.user_id
            );

            if (result.success) {
                console.log('Borrow request created successfully:', result.requestId);
                setSubmitSuccess(true);
                // Don't close modal automatically - let user see the success message
            } else {
                console.error('Failed to create borrow request:', result.error);
                // Could show error toast here
            }
        } catch (error) {
            console.error('Error creating borrow request:', error);
        }
    }

    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
            style={{ zIndex: 10000 }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.requests.createNew')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </button>
                </div>

                {submitSuccess ? (
                    /* Success View */
                    <div className="px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                        {/* Success Message Card */}
                        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg p-6 sm:p-8">
                            <div className="mb-4">
                                <span className="text-sm font-semibold tracking-wider text-red-400 uppercase">
                                    Confirmare
                                </span>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600 flex-shrink-0">
                                    <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-white leading-tight mb-3">
                                        Cererea a fost trimisă cu succes!
                                    </h2>
                                    <p className="text-gray-300 text-base leading-relaxed">
                                        În scurt timp vă vom contacta pentru confirmare.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Close Button */}
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-8 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                                Închide
                            </button>
                        </div>
                    </div>
                ) : (
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Date de contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Prenume *
                                </label>
                                <input
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) =>
                                        setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                                    }
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none"
                                    style={{
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px',
                                    }}
                                    required
                                    disabled={initialLoading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nume *</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Vârstă *</label>
                                <input
                                    type="number"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                    min="18"
                                    max="100"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-[1] country-code-dropdown-container">
                                        <button
                                            type="button"
                                            onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                                            className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                        >
                                            <span>{selectedCountryCode.flag}</span>
                                            <span>{selectedCountryCode.code}</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {showCountryCodeDropdown && (
                                            <div className="absolute top-full left-0 mt-1 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto z-[5] min-w-[200px]" style={{ backgroundColor: '#343434' }}>
                                                {COUNTRY_CODES.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCountryCode(country);
                                                            setShowCountryCodeDropdown(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                                                    >
                                                        <span>{country.flag}</span>
                                                        <span className="flex-1 text-left">{country.country}</span>
                                                        <span className="text-gray-400">{country.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.customerPhone || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        placeholder="000 00 000"
                                        className="w-full pl-[100px] pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">E-mail (opțional)</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    placeholder={t('admin.placeholders.email')}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Car  */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                            Automobil
                        </h3>
                        {selectedCar ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-4 px-4 py-3 rounded-xl border border-white/20 bg-white/10">
                                    <div className="w-20 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-700/30 flex items-center justify-center">
                                        {selectedCar.image_url ? (
                                            <img src={selectedCar.image_url} alt={selectedCar.make} className="object-cover w-full h-full" />
                                        ) : (
                                            <span className="text-white/50 text-xs">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                        <span className="text-white font-medium text-sm">{selectedCar.make} {selectedCar.model}</span>
                                        <span className="text-gray-300 text-xs">{selectedCar.year || "Unknown Year"}</span>
                                        {selectedCar.description && <span className="text-gray-400 text-xs mt-1">{selectedCar.description}</span>}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedCar(null)}
                                        className="text-red-500 hover:text-red-400 text-sm"
                                    >
                                        Schimbă
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <CarsFilterList
                                setCar={handleSetSelectedCar}
                            />
                        )}
                    </div>

                    {/* Rental Dates */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Perioada închirierii</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pickup Date */}
                            <div className="relative" ref={pickupCalendarRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data preluării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPickupCalendar(!showPickupCalendar);
                                        setShowReturnCalendar(false);
                                        setShowPickupTime(false);
                                        setShowReturnTime(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.startDate
                                        ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                        : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{formData.startDate ? formatDate(formData.startDate) : 'Data primirii'}</span>
                                </button>
                                <AnimatePresence>
                                    {showPickupCalendar && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 min-w-[280px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.pickup);
                                                        newDate.setMonth(newDate.getMonth() - 1);
                                                        setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <div className="text-sm font-medium text-white">
                                                    {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.pickup);
                                                        newDate.setMonth(newDate.getMonth() + 1);
                                                        setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                    <div key={day} className="text-gray-400 font-medium">{day}</div>
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
                                                    // Only block if effectiveNextAvailableDate is today or in the past (car is currently booked)
                                                    // If effectiveNextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                    const isBeforeAvailable = effectiveNextAvailableDate
                                                        ? (() => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const nextAvailDate = new Date(effectiveNextAvailableDate);
                                                            nextAvailDate.setHours(0, 0, 0, 0);
                                                            const dayDate = new Date(dayString);
                                                            dayDate.setHours(0, 0, 0, 0);
                                                            // Only block if effectiveNextAvailableDate is today or past, and day is before it
                                                            return nextAvailDate <= today && dayDate < nextAvailDate;
                                                        })()
                                                        : false;
                                                    const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                    // For pickup date, don't block by future rentals - allow selecting any future date
                                                    const isBlocked = isPast || isBeforeAvailable || isInActualRequest;
                                                    const isSelected = dayString === formData.startDate;
                                                    // Check if this is the return date (visible in pickup calendar)
                                                    const isReturnDate = formData.endDate && dayString === formData.endDate;
                                                    // Check if date is in range between pickup and return (only if return date is selected)
                                                    const isInRange = formData.startDate && formData.endDate &&
                                                        dayString > formData.startDate &&
                                                        dayString < formData.endDate;

                                                    // Get message for blocked dates
                                                    const getBlockedMessage = () => {
                                                        return 'Această dată nu este disponibilă.';
                                                    };

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors relative ${isBlocked
                                                                ? 'text-gray-300 cursor-not-allowed'
                                                                : 'text-white cursor-pointer'
                                                                } ${isSelected
                                                                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                    : isReturnDate
                                                                        ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                        : isInRange
                                                                            ? 'bg-white/20 text-white hover:bg-white/30'
                                                                            : !isBlocked
                                                                                ? 'hover:bg-white/20'
                                                                                : ''
                                                                }`}
                                                            onClick={() => {
                                                                if (!isBlocked) {
                                                                    // Check if pickup date is being changed (different from current selection)
                                                                    const isChangingPickupDate = formData.startDate && formData.startDate !== day;

                                                                    // If user is reselecting/changing the pickup date, clear all other inputs first
                                                                    if (isChangingPickupDate) {
                                                                        setFormData(prev => ({ ...prev, endDate: '', startTime: '', endTime: '' }));
                                                                    }

                                                                    setFormData(prev => ({ ...prev, startDate: day }));

                                                                    // If not changing, only clear return date if it's invalid (before pickup or less than 2 days)
                                                                    if (!isChangingPickupDate && formData.endDate && day >= formData.endDate) {
                                                                        const returnDay = new Date(formData.endDate);
                                                                        const pickupDay = new Date(day);
                                                                        const diffTime = returnDay.getTime() - pickupDay.getTime();
                                                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                        // Clear return date if less than 2 days
                                                                        if (diffDays < 2) {
                                                                            setFormData(prev => ({ ...prev, endDate: '' }));
                                                                        }
                                                                    }
                                                                    // Close calendar after 0.3s delay so user can see what they clicked
                                                                    setIsClosingWithDelay(true);
                                                                    setTimeout(() => {
                                                                        setShowPickupCalendar(false);
                                                                        setIsClosingWithDelay(false);
                                                                        if (!formData.startTime) {
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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ora preluării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPickupTime(!showPickupTime);
                                        setShowReturnTime(false);
                                        setShowPickupCalendar(false);
                                        setShowReturnCalendar(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.startTime
                                        ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                        : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                        }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>{formData.startTime || '__ : __'}</span>
                                </button>
                                <AnimatePresence>
                                    {showPickupTime && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex flex-col gap-1">
                                                {(() => {
                                                    // Calculate minimum hour if effectiveNextAvailableDate is set and matches selected date
                                                    let minHour: number | undefined = undefined;

                                                    // Check if selected date is today - if so, start from 2 hours from now
                                                    if (formData.startDate) {
                                                        const today = new Date();
                                                        today.setHours(0, 0, 0, 0);
                                                        const todayString = formatDateLocal(today);

                                                        if (formData.startDate === todayString) {
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
                                                        } else if (effectiveNextAvailableDate) {
                                                            // Check if effectiveNextAvailableDate matches selected date
                                                            const effectiveNextAvailableDateStr = effectiveNextAvailableDate.toISOString().split('T')[0];
                                                            if (formData.startDate === effectiveNextAvailableDateStr) {
                                                                // Car becomes free on this date, only show hours from that time onwards
                                                                const availableHour = effectiveNextAvailableDate.getHours();
                                                                const availableMinutes = effectiveNextAvailableDate.getMinutes();
                                                                // If there are minutes (e.g., 18:30), show from next hour (19:00)
                                                                // If it's exactly on the hour (e.g., 18:00), show from that hour
                                                                minHour = availableMinutes > 0 ? availableHour + 1 : availableHour;
                                                            }
                                                        }
                                                    }

                                                    // Filter out hours that are in maintenance periods
                                                    const availableHours = generateHours(minHour).filter((hour) => {
                                                        if (!formData.startDate) return true;
                                                        const checkDate = new Date(formData.startDate);
                                                        return !isInMaintenancePeriod(checkDate, hour);
                                                    });

                                                    return availableHours.map((hour) => (
                                                        <button
                                                            key={hour}
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData(prev => ({ ...prev, startTime: hour }));
                                                                // Close time picker after 0.3s delay so user can see what they clicked
                                                                setIsClosingWithDelay(true);
                                                                setTimeout(() => {
                                                                    setShowPickupTime(false);
                                                                    setIsClosingWithDelay(false);
                                                                    if (!formData.endDate) {
                                                                        setShowReturnCalendar(true);
                                                                    }
                                                                }, 300);
                                                            }}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                            className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${formData.startTime === hour
                                                                ? 'bg-red-500 text-white font-medium'
                                                                : 'text-white hover:bg-white/20'
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

                            {/* Return Date */}
                            <div className="relative" ref={returnCalendarRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data returnării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReturnCalendar(!showReturnCalendar);
                                        setShowPickupCalendar(false);
                                        setShowPickupTime(false);
                                        setShowReturnTime(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.endDate
                                        ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                        : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                        }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{formData.endDate ? formatDate(formData.endDate) : 'Data returnării'}</span>
                                </button>
                                <AnimatePresence>
                                    {showReturnCalendar && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 min-w-[280px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.return);
                                                        newDate.setMonth(newDate.getMonth() - 1);
                                                        setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <div className="text-sm font-medium text-white">
                                                    {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.return);
                                                        newDate.setMonth(newDate.getMonth() + 1);
                                                        setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                    <div key={day} className="text-gray-400 font-medium">{day}</div>
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
                                                    // Only block if effectiveNextAvailableDate is today or in the past (car is currently booked)
                                                    // If effectiveNextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                    const isBeforeAvailable = effectiveNextAvailableDate
                                                        ? (() => {
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            const nextAvailDate = new Date(effectiveNextAvailableDate);
                                                            nextAvailDate.setHours(0, 0, 0, 0);
                                                            const dayDate = new Date(dayString);
                                                            dayDate.setHours(0, 0, 0, 0);
                                                            // Only block if effectiveNextAvailableDate is today or past, and day is before it
                                                            return nextAvailDate <= today && dayDate < nextAvailDate;
                                                        })()
                                                        : false;
                                                    const isBeforePickup = formData.startDate && dayString <= formData.startDate;
                                                    // Minimum rental is 2 days - block dates that are less than 2 days after pickup
                                                    const isLessThanMinDays = formData.startDate && (() => {
                                                        const pickup = new Date(formData.startDate);
                                                        const returnDay = new Date(dayString);
                                                        const diffTime = returnDay.getTime() - pickup.getTime();
                                                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                        return diffDays < 2;
                                                    })();
                                                    const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                    // Only block by future rental if pickup date is before the future rental start
                                                    // If pickup is after future rental, allow return dates after it too
                                                    const isBlockedByFuture = formData.startDate ? (() => {
                                                        const earliestStart = getEarliestFutureRentalStart();
                                                        if (!earliestStart) return false;

                                                        const pickupDateObj = new Date(formData.startDate);
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
                                                    const isSelected = dayString === formData.endDate;
                                                    // Check if this is the pickup date (visible in return calendar)
                                                    const isPickupDate = formData.startDate && dayString === formData.startDate;
                                                    // Check if date is in range between pickup and return
                                                    const isInRange = formData.startDate && formData.endDate &&
                                                        dayString > formData.startDate &&
                                                        dayString < formData.endDate;

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
                                                            className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors relative ${isLessThanMinDays
                                                                ? 'text-black opacity-50 cursor-not-allowed'
                                                                : isBlocked
                                                                    ? 'text-gray-300 cursor-not-allowed'
                                                                    : 'text-white cursor-pointer'
                                                                } ${isSelected
                                                                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                    : isPickupDate
                                                                        ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                        : isInRange
                                                                            ? 'bg-white/20 text-white hover:bg-white/30'
                                                                            : !isBlocked && !isLessThanMinDays
                                                                                ? 'hover:bg-white/20'
                                                                                : ''
                                                                }`}
                                                            onClick={() => {
                                                                if (isLessThanMinDays) {
                                                                    setMinDaysMessage('Perioada minimă de închiriere este de 2 zile');
                                                                    setTimeout(() => setMinDaysMessage(''), 3000);
                                                                    return;
                                                                }
                                                                if (!isBlocked) {
                                                                    setFormData(prev => ({ ...prev, endDate: day }));
                                                                    // Close calendar after 0.3s delay so user can see what they clicked
                                                                    setIsClosingWithDelay(true);
                                                                    setTimeout(() => {
                                                                        setShowReturnCalendar(false);
                                                                        setIsClosingWithDelay(false);
                                                                        if (!formData.endTime) {
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
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ora returnării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReturnTime(!showReturnTime);
                                        setShowPickupTime(false);
                                        setShowPickupCalendar(false);
                                        setShowReturnCalendar(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.endTime
                                        ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                        : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                        }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>{formData.endTime || '__ : __'}</span>
                                </button>
                                <AnimatePresence>
                                    {showReturnTime && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="grid grid-cols-2 gap-1">
                                                {generateHours().map((hour) => (
                                                    <button
                                                        key={hour}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, endTime: hour }));
                                                            setShowReturnTime(false);
                                                        }}
                                                        className={`px-3 py-2 text-xs rounded transition-colors ${formData.endTime === hour
                                                            ? 'bg-red-500 text-white font-medium'
                                                            : 'text-white hover:bg-white/20'
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
                    </div>

                    {/* Rental Options */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                            Opțiuni de închiriere
                        </h3>

                        {categories.map(category => (
                            <div key={category} className="mb-5">
                                <h4 className="text-sm font-semibold text-gray-300 mb-3">{category}</h4>
                                <div className="space-y-2">
                                    {rentalOptions
                                        .filter(option => option.category === category)
                                        .map(option => (
                                            <OptionItem
                                                key={option.id}
                                                option={option}
                                                checked={options[option.id]}
                                                onChange={(id, value) => setOptions(prev => ({ ...prev, [id]: value }))}
                                            />
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comment */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Comentariu <span className="text-gray-400 font-normal">(opțional)</span></label>
                        <textarea
                            value={formData.comment || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 resize-none"
                            placeholder="Adăugați un comentariu (opțional)"
                        />
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">Detalii preț</h3>
                        <div className="space-y-3">
                            {formData.carId && selectedCar && (() => {
                                const summary = calculatePriceSummary(car, selectedCar, formData, options);
                                if (!summary) return null;

                                return (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Preț pe zi</span>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-white font-medium">{summary.pricePerDay.toFixed(0)} MDL</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Durată</span>
                                            <span className="text-white font-medium">
                                                {summary.rentalDays} {summary.rentalDays === 1 ? 'zi' : 'zile'}{summary.hours > 0 ? `, ${summary.hours} ${summary.hours === 1 ? 'oră' : 'ore'}` : ''}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-white/10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white font-medium">Preț de bază</span>
                                                <span className="text-white font-medium">{Math.round(summary.basePrice).toLocaleString()} MDL</span>
                                            </div>
                                        </div>

                                        {summary.additionalCosts > 0 && (
                                            <>
                                                <div className="pt-3 border-t border-white/10">
                                                    <h4 className="text-sm font-bold text-white mb-3">Servicii suplimentare</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {options.unlimitedKm && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Kilometraj nelimitat</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(summary.baseCarPrice * summary.rentalDays * 0.5).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.speedLimitIncrease && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(summary.baseCarPrice * summary.rentalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.tireInsurance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(summary.baseCarPrice * summary.rentalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.personalDriver && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Șofer personal</span>
                                                                <span className="text-white font-medium">{800 * summary.rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.priorityService && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Serviciu prioritar</span>
                                                                <span className="text-white font-medium">{1000 * summary.rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.childSeat && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Scaun auto pentru copii</span>
                                                                <span className="text-white font-medium">{100 * summary.rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.simCard && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                                <span className="text-white font-medium">{100 * summary.rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.roadsideAssistance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asistență rutieră</span>
                                                                <span className="text-white font-medium">{500 * summary.rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-2 border-t border-white/10">
                                                            <div className="flex justify-between font-medium">
                                                                <span className="text-white">Total servicii</span>
                                                                <span className="text-white">{Math.round(summary.additionalCosts).toLocaleString()} MDL</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                            <span className="text-white font-bold text-lg">Total</span>
                                            <span className="text-white font-bold text-xl">{Math.round(summary.totalPrice).toLocaleString()} MDL</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 sm:px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all text-sm sm:text-base"
                        >
                            {t('admin.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 sm:px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 text-sm sm:text-base"
                        >
                            <Save className="w-4 h-4" />
                            {t('admin.requests.createRental')}
                        </button>
                    </div>
                </form>
                )}
            </motion.div>
        </motion.div>,
        document.body
    );
};

// Edit Request Modal Component
interface EditRequestModalProps {
    request: OrderDisplay;
    onSave: (updatedData: {
        car_id?: string;
        start_date?: string;
        start_time?: string;
        end_date?: string;
        end_time?: string;
        customer_name?: string;
        customer_email?: string;
        customer_phone?: string;
        customer_age?: string;
        comment?: string;
        options?: any;
    }) => void;
    onClose: () => void;
    cars: CarType[];
}

