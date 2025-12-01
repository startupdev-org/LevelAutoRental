import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    CheckCircle,
    XIcon,
    Loader2,
    Edit,
    Check,
    RefreshCw,
    Calendar,
    Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Car as CarType } from '../../../../types';
import { OrderDisplay } from '../../../../lib/orders';
import { getDateDiffInDays } from '../../../../utils/date';

export interface RequestDetailsModalProps {
    request: OrderDisplay;
    onClose: () => void;
    onAccept: (request: OrderDisplay) => void;
    onReject: (request: OrderDisplay) => void;
    onUndoReject?: (request: OrderDisplay) => void;
    onSetToPending?: (request: OrderDisplay) => void;
    onEdit?: (request: OrderDisplay) => void;
    onCancelRental?: (request: OrderDisplay) => void;
    isProcessing?: boolean;
    cars: CarType[];
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ request, onClose, onAccept, onReject, onUndoReject, onSetToPending, onEdit, onCancelRental, isProcessing = false, cars }) => {
    const { t } = useTranslation();
    const car = cars.find(c => c.id.toString() === request.carId);
    if (!car) return null;

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const formatTime = (timeString: string): string => {
        if (!timeString) return '00:00';
        // Convert to 24-hour format if needed
        if (timeString.includes('AM') || timeString.includes('PM')) {
            const [time, period] = timeString.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
        }
        // If already in HH:MM format, ensure it's padded
        if (timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':');
            return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
        }
        return '00:00';
    };

    const startDate = new Date(request.pickupDate);
    const endDate = new Date(request.returnDate);

    // Parse times and combine with dates for accurate calculation
    const pickupTime = formatTime(request.pickupTime);
    const returnTime = formatTime(request.returnTime);
    const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
    const [returnHour, returnMin] = returnTime.split(':').map(Number);

    const startDateTime = new Date(startDate);
    startDateTime.setHours(pickupHour, pickupMin, 0, 0);

    const endDateTime = new Date(endDate);
    // If return time is 00:00, treat it as end of previous day (23:59:59)
    if (returnHour === 0 && returnMin === 0) {
        endDateTime.setHours(23, 59, 59, 999);
    } else {
        endDateTime.setHours(returnHour, returnMin, 0, 0);
    }

    const diffTime = endDateTime.getTime() - startDateTime.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const days = diffDays;
    const hours = diffHours >= 0 ? diffHours : 0; // Ensure hours is never negative

    // Calculate pricing using same system as Calculator.tsx
    const rentalDays = days; // Use full days for discount calculation (same as Calculator)
    const totalDays = days + (hours / 24); // Use total days for final calculation

    // Base price calculation (same as Calculator.tsx)
    let basePrice = 0;
    let discountPercent = 0;

    if (rentalDays >= 8) {
        discountPercent = 4;
        basePrice = car.price_per_day * 0.96 * rentalDays; // -4%
    } else if (rentalDays >= 4) {
        discountPercent = 2;
        basePrice = car.price_per_day * 0.98 * rentalDays; // -2%
    } else {
        basePrice = car.price_per_day * rentalDays;
    }

    // Add hours portion (hours are charged at full price, no discount)
    if (hours > 0) {
        const hoursPrice = (hours / 24) * car.price_per_day;
        basePrice += hoursPrice;
    }

    // Calculate additional costs from options (same as Calculator.tsx)
    const options = (request as any).options;
    let parsedOptions: any = {};

    if (options) {
        if (typeof options === 'string') {
            try {
                parsedOptions = JSON.parse(options);
            } catch (e) {
                parsedOptions = {};
            }
        } else {
            parsedOptions = options;
        }
    }

    let additionalCosts = 0;
    const baseCarPrice = car.price_per_day;

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

    // Total price = base price + additional costs
    const totalPrice = basePrice + additionalCosts;
    const pricePerDay = totalDays > 0 ? Math.round(totalPrice / totalDays) : car.price_per_day;

    // Get customer information - prefer separate fields, fallback to parsing name
    const firstName = request.customerFirstName || request.customerName?.split(' ')[0] || '';
    const lastName = request.customerLastName || request.customerName?.split(' ').slice(1).join(' ') || '';
    const age = request.customerAge || undefined;

    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
            onClick={onClose}
            style={{ zIndex: 10000 }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg md:rounded-xl shadow-lg max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
                style={{ pointerEvents: 'auto' }}
            >
                {/* Header */}
                <div className="sticky top-0 border-b border-white/20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">{t('admin.requestDetails.rentalRequest')}</h2>
                        <p className="text-gray-400 text-sm md:text-sm mt-1">{(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Rental Period */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.rentalPeriod')}</h3>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-300 text-sm md:text-base">
                                    {days} {t('admin.requestDetails.days')}{days !== 1 ? '' : ''}, {hours} {t('admin.requestDetails.hours')}{hours !== 1 ? '' : ''}
                                </span>
                            </div>

                            {/* Discount indicator */}
                            {discountPercent > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2.5 md:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
                                >
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs md:text-sm font-semibold">
                                        <div className="p-1 bg-emerald-500/20 rounded-lg flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>
                                            {discountPercent === 4
                                                ? t('admin.requestDetails.discount4Percent')
                                                : t('admin.requestDetails.discount2Percent')
                                            }
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-3 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.requestDetails.pickupDate')}</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDate(request.pickupDate)}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{t('admin.requestDetails.atTime')} {formatTime(request.pickupTime)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.requestDetails.returnDate')}</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDate(request.returnDate)}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{t('admin.requestDetails.atTime')} {formatTime(request.returnTime)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.contactInformation')}</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.firstName')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{firstName || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.lastName')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{lastName || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.age')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{age ? `${age}` : '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.phone')}</label>
                                {request.customerPhone ? (
                                    <a
                                        href={`tel:${request.customerPhone.replace(/\s/g, '')}`}
                                        className="text-white font-medium text-sm md:text-base hover:text-emerald-400 transition-colors"
                                    >
                                        {request.customerPhone}
                                    </a>
                                ) : (
                                    <p className="text-white font-medium text-sm md:text-base">🇲🇩 +373</p>
                                )}
                            </div>
                            {request.customerEmail && (
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.emailOptional')}</label>
                                    <p className="text-white text-sm md:text-base">{request.customerEmail}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rental Options */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">{t('admin.requestDetails.rentalOptions')}</h3>

                        {/* Parse options from request */}
                        {(() => {
                            const options = (request as any).options;
                            let parsedOptions: any = {};

                            if (options) {
                                if (typeof options === 'string') {
                                    try {
                                        parsedOptions = JSON.parse(options);
                                    } catch (e) {
                                        parsedOptions = {};
                                    }
                                } else {
                                    parsedOptions = options;
                                }
                            }

                            const selectedOptions: Array<{ label: string; price: string; category: string }> = [];

                            // Pickup and Return
                            if (parsedOptions.pickupAtAddress) {
                                selectedOptions.push({ label: 'Preluarea la adresă', price: 'Cost separat', category: 'pickup-return' });
                            }
                            if (parsedOptions.returnAtAddress) {
                                selectedOptions.push({ label: 'Returnarea la adresă', price: 'Cost separat', category: 'pickup-return' });
                            }

                            // Limits
                            if (parsedOptions.unlimitedKm) {
                                selectedOptions.push({ label: 'Kilometraj nelimitat', price: '+50%', category: 'limits' });
                            }
                            if (parsedOptions.speedLimitIncrease) {
                                selectedOptions.push({ label: 'Creșterea limitei de viteză', price: '+20%', category: 'limits' });
                            }

                            // VIP Services
                            if (parsedOptions.personalDriver) {
                                selectedOptions.push({ label: 'Șofer personal', price: '800 MDL/zi', category: 'vip' });
                            }
                            if (parsedOptions.priorityService) {
                                selectedOptions.push({ label: 'Priority Service', price: '1 000 MDL/zi', category: 'vip' });
                            }

                            // Insurance
                            if (parsedOptions.tireInsurance) {
                                selectedOptions.push({ label: 'Asigurare anvelope & parbriz', price: '+20%', category: 'insurance' });
                            }

                            // Additional
                            if (parsedOptions.childSeat) {
                                selectedOptions.push({ label: 'Scaun auto pentru copii', price: '100 MDL/zi', category: 'additional' });
                            }
                            if (parsedOptions.simCard) {
                                selectedOptions.push({ label: 'Cartelă SIM cu internet', price: '100 MDL/zi', category: 'additional' });
                            }
                            if (parsedOptions.roadsideAssistance) {
                                selectedOptions.push({ label: 'Asistență rutieră', price: '500 MDL/zi', category: 'additional' });
                            }

                            if (selectedOptions.length === 0) {
                                return (
                                    <div className="text-center py-6 md:py-8">
                                        <p className="text-gray-400 text-sm">{t('admin.requestDetails.noOptionsSelected')}</p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                                    {selectedOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                                                <span className="text-white text-sm font-medium">{option.label}</span>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${option.price.includes('%')
                                                ? 'text-emerald-400 bg-emerald-400/10'
                                                : 'text-gray-300 bg-white/5'
                                                }`}>
                                                {option.price}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Comment - Only show if comment exists */}
                    {((request as any).comment || (request as any).customerComment) && (
                        <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                            <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.commentOptional')}</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{(request as any).comment || (request as any).customerComment}</p>
                        </div>
                    )}

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.priceDetails')}</h3>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{t('admin.requestDetails.pricePerDay')}</span>
                                <span className="text-white font-medium">{car.price_per_day} MDL</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">Durată</span>
                                <span className="text-white font-medium">
                                    {rentalDays} {rentalDays === 1 ? 'zi' : 'zile'}{hours > 0 ? `, ${hours} ${hours === 1 ? 'oră' : 'ore'}` : ''}
                                </span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex items-center justify-between text-sm text-emerald-400">
                                    <span>{t('admin.requestDetails.discount')}</span>
                                    <span className="font-medium">-{discountPercent}%</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white font-medium">{t('admin.requestDetails.basePrice')}</span>
                                    <span className="text-white font-medium">{Math.round(basePrice).toLocaleString()} MDL</span>
                                </div>
                            </div>

                            {additionalCosts > 0 && (
                                <>
                                    <div className="pt-2 md:pt-3 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-2 md:mb-3">{t('admin.requestDetails.additionalServices')}</h4>
                                        <div className="space-y-1.5 md:space-y-2 text-sm">
                                            {parsedOptions.unlimitedKm && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Kilometraj nelimitat</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(baseCarPrice * totalDays * 0.5).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.speedLimitIncrease && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.tireInsurance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.personalDriver && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Șofer personal</span>
                                                    <span className="text-white font-medium">{800 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.priorityService && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Priority Service</span>
                                                    <span className="text-white font-medium">{1000 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.childSeat && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Scaun auto pentru copii</span>
                                                    <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.simCard && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                    <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.roadsideAssistance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asistență rutieră</span>
                                                    <span className="text-white font-medium">{500 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            <div className="pt-1.5 md:pt-2 border-t border-white/10">
                                                <div className="flex justify-between font-medium text-sm">
                                                    <span className="text-white">{t('admin.requestDetails.totalServices')}</span>
                                                    <span className="text-white">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-2 md:pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-white font-bold text-base md:text-lg">{t('admin.requestDetails.total')}</span>
                                <span className="text-white font-bold text-lg md:text-xl">{Math.round(totalPrice).toLocaleString()} MDL</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {request.status === 'PENDING' && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAccept(request);
                                    // Don't close the modal here - the contract modal will open
                                }}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('admin.requestDetails.processing')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        {t('admin.requestDetails.acceptRequest')}
                                    </>
                                )}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject(request);
                                    onClose();
                                }}
                                disabled={isProcessing}
                                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('admin.requestDetails.processing')}
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4" />
                                        {t('admin.requestDetails.rejectRequest')}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    {request.status === 'APPROVED' && (onReject || onSetToPending) && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            {onSetToPending && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetToPending(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 hover:border-yellow-500/60 text-yellow-300 hover:text-yellow-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('admin.requestDetails.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            {t('admin.requestDetails.setToPending')}
                                        </>
                                    )}
                                </button>
                            )}
                            {onReject && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReject(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <X className="w-4 h-4" />
                                            Respinge Cererea
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                    {request.status === 'REJECTED' && (onUndoReject || onEdit) && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            {onUndoReject && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUndoReject(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('admin.requestDetails.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            {t('admin.requestDetails.undoReject')}
                                        </>
                                    )}
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    {t('admin.requestDetails.editRequest')}
                                </button>
                            )}
                        </div>
                    )}
                    {request.status === 'EXECUTED' && onCancelRental && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onCancelRental(request);
                                    onClose();
                                }}
                                disabled={isProcessing}
                                className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 hover:border-orange-500/60 text-orange-300 hover:text-orange-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('admin.requestDetails.processing')}
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4" />
                                        Anulează Închirierea
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// Request Details View Component
interface RequestDetailsViewProps {
    request: OrderDisplay;
    onBack: () => void;
    onAccept: (request: OrderDisplay) => void;
    onReject: (request: OrderDisplay) => void;
    onUndoReject?: (request: OrderDisplay) => void;
    onSetToPending?: (request: OrderDisplay) => void;
    onEdit?: (request: OrderDisplay) => void;
    cars: CarType[];
}

const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ request, onBack, onAccept, onReject, onUndoReject, onSetToPending, onEdit, cars }) => {
    const car = cars.find(c => c.id.toString() === request.carId);
    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image_url ?? undefined);

    useEffect(() => {
        if (car) {
            setSelectedImage(car.image_url ?? undefined);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [car]);

    if (!car) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8"
        >
            {/* LEFT COLUMN: Request Info */}
            <div className="space-y-6">
                {/* Car Summary */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-red-500/50 rounded-xl p-6 transition-all shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <img
                            src={selectedImage}
                            alt={(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                            className="w-32 h-20 object-cover rounded-lg border border-white/20"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-white">{(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}</h2>
                            <div className="text-sm text-gray-300">{car.transmission} · {car.seats} seats</div>
                        </div>
                    </div>
                </motion.div>

                {/* Booking Details */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 space-y-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white">Request Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                                <span className="text-white text-sm font-medium">{new Date(request.pickupDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{request.pickupTime || '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                                <span className="text-white text-sm font-medium">{new Date(request.returnDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{request.returnTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rental Days</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(request.pickupDate, request.returnDate)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estimated Price</p>
                            <span className="text-white text-lg font-bold">{request.amount ? `${request.amount} MDL` : '—'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Customer Info */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Customer</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                            {request.customerName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                            <div className="text-white font-semibold">{request.customerName}</div>
                            <div className="text-gray-300 text-sm">{request.customerEmail}</div>
                            {request.customerPhone && (
                                <div className="text-gray-300 text-sm mt-1">{request.customerPhone}</div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Status */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Status</h2>
                    <div className="flex items-center gap-4">
                        <span
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl ${request.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                : request.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                        >
                            {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                        </span>
                        {request.createdAt && (
                            <span className="text-gray-400 text-sm">
                                Requested on {new Date(request.createdAt).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* RIGHT COLUMN: Actions */}
            <aside className="lg:col-start-2">
                <motion.div
                    initial={{ opacity: 1, x: 0 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="sticky top-24 space-y-3"
                >
                    <button
                        onClick={onBack}
                        className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg"
                    >
                        Back to Requests
                    </button>
                    {request.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => onAccept(request)}
                                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Accept Request
                            </button>
                            <button
                                onClick={() => onReject(request)}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Respinge Cererea
                            </button>
                        </>
                    )}
                    {request.status === 'APPROVED' && (typeof onSetToPending !== 'undefined' || typeof onReject !== 'undefined') && (
                        <>
                            {onSetToPending && (
                                <button
                                    onClick={() => onSetToPending(request)}
                                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 hover:border-yellow-500/60 text-yellow-300 hover:text-yellow-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Set to Pending
                                </button>
                            )}
                            {onReject && (
                                <button
                                    onClick={() => onReject(request)}
                                    className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Respinge Cererea
                                </button>
                            )}
                        </>
                    )}
                    {request.status === 'REJECTED' && (onUndoReject || onEdit) && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            {onUndoReject && (
                                <button
                                    onClick={() => onUndoReject(request)}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Undo Reject
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(request)}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Request
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </aside>
        </motion.div>
    );
};

// Create Rental Modal Component
interface CreateRentalModalProps {
    onSave: (rentalData: Partial<OrderDisplay>) => void;
    onClose: () => void;
    cars: CarType[];
    initialCarId?: string;
}

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

