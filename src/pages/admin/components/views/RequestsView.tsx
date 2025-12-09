import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Search,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Loader2,
    Plus,
    ArrowLeft,
    ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { BorrowRequest, BorrowRequestDTO, Car as CarType, OrderDisplay } from '../../../../types';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { CreateRentalModal } from '../modals/CreateRentalModal';
import { EditRequestModal } from '../modals/EditRequestModal';
import { ContractCreationModal } from '../../../../components/modals/ContractCreationModal';
import { getInitials } from '../../../../utils/customer';
import { getCarName } from '../../../../utils/car';
import { acceptBorrowRequest, BorrowRequestFilters, createBorrowRequest, fetchBorrowRequestsForDisplay, rejectBorrowRequest, undoRejectBorrowRequest, updateBorrowRequest } from '../../../../lib/db/requests/requests';
import { formatDateLocal } from '../../../../utils/date';
import { formatAmount } from '../../../../utils/currency';
import { RequestDetailsModal } from '../modals/RequestDetailsModal';
import { supabase } from '../../../../lib/supabase';

export const RequestsView: React.FC = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const { showSuccess, showError } = useNotification();
    const [requests, setRequests] = useState<BorrowRequestDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [cars, setCars] = useState<CarType[]>([]);
    const [showAddRentalModal, setShowAddRentalModal] = useState(false);
    const [selectedCarIdForRental, setSelectedCarIdForRental] = useState<string | undefined>(undefined);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<BorrowRequestDTO | null>(null);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<BorrowRequestDTO | null>(null);
    const [showContractModal, setShowContractModal] = useState(false);
    const [selectedRentalForContract, setSelectedRentalForContract] = useState<OrderDisplay | null>(null);
    const [showRequestContractModal, setShowRequestContractModal] = useState(false);
    const [selectedRequestForContract, setSelectedRequestForContract] = useState<BorrowRequest | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const [requestsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    const [sortBy, setSortBy] = useState<'start_date' | 'amount' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [status, setStatus] = useState<'PENDING' | 'REJECTED' | 'APPROVED' | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearch] = useState(searchQuery);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setCurrentPage(1);
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);



    // Open modal if carId is in URL params
    useEffect(() => {
        if (carId && cars.length > 0) {
            setSelectedCarIdForRental(carId);
            setShowAddRentalModal(true);
            // Remove carId from URL to avoid reopening on refresh
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('carId');
            setSearchParams(newParams, { replace: true });
        }
    }, [carId, cars.length, searchParams, setSearchParams]);

    // Trigger when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearchQuery, status, sortBy, sortOrder]);

    // Trigger loadRequests when page or filters change
    useEffect(() => {
        loadRequests();
    }, [currentPage, debouncedSearchQuery, status, sortBy, sortOrder]);



    const loadRequests = async () => {
        setLoading(true);
        try {
            const filters = getCurrentFilters();
            const { data, total } = await fetchBorrowRequestsForDisplay(currentPage, requestsPerPage, filters);
            const totalPages = Math.ceil(total / requestsPerPage);
            setRequests(data);
            setTotalRequests(total);
            setTotalPages(totalPages);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentFilters = (): BorrowRequestFilters | undefined => {
        if (!debouncedSearchQuery && !sortBy && !status) return undefined

        return {
            searchQuery: debouncedSearchQuery || undefined,
            sortBy: sortBy || undefined,
            sortOrder: sortOrder === 'asc', // converts to boolean
            status: status || undefined,
        }
    }



    const handleAccept = async (request: BorrowRequestDTO) => {
        console.log('should accept the request: ', request)
        const success = await acceptBorrowRequest(request.id)
        console.log('result: ', success)

        // setProcessingRequest(request.id.toString());
        // setShowRequestDetailsModal(false);
        // setSelectedRequest(null);
    };

    const handleReject = async (request: BorrowRequestDTO) => {
        const reason = window.prompt(`${t('admin.requests.confirmRejectRequest')} ${request.customer_name}? ${t('admin.requests.rejectReasonPrompt')}`);
        if (reason === null) return; // User cancelled

        setProcessingRequest(request.id.toString());
        try {
            // If request is already APPROVED, use updateBorrowRequest instead
            if (request.status === 'APPROVED') {
                const result = await updateBorrowRequest(request.id.toString(), { status: 'REJECTED' } as any);
                if (result.success) {
                    showSuccess(t('admin.requests.requestRejected'));
                    await loadRequests();
                } else {
                    showError(`${t('admin.requests.requestRejectFailed')} ${result.error || t('admin.common.unknownError')}`);
                }
            } else {
                const result = await rejectBorrowRequest(request.id.toString(), reason || undefined);
                if (result.success) {
                    showSuccess(t('admin.requests.requestRejected'));
                    await loadRequests();
                } else {
                    showError(`${t('admin.requests.requestRejectFailed')} ${result.error || t('admin.common.unknownError')}`);
                }
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            showError(t('admin.requests.requestRejectErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleUndoReject = async (request: BorrowRequestDTO) => {
        if (!window.confirm(`${t('admin.requests.confirmRestoreRequest')} ${request.customer_name} ${t('admin.requests.forCar')} ${getCarName(request.car)} ${t('admin.requests.toPending')}`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await undoRejectBorrowRequest(request.id.toString());
            if (result.success) {
                showSuccess(t('admin.requests.requestRestored'));
                await loadRequests();
            } else {
                showError(`${t('admin.requests.requestRestoreFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error undoing reject request:', error);
            showError(t('admin.requests.requestRestoreErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleSetToPending = async (request: BorrowRequestDTO) => {
        if (!window.confirm(`${t('admin.requests.confirmSetToPending')} ${request.customer_name} ${t('admin.requests.forCar')} ${request.car} ${t('admin.requests.backToPending')}`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await updateBorrowRequest(request.id.toString(), { status: 'PENDING' } as any);
            if (result.success) {
                showSuccess(t('admin.requests.requestSetToPending'));
                await loadRequests();
            } else {
                showError(`${t('admin.requests.requestUpdateFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error setting request to pending:', error);
            showError(t('admin.requests.requestUpdateErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleEdit = (request: BorrowRequestDTO) => {
        setEditingRequest(request);
        setShowEditModal(true);
    };

    const handleCancelRental = async (request: BorrowRequestDTO) => {
        if (!window.confirm(`Sunteți sigur că doriți să anulați închirierea pentru ${request.customer_name}? Această acțiune va seta cererea la In Asteptare și va șterge comanda de închiriere.`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const requestId = typeof request.id === 'string' ? parseInt(request.id) : request.id;

            // First, delete the rental with matching request_id
            const { error: deleteError } = await supabase
                .from('Rentals')
                .delete()
                .eq('request_id', requestId);

            if (deleteError) {
                console.error('Error deleting rental:', deleteError);
                showError(`Eroare la ștergerea închirierii: ${deleteError.message}`);
                setProcessingRequest(null);
                return;
            }

            // Then, set the request status to PENDING
            const result = await updateBorrowRequest(request.id.toString(), { status: 'PENDING' } as any);
            if (result.success) {
                showSuccess('Închirierea a fost anulată și cererea a fost setată la În Asteptare');
                await loadRequests();
            } else {
                showError(`Eroare la actualizarea cererii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error canceling rental:', error);
            showError('Eroare la anularea închirierii');
        } finally {
            setProcessingRequest(null);
        }
    };


    const handleSort = (field: 'start_date' | 'amount') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    function handleSelectRequest(request: BorrowRequestDTO) {
        console.log('should select this request: ', request)
        // Navigate to request details view
        setSearchParams({ section: 'requests', requestId: request.id.toString() });
    }

    function clearSort() {
        setSortBy(null);
        setSortOrder('asc');
    }

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Requests Table Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">{t('admin.requests.rentalRequests')}</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setStatus(prev => prev === 'PENDING' ? null : 'PENDING')}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${status === 'PENDING'
                                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 hover:bg-yellow-500/30 hover:border-yellow-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {status === 'PENDING'
                                        ? t('admin.requests.hideInPending')
                                        : t('admin.requests.showInPending')}
                                </button>


                                <button
                                    onClick={() => setStatus(prev => prev === 'REJECTED' ? null : 'REJECTED')}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${status === 'REJECTED'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {status === 'REJECTED'
                                        ? t('admin.requests.hideRejected')
                                        : t('admin.requests.showRejected')}
                                </button>


                                <button
                                    onClick={() => setStatus(prev => prev === 'APPROVED' ? null : 'APPROVED')}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${status === 'APPROVED'
                                        ? 'bg-green-500/20 text-green-300 border-green-500/50 hover:bg-green-500/30 hover:border-green-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {status === 'APPROVED'
                                        ? t('admin.requests.hideApproved')
                                        : t('admin.requests.showApproved')}
                                </button>

                                <button
                                    onClick={() => setShowAddRentalModal(true)}
                                    className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    {t('admin.requests.createRequest')}
                                </button>
                            </div>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            {/* Search */}
                            <div className="w-full md:flex-1 md:max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.placeholders.searchRequests')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-xs md:text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Filter and Sort Buttons */}
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                <span className="hidden md:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.requests.sortBy')}</span>
                                <span className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('admin.requests.sortBy')}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleSort('start_date')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'start_date'
                                            ? sortOrder === 'asc'
                                                ? 'bg-green-500/20 text-green-300 border-green-500/50'
                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.requests.pickupDate')}</span>
                                        {sortBy === 'start_date' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'start_date' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('amount')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'amount'
                                            ? sortOrder === 'asc'
                                                ? 'bg-green-500/20 text-green-300 border-green-500/50'
                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.requests.amount')}</span>
                                        {sortBy === 'amount' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'amount' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={clearSort}
                                        className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                        {t('admin.requests.clearSort')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards / Desktop Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                ) : requests.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden p-4 space-y-4">
                            {requests.map((request) => {
                                return (
                                    <div
                                        key={request.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => {
                                            handleSelectRequest(request)
                                        }}
                                    >
                                        {/* Header: Customer and Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                    {getInitials(request.customer_first_name || 'U')}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-semibold text-white text-sm truncate">{request.customer_first_name + ' ' + request.customer_last_name}</span>
                                                    {request.customer_phone && (
                                                        <span className="text-gray-400 text-xs truncate">{request.customer_phone}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm flex-shrink-0 ${request.status === 'PENDING'
                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                    : request.status === 'APPROVED'
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                    }`}
                                            >
                                                {request.status === 'PENDING' ? t('admin.status.pending') :
                                                    request.status === 'APPROVED' ? t('admin.status.approved') :
                                                        request.status === 'REJECTED' ? t('admin.status.rejected') : ''
                                                }
                                            </span>
                                        </div>

                                        {/* Car Info */}
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                            <img
                                                src={request.car.image_url || ''}
                                                alt={getCarName(request.car)}
                                                className="w-12 h-12 object-cover rounded-md border border-white/10 flex-shrink-0"
                                            />
                                            <span className="text-white font-medium text-sm flex-1">{getCarName(request.car)}</span>
                                        </div>

                                        {/* Dates and Amount */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.pickup')}</p>
                                                <p className="text-white text-sm font-medium">{formatDateLocal(request.start_date)}</p>
                                                <p className="text-gray-400 text-xs">{request.start_time}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.return')}</p>
                                                <p className="text-white text-sm font-medium">{formatDateLocal(request.end_date)}</p>
                                                <p className="text-gray-400 text-xs">{request.end_time}</p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-gray-400 text-xs mb-1">{t('admin.requests.amount')}</p>
                                            <p className="text-white font-semibold text-base">
                                                {formatAmount(request.total_amount)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.customer')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.car')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.pickup')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.return')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.amount')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.status')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {requests.map((request) => {
                                        return (
                                            <tr
                                                key={request.id}
                                                className="border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
                                                onClick={() => {
                                                    handleSelectRequest(request)
                                                }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                            {getInitials(request.customer_name || 'U')}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-white text-sm truncate">{request.customer_name}</span>
                                                            {request.customer_phone && (
                                                                <span className="text-gray-400 text-xs truncate">{request.customer_phone}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {request.car && request.car.image_url && (
                                                        <div className="flex items-center gap-3">

                                                            <img
                                                                src={request.car.image_url}
                                                                alt={request.car?.make}
                                                                className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0"
                                                            />
                                                            <span className="text-white font-medium text-sm">{getCarName(request.car)}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{formatDateLocal(request.end_date)}</span>
                                                        <span className="text-gray-400 text-xs">{request.start_time}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{formatDateLocal(request.end_date)}</span>
                                                        <span className="text-gray-400 text-xs">{request.end_time}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-semibold text-sm">
                                                        {formatAmount(request.total_amount)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${request.status === 'PENDING'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : request.status === 'APPROVED'
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                            }`}
                                                    >
                                                        {request.status === 'PENDING' ? t('admin.status.pending') :
                                                            request.status === 'APPROVED' ? t('admin.status.approved') :
                                                                request.status === 'REJECTED' ? t('admin.status.rejected') : ''}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {searchQuery ? t('admin.requests.noRequests') : t('admin.requests.noRequests')}
                    </div>
                )}
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-m text-gray-300">
                    Showing {requests.length > 0 ? (currentPage - 1) * requestsPerPage + 1 : 0} to {Math.min(currentPage * requestsPerPage, totalRequests)} of {totalRequests} requests

                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Previous
                    </button>
                    <div className="text-sm text-gray-300 px-2">
                        Page {currentPage} of {totalPages || 1}
                    </div>
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm"
                    >
                        Next
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Add Rental Modal */}
            {showAddRentalModal && (
                <CreateRentalModal
                    cars={cars}
                    initialCarId={selectedCarIdForRental}
                    onSave={async (rentalData) => {
                        try {
                            const result = await createBorrowRequest(
                                rentalData.carId || '',
                                rentalData.pickupDate || '',
                                rentalData.pickupTime || '',
                                rentalData.returnDate || '',
                                rentalData.returnTime || '',
                                rentalData.customerName || '',
                                rentalData.customerFirstName || '',
                                rentalData.customerLastName || '',
                                rentalData.customerEmail || '',
                                rentalData.customerPhone || '',
                                rentalData.customerAge ? String(rentalData.customerAge) : undefined,
                                (rentalData as any).comment,
                                (rentalData as any).options,
                                rentalData.amount
                            );
                            if (result.success) {
                                showSuccess('Request created successfully!');
                                setShowAddRentalModal(false);
                                setSelectedCarIdForRental(undefined);
                                await loadRequests();
                            } else {
                                showError(`Failed to create request: ${result.error || 'Unknown error'}`);
                            }
                        } catch (error) {
                            console.error('Error creating request:', error);
                            showError('An error occurred while creating the request.');
                        }
                    }}
                    onClose={() => {
                        setShowAddRentalModal(false);
                        setSelectedCarIdForRental(undefined);
                    }}
                />
            )}

            {/* Request Details Modal */}
            {showRequestDetailsModal && selectedRequest && (
                <RequestDetailsModal
                    request={selectedRequest}
                    handleClose={() => {
                        setShowRequestDetailsModal(false);
                        setSelectedRequest(null);
                    }}
                    handleAccept={handleAccept}
                    handleReject={handleReject}
                    handleUndoReject={handleUndoReject}
                    handleSetToPending={handleSetToPending}
                    handleEdit={handleEdit}
                    handleCancel={handleCancelRental}
                    isProcessing={processingRequest === selectedRequest.id.toString()}
                />
            )}

            {/* Contract Creation Modal */}
            {/* {showContractModal && selectedRentalForContract && (() => {
                const car = cars.find(c => c.id.toString() === selectedRentalForContract.carId);
                return car ? (
                    <ContractCreationModal
                        isOpen={showContractModal}
                        onClose={() => {
                            setShowContractModal(false);
                            setSelectedRentalForContract(null);
                        }}
                        order={selectedRentalForContract as any}
                        car={car}
                        onContractCreated={async () => {
                            setShowContractModal(false);
                            setSelectedRentalForContract(null);
                            await loadRequests();
                        }}
                    />
                ) : null;
            })()} */}

            {/* Contract Creation Modal for Requests */}
            {/* {showRequestContractModal && selectedRequestForContract && (() => {
                const car = cars.find(c => c.id.toString() === selectedRequestForContract.carId);
                return car ? (
                    <ContractCreationModal
                        isOpen={showRequestContractModal}
                        onClose={() => {
                            setShowRequestContractModal(false);
                            setSelectedRequestForContract(null);
                        }}
                        order={{
                            ...selectedRequestForContract,
                            request_id: selectedRequestForContract.id // Set request_id to the request's own ID
                        } as any}
                        car={car}
                        onContractCreated={async () => {
                            // Contract has been created and request approved, close modal and reload
                            setProcessingRequest(null);
                            setShowRequestContractModal(false);
                            setSelectedRequestForContract(null);
                            await loadRequests();
                            showSuccess('Cerere aprobată și contract creat cu succes!');
                        }}
                    />
                ) : null;
            })()} */}

            {/* Edit Request Modal */}
            {showEditModal && editingRequest && (
                <EditRequestModal
                    cars={cars}
                    request={editingRequest}
                    onSave={async (updatedData) => {
                        try {
                            const result = await updateBorrowRequest(editingRequest.id.toString(), updatedData);
                            if (result.success) {
                                alert(t('admin.requests.requestUpdated'));
                                setShowEditModal(false);
                                setEditingRequest(null);
                                await loadRequests();
                            } else {
                                alert(`${t('admin.requests.requestUpdateFailed')} ${result.error}`);
                            }
                        } catch (error) {
                            console.error('Error updating request:', error);
                            alert(t('admin.requests.requestUpdateErrorOccurred'));
                        }
                    }}
                    onClose={() => {
                        setShowEditModal(false);
                        setEditingRequest(null);
                    }}
                />
            )}
        </motion.div>
    );
};
