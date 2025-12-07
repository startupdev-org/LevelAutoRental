import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, X, RefreshCw, Edit } from 'lucide-react';
import { formatDateLocal, getDateDiffInDays } from '../../../../utils/date';
import { BorrowRequestDTO, Car } from '../../../../types';
import { formatAmount } from '../../../../utils/currency';

export interface RequestDetailsViewProps {
    request: BorrowRequestDTO;
    onBack: () => void;
    onAccept: (request: BorrowRequestDTO) => void;
    onReject: (request: BorrowRequestDTO) => void;
    onUndoReject?: (request: BorrowRequestDTO) => void;
    onSetToPending?: (request: BorrowRequestDTO) => void;
    onEdit?: (request: BorrowRequestDTO) => void;
}

export const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ request, onBack, onAccept, onReject, onUndoReject, onSetToPending, onEdit }) => {

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
                                <span className="text-white text-sm font-medium">{formatDateLocal(request.start_date)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{request.start_time || '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                                <span className="text-white text-sm font-medium">{formatDateLocal(request.end_date)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{request.end_time || '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rental Days</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(request.start_date, request.end_date)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estimated Price</p>
                            <span className="text-white text-lg font-bold">{formatAmount(request.total_amount)}</span>
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
                        {request.created_at && (
                            <span className="text-gray-400 text-sm">
                                Requested on {new Date(request.created_at).toLocaleDateString()}
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
