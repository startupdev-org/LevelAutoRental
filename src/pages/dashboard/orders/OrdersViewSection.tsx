import { useState, useMemo, useEffect } from 'react';
import { OrdersTable } from '../../../components/dashboard/OrderTable';
import { cancelRentalOrder, redoRentalOrder } from '../../../lib/orders';
import { updateBorrowRequest } from '../../../lib/db/requests/requests';
import { SalesChartCard } from '../../../components/dashboard/Chart';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { RentalDTO } from '../../../types';
import { useTranslation } from 'react-i18next';
import { fetchRentalsForAdmin } from '../../../lib/db/rentals/rentals';
import { OrderDetailsModal } from '../../admin/components/modals/OrderDetailsModal';

export const OrdersViewSection = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const [selectedOrder, setSelectedOrder] = useState<RentalDTO | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpening, setIsModalOpening] = useState(false);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const [orders, setOrders] = useState<RentalDTO[]>([]);
    const [showCancelled, setShowCancelled] = useState(false);
    const [orderStatusFilter, setOrderStatusFilter] = useState<'ACTIVE' | 'COMPLETED' | null>(null);
    const [loading, setLoading] = useState(false);
    const [ordersLoading, setOrdersLoading] = useState(false);

    // Load orders after cars are loaded
    const loadOrders = async () => {
        try {
            setOrdersLoading(true);
            const data = await fetchRentalsForAdmin();
            setOrders(data);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        loadOrders();
    }, [])

    // const handleCancelOrder = async (order: OrderDisplay) => {
    //     setProcessingOrder(order.id.toString());
    //     try {
    //         const result = await cancelRentalOrder(order.id.toString());
    //         if (result.success) {
    //             // If this order was created from a request, also mark the request as REJECTED
    //             const requestId = (order as any).request_id;
    //             if (requestId) {
    //                 try {
    //                     const updateResult = await updateBorrowRequest(requestId.toString(), { status: 'REJECTED' } as any);
    //                     if (!updateResult.success) {
    //                         console.warn('Failed to update corresponding request status:', updateResult.error);
    //                     }
    //                 } catch (requestError) {
    //                     console.warn('Error updating corresponding request:', requestError);
    //                 }
    //             }

    //             showSuccess('Comanda a fost anulată cu succes și cererea corespunzătoare a fost setată ca respinsă!');
    //             // Close the modal after successful cancellation
    //             setIsModalOpen(false);
    //             setSelectedOrder(null);
    //             setOrderNumber(undefined);
    //             setIsModalOpening(false);
    //             await loadOrders();
    //         } else {
    //             showError(`Eșuare la anularea comenzii: ${result.error || 'Eroare necunoscută'}`);
    //         }
    //     } catch (error) {
    //         console.error('Error cancelling order:', error);
    //         showError('A apărut o eroare la anularea comenzii.');
    //     } finally {
    //         setProcessingOrder(null);
    //     }
    // };

    // const handleRedoOrder = async (order: OrderDisplay) => {
    //     setProcessingOrder(order.id.toString());
    //     try {
    //         const result = await redoRentalOrder(order.id.toString());
    //         if (result.success) {
    //             showSuccess('Order restored successfully!');
    //             // Close the modal after successful restoration
    //             setIsModalOpen(false);
    //             setSelectedOrder(null);
    //             setOrderNumber(undefined);
    //             setIsModalOpening(false);
    //             await loadOrders();
    //         } else {
    //             showError(`Failed to restore order: ${result.error || 'Unknown error'}`);
    //         }
    //     } catch (error) {
    //         console.error('Error restoring order:', error);
    //         showError('An error occurred while restoring the order.');
    //     } finally {
    //         setProcessingOrder(null);
    //     }
    // };

    // Calculate revenue statistics from orders

    const revenueStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Current month COMPLETED orders only
        const currentMonthStart = new Date(now);
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const currentMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= currentMonthStart && order.rental_status === 'COMPLETED';
        });

        // Last month COMPLETED orders only
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const lastMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= lastMonthStart && orderDate <= lastMonthEnd && order.rental_status === 'COMPLETED';
        });

        // Calculate revenues
        const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);

        // Calculate growth
        const revenueGrowth = lastMonthRevenue > 0
            ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0;

        // Calculate average daily revenue for current month
        const daysInCurrentMonth = Math.max(1, Math.floor((now.getTime() - currentMonthStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);
        const avgDailyRevenue = totalRevenue / daysInCurrentMonth;

        // Calculate average daily revenue for last month
        const daysInLastMonth = lastMonthEnd.getDate();
        const avgDailyRevenueLastMonth = lastMonthRevenue / daysInLastMonth;

        // Find best day (highest revenue day in current month)
        const dailyRevenueMap = new Map<string, number>();
        currentMonthOrders.forEach(order => {
            const orderDate = new Date(order.created_at).toISOString().split('T')[0];
            dailyRevenueMap.set(orderDate, (dailyRevenueMap.get(orderDate) || 0) + (order.total_amount || 0));
        });

        let bestDay = '';
        let bestDayRevenue = 0;
        dailyRevenueMap.forEach((revenue, date) => {
            if (revenue > bestDayRevenue) {
                bestDayRevenue = revenue;
                bestDay = date;
            }
        });

        // Calculate order count metrics
        // Total COMPLETED orders only (as specified by user)
        const allCompletedOrders = orders.filter(order =>
            order.rental_status === 'COMPLETED'
        );
        const totalOrders = allCompletedOrders.length;
        const lastMonthOrdersCount = lastMonthOrders.length;
        const orderGrowth = lastMonthOrdersCount > 0
            ? ((currentMonthOrders.length - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
            : 0;

        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const completedOrders = currentMonthOrders.filter(order => order.rental_status === 'COMPLETED').length;
        const conversionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

        return {
            totalRevenue,
            lastMonthRevenue,
            revenueGrowth,
            avgDailyRevenue,
            avgDailyRevenueLastMonth,
            bestDay,
            bestDayRevenue,
            totalOrders,
            lastMonthOrdersCount,
            orderGrowth,
            avgOrderValue,
            conversionRate,
        };
    }, [orders]);

    // Generate chart data for all periods (like dashboard)
    const calculateChartData = useMemo(() => {
        // Filter only COMPLETED rental orders for sales calculation
        const rentalOrders = orders.filter(order =>
            order.rental_status === 'COMPLETED'
        );

        const generateChartDataForPeriod = (period: '24H' | '7D' | '30D' | 'WEEKS' | '12M') => {
            const now = new Date();
            const data: { day: number; sales: number; baseline: number }[] = [];

            // Calculate date ranges
            let startDate: Date;
            let intervals: number;
            let intervalMs: number;

            switch (period) {
                case '24H':
                    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    intervals = 24;
                    intervalMs = 60 * 60 * 1000; // 1 hour
                    break;
                case '7D':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intervals = 7;
                    intervalMs = 24 * 60 * 60 * 1000; // 1 day
                    break;
                case '30D':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    intervals = 30;
                    intervalMs = 24 * 60 * 60 * 1000; // 1 day
                    break;
                case 'WEEKS':
                    startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
                    intervals = 4;
                    intervalMs = 7 * 24 * 60 * 60 * 1000; // 1 week
                    break;
                case '12M':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    intervals = 12;
                    intervalMs = 30 * 24 * 60 * 60 * 1000; // ~1 month
                    break;
            }

            // Group orders by time interval
            for (let i = 0; i < intervals; i++) {
                const intervalStart = new Date(startDate.getTime() + i * intervalMs);
                const intervalEnd = new Date(startDate.getTime() + (i + 1) * intervalMs);

                const intervalOrders = rentalOrders.filter(order => {
                    if (!order.created_at) return false;
                    const orderDate = new Date(order.created_at);
                    return orderDate >= intervalStart && orderDate < intervalEnd;
                });

                const sales = intervalOrders.reduce((sum, order) => {
                    const amount = order.total_amount || order.total_amount || 0;
                    return sum + amount;
                }, 0);

                // Baseline is 70% of average sales for visual reference
                const avgSales = rentalOrders.length > 0
                    ? (rentalOrders.reduce((sum, o) => sum + (o.total_amount || o.total_amount || 0), 0) / rentalOrders.length) * 0.7
                    : 0;

                data.push({
                    day: i + 1,
                    sales: Math.round(sales),
                    baseline: Math.round(avgSales)
                });
            }

            return data;
        };

        return {
            '24H': generateChartDataForPeriod('24H'),
            '7D': generateChartDataForPeriod('7D'),
            '30D': generateChartDataForPeriod('30D'),
            'WEEKS': generateChartDataForPeriod('WEEKS'),
            '12M': generateChartDataForPeriod('12M')
        };
    }, [orders]);

    // Calculate sales and change for a specific period
    const calculatePeriodStats = useMemo(() => {
        const rentalOrders = orders.filter(order =>
            order.rental_status === 'COMPLETED'
        );

        const calculateForPeriod = (period: '24H' | '7D' | '30D' | 'WEEKS' | '12M') => {
            const now = new Date();
            let periodStart: Date;
            let previousPeriodStart: Date;
            let previousPeriodEnd: Date;

            switch (period) {
                case '24H':
                    periodStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(now.getTime() - 48 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    break;
                case '7D':
                    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case '30D':
                    periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'WEEKS':
                    periodStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(now.getTime() - 56 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
                    break;
                case '12M':
                    periodStart = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    previousPeriodStart = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);
                    previousPeriodEnd = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
            }

            const periodOrders = rentalOrders.filter(order => {
                if (!order.created_at) return false;
                const orderDate = new Date(order.created_at);
                return orderDate >= periodStart && orderDate <= now;
            });

            const previousPeriodOrders = rentalOrders.filter(order => {
                if (!order.created_at) return false;
                const orderDate = new Date(order.created_at);
                return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
            });

            const periodSales = periodOrders.reduce((sum, order) => {
                const amount = order.total_amount || order.total_amount || 0;
                return sum + amount;
            }, 0);

            const previousPeriodSales = previousPeriodOrders.reduce((sum, order) => {
                const amount = order.total_amount || order.total_amount || 0;
                return sum + amount;
            }, 0);

            const change = previousPeriodSales > 0
                ? ((periodSales - previousPeriodSales) / previousPeriodSales) * 100
                : 0;

            return {
                sales: periodSales,
                change: change,
                isPositive: change >= 0
            };
        };

        return {
            '24H': calculateForPeriod('24H'),
            '7D': calculateForPeriod('7D'),
            '30D': calculateForPeriod('30D'),
            'WEEKS': calculateForPeriod('WEEKS'),
            '12M': calculateForPeriod('12M')
        };
    }, [orders]);

    const [showContractModal, setShowContractModal] = useState(false);

    const handleOrderClick = (order: RentalDTO, orderNum: number) => {
        if (!isModalOpening) {
            setIsModalOpening(true);
            setSelectedOrder(order);
            setOrderNumber(orderNum);
            setIsModalOpen(true);
            // Reset modal opening state after animation
            setTimeout(() => {
                setIsModalOpening(false);
            }, 300);
        }
    };

    const handleCancelOrder = async (order: RentalDTO) => {
        setProcessingOrder(order.id.toString());
        try {
            const result = await cancelRentalOrder(order.id.toString());
            if (result.success) {
                // Close the modal after successful cancellation
                setIsModalOpen(false);
                setSelectedOrder(null);
                setOrderNumber(undefined);
                setIsModalOpening(false);
                await loadOrders();
            } else {
                console.error('Failed to cancel order:', result.error);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleRedoOrder = async (order: RentalDTO) => {
        setProcessingOrder(order.id.toString());
        try {
            const result = await redoRentalOrder(order.id.toString());
            if (result.success) {
                // Close the modal after successful restoration
                setIsModalOpen(false);
                setSelectedOrder(null);
                setOrderNumber(undefined);
                setIsModalOpening(false);
                await loadOrders();
            } else {
                console.error('Failed to restore order:', result.error);
            }
        } catch (error) {
            console.error('Error restoring order:', error);
        } finally {
            setProcessingOrder(null);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20" >
                <Loader2 className="w-8 h-8 animate-spin text-white/50" />
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
            >
                {/* Orders Table */}
                < motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <OrdersTable
                        title={t('admin.orders.allOrders')}
                        loading={ordersLoading}
                        onOrderClick={handleOrderClick}
                        initialSearch={initialSearch}
                        showCancelled={showCancelled}
                        onToggleShowCancelled={() => setShowCancelled(!showCancelled)}
                        orderStatusFilter={orderStatusFilter}
                        onOrderStatusFilterChange={setOrderStatusFilter}
                        cars={[]}
                    />
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" >
                    {/* Sales Chart */}
                    < motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                    >
                        <SalesChartCard
                            allPeriodData={calculateChartData}
                            periodStats={calculatePeriodStats}
                        />
                    </motion.div>

                    {/* Revenue Statistics */}
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                    >
                        <div>
                            <div className="mb-6" >
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1" > VENITURI </p>
                                < h3 className="text-3xl md:text-4xl font-bold text-white mb-2" >
                                    {revenueStats.totalRevenue.toFixed(2)} MDL
                                </h3>
                                < p className="text-sm text-emerald-400 font-semibold" >
                                    {revenueStats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.revenueGrowth).toFixed(1)}% față de ultimele 30 zile
                                </p>
                            </div>

                            < div className="space-y-4" >
                                {/* Last Month Comparison */}
                                < div >
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3" > Comparație cu Luna Trecută </h4>
                                    < div className="space-y-3" >
                                        <div className="flex items-center justify-between" >
                                            <span className="text-sm text-gray-300" > Venituri Luna Trecută </span>
                                            < span className="text-white font-semibold" >
                                                {revenueStats.lastMonthRevenue.toFixed(2)} MDL
                                            </span>
                                        </div>
                                        < div className="flex items-center justify-between" >
                                            <span className="text-sm text-gray-300" > Creștere </span>
                                            < span className={`font-semibold ${revenueStats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {revenueStats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.revenueGrowth).toFixed(1)}%
                                            </span>
                                        </div>
                                        < div className="flex items-center justify-between" >
                                            <span className="text-sm text-gray-300" > Medie Zilnică(Luna Aceasta) </span>
                                            < span className="text-white font-semibold" >
                                                {revenueStats.avgDailyRevenue.toFixed(2)} MDL
                                            </span>
                                        </div>
                                        < div className="flex items-center justify-between" >
                                            <span className="text-sm text-gray-300" > Medie Zilnică(Luna Trecută) </span>
                                            < span className="text-white font-semibold" >
                                                {revenueStats.avgDailyRevenueLastMonth.toFixed(2)} MDL
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Best Performing Day */}
                                {
                                    revenueStats.bestDay && (
                                        <div className="border-t border-white/10 pt-4" >
                                            <h4 className="text-sm font-semibold text-gray-300 mb-3" > Ziua cu Cea Mai Bună Performanță </h4>
                                            < div className="space-y-2" >
                                                <div className="flex items-center justify-between" >
                                                    <span className="text-sm text-gray-400" >
                                                        {
                                                            new Date(revenueStats.bestDay).toLocaleDateString('ro-RO', {
                                                                day: 'numeric',
                                                                month: 'short',
                                                                year: 'numeric'
                                                            })
                                                        }
                                                    </span>
                                                    < span className="text-white font-semibold" >
                                                        {revenueStats.bestDayRevenue.toFixed(2)} MDL
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }

                                {/* Key Metrics */}
                                <div className="border-t border-white/10 pt-4" >
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3" > Metrici Cheie </h4>
                                    < div className="space-y-2" >
                                        <div className="flex items-center justify-between" >
                                            <span className="text-sm text-gray-300" > Total Comenzi </span>
                                            < div className="flex items-center gap-2" >
                                                <span className="text-white font-semibold" > {revenueStats.totalOrders} </span>
                                                {
                                                    revenueStats.orderGrowth !== 0 && (
                                                        <span className={`text-xs ${revenueStats.orderGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {revenueStats.orderGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.orderGrowth).toFixed(1)}%
                                                        </span>
                                                    )
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </motion.div>

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={isModalOpen}
                order={selectedOrder}
                orderNumber={orderNumber}
                onClose={() => {
                    setSelectedOrder(null);
                    setOrderNumber(undefined);
                    setIsModalOpening(false);
                }}
                onCancel={handleCancelOrder}
                onRedo={handleRedoOrder}
                isProcessing={processingOrder === selectedOrder?.id.toString()}
                onOpenContractModal={() => {
                    setIsModalOpen(false); // Close order details modal
                    setShowContractModal(true); // Open contract modal
                    setIsModalOpening(false);
                }}
            />
        </>
    );
};

export default OrdersViewSection;