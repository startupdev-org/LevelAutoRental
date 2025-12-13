import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Calendar,
    Clock,
    MapPin,
    Loader2,
    CheckCircle,
    Check,
    Save,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BorrowRequestDTO, Car as CarType } from '../../../../types';
import { getDateDiffInDays } from '../../../../utils/date';
import { calculateAmount, calculatePriceSummary, getCarPrice } from '../../../../utils/car/pricing';
import { formatAmount } from '../../../../utils/currency';
import { COUNTRY_CODES } from '../../../../constants';

export interface EditRequestModalProps {
    request: BorrowRequestDTO;
    onSave: (updatedData: BorrowRequestDTO) => void;
    onClose: () => void;
    cars: CarType[];
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({ request, onSave, onClose, cars }) => {
    const { t } = useTranslation();
    // Parse existing request data
    const parsePhoneNumber = (phone: string | undefined): { code: string; number: string } => {
        if (!phone) return { code: '+373', number: '' };
        const match = phone.match(/^(\+\d+)\s*(.+)$/);
        if (match) {
            return { code: match[1], number: match[2] };
        }
        return { code: '+373', number: phone };
    };

    const phoneData = parsePhoneNumber(request.customer_phone);
    const initialCountryCode = COUNTRY_CODES.find(c => c.code === phoneData.code) || COUNTRY_CODES[0];

    // Parse customer name into first and last name
    const nameParts = (request.customer_name || '').split(' ');
    const initialFirstName = request.customer_first_name || nameParts[0] || '';
    const initialLastName = request.customer_last_name || nameParts.slice(1).join(' ') || '';

    // Parse options
    const requestOptions = (request as any).options;
    let initialOptions: any = {
        pickupAtAddress: false,
        returnAtAddress: false,
        unlimitedKm: false,
        speedLimitIncrease: false,
        personalDriver: false,
        priorityService: false,
        tireInsurance: false,
        childSeat: false,
        simCard: false,
        roadsideAssistance: false
    };

    if (requestOptions) {
        try {
            const parsed = typeof requestOptions === 'string' ? JSON.parse(requestOptions) : requestOptions;
            initialOptions = { ...initialOptions, ...parsed };
        } catch (e) {
            // Keep defaults
        }
    }

    const [formData, setFormData] = useState<BorrowRequestDTO>({
        id: request.id,
        customer_name: request.customer_name || '',
        customer_first_name: initialFirstName,
        customer_last_name: initialLastName,
        customer_email: request.customer_email || '',
        customer_phone: phoneData.number,
        // customerAge: request.customerAge || '',
        car_id: request.car_id || '',
        start_date: request.start_date || '',
        start_time: request.start_time || '09:00',
        end_date: request.end_date || '',
        end_time: request.end_time || '17:00',
        status: (request.status || 'PENDING') as any,
        total_amount: request.total_amount || 0,
        user_id: request.user_id || '',
        price_per_day: request.price_per_day,
        requested_at: request.requested_at,
        options: request.options,
        updated_at: request.updated_at,
        car: request.car,
        comment: request.comment || '',
    });

    const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountryCode);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
    const [options, setOptions] = useState(initialOptions);

    // Calendar state
    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);
    const [showPickupTime, setShowPickupTime] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);

    const startDateObj = formData.start_date ? new Date(formData.start_date) : new Date();
    const endDateObj = formData.end_date ? new Date(formData.end_date) : new Date();
    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>({
        pickup: startDateObj,
        return: endDateObj
    });
    const [nextAvailableDate, setNextAvailableDate] = useState<Date | null>(null);
    const [approvedBorrowRequests, setApprovedBorrowRequests] = useState<any[]>([]);
    const [carRentalsForCalendar, setCarRentalsForCalendar] = useState<any[]>([]);
    const [pickupCalendarInitialized, setPickupCalendarInitialized] = useState(false);
    const [returnCalendarInitialized, setReturnCalendarInitialized] = useState(false);
    const [isClosingWithDelay, setIsClosingWithDelay] = useState(false);
    const [minDaysMessage, setMinDaysMessage] = useState<string>('');

    // Refs for click outside detection
    const pickupCalendarRef = React.useRef<HTMLDivElement>(null);
    const returnCalendarRef = React.useRef<HTMLDivElement>(null);
    const pickupTimeRef = React.useRef<HTMLDivElement>(null);
    const returnTimeRef = React.useRef<HTMLDivElement>(null);

    // Helper functions (same as CreateRentalModal)
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
            const isBeforePickup = isReturnCalendar && formData.start_date && dayString <= formData.start_date;

            return isPast || isBeforeAvailable || isInApprovedRequest || isBeforePickup;
        });

        return allBlocked && monthDays.length > 0;
    };

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

    // Fetch rentals and calculate next available date
    useEffect(() => {
        const fetchCarAvailability = async () => {
            if (!formData.car_id) return;

            try {
                const { fetchRentals } = await import('../../../../lib/orders');
                const rentals = await fetchRentals();
                const now = new Date();

                const carIdNum = parseInt(formData.car_id, 10);

                // Filter rentals for this car that are active, contract, or current/future
                const carRentals = rentals.filter(rental => {
                    const rentalCarId = typeof rental.car_id === 'number'
                        ? rental.car_id
                        : parseInt(rental.car_id?.toString() || '0', 10);
                    const rentalStatus = (rental as any).status || rental.rental_status || '';

                    // Include ACTIVE, CONTRACT, or any rental that hasn't ended yet
                    if (rentalCarId !== carIdNum) return false;

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
    }, [formData.car_id]);

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
    }, [showReturnCalendar, calendarMonth.return, nextAvailableDate, approvedBorrowRequests, formData.start_date, returnCalendarInitialized]);

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
            if (!target.closest('.country-code-dropdown-container')) {
                setShowCountryCodeDropdown(false);
            }
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
        if (!formData.customer_first_name || !formData.customer_last_name || !formData.customer_phone || !formData.car_id || !formData.start_date || !formData.end_date) {
            alert(t('admin.requests.fillRequiredFieldsShort'));
            return;
        }

        const rentalDays = getDateDiffInDays(formData.start_date, formData.end_date);
        const pricePerDay = parseInt(getCarPrice(rentalDays, formData.car));

        const totalAmount = calculateAmount(rentalDays, pricePerDay, formData.start_date, formData.end_date, formData.car_id, formData.options);

        const customerName = `${formData.customer_first_name} ${formData.customer_last_name}`;
        `${selectedCountryCode.code} ${formData.customer_phone}`.trim();

        const updatedRequest: BorrowRequestDTO = {
            id: formData.id,
            options: formData.options,
            total_amount: totalAmount,
            car_id: formData.car_id,
            user_id: formData.user_id,
            start_date: formData.start_date,
            start_time: formData.start_time,
            end_date: formData.end_date,
            end_time: formData.end_time,
            price_per_day: pricePerDay.toString(),
            customer_name: customerName,
            customer_first_name: formData.customer_first_name,
            customer_last_name: formData.customer_last_name,
            customer_email: formData.customer_email,
            customer_phone: formData.customer_phone,
            comment: formData.comment,
            status: formData.status,
            requested_at: formData.requested_at,
            updated_at: formData.updated_at,
            car: formData.car,
        };

        onSave(updatedRequest);
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
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <h2 className="text-xl font-bold text-white">{t('admin.requests.editRequest')}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Date de contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prenume *</label>
                                <input
                                    type="text"
                                    value={formData.customer_first_name || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value, customerFirstName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nume *</label>
                                <input
                                    type="text"
                                    value={formData.customer_last_name}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
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
                                {/* <input
                                    type="number"
                                    min="18"
                                    max="100"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value, customerAge: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                    required
                                /> */}
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
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        placeholder="000 00 000"
                                        className="w-full pl-[120px] pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">E-mail (opțional)</label>
                                <input
                                    type="email"
                                    value={formData.customer_email || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                    style={{
                                        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 12px center',
                                        backgroundSize: '12px',
                                        paddingRight: '40px'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rental Dates - Same calendar implementation as CreateRentalModal */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Perioada închirierii</h3>
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
                                    <span>{formData.start_date ? formatDate(formData.start_date.toString()) : 'Data preluării'}</span>
                                </button>
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
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                                    setFormData(prev => ({ ...prev, endDate: '', startTime: '', endTime: '' }));
                                                                }

                                                                setFormData(prev => ({ ...prev, startDate: day }));

                                                                // If not changing, only clear return date if it's invalid (before pickup or less than 2 days)
                                                                if (!isChangingPickupDate && formData.end_date && day >= formData.end_date) {
                                                                    const returnDay = new Date(formData.end_date);
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
                                                // Calculate minimum hour if nextAvailableDate is set and matches selected date
                                                let minHour: number | undefined = undefined;

                                                // Check if selected date is today - if so, start from 2 hours from now
                                                if (formData.start_date) {
                                                    const today = new Date();
                                                    today.setHours(0, 0, 0, 0);
                                                    const todayString = formatDateLocal(today);

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
                                                    } else if (nextAvailableDate) {
                                                        // Check if nextAvailableDate matches selected date
                                                        const nextAvailableDateStr = nextAvailableDate.toISOString().split('T')[0];
                                                        if (formData.start_date === nextAvailableDateStr) {
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
                                                    if (!formData.start_date) return true;
                                                    const checkDate = new Date(formData.start_date);
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
                                    <span>{formData.end_date ? formatDate(formData.end_date.toString()) : 'Data returnării'}</span>
                                </button>
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
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                                const isBeforePickup = formData.start_date && dayString <= formData.start_date;
                                                // Minimum rental is 2 days - block dates that are less than 2 days after pickup
                                                const isLessThanMinDays = formData.start_date && (() => {
                                                    const pickup = new Date(formData.start_date);
                                                    const returnDay = new Date(dayString);
                                                    const diffTime = returnDay.getTime() - pickup.getTime();
                                                    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                                    return diffDays < 2;
                                                })();
                                                const isInActualRequest = isDateInActualApprovedRequest(dayString);
                                                // Only block by future rental if pickup date is before the future rental start
                                                // If pickup is after future rental, allow return dates after it too
                                                const isBlockedByFuture = formData.start_date ? (() => {
                                                    const earliestStart = getEarliestFutureRentalStart();
                                                    if (!earliestStart) return false;

                                                    const pickupDateObj = new Date(formData.start_date);
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
                                                const isSelected = dayString === formData.end_date;
                                                // Check if this is the pickup date (visible in return calendar)
                                                const isPickupDate = formData.start_date && dayString === formData.start_date;
                                                // Check if date is in range between pickup and return
                                                const isInRange = formData.start_date && formData.end_date &&
                                                    dayString > formData.start_date &&
                                                    dayString < formData.end_date;

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
                                {showReturnTime && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex flex-col gap-1">
                                            {generateHours().map((hour) => (
                                                <button
                                                    key={hour}
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setFormData(prev => ({ ...prev, endTime: hour }));
                                                        // Close time picker after 0.3s delay so user can see what they clicked
                                                        setIsClosingWithDelay(true);
                                                        setTimeout(() => {
                                                            setShowReturnTime(false);
                                                            setIsClosingWithDelay(false);
                                                        }, 300);
                                                    }}
                                                    onMouseDown={(e) => e.stopPropagation()}
                                                    className={`w-full px-3 py-2 text-sm rounded transition-colors text-center ${formData.end_time === hour
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
                            </div>
                        </div>
                    </div>

                    {/* Car Selection */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Selectare automobil</h3>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Automobil *</label>
                        <select
                            value={formData.car_id || ''}
                            onChange={(e) => {
                                const selectedCar = cars.find(c => c.id.toString() === e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    carId: e.target.value,
                                    carName: selectedCar ? ((selectedCar as any).name || `${selectedCar.make} ${selectedCar.model}`) : ''
                                }));
                            }}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                backgroundSize: '12px',
                                paddingRight: '40px'
                            }}
                            required
                        >
                            <option value="">Selectează automobil</option>
                            {cars.map((car) => (
                                <option key={car.id} value={car.id.toString()}>
                                    {(car as any).name || `${car.make} ${car.model}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Rental Options - Same as CreateRentalModal */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Opțiuni de închiriere</h3>

                        {/* Pickup and Return */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Preluarea și returnarea automobilului</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.pickupAtAddress}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, pickupAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.pickupAtAddress
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.pickupAtAddress && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">Preluarea la adresă</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Cost separat</div>
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.returnAtAddress}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, returnAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.returnAtAddress
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.returnAtAddress && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">Returnarea la adresă</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Cost separat</div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Limits */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Limite</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.unlimitedKm}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, unlimitedKm: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.unlimitedKm
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.unlimitedKm && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Kilometraj nelimitat</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+50%</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.speedLimitIncrease}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, speedLimitIncrease: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.speedLimitIncrease
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.speedLimitIncrease && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Creșterea limitei de viteză</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+20%</span>
                            </label>
                        </div>

                        {/* VIP Services */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Servicii VIP</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.personalDriver}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, personalDriver: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.personalDriver
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.personalDriver && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Șofer personal</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">800 MDL/zi</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.priorityService}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, priorityService: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.priorityService
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.priorityService && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Priority Service</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">1 000 MDL/zi</span>
                            </label>
                        </div>

                        {/* Insurance */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Asigurare</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.tireInsurance}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, tireInsurance: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.tireInsurance
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.tireInsurance && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Asigurare anvelope & parbriz</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+20%</span>
                            </label>
                        </div>

                        {/* Additional */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Suplimentar</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.childSeat}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, childSeat: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.childSeat
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.childSeat && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Scaun auto pentru copii</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">100 MDL/zi</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.simCard}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, simCard: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.simCard
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.simCard && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Cartelă SIM cu internet</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">100 MDL/zi</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.roadsideAssistance}
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, roadsideAssistance: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.roadsideAssistance
                                        ? 'bg-red-500 border-red-500'
                                        : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                        {options.roadsideAssistance && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Asistență rutieră</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">500 MDL/zi</span>
                            </label>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Comentariu (opțional)</h3>
                        <textarea
                            value={formData.comment || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 resize-none"
                            placeholder="Adăugați un comentariu (opțional)"
                        />
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Detalii preț</h3>
                        <div className="space-y-3">
                            {formData.car_id && (() => {
                                const priceSummary = calculatePriceSummary(formData.car, formData, formData.options)

                                return (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Preț pe zi</span>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-white font-medium">{formatAmount(priceSummary?.pricePerDay)} MDL</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Durată</span>
                                            <span className="text-white font-medium">
                                                {priceSummary?.rentalDays} {priceSummary?.rentalDays === 1 ? 'zi' : 'zile'}
                                            </span>
                                        </div>
                                        <div className="pt-2 border-t border-white/10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white font-medium">Preț de bază</span>
                                                <span className="text-white font-medium">{formatAmount(priceSummary?.baseCarPrice)} MDL</span>
                                            </div>
                                        </div>

                                        {/* {priceSummary?.additionalCosts > 0 && (
                                            <>
                                                <div className="pt-3 border-t border-white/10">
                                                    <h4 className="text-sm font-bold text-white mb-3">Servicii suplimentare</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {options.unlimitedKm && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Kilometraj nelimitat</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.5).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.speedLimitIncrease && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.tireInsurance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.personalDriver && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Șofer personal</span>
                                                                <span className="text-white font-medium">{800 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.priorityService && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Serviciu prioritar</span>
                                                                <span className="text-white font-medium">{1000 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.childSeat && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Scaun auto pentru copii</span>
                                                                <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.simCard && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                                <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.roadsideAssistance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asistență rutieră</span>
                                                                <span className="text-white font-medium">{500 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-2 border-t border-white/10">
                                                            <div className="flex justify-between font-medium">
                                                                <span className="text-white">Total servicii</span>
                                                                <span className="text-white">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )} */}

                                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                            <span className="text-white font-bold text-lg">Total</span>
                                            <span className="text-white font-bold text-xl">{formatAmount(priceSummary?.totalPrice)} MDL</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                        >
                            {t('admin.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {t('admin.common.save')}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>,
        document.body
    );
};
