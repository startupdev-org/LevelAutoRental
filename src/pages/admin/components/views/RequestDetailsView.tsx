import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, X, RefreshCw, ArrowLeft, Loader2, Pen, FileText, Download, Edit as EditIcon, Play } from 'lucide-react';
import { ContractCreationModal } from '../../../../components/modals/ContractCreationModal';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { formatDateLocal, calculateRentalDuration } from '../../../../utils/date';
import { BorrowRequestDTO } from '../../../../types';
import { formatAmount } from '../../../../utils/currency';
import { parseRequestOptions } from '../../../../utils/car/options';
import { acceptBorrowRequest, rejectBorrowRequest, undoRejectBorrowRequest, updateBorrowRequest, createRentalManually } from '../../../../lib/db/requests/requests';
import { getLoggedUser } from '../../../../lib/db/user/profile';
import { supabase } from '../../../../lib/supabase';
import { fetchBorrowRequestById } from '../../../../lib/db/requests/requests';
import { useTranslation } from 'react-i18next';
import { EditRequestModal } from '../modals/EditRequestModal';

export interface RequestDetailsViewProps {
    request: BorrowRequestDTO;
    onBack: () => void;
    onAccept: (request: BorrowRequestDTO) => void;
    onReject: (request: BorrowRequestDTO) => void;
    onUndoReject?: (request: BorrowRequestDTO) => void;
    onSetToPending?: (request: BorrowRequestDTO) => void;
    onEdit?: (request: BorrowRequestDTO) => void;
    onStartRental?: (request: BorrowRequestDTO) => void;
    onCreateContract?: () => void;
    onEditContract?: () => void;
    onDownloadContract?: () => void;
    onOpenOrder?: (request: BorrowRequestDTO) => void;
    isProcessing?: boolean;
    rentalExists?: boolean;
}

export const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ request, onBack, onAccept, onReject, onUndoReject, onSetToPending, onEdit, onStartRental, onCreateContract, onEditContract, onDownloadContract, onOpenOrder, isProcessing = false, rentalExists = false }) => {

    const car = request.car;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8"
        >
            {/* LEFT COLUMN: Request Info */}
            <div className="space-y-6">
                {/* Back Button */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex justify-start"
                >
                    <button
                        onClick={onBack}
                        disabled={isProcessing}
                        className="bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-2 px-4 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Înapoi la Cereri
                    </button>
                </motion.div>

                {/* Car Summary */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-red-500/50 rounded-xl p-6 transition-all shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <img
                            src={car.image_url || ''}
                            alt={(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}
                            className="w-32 h-20 object-cover rounded-lg border border-white/20"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-white">{(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}</h2>
                            <div className="text-sm text-gray-300">{car.transmission === 'Automatic' ? 'Automat' : car.transmission} · {car.seats} locuri</div>
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
                    <h2 className="text-xl font-bold text-white">Informații Cerere</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Preluare</p>
                                <span className="text-white text-sm font-medium">{formatDateLocal(request.start_date)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Ora</p>
                                <span className="text-white text-sm font-medium">{request.start_time ? request.start_time.slice(0, 5) : '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Returnare</p>
                                <span className="text-white text-sm font-medium">{formatDateLocal(request.end_date)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Ora</p>
                                <span className="text-white text-sm font-medium">{request.end_time ? request.end_time.slice(0, 5) : '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Rental Duration and Price */}
                    <div className="pt-4 border-t border-white/10 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-sm font-semibold text-white mb-2">Perioada Închirierii</h3>
                                <div className="text-white font-bold text-lg">
                                    {(() => {
                                        const duration = calculateRentalDuration(
                                            request.start_date,
                                            request.start_time || '09:00',
                                            request.end_date,
                                            request.end_time || '09:00'
                                        );
                                        return `${duration.days} zile, ${duration.hours} ore`;
                                    })()}
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-sm font-semibold text-white mb-2">Informații Preț</h3>
                                <div className="space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="text-gray-300 text-sm">Preț pe zi:</span>
                                        <span className="text-white font-medium">{formatAmount(request.price_per_day)}</span>
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-white/10">
                                        <span className="text-gray-300 text-sm font-medium">Sumă Totală:</span>
                                        <span className="text-white font-bold">{formatAmount(request.total_amount)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Requested Services */}
                    {(() => {
                        const selectedOptions = parseRequestOptions(request);
                        if (selectedOptions.length === 0) return null;

                        return (
                            <div className="pt-4 border-t border-white/10">
                                <h3 className="text-sm font-semibold text-white mb-3">Servicii Solicitate</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {selectedOptions.map((option, index) => (
                                        <div key={index} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                            <div className="flex items-center justify-between">
                                                <span className="text-white text-sm font-medium">{option.label}</span>
                                                <span className={`text-xs px-2 py-1 rounded ${option.price.includes('+') ? 'bg-red-500/20 text-red-300' :
                                                    option.price === 'Gratuit' ? 'bg-green-500/20 text-green-300' :
                                                        'bg-gray-500/20 text-gray-300'
                                                    }`}>
                                                    {option.price}
                                                </span>
                                            </div>
                                            <div className="text-gray-400 text-xs mt-1 capitalize">
                                                {option.category}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}
                </motion.div>

                {/* Customer Info */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Client</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                            {request.customer_name?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                            <div className="text-white font-semibold">{request.customer_name}</div>
                            <div className="text-gray-300 text-sm">{request.customer_email}</div>
                            {request.customer_phone && (
                                <div className="text-gray-300 text-sm mt-1">{request.customer_phone}</div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Contract Info */}
                {request.contract_url && (
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Contract</h2>
                        <div className="space-y-4">
                            {/* Contract Preview */}
                            <div className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-lg">
                                {/* Mini A4 Document Preview */}
                                <div className="bg-white rounded border border-gray-300 shadow-sm flex-shrink-0" style={{ aspectRatio: '1 / 1.414', width: '60px' }}>
                                    <div className="p-1 h-full flex flex-col">
                                        {/* Header */}
                                        <div className="text-center mb-0.5">
                                            <div className="w-3 h-0.5 bg-gray-400 rounded mx-auto mb-0.5"></div>
                                            <div className="w-4 h-0.5 bg-gray-500 rounded mx-auto"></div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-0.5">
                                            <div className="w-full h-0.5 bg-gray-200 rounded"></div>
                                            <div className="w-4/5 h-0.5 bg-gray-200 rounded"></div>
                                            <div className="w-3/4 h-0.5 bg-gray-200 rounded"></div>
                                            <div className="w-5/6 h-0.5 bg-gray-200 rounded"></div>
                                        </div>

                                        {/* Footer */}
                                        <div className="mt-0.5 pt-0.5 border-t border-gray-300">
                                            <div className="flex justify-between">
                                                <div className="w-1.5 h-0.5 bg-gray-400 rounded"></div>
                                                <div className="w-1.5 h-0.5 bg-gray-400 rounded"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Contract Info & Actions */}
                                <div className="flex-1 min-w-0">
                                    <div className="mb-2">
                                        <span className="text-white font-medium text-sm">Contract Închiriere Auto</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mb-3">
                                        PDF • {formatDateLocal(new Date())}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onDownloadContract?.()}
                                            className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white hover:text-gray-200 font-medium py-2 px-3 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-1.5 text-xs"
                                        >
                                            <Download className="w-3 h-3" />
                                            Descarcă
                                        </button>
                                        <button
                                            onClick={() => onEditContract?.()}
                                            className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-medium py-2 px-3 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-1.5 text-xs"
                                        >
                                            <EditIcon className="w-3 h-3" />
                                            Editează
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Status */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Status</h2>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <span
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl ${request.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                : request.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : request.status === 'PROCESSED'
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                        >
                            {request.status === 'PENDING' ? 'În Așteptare' :
                                request.status === 'APPROVED' ? 'Aprobat' :
                                    request.status === 'PROCESSED' ? 'Procesat' :
                                        request.status === 'REJECTED' ? 'Respins' : ''}
                        </span>
                        <div className="flex flex-col gap-1">
                            {request.requested_at && (
                                <span className="text-gray-400 text-sm">
                                    Solicitată la {(() => {
                                        // Parse UTC timestamp and ensure it's displayed in local time
                                        let date = new Date(request.requested_at);

                                        // If the timestamp string doesn't include timezone info, treat it as UTC
                                        if (typeof request.requested_at === 'string' && !request.requested_at.includes('Z') && !request.requested_at.includes('+')) {
                                            // Supabase timestamps are typically in UTC format like "2025-12-14T18:30:00"
                                            date = new Date(request.requested_at + 'Z'); // Add Z to indicate UTC
                                        }

                                        const formattedDate = formatDateLocal(date);
                                        const formattedTime = date.toLocaleTimeString('ro-RO', {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            hour12: false
                                        });
                                        return `${formattedDate} la ${formattedTime}`;
                                    })()}
                                </span>
                            )}
                        </div>
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
                    {request.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => onAccept(request)}
                                disabled={isProcessing}
                                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCircle className="w-4 h-4" />
                                )}
                                Acceptă Cererea
                            </button>
                            <button
                                onClick={() => onReject(request)}
                                disabled={isProcessing}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                    <X className="w-4 h-4" />
                                )}
                                Respinge Cererea
                            </button>
                        </>
                    )}
                    {request.status === 'APPROVED' && (typeof onSetToPending !== 'undefined' || typeof onReject !== 'undefined') && (
                        <>
                            {/* No contract - show create button */}
                            {!request.contract_url && onCreateContract && (
                                <button
                                    onClick={() => onCreateContract?.()}
                                    disabled={isProcessing}
                                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText className="w-4 h-4" />
                                    Creează Contract
                                </button>
                            )}
                            {/* Start Rental Button */}
                            {onStartRental && !rentalExists && request.contract_url && (
                                <button
                                    onClick={() => onStartRental?.(request)}
                                    disabled={isProcessing}
                                    className="w-full bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isProcessing ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Play className="w-4 h-4" />
                                    )}
                                    Începe Închiriere
                                </button>
                            )}
                            {onSetToPending && (
                                <button
                                    onClick={() => onSetToPending(request)}
                                    disabled={isProcessing}
                                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 hover:border-yellow-500/60 text-yellow-300 hover:text-yellow-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                    Setează ca În Așteptare
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
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(request)}
                                    className="w-full bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 hover:border-green-500/60 text-green-300 hover:text-green-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <Pen className="w-4 h-4" />
                                    Editeaza Cererea
                                </button>
                            )}
                        </>
                    )}
                    {request.status === 'REJECTED' && (onUndoReject) && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            {onUndoReject && (
                                <button
                                    onClick={() => onUndoReject(request)}
                                    disabled={isProcessing}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
                                    Anulează Respingerea
                                </button>
                            )}
                        </div>
                    )}
                    {request.status === 'PROCESSED' && onOpenOrder && rentalExists && (
                        <div className="space-y-4">
                            {/* Informational Status Card */}
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent"></div>
                                <div className="relative flex items-center gap-3 px-4 py-3">
                                    <div className="flex-shrink-0">
                                        <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50"></div>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-blue-300 font-medium text-sm leading-tight">
                                            Închirierea este activă și a început
                                        </p>
                                        <p className="text-blue-400/70 text-xs mt-0.5">
                                            Poți anula comanda dacă este necesar
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => onOpenOrder(request)}
                                disabled={isProcessing}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <X className="w-4 h-4" />
                                Anulează comandă
                            </button>
                        </div>
                    )}
                </motion.div>
            </aside>


        </motion.div>
    );
};

// Wrapper component that accepts requestId and fetches the request
export interface RequestDetailsViewWrapperProps {
    requestId: string;
}

export const RequestDetailsViewWrapper: React.FC<RequestDetailsViewWrapperProps> = ({ requestId }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [request, setRequest] = useState<BorrowRequestDTO | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [showContractModal, setShowContractModal] = useState(false);
    const [isModalOpening, setIsModalOpening] = useState(false);
    const [rentalExists, setRentalExists] = useState(false);
    const { showSuccess, showError } = useNotification();

    const handleCreateContract = (): void => {
        if (!isModalOpening) {
            setIsModalOpening(true);
            // Add a small delay to ensure no race conditions
            setTimeout(() => {
                setShowContractModal(true);
                setTimeout(() => setIsModalOpening(false), 300);
            }, 10);
        }
    };

    const handleEditContract = (): void => {
        if (!isModalOpening) {
            setIsModalOpening(true);
            // Add a small delay to ensure no race conditions
            setTimeout(() => {
                setShowContractModal(true);
                setTimeout(() => setIsModalOpening(false), 300);
            }, 10);
        }
    };

    const handleDownloadContract = (): void => {
        if (request?.contract_url) {
            window.open(request.contract_url, '_blank');
        }
    };

    const handleStartRental = async (request: BorrowRequestDTO): Promise<void> => {
        if (isProcessing) return;

        try {
            setIsProcessing(true);

            // Get current logged-in user for the rental
            const currentUser = await getLoggedUser();
            if (!currentUser?.id) {
                throw new Error('User not logged in');
            }

            // Create a rental record from the approved request
            const rentalResult = await createRentalManually(
                currentUser.id,
                request.car_id,
                typeof request.start_date === 'string' ? request.start_date : request.start_date.toISOString().split('T')[0],
                request.start_time,
                typeof request.end_date === 'string' ? request.end_date : request.end_date.toISOString().split('T')[0],
                request.end_time,
                request.total_amount,
                [request.car],
                {
                    rentalStatus: 'ACTIVE',
                    customerName: request.customer_name,
                    customerEmail: request.customer_email,
                    customerPhone: request.customer_phone,
                    customerFirstName: request.customer_first_name,
                    customerLastName: request.customer_last_name,
                    requestId: request.id,
                    features: request.options ? Object.keys(request.options) : undefined,
                    contractUrl: request.contract_url // Copy contract URL from request to rental
                }
            );

            if (rentalResult.success) {
                showSuccess('Închiriere începută cu succes!');
                // Update request status to indicate rental has started
                const updateResult = await updateBorrowRequest(request.id?.toString() || '', {
                    status: 'PROCESSED' // Rental has actually started
                });

                if (updateResult.success) {
                    // Update local state
                    setRequest(prev => prev ? { ...prev } : null);
                    // Mark that rental now exists
                    setRentalExists(true);
                }

                // Navigate to rentals/orders view to show the new active rental
                setTimeout(() => {
                    navigate('/admin?section=orders');
                }, 1500);
            } else {
                showError(`Nu s-a putut începe închirierea: ${rentalResult.error}`);
            }
        } catch (error) {
            console.error('Error starting rental:', error);
            showError('Eroare la începerea închirierii');
        } finally {
            setIsProcessing(false);
        }
    };


    // Check if rental already exists for this request
    const checkRentalExists = async (requestId: string) => {
        try {
            // Only consider ACTIVE rentals as "existing" - cancelled rentals don't prevent new rentals
            const { data, error } = await supabase
                .from('Rentals')
                .select('id')
                .eq('request_id', requestId)
                .eq('rental_status', 'ACTIVE')
                .limit(1); // Just check if any exist

            if (error) {
                console.error('Error checking rental existence:', error);
                return false;
            }

            const exists = data && data.length > 0;
            setRentalExists(exists);
            return exists;
        } catch (error) {
            console.error('Error in checkRentalExists:', error);
            return false;
        }
    };

    useEffect(() => {
        const loadRequest = async () => {
            try {
                setLoading(true);
                const fetchedRequest = await fetchBorrowRequestById(requestId);
                if (fetchedRequest) {
                    setRequest(fetchedRequest);
                    // Check if rental already exists for this request
                    await checkRentalExists(requestId);
                } else {
                    setError('Cerere negăsită');
                }
            } catch (err) {
                console.error('Error loading request:', err);
                setError('Eșec la încărcarea cererii');
            } finally {
                setLoading(false);
            }
        };

        loadRequest();
    }, [requestId]);

    const handleBack = () => {
        navigate('/admin?section=requests');
    };

    const handleAccept = async (request: BorrowRequestDTO) => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const result = await acceptBorrowRequest(request.id);

            if (result.success) {
                // Update local state to reflect the change
                setRequest(prev => prev ? { ...prev, status: 'APPROVED' } : null);
                // Navigate back to requests list after successful acceptance
                setTimeout(() => {
                    navigate('/admin?section=requests');
                }, 1500);
            } else {
                alert(`Eroare la acceptarea cererii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('Eroare la acceptarea cererii');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async (request: BorrowRequestDTO) => {
        if (isProcessing) return;

        const reason = window.prompt(`Ești sigur că vrei să respingi cererea lui ${request.customer_name}? Introdu motivul respingerii:`);
        if (reason === null) return; // User cancelled

        setIsProcessing(true);
        try {
            const result = await rejectBorrowRequest(request.id, reason);

            if (result.success) {
                // Update local state to reflect the change
                setRequest(prev => prev ? { ...prev, status: 'REJECTED' } : null);
                // Navigate back to requests list after successful rejection
                setTimeout(() => {
                    navigate('/admin?section=requests');
                }, 1500);
            } else {
                alert(`Eroare la respingerea cererii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('Eroare la respingerea cererii');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleUndoReject = async (request: BorrowRequestDTO) => {
        if (isProcessing) return;

        setIsProcessing(true);
        try {
            const result = await undoRejectBorrowRequest(request.id);

            if (result.success) {
                // Update local state to reflect the change
                setRequest(prev => prev ? { ...prev, status: 'PENDING' } : null);
            } else {
                alert(`Eroare la anularea respingerii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error undoing reject:', error);
            alert('Eroare la anularea respingerii');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSetToPending = async (request: BorrowRequestDTO) => {
        if (isProcessing) return;

        if (!request.id) {
            console.error('Request has no ID:', request);
            alert('Request ID is missing.');
            return;
        }

        setIsProcessing(true);
        try {
            // Call the update function
            const result = await updateBorrowRequest(request.id, { status: 'PENDING' });

            if (result.success) {
                // Update local state safely
                setRequest(prev => (prev?.id === request.id ? { ...prev, status: 'PENDING' } : prev));
            } else {
                alert(`Eroare la setarea statusului: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error setting to pending:', error);
            alert('Eroare la setarea statusului');
        } finally {
            setIsProcessing(false);
        }
    };

    function handleOpenEditModal() {
        setIsEditing(true)
    }
    function handleCloseEditModal() {
        setIsEditing(false)
    }


    const handleEdit = async (request: BorrowRequestDTO) => {
        // TODO: Implement edit functionality
        // alert('Funcționalitatea de editare va fi implementată în curând');

        if (isProcessing) return;

        try {
            const updates = request;
            const result = await updateBorrowRequest(request.id, updates)

            if (result.success) {
                // Update local state to reflect the change
            } else {
                alert(`Eroare la editarea cererii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error editing request:', error);
            alert('Eroare la setarea statusului');
        } finally {
            setIsProcessing(false);
        }

    };

    const handleOpenOrder = async (request: BorrowRequestDTO) => {
        try {
            // Find the most recent ACTIVE rental linked to this request
            const { data, error } = await supabase
                .from('Rentals')
                .select('id')
                .eq('request_id', request.id)
                .eq('rental_status', 'ACTIVE')
                .order('created_at', { ascending: false }) // Most recent first
                .limit(1)
                .single();

            if (error || !data) {
                console.error('No active rental found for this request:', error);
                alert('Nu s-a găsit nicio comandă activă pentru această cerere');
                return;
            }

            // Navigate to the order details view
            navigate(`/admin?section=orders&orderId=${data.id}`);
        } catch (error) {
            console.error('Error opening order:', error);
            alert('Eroare la deschiderea comenzii');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-red-400" />
                    <span className="text-gray-300">Se încarcă...</span>
                </div>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-red-400 text-center">
                    <h3 className="text-lg font-semibold mb-2">{t('common.error', 'Error')}</h3>
                    <p>{error || t('admin.requests.notFound', 'Request not found')}</p>
                </div>
                <button
                    onClick={handleBack}
                    className="flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/20 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Înapoi
                </button>
            </div>
        );
    }

    return (
        <>
            <RequestDetailsView
                request={request}
                onBack={handleBack}
                onAccept={handleAccept}
                onReject={handleReject}
                onUndoReject={handleUndoReject}
                onSetToPending={handleSetToPending}
                onEdit={handleOpenEditModal}
                onStartRental={handleStartRental}
                onCreateContract={handleCreateContract}
                onEditContract={handleEditContract}
                onDownloadContract={handleDownloadContract}
                onOpenOrder={handleOpenOrder}
                isProcessing={isProcessing}
                rentalExists={rentalExists}
            />

            {
                isEditing && (
                    <>
                        <EditRequestModal
                            request={request}
                            onSave={handleEdit}
                            onClose={handleCloseEditModal}
                            cars={[]} />
                    </>
                )
            }

            {/* Contract Creation Modal */}
            {showContractModal && (
                <ContractCreationModal
                    isOpen={true}
                    onClose={() => {
                        setShowContractModal(false);
                        setIsModalOpening(false);
                    }}
                    order={{
                        ...request,
                        request_id: request?.id,
                        id: request?.id?.toString() || '',
                        customer_name: request?.customer_name,
                        customer_first_name: request?.customer_first_name,
                        customer_last_name: request?.customer_last_name,
                        customer_email: request?.customer_email,
                        customer_phone: request?.customer_phone,
                        start_date: request?.start_date,
                        start_time: request?.start_time,
                        end_date: request?.end_date,
                        end_time: request?.end_time,
                        total_amount: request?.total_amount,
                        options: request?.options,
                        status: 'ACTIVE' // Treat as active for contract creation
                    } as any}
                    car={request?.car}
                    onContractCreated={async (contractUrl?: string | null) => {
                        console.log('Contract created, URL:', contractUrl);

                        if (contractUrl) {
                            // Update the request's contract_url field
                            if (request) {
                                const updateResult = await updateBorrowRequest(request.id?.toString() || '', {
                                    contract_url: contractUrl
                                } as any);

                                if (updateResult.success) {
                                    showSuccess('Contract creat și salvat cu succes!');
                                    // Update local state
                                    setRequest(prev => {
                                        const updated = prev ? { ...prev, contract_url: contractUrl } : null;
                                        return updated;
                                    });
                                } else {
                                    showError(`Contract creat dar nu s-a putut salva URL-ul în cerere: ${updateResult.error}`);
                                }
                            }

                            // Also update any associated rental's contract_url if one exists
                            if (rentalExists && request?.id) {
                                try {
                                    const { error: rentalUpdateError } = await supabase
                                        .from('Rentals')
                                        .update({ contract_url: contractUrl })
                                        .eq('request_id', request.id)
                                        .eq('rental_status', 'ACTIVE'); // Only update active rentals

                                    if (rentalUpdateError) {
                                        console.error('Error updating rental contract_url:', rentalUpdateError);
                                        // Don't show error to user since the contract was created successfully
                                    }
                                } catch (error) {
                                    console.error('Error updating rental contract_url:', error);
                                }
                            }
                        }

                        // Close modal
                        setShowContractModal(false);
                        setIsModalOpening(false);
                    }}
                />
            )}
        </>
    );
};

// Create Rental Modal Component
