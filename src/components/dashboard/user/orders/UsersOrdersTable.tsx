import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { Car as CarIcon, Loader2, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search, Plus } from 'lucide-react';
import { fetchRentalsHistory } from '../../../../lib/db/rentals/rentals';
import { EmptyState } from '../../../ui/EmptyState';
import { LoadingState } from '../../../ui/LoadingState';
import { Rental, RentalDTO } from '../../../../types';
import UserCreateRentalRequestModal from '../../../modals/UserCreateRentalRequestModal/UserCreateRentalRequestModal';

type OrdersTableProps = {
    title: string;
    onOrderClick: (order: Rental, orderNumber: number) => void;
    onAddOrder: () => void;
};

export const UserOrdersTable: React.FC<OrdersTableProps> = ({ title, onOrderClick }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');


    const [page, setPage] = useState(1);
    const pageSize = 5;

    const [orders, setOrders] = useState<RentalDTO[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    const [sortBy, setSortBy] = useState<'start_date' | 'total_amount' | null>(null);

    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const totalPages = Math.ceil(total / pageSize);

    // Debounce effect
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
            setPage(1); // reset to first page after search
        }, 1500); // 3 seconds

        return () => clearTimeout(handler); // cleanup on new keystroke
    }, [searchQuery]);

    // Fetch orders whenever page or sort changes
    useEffect(() => {
        handleFetchOrdersHistory();
    }, [page, sortBy, sortOrder, debouncedSearchQuery]);

    async function handleFetchOrdersHistory() {
        setLoading(true);
        // console.log('Making a request for this filters: ', { page, pageSize, sortBy, sortOrder, debouncedSearchQuery })
        const { rentals, total } = await fetchRentalsHistory(page, pageSize, sortBy, sortOrder, debouncedSearchQuery);

        setOrders(rentals);
        setTotal(total);

        setLoading(false);
    }



    const goToPage = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
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

    const handleOrderClick = (order: Rental) => {
        if (onOrderClick) {
            const orderNumber = order.id || '';
            onOrderClick(order, parseInt(orderNumber));
        }
    };

    const clearFilters = () => {
        setSearchQuery('')
        setDebouncedSearchQuery('');
        setSortBy(null);
        setSortOrder('desc');
        setPage(1);
    };

    function openModal() {
        setIsModalOpen(true);
    }

    function closeModal() {
        setIsModalOpen(false);
    }

    return (
        <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden mb-8">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row justify-between gap-4">
                <h3 className="text-xl font-bold text-white">{title}</h3>
                <button onClick={openModal} className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 font-semibold rounded-lg flex items-center gap-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Make a new request
                </button>
            </div>


            {/* Filters Section */}
            <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                        />
                    </div>
                </div>
                {/* Sort Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort by:</span>

                    {['start_date', 'total_amount'].map((field) => {
                        const isActive = sortBy === field;
                        const arrowColor = isActive
                            ? sortOrder === 'asc'
                                ? 'text-green-400'
                                : 'text-red-400'
                            : 'opacity-50 text-gray-400';

                        return (
                            <button
                                key={field}
                                onClick={() => {
                                    if (sortBy === field) {
                                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                                    } else {
                                        setSortBy(field as 'start_date' | 'total_amount');
                                        setSortOrder('asc'); // default ascending
                                    }
                                    setPage(1); // reset page
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                    }`}
                            >
                                {field === 'start_date' ? 'Date' : 'Price'}
                                {isActive ? (
                                    sortOrder === 'asc' ? (
                                        <ArrowUp className={`w-3 h-3 ${arrowColor}`} />
                                    ) : (
                                        <ArrowDown className={`w-3 h-3 ${arrowColor}`} />
                                    )
                                ) : (
                                    <ArrowUpDown className={`w-3 h-3 ${arrowColor}`} />
                                )}
                            </button>


                        );
                    })}
                    {/* CLEAR FILTERS */}
                    {(sortBy || searchQuery) && (
                        <button
                            onClick={clearFilters}
                            className="px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            {loading ? (
                <LoadingState message={'Loading orders...'} />
            ) : (
                <>
                    {orders.length === 0 ? (
                        <EmptyState
                            icon={<CarIcon className="w-8 h-8 text-gray-400" />}
                            title="No orders available for this filters"
                            subtitle="Try adjusting your current filters"
                            buttonText="Clear Filters"
                            onButtonClick={clearFilters}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-white/10">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Vehicle</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
                                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/10">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-white/50">
                                                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                                                    <p className="mt-2 text-sm text-gray-400">Loading orders...</p>
                                                </td>
                                            </tr>
                                        ) : orders.length === 0 ? (
                                            <tr>
                                                <td colSpan={4}>
                                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                                        <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mb-4">
                                                            <CarIcon className="w-8 h-8 text-gray-400" />
                                                        </div>
                                                        <p className="text-gray-400 text-lg font-medium mb-1">No orders available for this filters</p>
                                                        <p className="text-gray-500 text-sm">Try adjusting your current filters</p>
                                                        <button
                                                            onClick={clearFilters}
                                                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2 mt-4"
                                                        >
                                                            Clear Filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            orders.map((order) => (
                                                <tr key={order.id} className="hover:bg-white/5 cursor-pointer" onClick={() => handleOrderClick(order)}>
                                                    <td className="px-6 py-3 flex items-center gap-3">
                                                        {order.car?.image_url ? (
                                                            <img src={order.car.image_url} alt={order.car.make + ' ' + order.car.model} className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0" />
                                                        ) : (
                                                            <div className="w-10 h-10 bg-white/5 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                                                                <CarIcon className="w-4 h-4 text-gray-400" />
                                                            </div>
                                                        )}
                                                        <span className="text-white font-semibold text-sm">{order.car?.make} {order.car?.model}</span>
                                                    </td>
                                                    <td className="px-6 py-3">{getStatusBadge(order.rental_status)}</td>
                                                    <td className="px-6 py-3 text-white text-sm">{formatDate(order.start_date)}</td>
                                                    <td className="px-6 py-3 text-white text-sm">{order.total_amount} MDL</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>


                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
                                <div className="text-sm text-gray-300">
                                    {`Showing ${orders.length > 0 ? (page - 1) * pageSize + 1 : 0} to ${(page - 1) * pageSize + orders.length} of ${total} orders`}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm">
                                        <ArrowLeft className="w-4 h-4" /> Previous
                                    </button>
                                    <div className="text-sm text-gray-300 px-2">Page {page} of {totalPages || 1}</div>
                                    <button onClick={() => goToPage(page + 1)} disabled={page === totalPages || totalPages === 0} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/20 bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-all text-sm">
                                        Next <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}


            {isModalOpen && (
                <UserCreateRentalRequestModal
                    onClose={closeModal}
                />
            )}


        </div>
    );
};
