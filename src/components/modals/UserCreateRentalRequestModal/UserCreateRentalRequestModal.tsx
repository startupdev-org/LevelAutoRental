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
import { BorrowRequest, Car, User } from '../../../types';
import { OptionsState, RentalOption, rentalOptions } from '../../../constants/rentalOptions';
import { getLoggedUser } from '../../../lib/db/user/profile';
import { formatDateLocal, getDateDiffInDays } from '../../../utils/date';
import { calculateAmount, calculatePriceSummary, getCarPrice, PriceSummaryResult } from '../../../utils/car/pricing';
import { fetchCarById } from '../../../lib/db/cars/cars';
import { createUserBorrowRequest, isDateUnavailable } from '../../../lib/db/requests/requests';
import { CarsFilterList } from '../../dashboard/user-dashboard/orders/CarsSection';
import { OptionItem } from '../../dashboard/user/orders-requests/OptionItem';
import { formatAmount } from '../../../utils/currency';

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



export interface CreateRentalModalProps {
    isOpen: boolean;
    onClose: () => void;
    car?: Car | null;
    initialCarId?: string;
}

export const UserCreateRentalRequestModal: React.FC<CreateRentalModalProps> = ({
    isOpen,
    onClose,
    car,
    initialCarId,
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
        price_per_day: 0,
        user_id: '',
        comment: '',
        options: {
            pickupAtAddress: false,
            returnAtAddress: false,
            unlimitedKm: false,
            speedLimitIncrease: false,
            personalDriver: false,
            priorityService: false,
            tireInsurance: false,
            childSeat: false,
            simCard: false,
            airportDelivery: false,
            roadsideAssistance: false,
        },
        requested_at: '',
        updated_at: ''
    };

    const [selectedCar, setSelectedCar] = useState<Car | null>(car || null);


    function handleSetSelectedCar(car: Car | null) {
        setSelectedCar(car);
        setFormData(prev => ({
            ...prev,
            car_id: car ? car.id.toString() : '',
        }));
    }

    useEffect(() => {
        if (car) {
            setSelectedCar(car);
            setFormData(prev => ({
                ...prev,
                car_id: car.id.toString(),
            }));
        }
        setSubmitSuccess(false);
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
    const [isClosingWithDelay, setIsClosingWithDelay] = useState(false);
    const [minDaysMessage, setMinDaysMessage] = useState<string>('');
    const [submitSuccess, setSubmitSuccess] = useState(false);

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

    // Check if a date/time is in a maintenance period (12 hours after rental ends)
    async function isUnavailableDate(checkDate: string): Promise<boolean> {
        const carId = selectedCar?.id || '';
        return await isDateUnavailable(checkDate, carId)
    }

    // Find the earliest future approved/executed rental start date
    function getEarliestFutureRentalStart(): string | null {
        // TODO: return earliest future approved/executed rental start date (YYYY-MM-DD) or null
        throw new Error('getEarliestFutureRentalStart not implemented');
    }

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
        const totalAmount = calculateAmount(rentalDays, pricePerDay, formData.start_date, formData.end_date, formData.car_id, formData.options);

        // Prepare data with all fields including options - map to correct database column names
        const rentalData: BorrowRequest = {
            car_id: formData.car_id,
            user_id: formData.user_id || '',
            start_date: formData.start_date,
            start_time: formData.start_time,
            end_date: formData.end_date,
            end_time: formData.end_time,
            status: 'PENDING',
            price_per_day: pricePerDay,
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
    };

    async function handleSaveRental(rentalData: BorrowRequest) {
        console.log('saving the rentals request with the following info: ', rentalData)
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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <React.Fragment key="modal-container">
                    {/* Backdrop */}
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        key="modal"
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                                <h2 className="text-lg sm:text-xl font-bold text-white">{t('admin.requests.createNew')}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(95vh-200px)] md:max-h-[calc(92vh-200px)]">
                                <React.Fragment>
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
                                                            value={formData.customer_first_name || ''}
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
                                                            value={formData.customer_last_name || ''}
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
                                                            // TODO: think about the age parameter
                                                            // value={formData.age || ''}
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
                                                                value={formData.customer_phone || ''}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, customer_phone: e.target.value }))}
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
                                                            value={formData.customer_email || ''}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, customer_email: e.target.value }))}
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
                                                            className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.start_date
                                                                ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                                                : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                                                }`}
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formData.start_date ? formatDateLocal(formData.start_date, t('config.date')) : 'Data primirii'}</span>
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
                                                                            if (!day) return <div key={index}></div>; // ← ADD THIS LINE

                                                                            const dayDate = new Date(day);
                                                                            const dayString = day;
                                                                            const today = new Date();
                                                                            today.setHours(0, 0, 0, 0);
                                                                            const todayString = formatDateLocal(today, t('config.date'));
                                                                            // Only block dates that are strictly in the past (not today)
                                                                            const isPast = dayString < todayString;
                                                                            const isUnavailable = false; // placeholder - implement later

                                                                            const isBlocked = isPast || isUnavailable;
                                                                            const isSelected = dayString === formData.start_date;
                                                                            // Check if this is the return date (visible in pickup calendar)
                                                                            const isReturnDate = formData.end_date && dayString === formData.end_date;
                                                                            // Check if date is in range between pickup and return (only if return date is selected)
                                                                            const isInRange = formData.start_date && formData.end_date &&
                                                                                dayString > formData.start_date &&
                                                                                dayString < formData.end_date;

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
                                                                                            const isChangingPickupDate = formData.start_date && formData.start_date !== day;

                                                                                            // If user is reselecting/changing the pickup date, clear all other inputs first
                                                                                            if (isChangingPickupDate) {
                                                                                                setFormData(prev => ({ ...prev, end_date: '', start_time: '', end_time: '' }));
                                                                                            }

                                                                                            setFormData(prev => ({ ...prev, start_date: day }));

                                                                                            // If not changing, only clear return date if it's invalid (before pickup or less than 2 days)
                                                                                            if (!isChangingPickupDate && formData.end_date && day >= formData.end_date) {
                                                                                                const returnDay = new Date(formData.end_date);
                                                                                                const pickupDay = new Date(day);
                                                                                                const diffTime = returnDay.getTime() - pickupDay.getTime();
                                                                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                                                // Clear return date if less than 2 days
                                                                                                if (diffDays < 2) {
                                                                                                    setFormData(prev => ({ ...prev, end_date: '' }));
                                                                                                }
                                                                                            }
                                                                                            // Close calendar after 0.3s delay so user can see what they clicked
                                                                                            setIsClosingWithDelay(true);
                                                                                            setTimeout(() => {
                                                                                                setShowPickupCalendar(false);
                                                                                                setIsClosingWithDelay(false);
                                                                                                if (!formData.start_time) {
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
                                                                                    {isBlocked && (
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
                                                            className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.start_time
                                                                ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                                                : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                                                }`}
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            <span>{formData.start_time || '__ : __'}</span>
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
                                                                            if (formData.start_date) {
                                                                                const today = new Date();
                                                                                today.setHours(0, 0, 0, 0);
                                                                                const todayString = formatDateLocal(today, t('config.date'));

                                                                                if (formData.start_date === todayString) {
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
                                                                                }
                                                                            }

                                                                            // Filter out hours that are in maintenance periods
                                                                            const availableHours = generateHours(minHour).filter((hour) => {
                                                                                if (!formData.start_date) return true;
                                                                                // REMOVE the isUnavailableDate call - it breaks async/sync
                                                                                return true; // placeholder
                                                                            });

                                                                            return availableHours.map((hour) => (
                                                                                <button
                                                                                    key={hour}
                                                                                    type="button"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setFormData(prev => ({ ...prev, start_time: hour }));
                                                                                        // Close time picker after 0.3s delay so user can see what they clicked
                                                                                        setIsClosingWithDelay(true);
                                                                                        setTimeout(() => {
                                                                                            setShowPickupTime(false);
                                                                                            setIsClosingWithDelay(false);
                                                                                            if (!formData.end_date) {
                                                                                                setShowReturnCalendar(true);
                                                                                            }
                                                                                        }, 300);
                                                                                    }}
                                                                                    onMouseDown={(e) => e.stopPropagation()}
                                                                                    className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${formData.start_time === hour
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
                                                            className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.end_date
                                                                ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                                                : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                                                }`}
                                                        >
                                                            <Calendar className="w-4 h-4" />
                                                            <span>{formData.end_date ? formatDateLocal(formData.end_date, t('config.date')) : 'Data returnării'}</span>
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
                                                                            const todayString = formatDateLocal(today, t('config.date'));
                                                                            // Only block dates that are strictly in the past (not today)
                                                                            const isPast = dayString < todayString;
                                                                            const isUnavailable = isUnavailableDate(todayString)

                                                                            const isBlocked = isPast && isUnavailable;

                                                                            const isSelected = dayString === formData.end_date;

                                                                            const isLessThanMinDays = formData.start_date && (() => {
                                                                                const pickup = new Date(formData.start_date);
                                                                                const returnDay = new Date(dayString);
                                                                                const diffTime = returnDay.getTime() - pickup.getTime();
                                                                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                                                return diffDays < 2;
                                                                            })();
                                                                            // Check if date is before next available date
                                                                            // Only block if effectiveNextAvailableDate is today or in the past (car is currently booked)
                                                                            // If effectiveNextAvailableDate is in the future, don't block dates before it (there's a gap)
                                                                            // Get message for blocked dates
                                                                            const getBlockedMessage = () => {
                                                                                if (isBlocked) {
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
                                                                                            : isBlocked
                                                                                                ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                                                : isBlocked
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
                                                                                            setFormData(prev => ({ ...prev, end_date: day }));
                                                                                            // Close calendar after 0.3s delay so user can see what they clicked
                                                                                            setIsClosingWithDelay(true);
                                                                                            setTimeout(() => {
                                                                                                setShowReturnCalendar(false);
                                                                                                setIsClosingWithDelay(false);
                                                                                                if (!formData.end_time) {
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
                                                                                    {isBlocked && (
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
                                                            className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.end_time
                                                                ? 'border-white/30 text-white hover:border-white/50 bg-white/5'
                                                                : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                                                }`}
                                                        >
                                                            <Clock className="w-4 h-4" />
                                                            <span>{formData.end_time || '__ : __'}</span>
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
                                                                                    setFormData(prev => ({ ...prev, end_time: hour }));
                                                                                    setShowReturnTime(false);
                                                                                }}
                                                                                className={`px-3 py-2 text-xs rounded transition-colors ${formData.end_time === hour
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
                                                    {formData.car_id && car && (() => {
                                                        console.log('should claculate the summary')
                                                        const summary = calculatePriceSummary(car, formData, options);
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
                                                                        {summary.rentalDays} {summary.rentalDays === 1 ? 'zi' : 'zile'}
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
                                                                                        <span className="text-white">{formatAmount(summary.additionalCosts)}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}

                                                                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                                                    <span className="text-white font-bold text-lg">Total</span>
                                                                    <span className="text-white font-bold text-xl">{formatAmount(summary.totalPrice)}</span>
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
                                </React.Fragment>
                            </div>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}
        </AnimatePresence>,
        document.body
    );
};