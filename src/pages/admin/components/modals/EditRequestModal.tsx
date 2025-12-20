import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    X,
    Calendar,
    Clock,
    Loader2,
    Save,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { BorrowRequestDTO, Car as CarType } from '../../../../types';
import { calculatePriceSummary, PriceSummaryResult } from '../../../../utils/car/pricing';
import { OptionsState } from '../../../../constants/rentalOptions';
import { DollarSign } from 'lucide-react';
import { formatTimeHHMM } from '../../../../utils/time/time';

export interface EditRequestModalProps {
    isOpen: boolean;
    request: BorrowRequestDTO;
    onSave: (updatedData: BorrowRequestDTO) => void;
    onClose: () => void;
}

export const EditRequestModal: React.FC<EditRequestModalProps> = ({ isOpen, request, onSave, onClose }) => {

    // Helper function to format date to YYYY-MM-DD for HTML date input
    const formatDateForInput = (date: Date | string | undefined): string => {
        if (!date) return '';

        try {
            const dateObj = typeof date === 'string' ? new Date(date) : date;
            if (isNaN(dateObj.getTime())) return '';

            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        } catch (e) {
            return '';
        }
    };

    // Initialize form data with current request values (admin can only edit these fields)
    const [formData, setFormData] = useState({
        start_date: formatDateForInput(request.start_date),
        start_time: formatTimeHHMM(request.start_time), // "HH:mm"
        end_date: formatDateForInput(request.end_date),
        end_time: formatTimeHHMM(request.end_time),     // "HH:mm"
        total_amount: request.total_amount || 0,
        comment: request.comment || '',
    });



    // Fixed time options for business hours
    const timeOptions = [
        '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00'
    ];

    // Parse options from request
    const parseOptions = (options: any) => {
        const defaultOptions = {
            unlimitedKm: false,
            personalDriver: false,
            priorityService: false,
            childSeat: false,
            simCard: false,
            roadsideAssistance: false,
            airportDelivery: false
        };

        if (!options) return defaultOptions;

        try {
            const parsed = typeof options === 'string' ? JSON.parse(options) : options;
            return { ...defaultOptions, ...parsed };
        } catch (e) {
            return defaultOptions;
        }
    };

    const [options, setOptions] = useState(parseOptions(request.options));
    const [isSaving, setIsSaving] = useState(false);

    // Calendar states
    const [showStartCalendar, setShowStartCalendar] = useState(false);
    const [showEndCalendar, setShowEndCalendar] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<{ start: Date; end: Date }>(() => {
        const startDate = request.start_date ? new Date(request.start_date) : new Date();
        const endDate = request.end_date ? new Date(request.end_date) : new Date();
        return { start: startDate, end: endDate };
    });
    const [priceSummary, setPriceSummary] = useState<PriceSummaryResult | null>(null);

    // Calendar refs
    const startCalendarRef = useRef<HTMLDivElement>(null);
    const endCalendarRef = useRef<HTMLDivElement>(null);

    // Update form data when request changes
    useEffect(() => {
        setFormData({
            start_date: formatDateForInput(request.start_date),
            start_time: request.start_time || '09:00',
            end_date: formatDateForInput(request.end_date),
            end_time: request.end_time || '17:00',
            total_amount: request.total_amount || 0,
            comment: request.comment || '',
        });

        setOptions(parseOptions(request.options));

        // Update calendar months when request changes
        const startDate = request.start_date ? new Date(request.start_date) : new Date();
        const endDate = request.end_date ? new Date(request.end_date) : new Date();
        setCalendarMonth({ start: startDate, end: endDate });
    }, [request]);

    // Auto-calculate total amount and price summary when dates or options change
    useEffect(() => {
        if (!formData.start_date || !formData.end_date || !request.car) {
            setPriceSummary(null);
            return;
        }

        // Use the centralized calculatePriceSummary function for consistency
        const priceSummary = calculatePriceSummary(
            request.car,
            {
                ...request,
                start_date: formData.start_date,
                end_date: formData.end_date,
                start_time: formData.start_time,
                end_time: formData.end_time,
            },
            options
        );

        if (priceSummary) {
            setPriceSummary(priceSummary);
            setFormData(prev => ({ ...prev, total_amount: priceSummary.totalPrice }));
        } else {
            setPriceSummary(null);
        }
    }, [formData.start_date, formData.end_date, formData.start_time, formData.end_time, options, request.price_per_day]);

    // Handle click outside calendars
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (showStartCalendar && startCalendarRef.current && !startCalendarRef.current.contains(event.target as Node)) {
                setShowStartCalendar(false);
            }
            if (showEndCalendar && endCalendarRef.current && !endCalendarRef.current.contains(event.target as Node)) {
                setShowEndCalendar(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showStartCalendar, showEndCalendar]);

    // Handle option changes
    const handleOptionChange = (optionKey: string, checked: boolean) => {
        setOptions((prev: OptionsState) => ({ ...prev, [optionKey]: checked }));
    };

    // Calendar helper functions
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

    // Handle date selection from calendar
    const handleDateSelect = (dateString: string, isStartDate: boolean) => {
        if (isStartDate) {
            // Check if start date is being changed
            const isChangingStartDate = formData.start_date && formData.start_date !== dateString;

            // If changing start date, clear end date if it's before or equal to new start
            if (isChangingStartDate && formData.end_date && dateString >= formData.end_date) {
                setFormData(prev => ({ ...prev, start_date: dateString, end_date: '' }));
            } else {
                setFormData(prev => ({ ...prev, start_date: dateString }));
            }

            // Close calendar after 0.3s delay for visual feedback
            setIsClosingWithDelay(true);
            setTimeout(() => {
                setShowStartCalendar(false);
                setIsClosingWithDelay(false);
            }, 300);
        } else {
            setFormData(prev => ({ ...prev, end_date: dateString }));

            // Close calendar after 0.3s delay for visual feedback
            setIsClosingWithDelay(true);
            setTimeout(() => {
                setShowEndCalendar(false);
                setIsClosingWithDelay(false);
            }, 300);
        }
    };

    const handleInputChange = (field: string, value: any) => {
        let processedValue = value;

        // Input processing for admin-editable fields only
        if (field === 'comment') {
            if (processedValue.length > 1000) {
                processedValue = processedValue.substring(0, 1000);
            }
        }

        setFormData(prev => ({ ...prev, [field]: processedValue }));
    };

    const handleSave = async () => {
        // No validation needed for customer info (read-only)
        // Admin can only modify dates, amounts, options, and comments

        setIsSaving(true);
        try {
            const updatedRequest = {
                ...request,
                // Keep original customer information (not modified by admin)
                customer_first_name: request.customer_first_name,
                customer_last_name: request.customer_last_name,
                customer_name: request.customer_name,
                customer_email: request.customer_email,
                customer_phone: request.customer_phone,
                // Update only admin-modifiable fields
                start_date: formData.start_date,
                start_time: formData.start_time,
                end_date: formData.end_date,
                end_time: formData.end_time,
                total_amount: formData.total_amount,
                comment: formData.comment || undefined,
                options: options,
            };

            await onSave(updatedRequest);
            // Don't close automatically - let parent handle the close
        } catch (error) {
            console.error('Error saving request:', error);
        } finally {
            setIsSaving(false);
        }
    };

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
                        <h2 className="text-xl sm:text-2xl font-bold text-white">Editează Cererea</h2>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                            Modifică detaliile cererii de închiriere
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
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span className="text-sm sm:text-base">Perioada Închirierii</span>
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="relative" ref={startCalendarRef}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                    Data Început *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowStartCalendar(!showStartCalendar)}
                                    className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-between hover:bg-white/10 transition-colors"
                                >
                                    <span>{formData.start_date ? new Date(formData.start_date).toLocaleDateString('ro-RO') : 'Selectează data'}</span>
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                </button>

                                {/* Start Date Calendar Dropdown */}
                                {showStartCalendar && (
                                    <div className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full min-w-[280px]">
                                        {/* Month Navigation */}
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.start);
                                                    newDate.setMonth(newDate.getMonth() - 1);
                                                    setCalendarMonth(prev => ({ ...prev, start: newDate }));
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <div className="text-sm font-medium text-gray-700">
                                                {calendarMonth.start.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.start);
                                                    newDate.setMonth(newDate.getMonth() + 1);
                                                    setCalendarMonth(prev => ({ ...prev, start: newDate }));
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>

                                        {/* Instruction Message */}
                                        <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-600">
                                                {!formData.start_date
                                                    ? 'Selectează data de început'
                                                    : 'Clic pentru a schimba data de început'}
                                            </p>
                                        </div>

                                        {/* Days of Week */}
                                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                            {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                <div key={day} className="text-gray-500 font-medium">{day}</div>
                                            ))}
                                        </div>

                                        {/* Calendar Days */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {generateCalendarDays(calendarMonth.start).map((day, index) => {
                                                if (!day) return <div key={index}></div>;

                                                const dayDate = new Date(day);
                                                const isSelected = day === formData.start_date;
                                                const isEndDate = day === formData.end_date;
                                                // Check if date is in range between start and end
                                                const isInRange = formData.start_date && formData.end_date &&
                                                    day > formData.start_date &&
                                                    day < formData.end_date;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors cursor-pointer relative ${isSelected
                                                            ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                            : isEndDate
                                                                ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                : isInRange
                                                                    ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                                                                    : 'text-gray-700 hover:bg-gray-100'
                                                            }`}
                                                        onClick={() => handleDateSelect(day, true)}
                                                    >
                                                        <span className="relative z-0">{dayDate.getDate()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                    Ora Început
                                </label>
                                <input
                                    type="time"
                                    value={formData.start_time} // must be "HH:mm"
                                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                            <div className="relative" ref={endCalendarRef}>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                    Data Sfârșit *
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowEndCalendar(!showEndCalendar)}
                                    className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 flex items-center justify-between hover:bg-white/10 transition-colors"
                                >
                                    <span>{formData.end_date ? new Date(formData.end_date).toLocaleDateString('ro-RO') : 'Selectează data'}</span>
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                </button>

                                {/* End Date Calendar Dropdown */}
                                {showEndCalendar && (
                                    <div className="absolute z-50 top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-3 w-full min-w-[280px]">
                                        {/* Month Navigation */}
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.end);
                                                    newDate.setMonth(newDate.getMonth() - 1);
                                                    setCalendarMonth(prev => ({ ...prev, end: newDate }));
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                                            </button>
                                            <div className="text-sm font-medium text-gray-700">
                                                {calendarMonth.end.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.end);
                                                    newDate.setMonth(newDate.getMonth() + 1);
                                                    setCalendarMonth(prev => ({ ...prev, end: newDate }));
                                                }}
                                                className="p-1 hover:bg-gray-100 rounded transition-colors"
                                            >
                                                <ChevronRight className="w-4 h-4 text-gray-600" />
                                            </button>
                                        </div>

                                        {/* Instruction Message */}
                                        <div className="mb-3 px-2 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-xs text-gray-600">
                                                {!formData.end_date
                                                    ? 'Selectează data de sfârșit'
                                                    : 'Clic pentru a schimba data de sfârșit'}
                                            </p>
                                        </div>

                                        {/* Days of Week */}
                                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                            {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                <div key={day} className="text-gray-500 font-medium">{day}</div>
                                            ))}
                                        </div>

                                        {/* Calendar Days */}
                                        <div className="grid grid-cols-7 gap-1">
                                            {generateCalendarDays(calendarMonth.end).map((day, index) => {
                                                if (!day) return <div key={index}></div>;

                                                const dayDate = new Date(day);
                                                const isSelected = day === formData.end_date;
                                                const isStartDate = day === formData.start_date;
                                                const isBeforeStart = formData.start_date && day < formData.start_date;
                                                // Check if date is in range between start and end
                                                const isInRange = formData.start_date && formData.end_date &&
                                                    day > formData.start_date &&
                                                    day < formData.end_date;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`w-8 h-8 flex items-center justify-center text-xs rounded transition-colors relative ${isBeforeStart
                                                            ? 'text-gray-300 cursor-not-allowed'
                                                            : isSelected
                                                                ? 'bg-red-500 text-white hover:bg-red-600 font-medium cursor-pointer'
                                                                : isStartDate
                                                                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium cursor-pointer'
                                                                    : isInRange
                                                                        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 cursor-pointer'
                                                                        : 'text-gray-700 hover:bg-gray-100 cursor-pointer'
                                                            }`}
                                                        onClick={() => !isBeforeStart && handleDateSelect(day, false)}
                                                    >
                                                        <span className="relative z-0">{dayDate.getDate()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                    Ora Sfârșit
                                </label>
                                <input
                                    type='time'
                                    value={formData.end_time}
                                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Additional Services/Options */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                            <span className="text-sm sm:text-base">Servicii Adiționale</span>
                        </h3>
                        <div className="space-y-2">
                            {/* Unlimited Km */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 group">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={options.unlimitedKm}
                                            onChange={(e) => handleOptionChange('unlimitedKm', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.unlimitedKm
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-white/5 hover:border-red-400'
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
                                    <span className="text-white text-xs sm:text-sm">Kilometraj nelimitat</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-emerald-400">+50%</span>
                            </label>

                            {/* Personal Driver */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 group">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={options.personalDriver}
                                            onChange={(e) => handleOptionChange('personalDriver', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.personalDriver
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-white/5 hover:border-red-400'
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
                                    <span className="text-white text-xs sm:text-sm">Șofer personal</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-300">800 MDL/zi</span>
                            </label>

                            {/* Priority Service */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 group">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={options.priorityService}
                                            onChange={(e) => handleOptionChange('priorityService', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.priorityService
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-white/5 hover:border-red-400'
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
                                    <span className="text-white text-xs sm:text-sm">Priority Service</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-300">1000 MDL/zi</span>
                            </label>

                            {/* Child Seat */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 group">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={options.childSeat}
                                            onChange={(e) => handleOptionChange('childSeat', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.childSeat
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-white/5 hover:border-red-400'
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
                                    <span className="text-white text-xs sm:text-sm">Scaun auto pentru copii</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-300">100 MDL/zi</span>
                            </label>

                            {/* SIM Card */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 group">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={options.simCard}
                                            onChange={(e) => handleOptionChange('simCard', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.simCard
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-white/5 hover:border-red-400'
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
                                    <span className="text-white text-xs sm:text-sm">Cartelă SIM cu internet</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-300">100 MDL/zi</span>
                            </label>

                            {/* Roadside Assistance */}
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all duration-200 group">
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-shrink-0">
                                        <input
                                            type="checkbox"
                                            checked={options.roadsideAssistance}
                                            onChange={(e) => handleOptionChange('roadsideAssistance', e.target.checked)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${options.roadsideAssistance
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-white/5 hover:border-red-400'
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
                                    <span className="text-white text-xs sm:text-sm">Asistență rutieră 24/7</span>
                                </div>
                                <span className="text-xs sm:text-sm font-semibold text-gray-300">500 MDL/zi</span>
                            </label>
                        </div>
                    </div>

                    {/* Comments */}
                    <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                        <div className="space-y-3 sm:space-y-4">
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                                    Comentariu
                                </label>
                                <textarea
                                    value={formData.comment}
                                    onChange={(e) => handleInputChange('comment', e.target.value)}
                                    className="w-full px-3 sm:px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs sm:text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                                    placeholder="Comentariu suplimentar..."
                                    rows={3}
                                    maxLength={1000}
                                />
                                <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                                    {formData.comment.length}/1000 caractere
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Price Details */}
                    {priceSummary && (
                        <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">Detalii Preț</span>
                            </h3>
                            <div className="space-y-3">
                                {/* Price per day and duration */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-xs sm:text-sm">Preț pe zi</span>
                                    <span className="text-white font-semibold text-sm sm:text-base">{Math.round(priceSummary.pricePerDay)} MDL</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-xs sm:text-sm">Durată închiriere</span>
                                    <span className="text-white font-semibold text-sm sm:text-base">
                                        {priceSummary.rentalDays} zile{priceSummary.rentalHours > 0 ? `, ${priceSummary.rentalHours} ore` : ''}
                                    </span>
                                </div>

                                {/* Base price */}
                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-medium text-sm sm:text-base">Preț de bază</span>
                                        <span className="text-white font-semibold text-sm sm:text-base">{Math.round(priceSummary.basePrice).toLocaleString()} MDL</span>
                                    </div>
                                </div>

                                {/* Additional services */}
                                {priceSummary.additionalCosts > 0 && (
                                    <div className="pt-3 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-3">Servicii Adiționale</h4>
                                        <div className="space-y-2 text-sm">
                                            {options.unlimitedKm && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Kilometraj nelimitat</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(priceSummary.baseCarPrice * (priceSummary.totalHours / 24) * 0.5).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {options.personalDriver && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Șofer personal</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(800 * (priceSummary.totalHours / 24)).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {options.priorityService && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Priority Service</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(1000 * (priceSummary.totalHours / 24)).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {options.childSeat && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Scaun auto pentru copii</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(100 * (priceSummary.totalHours / 24)).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {options.simCard && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(100 * (priceSummary.totalHours / 24)).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {options.roadsideAssistance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asistență rutieră 24/7</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(500 * (priceSummary.totalHours / 24)).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-white/10">
                                                <span className="text-white font-medium">Costuri suplimentare</span>
                                                <span className="text-white font-semibold">{Math.round(priceSummary.additionalCosts).toLocaleString()} MDL</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="pt-3 border-t border-white/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-base">Total</span>
                                        <span className="text-emerald-400 font-bold text-lg">{Math.round(priceSummary.totalPrice).toLocaleString()} MDL</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="border-t border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 bg-white/5 backdrop-blur-sm" style={{ backgroundColor: '#1C1C1C' }}>
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-3 sm:px-4 md:px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-all font-semibold text-xs sm:text-sm disabled:opacity-50"
                    >
                        Anulează
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-3 sm:px-4 md:px-6 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all font-semibold flex items-center justify-center gap-1.5 sm:gap-2 text-xs sm:text-sm disabled:opacity-50"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                                <span>Se salvează...</span>
                            </>
                        ) : (
                            <>
                                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span>Salvează Modificările</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
