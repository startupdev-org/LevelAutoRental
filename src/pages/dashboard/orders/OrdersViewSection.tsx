import React, { useEffect, useState, useMemo } from 'react';
import { cars } from '../../../data/cars';
import { OrdersTable } from '../../../components/dashboard/OrderTable';
import { OrderDetailsModal } from '../../../components/modals/OrderDetailsModal';
import { OrderDisplay, cancelRentalOrder, redoRentalOrder, fetchRentalsOnly } from '../../../lib/orders';
import { SalesChartCard } from '../../../components/dashboard/Chart';
import { motion } from 'framer-motion';
import { Save, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';


// Order Form Modal Component
interface OrderFormModalProps {
    onSave: (orderData: Partial<OrderDisplay>) => void;
    onClose: () => void;
}


const OrderFormModal: React.FC<OrderFormModalProps> = ({ onSave, onClose }) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const [formData, setFormData] = useState<Partial<OrderDisplay>>({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        carId: '',
        carName: '',
        startDate: today.toISOString().split('T')[0],
        startTime: '09:00',
        endDate: tomorrow.toISOString().split('T')[0],
        endTime: '17:00',
        status: 'ACTIVE',
        amount: 0,
    });

    const calculateAmount = () => {
        if (!formData.startDate || !formData.endDate || !formData.carId) return 0;
        const selectedCar = cars.find(c => c.id.toString() === formData.carId);
        if (!selectedCar) return 0;

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        return selectedCar.pricePerDay * days;
    };

    useEffect(() => {
        const amount = calculateAmount();
        setFormData(prev => ({ ...prev, amount }));
    }, [formData.startDate, formData.endDate, formData.carId]);

    const handleCarChange = (carId: string) => {
        const selectedCar = cars.find(c => c.id.toString() === carId);
        setFormData(prev => ({
            ...prev,
            carId,
            carName: selectedCar?.name || '',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.customerName || !formData.carId) {
            alert('Please fill in all required fields');
            return;
        }
        onSave(formData);
    };

    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={onClose}
            style={{ zIndex: 10000 }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1C1C1C' }}>
                    <h2 className="text-xl font-bold text-white">Add New Order</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Customer Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Customer Name *</label>
                                <input
                                    type="text"
                                    value={formData.customerName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Phone *</label>
                                <input
                                    type="tel"
                                    value={formData.customerPhone || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vehicle Selection */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Vehicle Selection</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Select Car *</label>
                            <select
                                value={formData.carId || ''}
                                onChange={(e) => handleCarChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            >
                                <option value="">Select a car...</option>
                                {cars.map((car) => (
                                    <option key={car.id} value={car.id.toString()}>
                                        {car.name} - {car.pricePerDay} MDL/day
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Rental Period */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Rental Period</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date *</label>
                                <input
                                    type="date"
                                    value={formData.startDate || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Start Time *</label>
                                <input
                                    type="time"
                                    value={formData.startTime || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Date *</label>
                                <input
                                    type="date"
                                    value={formData.endDate || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                                    min={formData.startDate}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">End Time *</label>
                                <input
                                    type="time"
                                    value={formData.endTime || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Status & Amount */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10 space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Status & Amount</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                                <select
                                    value={formData.status || 'ACTIVE'}
                                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'ACTIVE' | 'COMPLETED' | 'CANCELLED' }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="COMPLETED">Completed</option>
                                    <option value="CANCELLED">Cancelled</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Amount (MDL)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.amount || 0}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    readOnly
                                />
                                <p className="text-xs text-gray-400 mt-1">Calculated automatically based on rental period</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            Add Order
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>,
        document.body
    );
};


export const OrdersViewSection: React.FC = () => {
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);
    const [orders, setOrders] = useState<OrderDisplay[]>([]);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const [showCancelled, setShowCancelled] = useState(false);

    // console.log('Order View Section is being rendered')

    const loadOrders = async () => {
        try {
            const data = await fetchRentalsOnly(cars);
            const rentalsOnly = data.filter(order => order.type === 'rental');
            setOrders(rentalsOnly);
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleCancelOrder = async (order: OrderDisplay) => {
        setProcessingOrder(order.id.toString());
        try {
            const result = await cancelRentalOrder(order.id.toString());
            if (result.success) {
                alert('Order cancelled successfully!');
                await loadOrders();
            } else {
                alert(`Failed to cancel order: ${result.error}`);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('An error occurred while cancelling the order.');
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleRedoOrder = async (order: OrderDisplay) => {
        setProcessingOrder(order.id.toString());
        try {
            const result = await redoRentalOrder(order.id.toString());
            if (result.success) {
                alert('Order restored successfully!');
                await loadOrders();
            } else {
                alert(`Failed to restore order: ${result.error}`);
            }
        } catch (error) {
            console.error('Error restoring order:', error);
            alert('An error occurred while restoring the order.');
        } finally {
            setProcessingOrder(null);
        }
    };

    // Calculate revenue statistics from orders
    const revenueStats = useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Current month orders (last 30 days)
        const currentMonthStart = new Date(now);
        currentMonthStart.setDate(1);
        currentMonthStart.setHours(0, 0, 0, 0);

        const currentMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= currentMonthStart;
        });

        // Last month orders
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const lastMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
        });

        // Calculate revenues
        const totalRevenue = currentMonthOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
        const lastMonthRevenue = lastMonthOrders.reduce((sum, order) => sum + (order.amount || 0), 0);

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
            const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
            dailyRevenueMap.set(orderDate, (dailyRevenueMap.get(orderDate) || 0) + (order.amount || 0));
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
        const totalOrders = currentMonthOrders.length;
        const lastMonthOrdersCount = lastMonthOrders.length;
        const orderGrowth = lastMonthOrdersCount > 0
            ? ((totalOrders - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
            : 0;

        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        const completedOrders = currentMonthOrders.filter(order => order.status === 'COMPLETED').length;
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

    // Generate chart data from orders (last 30 days)
    const chartData = useMemo(() => {
        const now = new Date();
        const days = 30;
        const data: { day: number; sales: number; baseline: number }[] = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            // Calculate sales for this day (orders created on this day)
            const daySales = orders
                .filter(order => {
                    const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
                    return orderDate === dateStr;
                })
                .reduce((sum, order) => sum + (order.amount || 0), 0);

            data.push({
                day: days - i,
                sales: Math.round(daySales),
                baseline: Math.round(daySales * 0.7), // Baseline is 70% of sales
            });
        }

        return data;
    }, [orders]);

    const handleOrderClick = (order: OrderDisplay, orderNum: number) => {
        console.log('handling order click for order: ', order)
        setSelectedOrder(order);
        setOrderNumber(orderNum);
        setIsModalOpen(true);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
            >
                {/* Orders Table */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <OrdersTable 
                        title="All Orders" 
                        onOrderClick={handleOrderClick} 
                        onAddOrder={() => setShowAddOrderModal(true)} 
                        initialSearch={initialSearch}
                        showCancelled={showCancelled}
                        onToggleShowCancelled={() => setShowCancelled(!showCancelled)}
                    />
                </motion.div>

                {/* Charts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Sales Chart */}
                    <motion.div
                        initial={{ opacity: 1, y: 0 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                    >
                        <SalesChartCard
                            totalSales={revenueStats.totalRevenue}
                            change="↑ 3.2% vs last 30 days"
                            data={chartData}
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
                            <div className="mb-6">
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">Revenue</p>
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {revenueStats.totalRevenue.toFixed(2)} MDL
                                </h3>
                                <p className="text-sm text-emerald-400 font-semibold">↑ 3.2% vs last 30 days</p>
                            </div>

                            <div className="space-y-4">
                                {/* Last Month Comparison */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Last Month Comparison</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Last Month Revenue</span>
                                            <span className="text-white font-semibold">
                                                {revenueStats.lastMonthRevenue.toFixed(2)} MDL
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Growth</span>
                                            <span className={`font-semibold ${revenueStats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {revenueStats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.revenueGrowth).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Avg Daily (This Month)</span>
                                            <span className="text-white font-semibold">
                                                {revenueStats.avgDailyRevenue.toFixed(2)} MDL
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Avg Daily (Last Month)</span>
                                            <span className="text-white font-semibold">
                                                {revenueStats.avgDailyRevenueLastMonth.toFixed(2)} MDL
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Best Performing Day */}
                                {revenueStats.bestDay && (
                                    <div className="border-t border-white/10 pt-4">
                                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Best Performing Day</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    {new Date(revenueStats.bestDay).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })}
                                                </span>
                                                <span className="text-white font-semibold">
                                                    {revenueStats.bestDayRevenue.toFixed(2)} MDL
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Key Metrics */}
                                <div className="border-t border-white/10 pt-4">
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Key Metrics</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Total Orders</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-white font-semibold">{revenueStats.totalOrders}</span>
                                                {revenueStats.orderGrowth !== 0 && (
                                                    <span className={`text-xs ${revenueStats.orderGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                        {revenueStats.orderGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.orderGrowth).toFixed(1)}%
                                                    </span>
                                                )}
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
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedOrder(null);
                    setOrderNumber(undefined);
                }}
                order={selectedOrder}
                orderNumber={orderNumber}
                onCancel={handleCancelOrder}
                onRedo={handleRedoOrder}
                isProcessing={processingOrder === selectedOrder?.id.toString()}
            />

            {/* Add Order Modal */}
            {showAddOrderModal && (
                <OrderFormModal
                    onSave={(orderData: Partial<OrderDisplay>) => {
                        // TODO: Implement save to database
                        console.log('Saving order:', orderData);
                        // For now, just close the modal
                        setShowAddOrderModal(false);
                        // Reload orders
                        const loadOrders = async () => {
                            try {
                                const { fetchRentalsOnly } = await import('../../../lib/orders');
                                const data = await fetchRentalsOnly(cars);
                                const rentalsOnly = data.filter(order => order.type === 'rental');
                                setOrders(rentalsOnly);
                            } catch (error) {
                                console.error('Failed to load orders:', error);
                            }
                        };
                        loadOrders();
                    }}
                    onClose={() => setShowAddOrderModal(false)}
                />
            )}
        </>
    );
};
