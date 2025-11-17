import React, { useEffect, useState, useMemo } from 'react';
import { cars } from '../../data/cars';
import { format } from 'date-fns';
import { fetchRentalsOnly, OrderDisplay } from '../../lib/orders';
import { Car as CarIcon, Loader2, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

type OrdersTableProps = {
    title: string;
    orders: OrderDisplay[];
    loading?: boolean;
    onOrderClick?: (order: OrderDisplay, orderNumber: number) => void;
    onAddOrder?: () => void;
    initialSearch?: string;
    showCancelled?: boolean;
    onToggleShowCancelled?: () => void;
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ title, orders, loading = false, onOrderClick, onAddOrder, initialSearch, showCancelled = false, onToggleShowCancelled }) => {
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [sortBy, setSortBy] = useState<'date' | 'customer' | 'amount' | 'status' | null>('status');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Update search query when initialSearch prop changes
    useEffect(() => {
        if (initialSearch !== undefined) {
            setSearchQuery(initialSearch);
        }
    }, [initialSearch]);

    // Filter and sort orders
    const filteredAndSortedOrders = useMemo(() => {
        // First filter by search query
        let filtered = orders.filter(order => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                order.customerName.toLowerCase().includes(searchLower) ||
                order.customerPhone?.toLowerCase().includes(searchLower) ||
                order.customerEmail?.toLowerCase().includes(searchLower) ||
                order.carName.toLowerCase().includes(searchLower) ||
                order.id.toLowerCase().includes(searchLower)
            );
            
            // Filter by cancelled status
            // When showCancelled is true, only show cancelled orders
            // When showCancelled is false, hide cancelled orders
            const matchesCancelledFilter = showCancelled 
                ? order.status === 'CANCELLED'
                : order.status !== 'CANCELLED';
            
            return matchesSearch && matchesCancelledFilter;
        });

        // Then sort
        if (sortBy) {
            filtered.sort((a, b) => {
                let diff = 0;

                if (sortBy === 'date') {
                    diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                } else if (sortBy === 'customer') {
                    diff = a.customerName.localeCompare(b.customerName);
                } else if (sortBy === 'amount') {
                    diff = (a.amount || 0) - (b.amount || 0);
                } else if (sortBy === 'status') {
                    const statusOrder: Record<string, number> = {
                        'CONTRACT': 0,
                        'ACTIVE': 1,
                        'COMPLETED': 2,
                        'CANCELLED': 3,
                    };
                    diff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                }

                return sortOrder === 'asc' ? diff : -diff;
            });
        } else {
            // Default: sort by status ascending
            const statusOrder: Record<string, number> = {
                'ACTIVE': 1,
                'COMPLETED': 2,
                'CANCELLED': 3,
            };
            filtered.sort((a, b) => {
                const diff = (statusOrder[a.status] || 0) - (statusOrder[b.status] || 0);
                return diff;
            });
        }

        return filtered;
    }, [orders, searchQuery, sortBy, sortOrder, showCancelled]);

    const totalPages = Math.ceil(filteredAndSortedOrders.length / pageSize);

    const paginatedOrders = filteredAndSortedOrders.slice(
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
    const getOrderNumber = (order: OrderDisplay) => {
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
        const capitalizedStatus = status.charAt(0) + status.slice(1).toLowerCase();
        return (
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${styles.bg} ${styles.text} ${styles.border}`}>
                {capitalizedStatus}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'MMM dd, yyyy');
        } catch {
            return dateString;
        }
    };

    const handleOrderClick = (order: OrderDisplay) => {
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
            <div className="px-6 py-4 border-b border-white/10">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-white">{title}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            {onToggleShowCancelled && (
                                <button
                                    onClick={onToggleShowCancelled}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${
                                        showCancelled
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/60'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {showCancelled ? 'Hide Cancelled' : 'Show Cancelled'}
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Search */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search orders..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                                />
                            </div>
                        </div>
                        {/* Sort Controls */}
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort by:</span>
                            <button
                                onClick={() => handleSort('date')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'date'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                Date
                                {sortBy === 'date' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                                {sortBy !== 'date' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                            <button
                                onClick={() => handleSort('customer')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'customer'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                Customer
                                {sortBy === 'customer' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                                {sortBy !== 'customer' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                            <button
                                onClick={() => handleSort('amount')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'amount'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                Amount
                                {sortBy === 'amount' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                                {sortBy !== 'amount' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                            <button
                                onClick={() => handleSort('status')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'status'
                                    ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                    : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                Status
                                {sortBy === 'status' && (
                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                )}
                                {sortBy !== 'status' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                            </button>
                            {sortBy && (
                                <button
                                    onClick={() => {
                                        setSortBy(null);
                                        setSortOrder('desc');
                                    }}
                                    className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                                >
                                    Clear Sort
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Order ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('customer')}
                                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                                >
                                    Customer
                                    {sortBy === 'customer' ? (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    ) : (
                                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Vehicle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('status')}
                                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                                >
                                    Status
                                    {sortBy === 'status' ? (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    ) : (
                                        <ArrowUpDown className="w-3 h-3 opacity-50" />
                                    )}
                                </button>
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                <button
                                    onClick={() => handleSort('amount')}
                                    className="flex items-center gap-1.5 hover:text-white transition-colors"
                                >
                                    Amount
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
                                    No orders available
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
                                                {getInitials(order.customerName)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="font-semibold text-white text-sm truncate">{order.customerName}</span>
                                                <span className="text-gray-400 text-xs truncate">{order.customerPhone || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            {order.carImage ? (
                                                <img
                                                    src={order.carImage}
                                                    alt={order.carName}
                                                    className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-white/5 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <CarIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-semibold text-sm">{order.carName}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-3 text-white font-semibold text-sm">
                                        {order.amount > 0 ? (
                                            `${order.amount.toFixed(2)} MDL`
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
            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                <div className="text-sm text-gray-300">
                    Showing {paginatedOrders.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} to {Math.min(currentPage * pageSize, filteredAndSortedOrders.length)} of {filteredAndSortedOrders.length} orders
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
        </div>
    );
};
