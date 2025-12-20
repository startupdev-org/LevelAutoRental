import React, { useEffect, useState } from 'react';
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
import { BorrowRequestDTO, Car as CarType } from '../../../../types';
import { useNotification } from '../../../../components/ui/NotificationToaster';
import { CreateRentalModal } from '../modals/CreateRentalModal';
import { EditRequestModal } from '../modals/EditRequestModal';
import { getInitials } from '../../../../utils/customer';
import { getCarName } from '../../../../utils/car/car';
import { BorrowRequestFilters, createBorrowRequest, fetchBorrowRequestsForDisplay, updateBorrowRequest } from '../../../../lib/db/requests/requests';
import { formatDateLocal } from '../../../../utils/date';
import { formatAmount, formatPrice, getSelectedCurrency } from '../../../../utils/currency';
import { formatTime } from '../../../../utils/time';
import { supabase } from '../../../../lib/supabase';
import i18n from '../../../../i18n/i18n';
import { convertPrice } from '../../../../utils/car/pricing';
import { useExchangeRates } from '../../../../hooks/useExchangeRates';

export const RequestsView: React.FC = () => {
    const { t } = useTranslation();
    const { eur, usd } = useExchangeRates();
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const { showSuccess, showError } = useNotification();
    const [requests, setRequests] = useState<BorrowRequestDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [cars] = useState<CarType[]>([]);
    const [showAddRentalModal, setShowAddRentalModal] = useState(false);
    const [selectedCarIdForRental, setSelectedCarIdForRental] = useState<string | undefined>(undefined);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<BorrowRequestDTO | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalRequests, setTotalRequests] = useState(0);
    const [requestsPerPage] = useState(5);
    const [totalPages, setTotalPages] = useState(0);

    const [sortBy, setSortBy] = useState<'start_date' | 'amount' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [status, setStatus] = useState<'PENDING' | 'REJECTED' | 'APPROVED' | 'PROCESSED' | null>(null);

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
        // Navigate to request details view
        const requestId = request.id || '';
        setSearchParams({ section: 'requests', requestId: requestId.toString() });
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
                                    onClick={() => setStatus(prev => prev === 'PROCESSED' ? null : 'PROCESSED')}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${status === 'PROCESSED'
                                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {status === 'PROCESSED'
                                        ? t('admin.requests.hideProcessed')
                                        : t('admin.requests.showProcessed')}
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
                                                        : request.status === 'PROCESSED'
                                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                                            : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                    }`}
                                            >
                                                {request.status === 'PENDING' ? t('admin.requests.pending') :
                                                    request.status === 'APPROVED' ? t('admin.requests.approved') :
                                                        request.status === 'PROCESSED' ? t('admin.requests.processed') :
                                                            request.status === 'REJECTED' ? t('admin.requests.rejected') : ''
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
                                                <p className="text-white text-sm font-medium">{formatDateLocal(request.start_date, t('config.date'))}</p>
                                                <p className="text-gray-400 text-xs">{formatTime(request.start_time)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.return')}</p>
                                                <p className="text-white text-sm font-medium">{formatDateLocal(request.end_date, t('config.date'))}</p>
                                                <p className="text-gray-400 text-xs">{formatTime(request.end_time)}</p>
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
                                                        <span className="text-white text-sm font-medium">{formatDateLocal(request.start_date, t('config.date'))}</span>
                                                        <span className="text-gray-400 text-xs">{formatTime(request.start_time)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{formatDateLocal(request.end_date, t('config.date'))}</span>
                                                        <span className="text-gray-400 text-xs">{formatTime(request.end_time)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-semibold text-sm">
                                                        {formatPrice(convertPrice(request.total_amount, getSelectedCurrency(), eur, usd), getSelectedCurrency(), i18n.language)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${request.status === 'PENDING'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : request.status === 'APPROVED'
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                                : request.status === 'PROCESSED'
                                                                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/50'
                                                                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                            }`}
                                                    >
                                                        {request.status === 'PENDING' ? t('admin.requests.pending') :
                                                            request.status === 'APPROVED' ? t('admin.requests.approved') :
                                                                request.status === 'PROCESSED' ? t('admin.requests.processed') :
                                                                    request.status === 'REJECTED' ? t('admin.requests.rejected') : ''}
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

                {/* Pagination */}
                <div className="px-3 md:px-6 py-3 md:py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="text-xs md:text-sm text-gray-300 text-center sm:text-left">
                        {t('admin.requests.showing')} {requests.length > 0 ? (currentPage - 1) * requestsPerPage + 1 : 0} {t('admin.requests.to')} {Math.min(currentPage * requestsPerPage, totalRequests)} {t('admin.requests.of')} {totalRequests} {t('admin.requests.requests')}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-xs md:text-sm"
                        >
                            <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            <span className="hidden sm:inline">{t('admin.requests.previous')}</span>
                        </button>
                        <div className="text-xs md:text-sm text-gray-300 px-2">
                            {t('admin.requests.page')} {currentPage} {t('admin.requests.ofPage')} {totalPages || 1}
                        </div>
                        <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-xs md:text-sm"
                        >
                            <span className="hidden sm:inline">{t('admin.requests.next')}</span>
                            <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        </button>
                    </div>
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


            {/* Edit Request Modal */}
            {showEditModal && editingRequest && (
                <EditRequestModal
                    request={editingRequest}
                    onSave={async (updatedData) => {
                        try {
                            if (!editingRequest?.id) {
                                console.error("Editing request has no ID");
                                return;
                            }
                            const result = await updateBorrowRequest(editingRequest.id.toString(), updatedData);
                            if (result.success) {
                                // If this request has been processed into a rental, update the rental's total_amount too
                                if (updatedData.total_amount) {
                                    try {
                                        // Find the associated rental
                                        const { data: rental, error: rentalError } = await supabase
                                            .from('Rentals')
                                            .select('id')
                                            .eq('request_id', editingRequest.id)
                                            .in('rental_status', ['ACTIVE', 'COMPLETED'])
                                            .order('created_at', { ascending: false })
                                            .limit(1)
                                            .single();

                                        if (rental && !rentalError) {
                                            // Update the rental's total_amount
                                            const { error: updateRentalError } = await supabase
                                                .from('Rentals')
                                                .update({ total_amount: updatedData.total_amount })
                                                .eq('id', rental.id);

                                            if (updateRentalError) {
                                                console.warn('Failed to update associated rental total_amount:', updateRentalError);
                                            } else {

                                            }
                                        }
                                    } catch (rentalUpdateError) {
                                        console.warn('Error updating associated rental:', rentalUpdateError);
                                    }
                                }

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
                // isOpen={isModa}
                />
            )}
        </motion.div>
    );
};
