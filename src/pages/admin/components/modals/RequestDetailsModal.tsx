import React from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
    X,
    CheckCircle,
    Loader2,
    Edit,
    RefreshCw,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BorrowRequestDTO, Car, RentalDTO } from '../../../../types';
import { formatDateLocal, getDateDiffInDays } from '../../../../utils/date';
import { formatTime } from '../../../../utils/time';
import { getCarPrice } from '../../../../utils/car/pricing';
import { formatAmount } from '../../../../utils/currency';
import { parseRequestOptions } from '../../../../utils/car/options';

export interface RequestDetailsModalProps {
    request: BorrowRequestDTO;
    handleClose: () => void;
    handleAccept: (request: BorrowRequestDTO) => void;
    handleReject: (request: BorrowRequestDTO) => void;
    handleUndoReject?: (request: BorrowRequestDTO) => void;
    handleSetToPending?: (request: BorrowRequestDTO) => void;
    handleEdit?: (request: BorrowRequestDTO) => void;
    handleCancel?: (request: BorrowRequestDTO) => void;
    isProcessing?: boolean;
}

export const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({
    request, handleClose, handleAccept, handleReject, handleUndoReject, handleSetToPending, handleEdit, handleCancel, isProcessing = false }) => {
    const { t } = useTranslation();

    const car = request.car as Car;

    const startDate = formatDateLocal(request.start_date, t('config.date'))
    const endDate = formatDateLocal(request.end_date, t('config.date'))
    const pickupTime = formatTime(request.start_time);
    const returnTime = formatTime(request.end_time);

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

    const rentalDays = getDateDiffInDays(request.start_date, request.end_date);
    const pricePerDay = getCarPrice(rentalDays, car)



    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
            onClick={handleClose}
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
                        onClick={handleClose}
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
                                    {rentalDays} {t('admin.requestDetails.days')}
                                </span>
                            </div>

                            {/* Discount indicator */}
                            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-3 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.requestDetails.pickupDate')}</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDateLocal(request.start_date, t('config.date'))}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{t('admin.requestDetails.atTime')} {formatTime(request.start_time)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.requestDetails.returnDate')}</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDateLocal(request.end_date, t('config.date'))}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{t('admin.requestDetails.atTime')} {formatTime(request.end_time)}</p>
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
                                <p className="text-white font-medium text-sm md:text-base">{request.customer_first_name || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.lastName')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{request.customer_last_name || '—'}</p>
                            </div>
                            {/* <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.age')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{request.cu ? `${age}` : '—'}</p>
                            </div> */}
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.phone')}</label>
                                {request.customer_phone ? (
                                    <a
                                        href={`tel:${request.customer_phone.replace(/\s/g, '')}`}
                                        className="text-white font-medium text-sm md:text-base hover:text-emerald-400 transition-colors"
                                    >
                                        {request.customer_phone}
                                    </a>
                                ) : (
                                    <p className="text-white font-medium text-xs md:text-base">No phone number provided</p>
                                )}
                            </div>
                            {request.customer_email && (
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.emailOptional')}</label>
                                    <p className="text-white text-sm md:text-base">{request.customer_email}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rental Options */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">
                            {t('admin.requestDetails.rentalOptions')}
                        </h3>

                        {(() => {
                            const options = parseRequestOptions(request); // Use the helper function

                            if (options.length === 0) {
                                return (
                                    <div className="text-center py-6 md:py-8">
                                        <p className="text-gray-400 text-sm">
                                            {t('admin.requestDetails.noOptionsSelected')}
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                                    {options.map((option, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                                                <span className="text-white text-sm font-medium">{option.label}</span>
                                            </div>
                                            <span
                                                className={`text-xs font-semibold px-2 py-1 rounded ${option.price.includes('%')
                                                    ? 'text-emerald-400 bg-emerald-400/10'
                                                    : 'text-gray-300 bg-white/5'
                                                    }`}
                                            >
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
                                <span className="text-white font-medium">{formatAmount(pricePerDay)}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">Durată</span>
                                <span className="text-white font-medium">
                                    {rentalDays} {rentalDays === 1 ? 'zi' : 'zile'}
                                </span>
                            </div>
                            <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white font-medium">{t('admin.requestDetails.basePrice')}</span>
                                    <span className="text-white font-medium">{formatAmount(pricePerDay)}</span>
                                </div>
                            </div>

                            {/* {additionalCosts > 0 && (
                                <>
                                    <div className="pt-2 md:pt-3 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-2 md:mb-3">{t('admin.requestDetails.additionalServices')}</h4>
                                        <div className="space-y-1.5 md:space-y-2 text-sm">
                                            {parsedOptions.unlimitedKm && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Kilometraj nelimitat</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(pricePerDay * rentalDays * 0.5).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.speedLimitIncrease && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(pricePerDay * rentalDays * 0.2).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.tireInsurance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(pricePerDay * rentalDays * 0.2).toLocaleString()} MDL
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
                            )} */}

                            <div className="pt-2 md:pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-white font-bold text-base md:text-lg">{t('admin.requestDetails.total')}</span>
                                <span className="text-white font-bold text-lg md:text-xl">{formatAmount(request.total_amount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                        {request.status === 'PENDING' && (
                            <>
                                {/* ACCEPT */}
                                <button
                                    onClick={() => handleAccept(request)}
                                    disabled={isProcessing}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    {t('admin.requestDetails.acceptRequest')}
                                </button>

                                {/* REJECT */}
                                <button
                                    onClick={() => handleReject(request)}
                                    disabled={isProcessing}
                                    className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    {t('admin.requestDetails.rejectRequest')}
                                </button>

                                {/* EDIT */}
                                <button
                                    onClick={() => handleEdit}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    {t('admin.requestDetails.editRequest')}
                                </button>
                            </>
                        )}

                        {request.status === 'APPROVED' && (
                            <>
                                {/* CANCEL */}
                                <button
                                    onClick={() => handleCancel}
                                    disabled={isProcessing}
                                    className="flex-1 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300 font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <X className="w-4 h-4" />
                                    {t('admin.requestDetails.cancelRental')}
                                </button>

                                {/* EDIT */}
                                <button
                                    onClick={() => handleEdit}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    {t('admin.requestDetails.editRequest')}
                                </button>
                            </>
                        )}

                        {request.status === 'REJECTED' && (
                            <>
                                {/* APPROVE */}
                                <button
                                    onClick={() => handleAccept(request)}
                                    disabled={isProcessing}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 font-semibold py-2.5 px-6 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" />
                                    {t('admin.requestDetails.acceptRequest')}
                                </button>
                            </>
                        )}

                    </div>

                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};
