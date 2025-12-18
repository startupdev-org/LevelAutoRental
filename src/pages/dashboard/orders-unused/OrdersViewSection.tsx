import React, { useEffect, useState, useMemo } from 'react';
import { cars as staticCars } from '../../../data/cars';
import { OrdersTable } from '../../../components/dashboard/OrderTable';
import { BorrowRequestsDetailsModal } from '../../../components/modals/OrderDetailsModal';
import { ContractCreationModal } from '../../../components/modals/ContractCreationModal';
import { cancelRentalOrder, redoRentalOrder, fetchRentalsForCalendarPage, fetchRentalsForCalendarPageByMonth } from '../../../lib/orders';
import { updateBorrowRequest } from '../../../lib/db/requests/requests';
import { SalesChartCard } from '../../../components/dashboard/Chart';
import { motion } from 'framer-motion';
import { Save, X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { fetchCars } from '../../../lib/cars';
import { fetchImagesByCarName } from '../../../lib/db/cars/cars';
import { Car, OrderDisplay } from '../../../types';
import { useNotification } from '../../../components/ui/NotificationToaster';
import { useTranslation } from 'react-i18next';


// Order Form Modal Component
interface OrderFormModalProps {
    onSave: (orderData: Partial<OrderDisplay>) => void;
    onClose: () => void;
}


const OrderFormModal: React.FC<OrderFormModalProps> = ({ onSave, onClose }) => {
    const [cars, setCars] = useState<Car[]>([]);
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

    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();
                setCars(fetchedCars.length > 0 ? fetchedCars : staticCars);
            } catch (error) {
                console.error('Error loading cars:', error);
                setCars(staticCars);
            }
        };
        loadCars();
    }, []);

    const calculateAmount = () => {
        if (!formData.startDate || !formData.endDate || !formData.carId) return 0;
        const selectedCar = cars.find(c => c.id.toString() === formData.carId);
        if (!selectedCar) return 0;

        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) || 1;
        const pricePerDay = (selectedCar as any).pricePerDay || selectedCar.price_per_day || 0;
        return pricePerDay * days;
    };

    useEffect(() => {
        if (cars.length > 0) {
            const amount = calculateAmount();
            setFormData(prev => ({ ...prev, amount }));
        }
    }, [formData.startDate, formData.endDate, formData.carId, cars]);

    const handleCarChange = (carId: string) => {
        const selectedCar = cars.find(c => c.id.toString() === carId);
        const carName = selectedCar ? ((selectedCar as any).name || `${selectedCar.make || ''} ${selectedCar.model || ''}`.trim()) : '';
        setFormData(prev => ({
            ...prev,
            carId,
            carName,
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
                                {cars.map((car) => {
                                    const basePrice = (car as any).pricePerDay || car.price_per_day || 0;
                                    const discount = (car as any).discount_percentage || car.discount_percentage || 0;
                                    const finalPrice = discount > 0
                                        ? basePrice * (1 - discount / 100)
                                        : basePrice;
                                    const carName = (car as any).name || `${car.make || ''} ${car.model || ''}`.trim();
                                    return (
                                        <option key={car.id} value={car.id.toString()}>
                                            {carName} - {finalPrice.toFixed(0)} MDL/day{discount > 0 ? ` (-${discount}%)` : ''}
                                        </option>
                                    );
                                })}
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
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const { showSuccess, showError } = useNotification();
    const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
    const [orderNumber, setOrderNumber] = useState<number | undefined>(undefined);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isModalOpening, setIsModalOpening] = useState(false);
    const [showAddOrderModal, setShowAddOrderModal] = useState(false);
    const [orders, setOrders] = useState<OrderDisplay[]>([]);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);
    const [showCancelled, setShowCancelled] = useState(false);
    const [cars, setCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [ordersLoading, setOrdersLoading] = useState(true);

    // Load cars from database first
    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();
                const carsToUse = fetchedCars.length > 0 ? fetchedCars : staticCars;

                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    carsToUse.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );

                setCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
                setCars(staticCars);
            } finally {
                setLoading(false);
            }
        };
        loadCars();
    }, []);

    // Load orders after cars are loaded
    const loadOrders = async () => {
        if (cars.length === 0) return;
        try {
            setOrdersLoading(true);
            const data = await fetchRentalsForCalendarPageByMonth(cars);
            const rentalsOnly = data.filter(order => order.type === 'rental');
            setOrders(rentalsOnly);
        } catch (error) {
            console.error('Failed to load orders:', error);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        if (cars.length > 0) {
            loadOrders();
        }
    }, [cars, searchParams]); // Reload when cars load or when navigation occurs

    const handleCancelOrder = async (order: OrderDisplay) => {
        setProcessingOrder(order.id.toString());
        try {
            const result = await cancelRentalOrder(order.id.toString());
            if (result.success) {
                // If this order was created from a request, also mark the request as REJECTED
                const requestId = (order as any).request_id;
                if (requestId) {
                    try {
                        const updateResult = await updateBorrowRequest(requestId.toString(), { status: 'REJECTED' } as any);
                        if (!updateResult.success) {
                            console.warn('Failed to update corresponding request status:', updateResult.error);
                        }
                    } catch (requestError) {
                        console.warn('Error updating corresponding request:', requestError);
                    }
                }

                showSuccess('Comanda a fost anulată cu succes și cererea corespunzătoare a fost setată ca respinsă!');
                // Close the modal after successful cancellation
                setIsModalOpen(false);
                setSelectedOrder(null);
                setOrderNumber(undefined);
                setIsModalOpening(false);
                await loadOrders();
            } else {
                showError(`Eșuare la anularea comenzii: ${result.error || 'Eroare necunoscută'}`);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            showError('A apărut o eroare la anularea comenzii.');
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleRedoOrder = async (order: OrderDisplay) => {
        setProcessingOrder(order.id.toString());
        try {
            const result = await redoRentalOrder(order.id.toString());
            if (result.success) {
                showSuccess('Order restored successfully!');
                // Close the modal after successful restoration
                setIsModalOpen(false);
                setSelectedOrder(null);
                setOrderNumber(undefined);
                setIsModalOpening(false);
                await loadOrders();
            } else {
                showError(`Failed to restore order: ${result.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error restoring order:', error);
            showError('An error occurred while restoring the order.');
        } finally {
            setProcessingOrder(null);
        }
    };

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
            const orderDate = new Date(order.createdAt);
            return orderDate >= currentMonthStart && order.status === 'COMPLETED';
        });

        // Last month COMPLETED orders only
        const lastMonthStart = new Date(currentYear, currentMonth - 1, 1);
        const lastMonthEnd = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

        const lastMonthOrders = orders.filter(order => {
            const orderDate = new Date(order.createdAt);
            return orderDate >= lastMonthStart && orderDate <= lastMonthEnd && order.status === 'COMPLETED';
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
        // Total COMPLETED orders only (as specified by user)
        const allCompletedOrders = orders.filter(order =>
            order.type === 'rental' &&
            order.status === 'COMPLETED'
        );
        const totalOrders = allCompletedOrders.length;
        const lastMonthOrdersCount = lastMonthOrders.length;
        const orderGrowth = lastMonthOrdersCount > 0
            ? ((currentMonthOrders.length - lastMonthOrdersCount) / lastMonthOrdersCount) * 100
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

    // Generate chart data for all periods (like dashboard)
    const calculateChartData = useMemo(() => {
        // Filter only COMPLETED rental orders for sales calculation
        const rentalOrders = orders.filter(order =>
            order.type === 'rental' &&
            order.status === 'COMPLETED'
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
                    if (!order.createdAt) return false;
                    const orderDate = new Date(order.createdAt);
                    return orderDate >= intervalStart && orderDate < intervalEnd;
                });

                const sales = intervalOrders.reduce((sum, order) => {
                    const amount = order.amount || parseFloat(order.total_amount || '0') || 0;
                    return sum + amount;
                }, 0);

                // Baseline is 70% of average sales for visual reference
                const avgSales = rentalOrders.length > 0
                    ? (rentalOrders.reduce((sum, o) => sum + (o.amount || parseFloat(o.total_amount || '0') || 0), 0) / rentalOrders.length) * 0.7
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
            order.type === 'rental' &&
            order.status === 'COMPLETED'
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
                if (!order.createdAt) return false;
                const orderDate = new Date(order.createdAt);
                return orderDate >= periodStart && orderDate <= now;
            });

            const previousPeriodOrders = rentalOrders.filter(order => {
                if (!order.createdAt) return false;
                const orderDate = new Date(order.createdAt);
                return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
            });

            const periodSales = periodOrders.reduce((sum, order) => {
                const amount = order.amount || parseFloat(order.total_amount || '0') || 0;
                return sum + amount;
            }, 0);

            const previousPeriodSales = previousPeriodOrders.reduce((sum, order) => {
                const amount = order.amount || parseFloat(order.total_amount || '0') || 0;
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

    const handleOrderClick = (order: OrderDisplay, orderNum: number) => {
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
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
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <OrdersTable
                        title={t('admin.orders.allOrders')}
                        orders={orders}
                        loading={ordersLoading}
                        onOrderClick={handleOrderClick}
                        onAddOrder={() => setShowAddOrderModal(true)}
                        initialSearch={initialSearch}
                        showCancelled={showCancelled}
                        onToggleShowCancelled={() => setShowCancelled(!showCancelled)}
                        cars={cars}
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
                            <div className="mb-6">
                                <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">VENITURI</p>
                                <h3 className="text-3xl md:text-4xl font-bold text-white mb-2">
                                    {revenueStats.totalRevenue.toFixed(2)} MDL
                                </h3>
                                <p className="text-sm text-emerald-400 font-semibold">
                                    {revenueStats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.revenueGrowth).toFixed(1)}% față de ultimele 30 zile
                                </p>
                            </div>

                            <div className="space-y-4">
                                {/* Last Month Comparison */}
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Comparație cu Luna Trecută</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Venituri Luna Trecută</span>
                                            <span className="text-white font-semibold">
                                                {revenueStats.lastMonthRevenue.toFixed(2)} MDL
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Creștere</span>
                                            <span className={`font-semibold ${revenueStats.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {revenueStats.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(revenueStats.revenueGrowth).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Medie Zilnică (Luna Aceasta)</span>
                                            <span className="text-white font-semibold">
                                                {revenueStats.avgDailyRevenue.toFixed(2)} MDL
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Medie Zilnică (Luna Trecută)</span>
                                            <span className="text-white font-semibold">
                                                {revenueStats.avgDailyRevenueLastMonth.toFixed(2)} MDL
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Best Performing Day */}
                                {revenueStats.bestDay && (
                                    <div className="border-t border-white/10 pt-4">
                                        <h4 className="text-sm font-semibold text-gray-300 mb-3">Ziua cu Cea Mai Bună Performanță</h4>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">
                                                    {new Date(revenueStats.bestDay).toLocaleDateString('ro-RO', {
                                                        day: 'numeric',
                                                        month: 'short',
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
                                    <h4 className="text-sm font-semibold text-gray-300 mb-3">Metrici Cheie</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-300">Total Comenzi</span>
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
            <BorrowRequestsDetailsModal
                isOpen={isModalOpen}
                onClose={() => {

                    setSelectedOrder(null);
                    setOrderNumber(undefined);
                    setIsModalOpening(false);
                }}
                order={selectedOrder}
                orderNumber={orderNumber}
                onCancel={handleCancelOrder}
                onRedo={handleRedoOrder}
                isProcessing={processingOrder === selectedOrder?.id.toString()}
                cars={cars}
                onOpenContractModal={() => {
                    setIsModalOpen(false); // Close order details modal
                    setShowContractModal(true); // Open contract modal
                    setIsModalOpening(false);
                }}
            />
            {/* Contract Creation Modal */}
            {selectedOrder && cars.length > 0 && (() => {
                const car = cars.find(c => c.id.toString() === selectedOrder.carId);
                return car ? (
                    <ContractCreationModal
                        isOpen={showContractModal}
                        onClose={() => setShowContractModal(false)}
                        order={selectedOrder}
                        car={car}
                        orderNumber={orderNumber}
                        onContractCreated={async () => {
                            setShowContractModal(false);
                            // Reload orders to reflect status change
                            await loadOrders();
                            // Also close the order details modal and clear selection
                            setIsModalOpen(false);
                            setSelectedOrder(null);
                            setIsModalOpening(false);
                        }}
                    />
                ) : null;
            })()}

            {/* Add Order Modal */}
            {showAddOrderModal && (
                <OrderFormModal
                    onSave={async (orderData: Partial<OrderDisplay>) => {
                        // TODO: Implement save to database
                        // For now, just close the modal
                        setShowAddOrderModal(false);
                        // Reload orders
                        await loadOrders();
                    }}
                    onClose={() => setShowAddOrderModal(false)}
                />
            )}
        </>
    );
};
