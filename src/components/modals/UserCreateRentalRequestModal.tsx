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
import { BorrowRequest, Car, Car as CarType, User } from '../../types';
import { getLoggedUser } from '../../lib/db/user/profile';
import { OptionsState, RentalOption, rentalOptions } from '../../constants/rentalOptions';
import { OptionItem } from '../dashboard/user/orders-requests/OptionItem';
import { CarsFilterList } from '../dashboard/user-dashboard/orders/CarsSection';
import { createUserBorrowRequest, getEarliestFutureRentalStart, isDateInActualApprovedRequest } from '../../lib/db/requests/requests';
import { getCarPrice } from '../../utils/car/pricing';
import { formatDateLocal, getDateDiffInDays } from '../../utils/date';
import { formatAmount } from '../../utils/currency';
import { fetchCarById } from '../../lib/db/cars/cars';
import { DayState } from '../../utils/calendar/calendar';
import SuccessView from './components/SuccessView';
import CustomerInfoSection from './components/CustomerInfoSection';
import CarSelectionSection from './components/CarSelectionSection';
import DateSelectionSection from './components/DateSelectionSection';
import RentalOptionsSection from './components/RentalOptionsSection';
import PriceSummarySection from './components/PriceSummarySection';


// Country codes for phone selector
export const COUNTRY_CODES = [
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

export const MINIMUM_RENTAL_DAYS = 2;

// Rental option prices (moved from inline code)
export const RENTAL_ADDON_PRICES = {
    unlimitedKm: { percentage: 0.5 }, // 50% of daily price
    speedLimitIncrease: { percentage: 0.2 }, // 20% of daily price
    tireInsurance: { percentage: 0.2 }, // 20% of daily price
    personalDriver: { fixed: 800 }, // per day
    priorityService: { fixed: 1000 }, // per day
    childSeat: { fixed: 100 }, // per day
    simCard: { fixed: 100 }, // per day
    roadsideAssistance: { fixed: 500 }, // per day
};

interface PriceSummaryResult {
    pricePerDay: number;
    rentalDays: number;
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

    const defaultFormData: BorrowRequest = {
        customer_name: '',
        customer_first_name: user?.first_name || '',
        customer_last_name: user?.last_name || '',
        customer_email: user?.email || '',
        customer_phone: user?.phone_number,
        car_id: initialCarId || '',
        start_date: '',
        start_time: '',
        end_date: '',
        end_time: '',
        status: 'APPROVED',
        total_amount: 0,
        price_per_day: '',
        user_id: '',
        comment: '',
        options: null,
        requested_at: '',
        updated_at: ''
    };

    const [selectedCar, setSelectedCar] = useState<CarType | null>(car || null);

    console.log('selected car is: ', car)
    console.log('selected car is: ', selectedCar)


    function handleSetSelectedCar(car: CarType | null) {
        setSelectedCar(car);
        setFormData(prev => ({
            ...prev,
            car_id: car ? car.id.toString() : '',
        }));
    }

    // Update selectedCar and formData when car prop changes
    useEffect(() => {
        if (car) {
            setSelectedCar(car);
            setFormData(prev => ({
                ...prev,
                car_id: car.id.toString(),
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
                customer_name: `${user.first_name || ''} ${user.last_name || ''}`,
                customer_first_name: user.first_name || '',
                customer_last_name: user.last_name || '',
                customer_email: user.email || '',
                customer_phone: user.phone_number || '',
                user_id: user.id
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

    const [formData, setFormData] = useState<BorrowRequest>(() => (defaultFormData));


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

    const handleDateChange = (type: 'start' | 'end', date: Date) => {
        const formattedDate = formatDateLocal(date);

        setFormData(prev => ({
            ...prev,
            start_date: type === 'start' ? formattedDate : prev.start_date,
            end_date: type === 'end' ? formattedDate : prev.end_date,
        }));
    };


    // Check if date is blocked by future rental
    const isDateAlreadyBooked = async (dateString: string, carId: string): Promise<boolean> => {
        const nextRentalStart = await getEarliestFutureRentalStart(dateString, carId);
        return nextRentalStart !== null;
    };


    // Combined check for blocking (includes both actual requests and future rental limit)
    const isDateInApprovedRequest = async (dateString: string): Promise<boolean> => {
        if (selectedCar === null)
            throw Error('Car not selected')
        return await isDateInActualApprovedRequest(dateString, selectedCar?.id) || isDateAlreadyBooked(dateString);
    };

    // Check if all dates in a month are blocked (have x marks)
    const isMonthFullyBooked = (monthDate: Date, isReturnCalendar: boolean = false): boolean => {
        const days = generateCalendarDays(monthDate) as string[];
        const monthDays = days.filter(Boolean) as string[];

        const allBlocked = monthDays.every(day => {
            return (
                isPastDate(day) ||
                isBeforeNextAvailable(day, effectiveNextAvailableDate) ||
                isBlockedByApprovedRequest(day) ||
                (isReturnCalendar && isBeforePickupDate(day, formData.start_date))
            );
        });

        return allBlocked && monthDays.length > 0;
    };

    const [options, setOptions] = useState({
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

    const calculateAmount = (totalDays: number, pricePerDay: number) => {
        if (!formData.start_date || !formData.end_date || !formData.car_id || !car) return 0;

        let basePrice = pricePerDay * totalDays;

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
            additionalCosts += 800 * totalDays;
        }
        if (options.priorityService) {
            additionalCosts += 1000 * totalDays;
        }
        if (options.childSeat) {
            additionalCosts += 100 * totalDays;
        }
        if (options.simCard) {
            additionalCosts += 100 * totalDays;
        }
        if (options.roadsideAssistance) {
            additionalCosts += 500 * totalDays;
        }

        const total = basePrice + additionalCosts;

        console.log('the total is: ', total)

        // optional: round to 2 decimals for storage
        return Math.round(total * 100) / 100;
    };

    function calculatePriceSummary(
        selectedCar: Car,
        formData: BorrowRequest,
        options: OptionsState
    ): PriceSummaryResult | null {
        console.log('calculating the summary price')

        if (!selectedCar) return null;


        const rentalDays = getDateDiffInDays(formData.start_date, formData.end_date);
        const pricePerDay = parseFloat(getCarPrice(rentalDays, selectedCar))


        let basePrice = pricePerDay * rentalDays;


        let additionalCosts = 0;
        const baseCarPrice = pricePerDay;

        if (options.unlimitedKm) additionalCosts += baseCarPrice * rentalDays * 0.5;
        if (options.speedLimitIncrease) additionalCosts += baseCarPrice * rentalDays * 0.2;
        if (options.tireInsurance) additionalCosts += baseCarPrice * rentalDays * 0.2;
        if (options.personalDriver) additionalCosts += 800 * rentalDays;
        if (options.priorityService) additionalCosts += 1000 * rentalDays;
        if (options.childSeat) additionalCosts += 100 * rentalDays;
        if (options.simCard) additionalCosts += 100 * rentalDays;
        if (options.roadsideAssistance) additionalCosts += 500 * rentalDays;

        const totalPrice = basePrice + additionalCosts;

        console.log('total price from price summary is: ', totalPrice)

        return {
            pricePerDay,
            rentalDays,
            basePrice,
            additionalCosts,
            totalPrice,
            baseCarPrice,
        };
    }

    // Function to get the state of a specific day
    const getDayState = (dayString: string): DayState => {

        if (selectedCar === null)
            throw Error('No car selected!')

        const dayDate = new Date(dayString)

        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const pickupDate = formData.start_date
            ? new Date(formData.start_date)
            : null

        const returnDate = formData.end_date
            ? new Date(formData.end_date)
            : null

        if (pickupDate) pickupDate.setHours(0, 0, 0, 0)
        if (returnDate) returnDate.setHours(0, 0, 0, 0)

        dayDate.setHours(0, 0, 0, 0)

        const isPast = dayDate < today

        // Already booked
        const isAlreadyBooked = isDateInActualApprovedRequest(dayString, selectedCar.id) ||
            isDateAlreadyBooked(dayString)

        // Selected
        const isSelected = dayString === formData.end_date

        // Pickup date shown in return calendar
        const isPickupDate = dayString === formData.start_date

        // Between pickup & return
        const isInRange =
            pickupDate &&
            returnDate &&
            dayDate > pickupDate &&
            dayDate < returnDate

        // Before pickup
        const isBeforePickup =
            pickupDate && dayDate <= pickupDate

        // Minimum rental 2 days
        const isLessThanMinDays = pickupDate
            ? Math.floor((dayDate.getTime() - pickupDate.getTime()) / 86400000) < 2
            : false

        // Future booking block
        const isBlockedByFuture = (() => {
            const earliestStart = getEarliestFutureRentalStart()
            if (!earliestStart || !pickupDate) return false

            const earliestStartDate = new Date(earliestStart)
            earliestStartDate.setHours(0, 0, 0, 0)

            if (pickupDate >= earliestStartDate) return false

            return dayDate >= earliestStartDate
        })()

        // Before available
        const isBeforeAvailable = effectiveNextAvailableDate
            ? (() => {
                const nextAvailDate = new Date(effectiveNextAvailableDate)
                nextAvailDate.setHours(0, 0, 0, 0)
                return nextAvailDate <= today && dayDate < nextAvailDate
            })()
            : false

        const isBlocked =
            isPast ||
            isAlreadyBooked ||
            isBlockedByFuture ||
            isBeforePickup ||
            isBeforeAvailable

        let reason = undefined

        if (isPast) reason = "Data este în trecut"
        else if (isAlreadyBooked) reason = "Data este deja rezervată"
        else if (isBlockedByFuture) {
            const earliestStart = getEarliestFutureRentalStart()
            if (earliestStart) {
                const formatted = new Date(earliestStart).toLocaleDateString('ro-RO', {
                    day: 'numeric', month: 'long', year: 'numeric'
                })
                reason = `Mașina este rezervată începând cu ${formatted}`
            }
        }
        else if (isLessThanMinDays) {
            reason = "Perioada minimă de închiriere este de 2 zile"
        }
        else if (isBeforePickup) {
            reason = "Nu puteți selecta o dată înainte de ridicare"
        }

        return {
            isBlocked,
            isAlreadyBooked,
            isInRange: Boolean(isInRange),
            isSelected,
            isPickupDate,
            isLessThanMinDays,
            reason
        }
    }

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
        if (formData.start_date) {
            setCalendarMonth(prev => ({ ...prev, pickup: new Date(formData.start_date || '') }));
        }
    }, [formData.start_date]);

    useEffect(() => {
        if (formData.end_date) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(formData.end_date || '') }));
        } else if (formData.start_date) {
            const nextMonth = new Date(formData.start_date);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setCalendarMonth(prev => ({ ...prev, return: nextMonth }));
        }
    }, [formData.end_date, formData.start_date]);

    // Sync calendar months with selected dates (same as CarDetails)
    useEffect(() => {
        if (formData.start_date) setCalendarMonth(prev => ({ ...prev, pickup: new Date(formData.start_date || '') }));
    }, [formData.start_date]);

    useEffect(() => {
        if (formData.end_date) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(formData.end_date || '') }));
        } else if (formData.start_date) {
            // Always show the same month as pickup date for return calendar
            // This ensures the calendar doesn't jump to next month when pickup is selected
            const pickup = new Date(formData.start_date);
            setCalendarMonth(prev => ({ ...prev, return: new Date(pickup) }));
        }
    }, [formData.end_date, formData.start_date]);

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
    }, [showReturnCalendar, calendarMonth.return, effectiveNextAvailableDate, effectiveApprovedBorrowRequests, formData.start_date, returnCalendarInitialized]);

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

    // Function to handle the submission of rental data
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        console.log('form data: ', formData)

        if (!formData.customer_first_name || !formData.customer_last_name || !formData.customer_phone || !formData.car_id || !formData.start_date || !formData.end_date) {
            alert(t('admin.requests.fillRequiredFields'));
            return;
        }

        // Combine firstName and lastName into customerName
        const customerName = `${formData.customer_first_name} ${formData.customer_last_name}`;

        // Include country code in phone number
        const fullPhoneNumber = `${selectedCountryCode.code} ${formData.customer_phone}`.trim();

        const rentalDays = getDateDiffInDays(formData.start_date, formData.end_date)
        const car = await fetchCarById(formData.car_id)

        if (car === null) throw Error('Car not found')

        const pricePerDay = parseFloat(getCarPrice(rentalDays, car))


        // Calculate total amount
        const totalAmount = calculateAmount(rentalDays, pricePerDay);

        // Prepare data with all fields including options - map to correct database column names
        const rentalData: BorrowRequest = {
            car_id: formData.car_id,
            user_id: formData.user_id || '',
            start_date: formData.start_date,
            start_time: formData.start_time,
            end_date: formData.end_date,
            end_time: formData.end_time,
            status: 'PENDING',
            price_per_day: pricePerDay.toString(),
            customer_name: customerName,
            customer_first_name: formData.customer_first_name,
            customer_last_name: formData.customer_last_name,
            customer_email: formData.customer_email,
            customer_phone: fullPhoneNumber,
            comment: formData.comment,
            options: options,
            requested_at: new Date().toString(),
            updated_at: new Date().toString(),
            total_amount: totalAmount,
        };

        handleSaveRental(rentalData);
    }

    // Function to save rental data
    async function handleSaveRental(rentalData: BorrowRequest) {
        console.log('saving the rentals request with the following info: ', rentalData);
        try {
            // Assuming rentalData is your form / car rental info
            const borrowRequest: BorrowRequest = {
                car_id: rentalData.car_id.toString(),
                user_id: rentalData.user_id || null,
                start_date: new Date(rentalData.start_date),
                start_time: rentalData.start_time,
                end_date: new Date(rentalData.end_date),
                end_time: rentalData.end_time,
                price_per_day: rentalData.price_per_day,
                customer_name: rentalData.customer_name,
                customer_first_name: rentalData.customer_first_name,
                customer_last_name: rentalData.customer_last_name,
                customer_email: rentalData.customer_email,
                customer_phone: rentalData.customer_phone || '',
                total_amount: Number(rentalData.total_amount), // ensure number
                options: rentalData.options, // serialize object to string
                status: 'PENDING', // default status for new requests
                requested_at: new Date().toString(),
                updated_at: new Date().toString(),
                comment: rentalData.comment || '',
            };

            const result = await createUserBorrowRequest(borrowRequest);

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

    /**
     * Handles the selection of a return date from the calendar
     * @param day - The selected date
     */
    const handleDateSelection = (day: string) => {
        const state = getDayState(day);

        if (state.isLessThanMinDays) {
            setMinDaysMessage('Perioada minimă de închiriere este de 2 zile');
            setTimeout(() => setMinDaysMessage(''), 3000);
            return;
        }

        if (!state.isBlocked) {
            setFormData(prev => ({ ...prev, end_date: day }));
            setIsClosingWithDelay(true);

            setTimeout(() => {
                setShowReturnCalendar(false);
                setIsClosingWithDelay(false);
                if (!formData.end_time) {
                    setShowReturnTime(true);
                }
            }, 300);
        } else {
            alert(state.reason || 'Această dată nu este disponibilă.');
        }
    };


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
                    <SuccessView onClose={onClose} />
                ) : (
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                        {/* Customer Information */}
                        <CustomerInfoSection
                            formData={formData}
                            setFormData={setFormData}
                            initialLoading={initialLoading}
                            selectedCountryCode={selectedCountryCode}
                            setSelectedCountryCode={setSelectedCountryCode}
                            showCountryCodeDropdown={showCountryCodeDropdown}
                            setShowCountryCodeDropdown={setShowCountryCodeDropdown}
                        />

                        {/* Car  */}
                        <CarSelectionSection
                            car={car}
                            handleSetSelectedCar={handleSetSelectedCar}
                            selectedCar={selectedCar}
                        />

                        {/* Rental Dates */}
                        <DateSelectionSection
                            formData={formData}
                            setFormData={setFormData}
                            showPickupCalendar={showPickupCalendar}
                            setShowPickupCalendar={setShowPickupCalendar}
                            showReturnCalendar={showReturnCalendar}
                            setShowReturnCalendar={setShowReturnCalendar}
                            showPickupTime={showPickupTime}
                            setShowPickupTime={setShowPickupTime}
                            showReturnTime={showReturnTime}
                            setShowReturnTime={setShowReturnTime}
                            calendarMonth={calendarMonth}
                            setCalendarMonth={setCalendarMonth}
                            pickupCalendarRef={pickupCalendarRef}
                            returnCalendarRef={returnCalendarRef}
                            pickupTimeRef={pickupTimeRef}
                            returnTimeRef={returnTimeRef}
                            effectiveNextAvailableDate={effectiveNextAvailableDate}
                            effectiveApprovedBorrowRequests={effectiveApprovedBorrowRequests}
                            getDayState={getDayState}
                            handleDateChange={handleDateChange}
                            isClosingWithDelay={isClosingWithDelay}
                            setIsClosingWithDelay={setIsClosingWithDelay}
                        />

                        {/* Rental Options */}
                        <RentalOptionsSection
                            categories={categories}
                            rentalOptions={rentalOptions}
                            options={options}
                            setOptions={setOptions}
                        />

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
                        <PriceSummarySection
                            formData={formData}
                            car={car}
                            options={options}
                            calculatePriceSummary={calculatePriceSummary}
                        />

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