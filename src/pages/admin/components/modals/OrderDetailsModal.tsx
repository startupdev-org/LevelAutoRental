import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    X,
    Calendar,
    Clock,
    Download,
    FileText,
    Loader2,
    RefreshCw,
    Car as CarIcon,
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { RentalDTO, Car } from '../../../../types';
import { formatDateLocal, getDateDiffInDays } from '../../../../utils/date';
import { formatTime } from '../../../../utils/time';
import { formatPrice } from '../../../../utils/currency';
import { parseRequestOptions } from '../../../../utils/car/options';
import { calculatePriceSummary } from '../../../../utils/car/pricing';
import { getCarName } from '../../../../utils/car/car';
import i18n from '../../../../i18n/i18n';

export interface OrderDetailsModalProps {
    isOpen: boolean;
    order: RentalDTO | null;
    orderNumber?: number;
    onClose: () => void;
    onCancel?: (order: RentalDTO) => void;
    onRedo?: (order: RentalDTO) => void;
    onOpenContractModal?: () => void;
    isProcessing?: boolean;
}

export const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
    isOpen,
    order,
    orderNumber,
    onClose,
    onCancel,
    onRedo,
    onOpenContractModal,
    isProcessing = false
}) => {
    const { t, i18n } = useTranslation();

    if (!isOpen || !order) return null;

    const car = order.car as Car;
    const startDate = formatDateLocal(order.start_date, t('config.date'));
    const endDate = formatDateLocal(order.end_date, t('config.date'));
    const pickupTime = formatTime(order.start_time || '09:00');
    const returnTime = formatTime(order.end_time || '17:00');

    const rentalDays = getDateDiffInDays(order.start_date, order.end_date);

    const options = parseRequestOptions(order.options);

    // Calculate price summary using the same function as RequestDetailsView
    const priceSummary = calculatePriceSummary(
        car,
        {
            ...order,
            start_date: order.start_date,
            end_date: order.end_date,
            start_time: order.start_time,
            end_time: order.end_time,
        },
        options
    );


    return createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                {/* Header */}
                <div className="sticky top-0 border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <div>
                            <h2 className="text-lg md:text-2xl font-bold text-white">
                                {t('admin.orders.orderDetails.title', { id: orderNumber || order.id })}
                            </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Order Info Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Car Information */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CarIcon className="w-5 h-5" />
                                {t('admin.orders.orderDetails.vehicle')}
                            </h3>
                            <div className="space-y-3">
                                {car?.image_url && (
                                    <img
                                        src={car.image_url}
                                        alt={getCarName(car)}
                                        className="w-full h-32 object-cover rounded-lg border border-white/10"
                                    />
                                )}
                                <div>
                                    <p className="text-white font-semibold text-lg">{getCarName(car)}</p>
                                    <p className="text-gray-400 text-sm">
                                        {car?.year} • {car?.transmission === 'automatic' ? 'Automat' : car?.transmission?.charAt(0).toUpperCase() + car?.transmission?.slice(1).toLowerCase()} • {car?.fuel_type === 'diesel' ? 'Diesel' : car?.fuel_type?.charAt(0).toUpperCase() + car?.fuel_type?.slice(1).toLowerCase()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                {t('admin.orders.orderDetails.customerInfo')}
                            </h3>
                            <div className="space-y-3">
                                {(order.customer_first_name || order.customer_last_name) && (
                                    <div className="flex items-center gap-3">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-white">
                                            {[order.customer_first_name, order.customer_last_name].filter(Boolean).join(' ') || 'N/A'}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center gap-3">
                                    <Mail className="w-4 h-4 text-gray-400" />
                                    <span className="text-white">{order.customer_email || 'N/A'}</span>
                                </div>
                                {order.customer_phone && (
                                    <div className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <a
                                            href={`tel:${order.customer_phone}`}
                                            className="text-blue-400 hover:text-blue-300 transition-colors underline"
                                        >
                                            {order.customer_phone}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Rental Period */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            {t('admin.orders.orderDetails.rentalPeriod')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-gray-400 text-sm mb-1">{t('admin.requests.pickup')}</p>
                                <p className="text-white font-semibold">{startDate}</p>
                                <p className="text-gray-400 text-sm flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {pickupTime}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm mb-1">{t('admin.requests.return')}</p>
                                <p className="text-white font-semibold">{endDate}</p>
                                <p className="text-gray-400 text-sm flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {returnTime}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10">
                            <p className="text-gray-400 text-sm">{t('admin.orders.orderDetails.duration')}</p>
                            <p className="text-white font-semibold">
                                {priceSummary ? `${priceSummary.rentalDays} zile${priceSummary.rentalHours > 0 ? `, ${priceSummary.rentalHours} ore` : ''}` : `${rentalDays} ${t('admin.orders.orderDetails.days')}`}
                            </p>
                        </div>
                    </div>

                    {/* Financial Details */}
                    {priceSummary && (
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <CreditCard className="w-5 h-5" />
                                {t('admin.orders.orderDetails.financialDetails')}
                            </h3>
                            <div className="space-y-3">
                                {/* Price per day and duration */}
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">Preț pe zi</span>
                                    <span className="text-white font-semibold text-base">{formatPrice(priceSummary.pricePerDay, 'MDL', i18n.language)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-300 text-sm">Durată închiriere</span>
                                    <span className="text-white font-semibold text-base">
                                        {priceSummary.rentalDays} zile{priceSummary.rentalHours > 0 ? `, ${priceSummary.rentalHours} ore` : ''}
                                    </span>
                                </div>

                                {/* Base price */}
                                <div className="pt-2 border-t border-white/10">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-medium text-base">Preț de bază</span>
                                        <span className="text-white font-semibold text-base">{formatPrice(priceSummary.basePrice, 'MDL', i18n.language)}</span>
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
                                                        {formatPrice(priceSummary.baseCarPrice * (priceSummary.totalHours / 24) * 0.5, 'MDL', i18n.language)}
                                                    </span>
                                                </div>
                                            )}
                                            {options.personalDriver && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Șofer personal</span>
                                                    <span className="text-white font-medium">
                                                        {formatPrice(800 * (priceSummary.totalHours / 24), 'MDL', i18n.language)}
                                                    </span>
                                                </div>
                                            )}
                                            {options.priorityService && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Priority Service</span>
                                                    <span className="text-white font-medium">
                                                        {formatPrice(1000 * (priceSummary.totalHours / 24), 'MDL', i18n.language)}
                                                    </span>
                                                </div>
                                            )}
                                            {options.childSeat && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Scaun auto pentru copii</span>
                                                    <span className="text-white font-medium">
                                                        {formatPrice(100 * (priceSummary.totalHours / 24), 'MDL', i18n.language)}
                                                    </span>
                                                </div>
                                            )}
                                            {options.simCard && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                    <span className="text-white font-medium">
                                                        {formatPrice(100 * (priceSummary.totalHours / 24), 'MDL', i18n.language)}
                                                    </span>
                                                </div>
                                            )}
                                            {options.roadsideAssistance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asistență rutieră 24/7</span>
                                                    <span className="text-white font-medium">
                                                        {formatPrice(500 * (priceSummary.totalHours / 24), 'MDL', i18n.language)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2 border-t border-white/10">
                                                <span className="text-white font-medium">Costuri suplimentare</span>
                                                {formatPrice(priceSummary.additionalCosts, 'MDL', i18n.language)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Total */}
                                <div className="pt-3 border-t border-white/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-white font-bold text-base">Total</span>
                                        <span className="text-emerald-400 font-bold text-lg">{formatPrice(priceSummary.totalPrice, 'MDL', i18n.language)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Options */}
                    {options && Object.keys(options).length > 0 && (
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">{t('admin.orders.orderDetails.options')}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {options.unlimitedKm && (
                                    <div className="flex items-center gap-2 text-white">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span>Kilometraj nelimitat</span>
                                    </div>
                                )}
                                {options.personalDriver && (
                                    <div className="flex items-center gap-2 text-white">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span>Șofer personal</span>
                                    </div>
                                )}
                                {options.childSeat && (
                                    <div className="flex items-center gap-2 text-white">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span>Scaun auto pentru copii</span>
                                    </div>
                                )}
                                {options.simCard && (
                                    <div className="flex items-center gap-2 text-white">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span>Cartelă SIM cu internet</span>
                                    </div>
                                )}
                                {options.roadsideAssistance && (
                                    <div className="flex items-center gap-2 text-white">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                                        <span>Asistență rutieră 24/7</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Contract */}
                    {order.contract_url && (
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                {t('admin.orders.orderDetails.contract')}
                            </h3>
                            <div className="space-y-4">
                                {/* Contract Info */}
                                <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="mb-2">
                                        <span className="text-white font-medium text-sm">Contract Închiriere Auto</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3">
                                        PDF • {formatDateLocal(new Date(order.created_at || new Date()), t('config.date'))}
                                    </div>

                                    {/* Download Button */}
                                    <a
                                        href={order.contract_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-green-700/30 hover:bg-green-700/40 border border-green-600/60 hover:border-green-600/70 text-green-200 hover:text-green-100 font-medium py-2 px-3 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-1.5 text-xs"
                                    >
                                        <Download className="w-3 h-3" />
                                        {t('admin.orders.orderDetails.downloadContract')}
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/10">
                        {order.rental_status === 'CANCELLED' && onRedo && (
                            <button
                                onClick={() => onRedo(order)}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 rounded-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                {t('admin.orders.orderDetails.redo')}
                            </button>
                        )}

                        {order.rental_status !== 'CANCELLED' && onCancel && (
                            <button
                                onClick={() => onCancel(order)}
                                disabled={isProcessing}
                                className="flex-1 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 rounded-lg transition-all font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="w-4 h-4" />
                                )}
                                {t('admin.orders.orderDetails.cancel')}
                            </button>
                        )}
                    </div>

                </div>
            </motion.div>
        </div>,
        document.getElementById('modal-root') || document.body
    );
};
