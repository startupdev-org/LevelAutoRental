import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { cars } from '../../data/cars';
import { format } from 'date-fns';
import { fetchRentalsOnly, OrderDisplay } from '../../lib/orders';
import { Car as CarIcon, Loader2, ArrowLeft, ArrowRight, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Car } from '../../types';

type OrdersTableProps = {
    title: string;
    orders: OrderDisplay[];
    loading?: boolean;
    onOrderClick?: (order: OrderDisplay, orderNumber: number) => void;
    onAddOrder?: () => void;
    initialSearch?: string;
    showCancelled?: boolean;
    onToggleShowCancelled?: () => void;
    cars?: Car[];
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ title, orders, loading = false, onOrderClick, onAddOrder, initialSearch, showCancelled = false, onToggleShowCancelled, cars: propCars }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [sortBy, setSortBy] = useState<'date' | 'customer' | 'amount' | 'status' | null>('status');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 6;

    // Use provided cars or fallback to static cars
    const carsList = propCars || cars;

    // Calculate total price for an order (exact same logic as requests)
    const calculateOrderTotalPrice = useCallback((order: OrderDisplay): number => {
        const car = carsList.find(c => c.id.toString() === order.carId);
        if (!car) return order.amount || 0;

        const formatTime = (timeString: string): string => {
            if (!timeString) return '00:00';
            if (timeString.includes('AM') || timeString.includes('PM')) {
                const [time, period] = timeString.split(' ');
                const [hours, minutes] = time.split(':');
                let hour24 = parseInt(hours);
                if (period === 'PM' && hour24 !== 12) hour24 += 12;
                if (period === 'AM' && hour24 === 12) hour24 = 0;
                return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
            }
            if (timeString.includes(':')) {
                const [hours, minutes] = timeString.split(':');
                return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
            }
            return '00:00';
        };

        const startDate = new Date(order.pickupDate);
        const endDate = new Date(order.returnDate);

        const pickupTime = formatTime(order.pickupTime);
        const returnTime = formatTime(order.returnTime);
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

        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;

        // Calculate pricing using same system as Calculator.tsx
        const rentalDays = days; // Use full days for discount calculation (same as Calculator)
        const totalDays = days + (hours / 24); // Use total days for final calculation

        // Base price calculation (same as Calculator.tsx)
        let basePrice = 0;
        let discountPercent = 0;

        if (rentalDays >= 8) {
            discountPercent = 4;
            basePrice = car.price_per_day * 0.96 * rentalDays; // -4%
        } else if (rentalDays >= 4) {
            discountPercent = 2;
            basePrice = car.price_per_day * 0.98 * rentalDays; // -2%
        } else {
            basePrice = car.price_per_day * rentalDays;
        }

        // Add hours portion (hours are charged at full price, no discount)
        if (hours > 0) {
            const hoursPrice = (hours / 24) * car.price_per_day;
            basePrice += hoursPrice;
        }

        // Calculate additional costs from options (same as Calculator.tsx)
        const options = (order as any).options || (order as any).features;
        let parsedOptions: any = {};


        if (options) {
            if (typeof options === 'string') {
                try {
                    parsedOptions = JSON.parse(options);
                } catch (e) {
                    parsedOptions = {};
                }
            } else if (Array.isArray(options)) {
                // Handle features array from rentals
                parsedOptions = {};
                options.forEach((feature: string) => {
                    const featureLower = feature.toLowerCase();
                    if (featureLower.includes('unlimited') || featureLower.includes('kilometraj')) {
                        parsedOptions.unlimitedKm = true;
                    } else if (featureLower.includes('speed') || featureLower.includes('viteză')) {
                        parsedOptions.speedLimitIncrease = true;
                    } else if (featureLower.includes('tire') || featureLower.includes('anvelope') || featureLower.includes('parbriz')) {
                        parsedOptions.tireInsurance = true;
                    } else if (featureLower.includes('driver') || featureLower.includes('șofer')) {
                        parsedOptions.personalDriver = true;
                    } else if (featureLower.includes('priority')) {
                        parsedOptions.priorityService = true;
                    } else if (featureLower.includes('child') || featureLower.includes('copil') || featureLower.includes('scaun')) {
                        parsedOptions.childSeat = true;
                    } else if (featureLower.includes('sim') || featureLower.includes('card')) {
                        parsedOptions.simCard = true;
                    } else if (featureLower.includes('roadside') || featureLower.includes('asistență') || featureLower.includes('rutieră')) {
                        parsedOptions.roadsideAssistance = true;
                    }
                });
            } else {
                parsedOptions = options;
            }
        }


        let additionalCosts = 0;
        const baseCarPrice = car.price_per_day;

        // Percentage-based options (calculated on discounted price)
        if (parsedOptions.unlimitedKm) {
            additionalCosts += baseCarPrice * totalDays * 0.5;
        }
        if (parsedOptions.speedLimitIncrease) {
            additionalCosts += baseCarPrice * totalDays * 0.2;
        }
        if (parsedOptions.tireInsurance) {
            additionalCosts += baseCarPrice * totalDays * 0.2;
        }

        // Fixed daily costs
        if (parsedOptions.personalDriver) {
            additionalCosts += 800 * rentalDays;
        }
        if (parsedOptions.priorityService) {
            additionalCosts += 1000 * rentalDays;
        }
        if (parsedOptions.childSeat) {
            additionalCosts += 100 * rentalDays;
        }
        if (parsedOptions.simCard) {
            additionalCosts += 100 * rentalDays;
        }
        if (parsedOptions.roadsideAssistance) {
            additionalCosts += 500 * rentalDays;
        }

        // Total price = base price + additional costs
        const totalPrice = basePrice + additionalCosts;


        return Math.round(totalPrice);
    }, [carsList]);

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
            const orderIdString = typeof order.id === 'string' ? order.id : order.id.toString();
            const matchesSearch = (
                order.customerName.toLowerCase().includes(searchLower) ||
                order.customerPhone?.toLowerCase().includes(searchLower) ||
                order.customerEmail?.toLowerCase().includes(searchLower) ||
                order.carName.toLowerCase().includes(searchLower) ||
                orderIdString.toLowerCase().includes(searchLower)
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
                    diff = calculateOrderTotalPrice(a) - calculateOrderTotalPrice(b);
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
                'CONTRACT': 0,
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
    }, [orders, searchQuery, sortBy, sortOrder, showCancelled, calculateOrderTotalPrice]);

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
            <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                <div className="flex flex-col gap-3 md:gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                        <div>
                            <h2 className="text-lg md:text-xl font-bold text-white">{title}</h2>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                            {onToggleShowCancelled && (
                                <button
                                    onClick={onToggleShowCancelled}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${
                                        showCancelled
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
                        const carImage = (order as any).carImage || order.avatar || '';
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
                                    {getStatusBadge(order.status)}
                                </div>

                                {/* Customer Info */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-md">
                                        {getInitials(order.customerName || 'U')}
                                    </div>
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className="font-semibold text-white text-sm truncate">{order.customerName || 'Unknown'}</span>
                                        {order.customerPhone && (
                                            <span className="text-gray-400 text-xs truncate">{order.customerPhone}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Car Info */}
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                    {carImage ? (
                                        <img
                                            src={carImage}
                                            alt={order.carName || 'Car'}
                                            className="w-12 h-12 object-cover rounded-md border border-white/10 flex-shrink-0"
                                        />
                                    ) : (
                                        <div className="w-12 h-12 bg-white/5 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                                            <CarIcon className="w-5 h-5 text-gray-400" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white font-semibold text-sm truncate">{order.carName || 'Unknown Car'}</p>
                                    </div>
                                </div>

                                {/* Dates */}
                                {(order.pickupDate || order.returnDate) && (
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        {order.pickupDate && (
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.pickup') || 'Pickup'}</p>
                                                <p className="text-white text-sm font-medium">
                                                    {order.pickupDate ? formatDate(order.pickupDate) : '—'}
                                                </p>
                                                {order.pickupTime && (
                                                    <p className="text-gray-400 text-xs">{order.pickupTime}</p>
                                                )}
                                            </div>
                                        )}
                                        {order.returnDate && (
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.return') || 'Return'}</p>
                                                <p className="text-white text-sm font-medium">
                                                    {order.returnDate ? formatDate(order.returnDate) : '—'}
                                                </p>
                                                {order.returnTime && (
                                                    <p className="text-gray-400 text-xs">{order.returnTime}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Amount */}
                                <div className="pt-4 border-t border-white/10">
                                    <p className="text-gray-400 text-xs mb-1">{t('admin.orders.amount')}</p>
                                    <p className="text-white font-semibold text-base">
                                        {calculateOrderTotalPrice(order) > 0 ? (
                                            `${calculateOrderTotalPrice(order).toLocaleString()} MDL`
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
                                            {((order as any).carImage || order.avatar) ? (
                                                <img
                                                    src={(order as any).carImage || order.avatar}
                                                    alt={order.carName || 'Car'}
                                                    className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 bg-white/5 rounded-md border border-white/10 flex items-center justify-center flex-shrink-0">
                                                    <CarIcon className="w-4 h-4 text-gray-400" />
                                                </div>
                                            )}
                                            <div>
                                                <p className="text-white font-semibold text-sm">{order.carName || 'Unknown Car'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="px-6 py-3 text-white font-semibold text-sm">
                                        {calculateOrderTotalPrice(order) > 0 ? (
                                            `${calculateOrderTotalPrice(order).toLocaleString()} MDL`
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
                    {t('admin.orders.showing')} {paginatedOrders.length > 0 ? ((currentPage - 1) * pageSize) + 1 : 0} {t('admin.orders.to')} {Math.min(currentPage * pageSize, filteredAndSortedOrders.length)} {t('admin.orders.of')} {filteredAndSortedOrders.length} {t('admin.orders.orders')}
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
