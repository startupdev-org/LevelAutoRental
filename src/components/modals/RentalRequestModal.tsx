import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Car, Gauge, Zap, UserRound, Star, Shield, Baby, Wifi, Wrench, Check, FileText, Cookie, MapPin, CreditCard, Bell, CheckCircle } from 'lucide-react';
import { Car as CarType } from '../../types';
import { useTranslation } from 'react-i18next';
import { createUserBorrowRequest } from '../../lib/orders';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface RentalRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    car: CarType;
    pickupDate: string;
    returnDate: string;
    pickupTime: string;
    returnTime: string;
    rentalCalculation: {
        days: number;
        hours: number;
        pricePerDay: number;
        totalPrice: number;
    } | null;
    approvedBorrowRequests?: Array<{
        start_date: string;
        end_date: string;
        start_time?: string;
        end_time?: string;
        status?: string;
    }>;
    carRentalsForCalendar?: Array<{
        start_date: string;
        end_date: string;
        start_time?: string;
        end_time?: string;
        rental_status?: string;
    }>;
}

export const RentalRequestModal: React.FC<RentalRequestModalProps> = ({
    isOpen,
    onClose,
    car,
    pickupDate,
    returnDate,
    pickupTime,
    returnTime,
    rentalCalculation,
    approvedBorrowRequests = [],
    carRentalsForCalendar = []
}) => {
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

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        age: '',
        phone: '',
        email: '',
        comment: ''
    });

    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsModalType, setTermsModalType] = useState<'terms' | 'privacy'>('terms');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<{
        firstName?: string;
        lastName?: string;
        age?: string;
        email?: string;
        phone?: string;
        comment?: string;
    }>({});
    const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
    const { t } = useTranslation();
    const { user } = useAuth();
    const navigate = useNavigate();

    const [options, setOptions] = useState({
        unlimitedKm: false,
        personalDriver: false,
        priorityService: false,
        tireInsurance: false,
        childSeat: false,
        simCard: false,
        roadsideAssistance: false,
        airportDelivery: false
    });

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    // Calculate base price with discount (same logic as Calculator page and Admin)
    const calculateBasePrice = () => {
        if (!rentalCalculation) return 0;
        // Get price with car discount applied first
        const basePricePerDay = (car as any).pricePerDay || car.price_per_day || 0;
        const carDiscount = (car as any).discount_percentage || 0;
        const pricePerDay = carDiscount > 0
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;
        const rentalDays = rentalCalculation.days; // Use full days for discount calculation
        const totalDays = rentalDays + (rentalCalculation.hours / 24); // Use total days for final calculation

        // Base price calculation (same as Calculator.tsx and Admin) - using discounted price
        let basePrice = 0;

        if (rentalDays >= 8) {
            basePrice = pricePerDay * 0.96 * rentalDays; // -4% discount
        } else if (rentalDays >= 4) {
            basePrice = pricePerDay * 0.98 * rentalDays; // -2% discount
        } else {
            basePrice = pricePerDay * rentalDays;
        }

        // Add hours portion if there are extra hours
        if (rentalCalculation.hours > 0) {
            const hoursPrice = (rentalCalculation.hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }

        return basePrice;
    };

    const calculateTotalCost = () => {
        if (!rentalCalculation) return 0;

        // Use the same calculation logic as Calculator page and Admin
        const basePrice = calculateBasePrice();
        const baseCarPrice = car.price_per_day;
        const rentalDays = rentalCalculation.days; // Use full days for additional costs calculation
        let additionalCost = 0;

        // Percentage-based options (calculated as percentage of base car price * days, like Calculator and Admin)
        if (options.unlimitedKm) {
            additionalCost += baseCarPrice * rentalDays * 0.5; // 50% of daily rate
        }
        if (options.tireInsurance) {
            additionalCost += baseCarPrice * rentalDays * 0.2; // 20% of daily rate
        }

        // Fixed daily costs (same as Calculator and Admin)
        if (options.personalDriver) {
            additionalCost += 800 * rentalDays;
        }
        if (options.priorityService) {
            additionalCost += 1000 * rentalDays;
        }
        if (options.childSeat) {
            additionalCost += 100 * rentalDays;
        }
        if (options.simCard) {
            additionalCost += 100 * rentalDays;
        }
        if (options.roadsideAssistance) {
            additionalCost += 500 * rentalDays;
        }

        // Pickup/return at address costs are calculated separately (not included in base)
        // They would be calculated based on location, so we don't add them here

        return Math.round(basePrice + additionalCost);
    };

    const basePrice = calculateBasePrice();
    const totalCost = calculateTotalCost();

    // Calculate additional costs separately for display
    const rentalDays = rentalCalculation?.days || 0;
    let additionalCosts = 0;

    // Get discounted price for additional services
    const basePricePerDay = (car as any).pricePerDay || car.price_per_day || 0;
    const carDiscount = (car as any).discount_percentage || 0;
    const baseCarPrice = carDiscount > 0
        ? basePricePerDay * (1 - carDiscount / 100)
        : basePricePerDay;

    // Percentage-based options (calculated as percentage of base car price * days)
    if (options.unlimitedKm) {
        additionalCosts += baseCarPrice * rentalDays * 0.5; // 50%
    }
    if (options.tireInsurance) {
        additionalCosts += baseCarPrice * rentalDays * 0.2; // 20%
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

    const pricePerDay = rentalCalculation ? Math.round(totalCost / (rentalCalculation.days + (rentalCalculation.hours / 24))) : 0;

    // Calculate discount info
    const discountPercentage = rentalCalculation && rentalCalculation.days >= 8
        ? 4
        : rentalCalculation && rentalCalculation.days >= 4
            ? 2
            : 0;

    const originalPrice = rentalCalculation
        ? car.price_per_day * (rentalCalculation.days + (rentalCalculation.hours / 24))
        : 0;

    // Validation functions
    const validateName = (name: string): string | null => {
        if (!name.trim()) {
            return 'Acest câmp este obligatoriu.';
        }
        if (name.trim().length < 2) {
            return 'Numele trebuie să aibă minim 2 caractere.';
        }
        if (name.trim().length > 50) {
            return 'Numele nu poate depăși 50 de caractere.';
        }
        // Allow letters, spaces, hyphens, and Romanian characters
        const nameRegex = /^[a-zA-ZăâîșțĂÂÎȘȚ\s\-']+$/;
        if (!nameRegex.test(name.trim())) {
            return 'Numele poate conține doar litere, spații și cratime.';
        }
        return null;
    };

    const validateAge = (age: string): string | null => {
        if (!age.trim()) {
            return 'Vă rugăm să introduceți vârsta.';
        }
        const ageNum = parseInt(age, 10);
        if (isNaN(ageNum)) {
            return 'Vă rugăm să introduceți un număr valid.';
        }
        if (ageNum < 18) {
            return 'Vârsta minimă este de 18 ani.';
        }
        if (ageNum > 100) {
            return 'Vă rugăm să introduceți o vârstă validă (maximum 100 ani).';
        }
        return null;
    };

    const validateEmail = (email: string): string | null => {
        // If user is logged in, email is optional (will use account email)
        if (user) {
            // If email is provided, validate format
            if (email.trim()) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email.trim())) {
                    return 'Vă rugăm să introduceți o adresă de e-mail validă.';
                }
                if (email.trim().length > 255) {
                    return 'Adresa de e-mail nu poate depăși 255 de caractere.';
                }
            }
            return null; // Email is optional for logged-in users
        }
        // For logged-out users, email is required
        if (!email.trim()) {
            return 'Adresa de e-mail este obligatorie.';
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            return 'Vă rugăm să introduceți o adresă de e-mail validă.';
        }
        if (email.trim().length > 255) {
            return 'Adresa de e-mail nu poate depăși 255 de caractere.';
        }
        return null;
    };

    const validatePhone = (phone: string): string | null => {
        if (!phone.trim()) {
            return 'Numărul de telefon este obligatoriu.';
        }
        // Remove spaces, dashes, and parentheses for validation
        const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
        // Allow only digits
        if (!/^\d+$/.test(cleanPhone)) {
            return 'Numărul de telefon poate conține doar cifre, spații și cratime.';
        }
        // Check length (minimum 6 digits, maximum 15 digits)
        if (cleanPhone.length < 6) {
            return 'Numărul de telefon trebuie să aibă minim 6 cifre.';
        }
        if (cleanPhone.length > 15) {
            return 'Numărul de telefon nu poate depăși 15 cifre.';
        }
        return null;
    };

    const validateComment = (comment: string): string | null => {
        if (comment.length > 1000) {
            return 'Comentariul nu poate depăși 1000 de caractere.';
        }
        return null;
    };

    const handleInputChange = (field: string, value: string) => {
        // Apply input restrictions based on field type
        let processedValue = value;

        if (field === 'firstName' || field === 'lastName') {
            // Only allow letters, spaces, hyphens, and Romanian characters
            processedValue = value.replace(/[^a-zA-ZăâîșțĂÂÎȘȚ\s\-']/g, '');
            // Limit length
            if (processedValue.length > 50) {
                processedValue = processedValue.substring(0, 50);
            }
        } else if (field === 'age') {
            // Only allow digits
            processedValue = value.replace(/\D/g, '');
            // Limit to 3 digits (max 100)
            if (processedValue.length > 3) {
                processedValue = processedValue.substring(0, 3);
            }
        } else if (field === 'email') {
            // Allow email characters, limit length
            if (processedValue.length > 255) {
                processedValue = processedValue.substring(0, 255);
            }
        } else if (field === 'phone') {
            // Allow digits, spaces, dashes, and parentheses
            processedValue = value.replace(/[^\d\s\-\(\)]/g, '');
            // Limit length (15 digits max)
            const digitsOnly = processedValue.replace(/\D/g, '');
            if (digitsOnly.length > 15) {
                // Keep formatting but limit digits
                const formatted = processedValue.substring(0, processedValue.length - (digitsOnly.length - 15));
                processedValue = formatted;
            }
        } else if (field === 'comment') {
            // Limit comment length
            if (processedValue.length > 1000) {
                processedValue = processedValue.substring(0, 1000);
            }
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));

        // Only validate and show errors if user has attempted to submit
        if (hasAttemptedSubmit) {
            let error: string | null = null;
            if (field === 'firstName') {
                error = validateName(processedValue);
            } else if (field === 'lastName') {
                error = validateName(processedValue);
            } else if (field === 'age') {
                error = validateAge(processedValue);
            } else if (field === 'email') {
                error = validateEmail(processedValue);
            } else if (field === 'phone') {
                error = validatePhone(processedValue);
            } else if (field === 'comment') {
                error = validateComment(processedValue);
            }

            setFieldErrors(prev => ({
                ...prev,
                [field]: error || undefined
            }));
        }

        // Clear submit error when user starts typing
        if (submitError) {
            setSubmitError(null);
        }
    };

    const handleOptionChange = (option: string, value: boolean) => {
        setOptions(prev => ({ ...prev, [option]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mark that user has attempted to submit
        setHasAttemptedSubmit(true);

        // Comprehensive validation before submitting
        const errors: typeof fieldErrors = {};

        const firstNameError = validateName(formData.firstName);
        if (firstNameError) errors.firstName = firstNameError;

        const lastNameError = validateName(formData.lastName);
        if (lastNameError) errors.lastName = lastNameError;

        const ageError = validateAge(formData.age);
        if (ageError) errors.age = ageError;

        const emailError = validateEmail(formData.email);
        if (emailError) errors.email = emailError;

        const phoneError = validatePhone(formData.phone);
        if (phoneError) errors.phone = phoneError;

        const commentError = validateComment(formData.comment);
        if (commentError) errors.comment = commentError;

        // Set all errors
        setFieldErrors(errors);

        // If there are any errors, scroll to the first error field and prevent submission
        if (Object.keys(errors).length > 0) {
            const firstErrorField = Object.keys(errors)[0];

            // Scroll to the first error field
            setTimeout(() => {
                const errorElement = document.querySelector(`[data-field="${firstErrorField}"]`);
                if (errorElement) {
                    errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Focus the input field
                    const input = errorElement.querySelector('input, textarea') as HTMLElement;
                    if (input) {
                        input.focus();
                    }
                }
            }, 100);

            setSubmitError('Vă rugăm să corectați erorile din formular.');
            return;
        }

        // Check for date overlaps with existing rentals/requests
        const checkDateOverlap = () => {
            // Parse selected dates and times
            const selectedStartDate = new Date(`${pickupDate}T${pickupTime}`);
            const selectedEndDate = new Date(`${returnDate}T${returnTime}`);

            // Combine all existing rentals and approved requests
            const allExistingBookings = [
                ...carRentalsForCalendar.map(r => ({
                    start_date: r.start_date,
                    end_date: r.end_date,
                    start_time: r.start_time || '09:00',
                    end_time: r.end_time || '17:00',
                    status: r.rental_status || 'ACTIVE'
                })),
                ...approvedBorrowRequests.map(r => ({
                    start_date: r.start_date,
                    end_date: r.end_date,
                    start_time: r.start_time || '09:00',
                    end_time: r.end_time || '17:00',
                    status: r.status || 'APPROVED'
                }))
            ];

            // Check each existing booking for overlap
            for (const booking of allExistingBookings) {
                if (!booking.start_date || !booking.end_date) continue;

                // Parse booking dates
                const bookingStartStr = booking.start_date.includes('T')
                    ? booking.start_date.split('T')[0]
                    : booking.start_date.split(' ')[0];
                const bookingEndStr = booking.end_date.includes('T')
                    ? booking.end_date.split('T')[0]
                    : booking.end_date.split(' ')[0];

                // Parse times - handle different formats (HH:MM, HH:MM:SS, etc.)
                const parseTime = (timeStr: string): string => {
                    if (!timeStr) return '09:00';
                    // If already in HH:MM format, return as is
                    if (timeStr.match(/^\d{2}:\d{2}$/)) return timeStr;
                    // If in HH:MM:SS format, extract HH:MM
                    if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr.substring(0, 5);
                    // Default to 09:00
                    return '09:00';
                };

                const bookingStartTime = parseTime(booking.start_time || '09:00');
                const bookingEndTime = parseTime(booking.end_time || '17:00');

                const bookingStartDate = new Date(`${bookingStartStr}T${bookingStartTime}`);
                const bookingEndDate = new Date(`${bookingEndStr}T${bookingEndTime}`);

                // Check for overlap: two periods overlap if they share any common time
                // Period A overlaps Period B if:
                // - A starts before B ends AND A ends after B starts
                const hasOverlap = (
                    selectedStartDate < bookingEndDate && selectedEndDate > bookingStartDate
                );

                if (hasOverlap) {
                    // Format dates for error message
                    const formatDateForDisplay = (dateStr: string) => {
                        const date = new Date(dateStr);
                        return date.toLocaleDateString('ro-RO', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        });
                    };

                    return `Mașina este deja rezervată în perioada ${formatDateForDisplay(bookingStartStr)} - ${formatDateForDisplay(bookingEndStr)}. Vă rugăm să selectați o altă perioadă.`;
                }
            }

            return null;
        };

        const overlapError = checkDateOverlap();
        if (overlapError) {
            setSubmitError(overlapError);
            setIsSubmitting(false);
            return;
        }

        // Clear any previous errors and set submitting state
        setSubmitError(null);
        setSubmitSuccess(false);
        setIsSubmitting(true);

        try {
            // Include country code in phone number
            const fullPhoneNumber = `${selectedCountryCode.code} ${formData.phone.trim()}`;

            // Format dates for database (YYYY-MM-DD)
            const formatDateForDB = (dateString: string): string => {
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };

            // Format time for database (HH:MM:SS)
            const formatTimeForDB = (timeString: string): string => {
                // If time is in format "HH:MM", ensure it's in "HH:MM:SS" format
                if (timeString.includes(':')) {
                    const parts = timeString.split(':');
                    if (parts.length === 2) {
                        return `${parts[0]}:${parts[1]}:00`;
                    }
                }
                return timeString;
            };

            // Prepare options object
            const optionsData: any = {};
            if (options.unlimitedKm) optionsData.unlimitedKm = true;
            if (options.personalDriver) optionsData.personalDriver = true;
            if (options.priorityService) optionsData.priorityService = true;
            if (options.tireInsurance) optionsData.tireInsurance = true;
            if (options.childSeat) optionsData.childSeat = true;
            if (options.simCard) optionsData.simCard = true;
            if (options.roadsideAssistance) optionsData.roadsideAssistance = true;
            if (options.airportDelivery) optionsData.airportDelivery = true;

            // Use user's email from account if logged in, otherwise use form email
            const emailToUse = user?.email || formData.email;
            // For user_id, always use email (for logged-in users, use their email; for guests, use their provided email)
            const userIdForRequest = emailToUse;

            const result = await createUserBorrowRequest(
                car.id.toString(),
                formatDateForDB(pickupDate),
                formatTimeForDB(pickupTime),
                formatDateForDB(returnDate),
                formatTimeForDB(returnTime),
                formData.firstName,
                formData.lastName,
                emailToUse,
                fullPhoneNumber,
                formData.age || undefined,
                formData.comment || undefined,
                Object.keys(optionsData).length > 0 ? optionsData : undefined,
                totalCost,
                userIdForRequest // Use email as user_id (for both logged-in users and guests)
            );

            if (result.success) {
                setSubmitSuccess(true);
                // Don't close modal automatically - let user see the success message and registration option
            } else {
                setSubmitError(result.error || 'A apărut o eroare la trimiterea cererii. Vă rugăm să încercați din nou.');
            }
        } catch (error) {
            console.error('Error submitting rental request:', error);
            setSubmitError('A apărut o eroare neașteptată. Vă rugăm să încercați din nou.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Close country code dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.country-code-dropdown-container')) {
                setShowCountryCodeDropdown(false);
            }
        };

        if (showCountryCodeDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryCodeDropdown]);

    // Auto-fill email when user is logged in and modal opens
    useEffect(() => {
        if (isOpen && user?.email) {
            setFormData(prev => ({
                ...prev,
                email: user.email || ''
            }));
        }
    }, [isOpen, user]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFormData({
                firstName: '',
                lastName: '',
                age: '',
                phone: '',
                email: '',
                comment: ''
            });
            setFieldErrors({});
            setHasAttemptedSubmit(false);
            setOptions({
                unlimitedKm: false,
                personalDriver: false,
                priorityService: false,
                tireInsurance: false,
                childSeat: false,
                simCard: false,
                roadsideAssistance: false,
                airportDelivery: false
            });
            setSubmitError(null);
            setSubmitSuccess(false);
        }
    }, [isOpen]);

    if (!rentalCalculation) return null;

    return (
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
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
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
                        <div className="bg-white rounded-2xl border border-gray-300 shadow-2xl max-w-5xl w-full max-h-[95vh] md:max-h-[92vh] overflow-hidden md:my-4">
                            {/* Header */}
                            <div className="sticky top-0 bg-white border-b border-gray-300 px-6 md:px-8 py-6 flex items-center justify-between rounded-t-2xl z-10">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight">Cerere de închiriere</h2>
                                    <p className="mt-1 text-sm text-gray-500">{car.make + ' ' + car.model}</p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="overflow-y-auto max-h-[calc(95vh-200px)] md:max-h-[calc(92vh-200px)]">
                                {submitSuccess ? (
                                    /* Success View */
                                    <div className="px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
                                        {/* Success Message Card */}
                                        <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8">
                                            <div className="mb-4">
                                                <span className="text-sm font-semibold tracking-wider text-red-500 uppercase">
                                                    Confirmare
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-4">
                                                <div className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600 flex-shrink-0">
                                                    <CheckCircle className="w-7 h-7 text-white" strokeWidth={2.5} />
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 leading-tight mb-3">
                                                        Cererea a fost trimisă cu succes!
                                                    </h2>
                                                    <p className="text-gray-600 text-base leading-relaxed">
                                                        În scurt timp vă vom contacta pentru confirmare.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Registration Card - Only show if user is logged out */}
                                        {!user && (
                                            <div className="bg-white rounded-2xl border border-gray-300 shadow-sm p-6 md:p-8">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600 flex-shrink-0">
                                                        <UserRound className="w-5 h-5 text-white" strokeWidth={2} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-xl font-bold text-gray-800 mb-3">
                                                            Creează cont pentru acces rapid
                                                        </h3>
                                                        <p className="text-gray-600 text-sm leading-relaxed mb-6">
                                                            Pentru a vedea și a avea acces rapid la cererile și comenzile dvs., puteți să vă înregistrați.
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                onClose();
                                                                navigate('/auth/signup');
                                                            }}
                                                            className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg text-base"
                                                        >
                                                            Creează cont
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="px-4 md:px-8 py-6 md:py-8 space-y-6 md:space-y-8">
                                        {/* Rental Period */}
                                        <div className="bg-white rounded-2xl border border-gray-300 p-4 md:p-6 shadow-sm">
                                            <div className="mb-3 md:mb-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                                        <Calendar className="w-5 h-5 text-white" />
                                                    </div>
                                                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                                                        Perioada închirierii
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="space-y-2 md:space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-600 text-sm md:text-base">
                                                        {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                                        {rentalCalculation.hours > 0 && `, ${rentalCalculation.hours} ${rentalCalculation.hours === 1 ? 'oră' : 'ore'}`}
                                                    </span>
                                                </div>

                                                {/* Discount indicator */}
                                                {discountPercentage > 0 && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: -10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className="p-2.5 md:p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                                                    >
                                                        <div className="flex items-center gap-2 text-emerald-700 text-xs md:text-sm font-semibold">
                                                            <div className="p-1 bg-emerald-500/20 rounded-lg flex-shrink-0">
                                                                <Check className="w-3 h-3 text-emerald-600" />
                                                            </div>
                                                            <span>
                                                                {discountPercentage === 4
                                                                    ? 'Reducere de 4% pentru 8+ zile'
                                                                    : 'Reducere de 2% pentru 4+ zile'
                                                                }
                                                            </span>
                                                        </div>
                                                    </motion.div>
                                                )}

                                                <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-3 border-t border-gray-300">
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data preluării</p>
                                                        <p className="text-gray-900 font-semibold text-sm md:text-base">{formatDate(pickupDate)}</p>
                                                        <p className="text-gray-500 text-xs md:text-sm">ora {pickupTime}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data returnării</p>
                                                        <p className="text-gray-900 font-semibold text-sm md:text-base">{formatDate(returnDate)}</p>
                                                        <p className="text-gray-500 text-xs md:text-sm">ora {returnTime}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="bg-white rounded-2xl border border-gray-300 p-4 md:p-6 shadow-sm">
                                            <div className="mb-3 md:mb-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                                        <UserRound className="w-5 h-5 text-white" />
                                                    </div>
                                                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                                                        Date de contact
                                                    </h3>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-4">
                                                <div data-field="firstName">
                                                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                        Prenume <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.firstName}
                                                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-colors text-sm md:text-base ${hasAttemptedSubmit && fieldErrors.firstName
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'
                                                            }`}
                                                        required
                                                        maxLength={50}
                                                    />
                                                    {hasAttemptedSubmit && fieldErrors.firstName && (
                                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>
                                                    )}
                                                </div>
                                                <div data-field="lastName">
                                                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                        Nume <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.lastName}
                                                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-colors text-sm md:text-base ${hasAttemptedSubmit && fieldErrors.lastName
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'
                                                            }`}
                                                        required
                                                        maxLength={50}
                                                    />
                                                    {hasAttemptedSubmit && fieldErrors.lastName && (
                                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="mb-4" data-field="age">
                                                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                    Vârstă <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.age}
                                                    onChange={(e) => handleInputChange('age', e.target.value)}
                                                    placeholder="18"
                                                    min="18"
                                                    max="100"
                                                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-colors text-sm md:text-base ${hasAttemptedSubmit && fieldErrors.age
                                                        ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                        : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'
                                                        }`}
                                                    required
                                                />
                                                {hasAttemptedSubmit && fieldErrors.age && (
                                                    <p className="mt-1 text-xs text-red-500">{fieldErrors.age}</p>
                                                )}
                                            </div>
                                            {!user && (
                                                <div className="mb-4" data-field="email">
                                                    <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                        E-mail <span className="text-red-500">*</span>
                                                    </label>
                                                    <input
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                                        placeholder="email@mail.com"
                                                        className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-colors text-sm md:text-base ${hasAttemptedSubmit && fieldErrors.email
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'
                                                            }`}
                                                        required
                                                        maxLength={255}
                                                    />
                                                    {hasAttemptedSubmit && fieldErrors.email && (
                                                        <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                                                    )}
                                                </div>
                                            )}
                                            <div data-field="phone">
                                                <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">
                                                    Telefon <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 country-code-dropdown-container">
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                                                            className="flex items-center gap-1.5 text-gray-600 hover:text-gray-900 text-sm font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                                                        >
                                                            <span>{selectedCountryCode.flag}</span>
                                                            <span>{selectedCountryCode.code}</span>
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                        {showCountryCodeDropdown && (
                                                            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 min-w-[200px]">
                                                                {COUNTRY_CODES.map((country) => (
                                                                    <button
                                                                        key={country.code}
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setSelectedCountryCode(country);
                                                                            setShowCountryCodeDropdown(false);
                                                                        }}
                                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                                    >
                                                                        <span>{country.flag}</span>
                                                                        <span className="flex-1 text-left">{country.country}</span>
                                                                        <span className="text-gray-500">{country.code}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        value={formData.phone}
                                                        onChange={(e) => handleInputChange('phone', e.target.value)}
                                                        placeholder="000 00 000"
                                                        className={`w-full pl-28 pr-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 transition-colors ${hasAttemptedSubmit && fieldErrors.phone
                                                            ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                            : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'
                                                            }`}
                                                        required
                                                        maxLength={20}
                                                    />
                                                </div>
                                                {hasAttemptedSubmit && fieldErrors.phone && (
                                                    <p className="mt-1 text-xs text-red-500">{fieldErrors.phone}</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rental Options */}
                                        <div className="bg-white rounded-2xl border border-gray-300 p-4 md:p-6 shadow-sm">
                                            <div className="mb-3 md:mb-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                                        <Car className="w-5 h-5 text-white" />
                                                    </div>
                                                    <h3 className="text-base md:text-lg font-bold text-gray-800">
                                                        Opțiuni de închiriere
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Limits */}
                                            <div className="mb-5 md:mb-6">
                                                <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Limite</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.unlimitedKm}
                                                                    onChange={(e) => handleOptionChange('unlimitedKm', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.unlimitedKm
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.unlimitedKm ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Kilometraj nelimitat</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-red-600 bg-red-50 px-2 md:px-3 py-1 rounded-lg">+50%</span>
                                                    </label>

                                                </div>
                                            </div>

                                            {/* VIP Services */}
                                            <div className="mb-5 md:mb-6">
                                                <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Servicii VIP</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.personalDriver}
                                                                    onChange={(e) => handleOptionChange('personalDriver', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.personalDriver
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.personalDriver ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Șofer personal</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">800 MDL/zi</span>
                                                    </label>

                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.priorityService}
                                                                    onChange={(e) => handleOptionChange('priorityService', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.priorityService
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.priorityService ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Priority Service</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">1 000 MDL/zi</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Insurance */}
                                            <div className="mb-5 md:mb-6">
                                                <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Asigurare</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.tireInsurance}
                                                                    onChange={(e) => handleOptionChange('tireInsurance', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.tireInsurance
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.tireInsurance ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Asigurare anvelope & parbriz</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-red-600 bg-red-50 px-2 md:px-3 py-1 rounded-lg">+20%</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Additional */}
                                            <div>
                                                <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 md:mb-3">Suplimentar</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.childSeat}
                                                                    onChange={(e) => handleOptionChange('childSeat', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.childSeat
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.childSeat ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Scaun auto pentru copii</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">100 MDL/zi</span>
                                                    </label>

                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.simCard}
                                                                    onChange={(e) => handleOptionChange('simCard', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.simCard
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.simCard ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Cartelă SIM cu internet</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">100 MDL/zi</span>
                                                    </label>

                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.roadsideAssistance}
                                                                    onChange={(e) => handleOptionChange('roadsideAssistance', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.roadsideAssistance
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.roadsideAssistance ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Asistență rutieră</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-gray-900 bg-gray-100 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">500 MDL/zi</span>
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Delivery */}
                                            <div className="mb-5 md:mb-6">
                                                <h4 className="text-xs md:text-sm font-semibold text-gray-900 mb-2 mt-4 md:mb-3">Livrare</h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-white border border-gray-300 hover:shadow-md cursor-pointer transition-all duration-200 group">
                                                        <div className="flex items-center gap-3 md:gap-4">
                                                            <div className="relative flex-shrink-0">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={options.airportDelivery}
                                                                    onChange={(e) => handleOptionChange('airportDelivery', e.target.checked)}
                                                                    className="sr-only"
                                                                />
                                                                <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.airportDelivery
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'border-gray-300 bg-white group-hover:border-red-400'
                                                                    }`}>
                                                                    <svg
                                                                        className={`w-3 h-3 text-white transition-opacity duration-200 ${options.airportDelivery ? 'opacity-100' : 'opacity-0'
                                                                            }`}
                                                                        fill="currentColor"
                                                                        viewBox="0 0 20 20"
                                                                    >
                                                                        <path
                                                                            fillRule="evenodd"
                                                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                            clipRule="evenodd"
                                                                        />
                                                                    </svg>
                                                                </div>
                                                            </div>
                                                            <span className="font-medium text-gray-900 text-xs md:text-sm">Livrare aeroport</span>
                                                        </div>
                                                        <span className="text-xs md:text-sm font-bold text-green-600 bg-green-50 px-2 md:px-3 py-1 rounded-lg whitespace-nowrap">Gratuit</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Comment */}
                                        <div data-field="comment">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Comentariu <span className="text-gray-400 font-normal">(opțional)</span></label>
                                            <textarea
                                                value={formData.comment}
                                                onChange={(e) => handleInputChange('comment', e.target.value)}
                                                rows={3}
                                                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-1 resize-none transition-colors ${hasAttemptedSubmit && fieldErrors.comment
                                                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                                                    : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900 hover:border-gray-400'
                                                    }`}
                                                placeholder="Adăugați un comentariu (opțional)"
                                                maxLength={1000}
                                            />
                                            {hasAttemptedSubmit && fieldErrors.comment && (
                                                <p className="mt-1 text-xs text-red-500">{fieldErrors.comment}</p>
                                            )}
                                            {formData.comment.length > 0 && (
                                                <p className="mt-1 text-xs text-gray-500 text-right">
                                                    {formData.comment.length}/1000 caractere
                                                </p>
                                            )}
                                        </div>

                                        {/* Price Summary */}
                                        <div className="bg-white rounded-2xl border border-gray-300 p-4 md:p-6 shadow-sm mt-6">
                                            <div className="mb-3 md:mb-4">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg bg-gradient-to-b from-red-500 to-red-600">
                                                        <Star className="w-5 h-5 text-white" />
                                                    </div>
                                                    <h3 className="text-base md:text-lg font-bold text-gray-800">Detalii preț</h3>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between text-sm md:text-base">
                                                    <span className="text-gray-600">Preț pe zi</span>
                                                    <span className="text-gray-900 font-medium">{car.price_per_day.toLocaleString('ro-RO')} MDL</span>
                                                </div>
                                                <div className="flex items-center justify-between text-sm md:text-base">
                                                    <span className="text-gray-600">Perioadă</span>
                                                    <span className="text-gray-900 font-medium">
                                                        {rentalCalculation.days} {rentalCalculation.days === 1 ? 'zi' : 'zile'}
                                                        {rentalCalculation.hours > 0 && `, ${rentalCalculation.hours} ${rentalCalculation.hours === 1 ? 'oră' : 'ore'}`}
                                                    </span>
                                                </div>
                                                {discountPercentage > 0 && (
                                                    <div className="flex items-center justify-between text-sm md:text-base text-green-600">
                                                        <span>Reducere</span>
                                                        <span className="font-medium">-{discountPercentage}%</span>
                                                    </div>
                                                )}
                                                <div className="pt-2 border-t border-gray-300">
                                                    <div className="flex items-center justify-between text-sm md:text-base">
                                                        <span className="text-gray-900 font-medium">Preț de bază</span>
                                                        <span className="text-gray-900 font-medium">{Math.round(basePrice).toLocaleString('ro-RO')} MDL</span>
                                                    </div>
                                                </div>

                                                {additionalCosts > 0 && (
                                                    <>
                                                        <div className="pt-3 border-t border-gray-300">
                                                            <h4 className="text-sm md:text-base font-bold text-gray-900 mb-3">Servicii suplimentare</h4>
                                                            <div className="space-y-2 text-sm md:text-base">
                                                                {options.unlimitedKm && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Kilometraj nelimitat</span>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {Math.round(car.price_per_day * rentalCalculation.days * 0.5).toLocaleString('ro-RO')} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {options.tireInsurance && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Asigurare anvelope & parbriz</span>
                                                                        <span className="text-gray-900 font-medium">
                                                                            {Math.round(car.price_per_day * rentalCalculation.days * 0.2).toLocaleString('ro-RO')} MDL
                                                                        </span>
                                                                    </div>
                                                                )}
                                                                {options.personalDriver && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Șofer personal</span>
                                                                        <span className="text-gray-900 font-medium">{800 * rentalCalculation.days} MDL</span>
                                                                    </div>
                                                                )}
                                                                {options.priorityService && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Priority Service</span>
                                                                        <span className="text-gray-900 font-medium">{1000 * rentalCalculation.days} MDL</span>
                                                                    </div>
                                                                )}
                                                                {options.childSeat && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Scaun auto pentru copii</span>
                                                                        <span className="text-gray-900 font-medium">{100 * rentalCalculation.days} MDL</span>
                                                                    </div>
                                                                )}
                                                                {options.simCard && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Cartelă SIM cu internet</span>
                                                                        <span className="text-gray-900 font-medium">{100 * rentalCalculation.days} MDL</span>
                                                                    </div>
                                                                )}
                                                                {options.roadsideAssistance && (
                                                                    <div className="flex justify-between">
                                                                        <span className="text-gray-600">Asistență rutieră</span>
                                                                        <span className="text-gray-900 font-medium">{500 * rentalCalculation.days} MDL</span>
                                                                    </div>
                                                                )}
                                                                <div className="pt-2 border-t border-gray-300">
                                                                    <div className="flex justify-between font-medium text-sm md:text-base">
                                                                        <span className="text-gray-900">Total servicii</span>
                                                                        <span className="text-gray-900">{Math.round(additionalCosts).toLocaleString('ro-RO')} MDL</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </>
                                                )}

                                                <div className="pt-3 border-t border-gray-300 flex items-center justify-between">
                                                    <span className="text-gray-900 font-bold text-base md:text-lg">Total</span>
                                                    <span className="text-gray-900 font-bold text-lg md:text-xl">{totalCost.toLocaleString('ro-RO')} MDL</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Submit Button */}
                                        <div className="flex flex-col gap-2 mt-6">
                                            {submitError && (
                                                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                                                    <p className="text-sm text-red-800 font-medium text-center">
                                                        {submitError}
                                                    </p>
                                                </div>
                                            )}
                                            <button
                                                type="submit"
                                                onClick={handleSubmit}
                                                disabled={isSubmitting || submitSuccess}
                                                className="w-full font-semibold text-sm md:text-base py-3.5 px-6 rounded-xl transition-all bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSubmitting ? 'Se trimite...' : submitSuccess ? 'Trimis cu succes!' : 'Trimite cererea'}
                                            </button>
                                            <p className="text-[10px] md:text-xs text-center text-gray-500 leading-relaxed">
                                                Făcând clic pe butonul «Trimite cererea», sunteți de acord cu{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTermsModalType('terms');
                                                        setShowTermsModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 underline"
                                                >
                                                    termenii de utilizare
                                                </button>
                                                {' '}și{' '}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setTermsModalType('privacy');
                                                        setShowTermsModal(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 underline"
                                                >
                                                    politica de confidențialitate
                                                </button>
                                            </p>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </React.Fragment>
            )}

            {/* Terms/Privacy Modal */}
            <AnimatePresence>
                {showTermsModal && (
                    <React.Fragment key="terms-container">
                        <motion.div
                            key="terms-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
                            onClick={() => setShowTermsModal(false)}
                        />
                        <motion.div
                            key="terms-modal"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ duration: 0.2 }}
                            className="fixed inset-0 z-[10001] flex items-center justify-center p-4"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="bg-white rounded-2xl border border-gray-300 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                                {/* Header */}
                                <div className="sticky top-0 bg-white border-b border-gray-300 px-6 md:px-8 py-4 flex items-center justify-between rounded-t-2xl z-10">
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-800">
                                            {termsModalType === 'terms' ? 'Termeni și condiții' : 'Politica de confidențialitate'}
                                        </h2>
                                    </div>
                                    <button
                                        onClick={() => setShowTermsModal(false)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-all flex-shrink-0"
                                    >
                                        <X className="w-5 h-5 text-gray-500" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="overflow-y-auto max-h-[calc(90vh-100px)] px-6 md:px-8 py-6">
                                    {termsModalType === 'terms' ? (
                                        <div className="space-y-6">
                                            {/* Intro Section */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                                                            {t('pages.terms.sections.intro.title')}
                                                        </h3>
                                                        <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                            {t('pages.terms.sections.intro.description')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Cookies Section */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                                        <Cookie className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                                                            {t('pages.terms.sections.cookies.title')}
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {[1, 2, 3, 4].map((num) => (
                                                                <li key={num} className="flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                                        {t(`pages.terms.sections.cookies.bullet${num}`)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Payment Section */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                                        <CreditCard className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                                                            {t('pages.terms.sections.payment.title')}
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {[1, 2, 3, 4].map((num) => (
                                                                <li key={num} className="flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                                        {t(`pages.terms.sections.payment.bullet${num}`)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {/* Personal Data Section */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                                        <Shield className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                                                            {t('pages.terms.sections.personal-data.title')}
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {[1, 2, 3, 4].map((num) => (
                                                                <li key={num} className="flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                                        {t(`pages.terms.sections.personal-data.bullet${num}`)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Location Section */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                                        <MapPin className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                                                            {t('pages.terms.sections.location.title')}
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {[1, 2, 3, 4].map((num) => (
                                                                <li key={num} className="flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                                        {t(`pages.terms.sections.location.bullet${num}`)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Notifications Section */}
                                            <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-6">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center flex-shrink-0">
                                                        <Bell className="w-5 h-5 text-white" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3">
                                                            {t('pages.terms.sections.notifications.title')}
                                                        </h3>
                                                        <ul className="space-y-2">
                                                            {[1, 2, 3, 4].map((num) => (
                                                                <li key={num} className="flex items-start gap-2">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 flex-shrink-0" />
                                                                    <span className="text-gray-600 leading-relaxed text-sm md:text-base">
                                                                        {t(`pages.terms.sections.notifications.bullet${num}`)}
                                                                    </span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </React.Fragment>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

