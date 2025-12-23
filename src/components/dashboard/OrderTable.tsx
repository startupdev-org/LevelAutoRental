import React, { useEffect, useState } from 'react';
import { Car as CarIcon, Loader2, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Car, RentalDTO } from '../../types';
import { formatPrice } from '../../utils/currency';
import { getCarName } from '../../utils/car/car';
import { formatTime } from '../../utils/time';
import { formatDateLocal } from '../../utils/date';
import { fetchRentalsForAdminPaginated } from '../../lib/db/rentals/rentals';

type OrdersTableProps = {
    title: string;
    loading?: boolean;
    onOrderClick?: (order: RentalDTO, orderNumber: number) => void;
    onAddOrder?: () => void;
    initialSearch?: string;
    showCancelled?: boolean;
    onToggleShowCancelled?: () => void;
    orderStatusFilter?: 'ACTIVE' | 'COMPLETED' | null;
    onOrderStatusFilterChange?: (status: 'ACTIVE' | 'COMPLETED' | null) => void;
    cars?: Car[];
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ title, loading = false, onOrderClick, initialSearch, showCancelled = false, onToggleShowCancelled, orderStatusFilter, onOrderStatusFilterChange, cars: propCars }) => {
    const { t, i18n } = useTranslation();
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [sortBy, setSortBy] = useState<'date' | 'customer' | 'amount' | 'status' | null>('status');

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const [orders, setOrders] = useState<RentalDTO[]>([]);
    const [totalOrders, setTotalOrders] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setLoading] = useState(false);
    const pageSize = 6;

    // Update search query when initialSearch prop changes
    useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch);
        }
    }, [initialSearch]);


    useEffect(() => {
        setCurrentPage(1);
    }, [orders, orderStatusFilter]);

    useEffect(() => {
        const loadOrdersPaginated = async () => {
            setLoading(true);
            try {
                const { rentals, total } = await handleFetchRentalsForAdminPaginated(
                    currentPage,
                    pageSize
                );

                setOrders(rentals)
                setTotalOrders(total)

            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false)
            }
        };
        loadOrdersPaginated();
    }, []);

    async function handleFetchRentalsForAdminPaginated(
        page: number,
        pageSize: number
    ): Promise<{ rentals: RentalDTO[]; total: number }> {
        return await fetchRentalsForAdminPaginated(page, pageSize);
    }

    // Filter orders based on status filter and cancelled visibility
    const filteredOrders = orders.filter(order => {
        // Filter by status (ACTIVE/COMPLETED)
        if (orderStatusFilter && order.rental_status !== orderStatusFilter) {
            return false;
        }

        // Filter cancelled orders if not showing them
        if (!showCancelled && order.rental_status === 'CANCELLED') {
            return false;
        }

        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / pageSize);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages) return;
        setCurrentPage(page);
    };

    const handleSort = (field: 'date' | 'customer' | 'amount' | 'status') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with descending order (newest first for date)
            setSortBy(field);
            setSortOrder(field === 'date' ? 'desc' : 'asc');
        }
        setCurrentPage(1); // Reset to first page when sorting
    };


    // Use the actual database ID from Supabase and format as #0001, #0002, etc.
    const getOrderNumber = (order: RentalDTO) => {
        // Convert ID to number if it's a string, then format with leading zeros
        const id = typeof order.id === 'number' ? order.id : parseInt(order.id.toString(), 10);
        return id || 0;
    };

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { bg: string; text: string; border: string }> = {
            'CONTRACT': { bg: 'bg-orange-500/20', text: 'text-orange-300', border: 'border-orange-500/50' },
            'ACTIVE': { bg: 'bg-blue-500/20', text: 'text-blue-300', border: 'border-blue-500/50' },
            'COMPLETED': { bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/50' },
            'CANCELLED': { bg: 'bg-gray-500/20', text: 'text-gray-300', border: 'border-gray-500/50' },
        };

        const styles = statusMap[status] || statusMap['ACTIVE'];
        const statusTranslations: Record<string, string> = {
            'CONTRACT': t('admin.status.contract'),
            'ACTIVE': t('admin.status.active'),
            'COMPLETED': t('admin.status.completed'),
            'CANCELLED': t('admin.status.cancelled'),
        };
        const statusText = statusTranslations[status] || status.charAt(0) + status.slice(1).toLowerCase();
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${styles.bg} ${styles.text} ${styles.border}`}>
                {statusText}
            </span>
        );
    };

    const handleOrderClick = (order: RentalDTO) => {
        if (onOrderClick) {
            const orderNumber = getOrderNumber(order);
            onOrderClick(order, orderNumber);
        }
    };

    const getInitials = (name: string) => {
        const parts = name.trim().split(' ');
        if (parts.length >= 2) {
            return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                <div className="flex flex-col gap-3 md:gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
                        </div>
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            {onOrderStatusFilterChange && (
                                <>
                                    <button
                                        onClick={() => onOrderStatusFilterChange(orderStatusFilter === 'ACTIVE' ? null : 'ACTIVE')}
                                        className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${orderStatusFilter === 'ACTIVE'
                                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/50 hover:bg-blue-500/30 hover:border-blue-500/60'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {orderStatusFilter === 'ACTIVE' ? t('admin.orders.hideActive') : t('admin.orders.showActive')}
                                    </button>

                                    <button
                                        onClick={() => onOrderStatusFilterChange(orderStatusFilter === 'COMPLETED' ? null : 'COMPLETED')}
                                        className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${orderStatusFilter === 'COMPLETED'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30 hover:border-emerald-500/60'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        {orderStatusFilter === 'COMPLETED' ? t('admin.orders.hideCompleted') : t('admin.orders.showCompleted')}
                                    </button>
                                </>
                            )}
                            {onToggleShowCancelled && (
                                <button
                                    onClick={onToggleShowCancelled}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${showCancelled
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {showCancelled ? t('admin.orders.hideCancelled') : t('admin.orders.showCancelled')}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                        {/* Search */}
                        <div className="w-full md:flex-1 md:max-w-md">
                            <div className="relative">
                                <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                                <input
                                    type="text"
                                    placeholder={t('admin.placeholders.searchOrders')}
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-xs md:text-sm placeholder-gray-400"
                                />
                            </div>
                        </div>
                        {/* Sort Controls */}
                        <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                            <span className="hidden md:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.orders.sortBy')}</span>
                            <span className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('admin.orders.sortBy')}</span>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => handleSort('date')}
                                    className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'date'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span className="truncate">{t('admin.orders.date')}</span>
                                    {sortBy === 'date' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                    )}
                                    {sortBy !== 'date' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                </button>
                                <button
                                    onClick={() => handleSort('amount')}
                                    className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'amount'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <span className="truncate">{t('admin.orders.amount')}</span>
                                    {sortBy === 'amount' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                    )}
                                    {sortBy !== 'amount' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                </button>
                                {sortBy && sortBy !== 'status' && (
                                    <button
                                        onClick={() => {
                                            setSortBy('status');
                                            setSortOrder('asc');
                                        }}
                                        className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                    >
                                        {t('admin.orders.clearSort')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden p-4 space-y-4">
                {paginatedOrders.length === 0 ? (
                    <div className="px-4 py-12 text-center text-gray-400">
                        {t('admin.orders.noOrders')}
                    </div>
                ) : (
                    paginatedOrders.map((order) => {
                        const carImage = (order as any).carImage || order.car?.image_url || '';
                        return (
                            <div
                                key={order.id}
                                className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                                onClick={() => handleOrderClick(order)}
                            >
                                {/* Header: Order ID and Status */}
                                <div className="flex items-start justify-between mb-4">
                                    <span className="text-white font-semibold text-sm">
                                        #{getOrderNumber(order).toString().padStart(4, '0')}
                                    </span>
                                    {getStatusBadge(order.rental_status)}
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                                        {getInitials(order.customer_email || 'U')}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-white text-sm truncate">{order.customer_email || 'Unknown'}</span>
                                        {/* {order.customerPhone && (
                                            <span className="text-gray-400 text-xs truncate">{order.customerPhone}</span>
                                        )} */}
                                    </div>
                                </div>

                                {/* Car Info */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                    {carImage ? (
                                        <img
                                            src={carImage}
                                            alt={order.car?.make || 'Car Make'}
                                            className="w-12 h-12 object-cover rounded-md border border-white/10 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-white/5 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <CarIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{getCarName(order.car) || 'Unknown Car'}</p>
                                    </div>
                                </div>

                                {/* Dates */}
                                {(order.start_date || order.end_date) && (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {order.start_date && (
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.pickup') || 'Pickup'}</p>
                                                <p className="text-white text-sm font-medium">
                                                    {order.start_date ? formatDateLocal(order.start_date, t('config.date')) : '—'}
                                                </p>
                                                {order.start_time && (
                                                    <p className="text-gray-400 text-xs">{order.start_time.slice(0, 5)}</p>
                                                )}
                                            </div>
                                        )}
                                        {order.end_date && (
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.return') || 'Return'}</p>
                                                <p className="text-white text-sm font-medium">
                                                    {order.end_date ? formatDateLocal(order.end_date, t('config.date')) : '—'}
                                                </p>
                                                {order.end_time && (
                                                    <p className="text-gray-400 text-xs">{formatTime(order.end_time)}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-xs mb-1">{t('admin.orders.amount')}</p>
                                    <p className="text-white font-semibold text-base">
                                        {order.total_amount && order.total_amount > 0 ? (
                                            formatPrice(order.total_amount, 'MDL', i18n.language)
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {t('admin.orders.orderId')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {t('admin.orders.customer')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {t('admin.orders.vehicle')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                {t('admin.orders.status')}
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('amount')}
                                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                                >
                                    {t('admin.orders.amount')}
                                    {sortBy === 'amount' ? (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    ) : (
                                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                                    )}
                                </button>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {paginatedOrders.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-400">
                                    {t('admin.orders.noOrders')}
                                </td>
                            </tr>
                        ) : (
                            paginatedOrders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-white/5 transition-colors cursor-pointer"
                                    onClick={() => handleOrderClick(order)}
                                >
                                    <td className="px-6 py-3">
                                        <span className="text-white font-semibold text-sm">
                                            #{getOrderNumber(order).toString().padStart(4, '0')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                                                {getInitials(order.customer_email || 'U')}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-white text-sm truncate">{order.customer_email}</span>
                                                {/* <span className="text-gray-400 text-xs truncate">{order.customerPhone || 'N/A'}</span> */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            {(order.car?.image_url) ? (
                                                <img
                                                    src={order.car?.image_url}
                                                    alt={getCarName(order.car) || 'Car Name'}
                                                    className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-white/5 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <CarIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-semibold text-sm">{getCarName(order.car) || 'Unknown Car'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {getStatusBadge(order.rental_status)}
                                    </td>
                                    <td className="px-6 py-3 text-white font-semibold text-sm">
                                        {order.total_amount && order.total_amount > 0 ? (
                                            formatPrice(order.total_amount, 'MDL', i18n.language)
                                        ) : (
                                            <span className="text-gray-400">—</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="px-3 md:px-6 py-3 md:py-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs md:text-sm text-gray-300 text-center sm:text-left">
                    {t('admin.orders.showing')} {paginatedOrders.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} {t('admin.orders.to')} {Math.min(currentPage * pageSize, filteredOrders.length)} {t('admin.orders.of')} {filteredOrders.length} {t('admin.orders.orders')}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-xs md:text-sm"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" />
                        <span className="hidden sm:inline">{t('admin.orders.previous')}</span>
                    </button>
                    <div className="text-xs md:text-sm text-gray-300 px-2">
                        {t('admin.orders.page')} {currentPage} {t('admin.orders.ofPage')} {totalPages || 1}
                    </div>
                    <button
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages || totalPages === 0}
                        className="flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg border border-white/20 bg-white/10 backdrop-blur-xl text-white disabled:opacity-50 hover:bg-white/20 transition-all text-xs md:text-sm"
                    >
                        <span className="hidden sm:inline">{t('admin.orders.next')}</span>
                        <ArrowRight className="w-3.5 h-3.5 md:w-4 md:h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
