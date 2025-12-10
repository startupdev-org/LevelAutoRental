import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Clock, CheckCircle, X, RefreshCw, Edit, ArrowLeft, Loader2, Pen } from 'lucide-react';
import { formatDateLocal, getDateDiffInDays, calculateRentalDuration } from '../../../../utils/date';
import { BorrowRequestDTO, Car } from '../../../../types';
import { formatAmount } from '../../../../utils/currency';
import { parseRequestOptions } from '../../../../utils/car/options';
import { rentalOptions } from '../../../../constants/rentalOptions';
import { acceptBorrowRequest, rejectBorrowRequest, undoRejectBorrowRequest, updateBorrowRequest } from '../../../../lib/db/requests/requests';
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
    isProcessing?: boolean;
}

export const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ request, onBack, onAccept, onReject, onUndoReject, onSetToPending, onEdit, isProcessing = false }) => {

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
                                <span className="text-white text-sm font-medium">{request.start_time || '--:--'}</span>
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
                                <span className="text-white text-sm font-medium">{request.end_time || '--:--'}</span>
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
                                <h3 className="text-sm font-semibold text-white mb-3">Requested Services</h3>
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
                            {request.status === 'PENDING' ? 'În Așteptare' :
                                request.status === 'APPROVED' ? 'Aprobat' :
                                    request.status === 'REJECTED' ? 'Respins' : ''}
                        </span>
                        {request.updated_at && (

                            <span className="text-gray-400 text-sm">
                                Actualizata ultima data pe {formatDateLocal(request.updated_at)}
                            </span>
                        )}
                        {request.requested_at && (
                            <span className="text-gray-400 text-sm">
                                Solicitata la {formatDateLocal(request.requested_at)}
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
                        disabled={isProcessing}
                        className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Înapoi la Cereri
                    </button>
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


    useEffect(() => {
        const loadRequest = async () => {
            try {
                setLoading(true);
                const fetchedRequest = await fetchBorrowRequestById(requestId);
                if (fetchedRequest) {
                    setRequest(fetchedRequest);
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
            console.log('Accepting request:', request);
            const result = await acceptBorrowRequest(request.id);
            console.log('Accept result:', result);

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
            console.log('Rejecting request:', request, 'Reason:', reason);
            const result = await rejectBorrowRequest(request.id, reason);
            console.log('Reject result:', result);

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
            console.log('Undoing reject for request:', request);
            const result = await undoRejectBorrowRequest(request.id);
            console.log('Undo reject result:', result);

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
            console.log('Setting request to pending:', request);

            // Call the update function
            const result = await updateBorrowRequest(request.id, { status: 'PENDING' });
            console.log('Set to pending result:', result);

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
            console.log('Editing request:', request);
            const updates = request;
            const result = await updateBorrowRequest(request.id, updates)
            console.log('Editing request result:', result);

            if (result.success) {
                // Update local state to reflect the change
                console.log('succes la editarea cererii')
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
                isProcessing={isProcessing}
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
        </>
    );
};

// Create Rental Modal Component
