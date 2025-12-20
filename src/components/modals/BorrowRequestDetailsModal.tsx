import { createPortal } from 'react-dom';
import { X, Calendar, Clock, FileText, Download } from 'lucide-react';
import { BorrowRequestDTO } from '../../types';
import { useTranslation } from 'react-i18next';
import { calculatePriceSummary } from '../../utils/car/pricing';
import { formatDateLocal } from '../../utils/date';
import { formatTime } from '../../utils/time';
import { parseRequestOptions } from '../../utils/car/options';
import { getCarName } from '../../utils/car/car';
import { displayId } from '../../utils/requests/requests';
import { formatPrice, getSelectedCurrency } from '../../utils/currency';

interface BorrowRequestsDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: BorrowRequestDTO | null;
    onCancel?: (order: BorrowRequestDTO) => void;
    onRedo?: (order: BorrowRequestDTO) => void;
    isProcessing?: boolean;
    onOpenContractModal?: () => void; // Callback to open contract modal from parent
    showOrderNumber?: boolean; // Whether to show the order number for admins/users
}

export function BorrowRequestsDetailsModal({
    isOpen,
    onClose,
    order,
    showOrderNumber = true,
}: BorrowRequestsDetailsModalProps) {

    const { t, i18n } = useTranslation();

    if (!isOpen || !order) return null;

    const displayOrder = order;

    // If parent provides onOpenContractModal, use it; otherwise use local state
    // const handleOpenContractModal = () => {
    //     if (onOpenContractModal) {
    //         onOpenContractModal();
    //     } else {
    //         setShowContractModal(true);
    //     }
    // };

    // Fetch original request options if request_id exists
    // TODO: HANDLE THIS THING
    // useEffect(() => {
    //     const fetchRequestOptions = async () => {

    //     };

    //     if (isOpen && order) {
    //         fetchRequestOptions();
    //     }
    // }, [isOpen, order]);

    // Handle both Rental and OrderDisplay formats
    const startDate = (order as BorrowRequestDTO).start_date;
    const startTime = (order as BorrowRequestDTO).start_time;
    const endDate = (order as BorrowRequestDTO).end_date;
    const endTime = (order as BorrowRequestDTO).end_time;

    const summary =
        order && order.car && order.options
            ? calculatePriceSummary(order.car, order, order.options)
            : null;

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
                        <h2 className="text-xl sm:text-2xl font-bold text-white">{t('admin.orders.orderDetails')}</h2>
                        <p className="text-gray-400 text-xs sm:text-sm mt-1">
                            {t('admin.orders.orderNumber')}{displayId(order.id)}
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">{t('admin.orders.rentalPeriod')}</span>
                            </h3>
                            <div className="flex items-center gap-2">
                                {(order.car?.image_url || (order.car as any)?.image || (order as any).car?.image_url) && (
                                    <img
                                        src={order.car?.image_url || (order.car as any)?.image || (order as any).car?.image_url}
                                        alt={getCarName(order.car) || t('admin.orders.unknownCar')}
                                        className="w-10 h-7 sm:w-12 sm:h-8 object-cover rounded-md border border-white/10"
                                    />
                                )}
                                <span className="text-white font-semibold text-xs sm:text-sm">
                                    {getCarName(order.car) || t('admin.orders.unknownCar')}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                <p className="text-gray-400 text-xs sm:text-sm mb-2">{t('admin.orders.pickup')}</p>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-white font-semibold text-sm sm:text-base">{formatDateLocal(startDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm sm:text-base">{formatTime(startTime)}</span>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-3 sm:p-4 border border-white/10">
                                <p className="text-gray-400 text-xs sm:text-sm mb-2">{t('admin.orders.return')}</p>
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-white font-semibold text-sm sm:text-base">{formatDateLocal(endDate)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                                    <span className="text-gray-300 text-sm sm:text-base">{formatTime(endTime)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-white/10">
                            {summary && (
                                <p className="text-gray-400 text-xs sm:text-sm">{t('admin.orders.duration')}: <span className="text-white font-semibold">{summary?.rentalDays} {t('admin.orders.days')}{summary?.rentalHours > 0 ? `, ${summary?.rentalHours} ${t('admin.requestDetails.hours') || 'ore'}` : ''}</span></p>
                            )}
                        </div>
                    </div>

                    {/* Financial Details */}
                    {(() => {
                        const options = parseRequestOptions(order);
                        const selectedCurrency = getSelectedCurrency();

                        console.log('options: ', options)

                        if (!summary) return null;

                        return (
                            <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                                    {t('admin.requestDetails.priceDetails')}
                                </h3>


                                <h5 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                                    Optiuni selectate
                                </h5>

                                {/* OPTIONS SECTION */}
                                {options.length > 0 ? (
                                    <div className="mb-4">

                                        <div className="flex flex-col gap-2.5">
                                            {options.map((option, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 md:gap-3">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                                        <span className="text-white text-sm font-medium">
                                                            {option.label}
                                                        </span>
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
                                    </div>
                                ) : (
                                    <div className="mb-4">
                                        <span className="text-gray-400 text-sm italic">
                                            {t('admin.requestDetails.noOptionsSelected')}
                                        </span>
                                    </div>
                                )}


                                {/* PRICE BREAKDOWN */}
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-xs sm:text-sm">
                                            {t('admin.requestDetails.pricePerDay')}
                                        </span>
                                        <span className="text-white font-semibold text-sm sm:text-base">
                                            {formatPrice(summary.pricePerDay, selectedCurrency, i18n.language)}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-300 text-xs sm:text-sm">
                                            {t('admin.requestDetails.numberOfDays')}
                                        </span>
                                        <span className="text-white font-semibold text-sm sm:text-base">
                                            {summary.rentalDays} {t('admin.requestDetails.days')}
                                        </span>
                                    </div>

                                    <div className="pt-2 border-t border-white/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-medium text-sm sm:text-base">
                                                {t('admin.requestDetails.basePrice')}
                                            </span>
                                            <span className="text-white font-semibold text-sm sm:text-base">
                                                {formatPrice(summary.baseCarPrice, selectedCurrency, i18n.language)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-white/10">
                                        <div className="flex justify-between items-center">
                                            <span className="text-white font-semibold text-base sm:text-lg">
                                                {t('admin.requestDetails.total')}
                                            </span>
                                            <span className="text-emerald-400 font-bold text-lg sm:text-xl">
                                                {formatPrice(summary.totalPrice, selectedCurrency, i18n.language)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}


                    {/* Contract Download - Show first */}
                    {displayOrder?.contract_url && (
                        <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10 mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">{t('admin.orders.contract')}</span>
                            </h3>
                            <a
                                href={displayOrder.contract_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                            >
                                <Download className="w-4 h-4" />
                                <span>{t('admin.orders.downloadContractPDF')}</span>
                            </a>
                            <p className="text-[10px] sm:text-xs text-gray-400 mt-2 text-center">
                                Descarcă contractul de închiriere
                            </p>
                        </div>
                    )}

                    {/* Action Buttons - Show after contract */}
                    {showOrderNumber && order.status !== 'APPROVED' && (
                        <div className="bg-white/5 rounded-xl p-4 sm:p-6 border border-white/10">
                            <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span className="text-sm sm:text-base">Acțiuni</span>
                            </h3>

                            <div className="space-y-3">
                                {/* {(displayOrder as any)?.status === 'CONTRACT' && (
                                    <button
                                        onClick={handleOpenContractModal}
                                        className="w-full px-4 py-2.5 sm:py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold disabled:opacity-50"
                                        disabled={isGeneratingContract}
                                    >
                                        {isGeneratingContract ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <FileText className="w-4 h-4" />
                                        )}
                                        <span>Creează Contract</span>
                                    </button>
                                )} */}

                                {/* Cancel Order Button - for ACTIVE and CONTRACT status */}
                                {/* {((displayOrder as any)?.status === 'ACTIVE' || (displayOrder as any)?.status === 'CONTRACT') && onCancel && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Ești sigur că vrei să anulezi această comandă? Această acțiune va anula și cererea corespunzătoare.')) {
                                                onCancel(displayOrder as BorrowRequestDTO);
                                            }
                                        }}
                                        className="w-full px-4 py-2.5 sm:py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg transition-all flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold"
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Anulează Comanda</span>
                                    </button>
                                )} */}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

