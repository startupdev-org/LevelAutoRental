import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { cars } from '../../data/cars';
import { sparkData, mainChart, orders } from '../../data/index';
import { SalesChartCard } from '../../components/dashboard/Chart';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ShoppingCart,
    CalendarDays,
    Users as UsersIcon,
    Settings as SettingsIcon,
    LogOut,
    Home,
    Calendar,
    Clock,
    Plus,
    Trash2,
    Search,
    X,
    Save,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    Upload,
    CheckCircle,
    ArrowRight,
    RefreshCw,
    Download,
    Loader2,
    FileText,
    Check,
    Car,
    Edit
} from 'lucide-react';
import { LiaCarSideSolid } from 'react-icons/lia';
import { getDateDiffInDays } from '../../utils/date';
import Settings from '../dashboard/settings/Settings';
import Users from '../dashboard/users/Users';
import { LuPencil } from 'react-icons/lu';
import { CardStats } from '../../components/dashboard/CardStats';
import CalendarPage from '../dashboard/calendar/CalendarPage';
import { Car as CarType } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../../constants';
import { generateContractFromOrder } from '../../lib/contract';
import { OrderDisplay } from '../../lib/orders';

import { OrdersViewSection } from '../dashboard/orders/OrdersViewSection';
import {
    fetchBorrowRequestsForDisplay,
    acceptBorrowRequest, 
    rejectBorrowRequest,
    undoRejectBorrowRequest,
    updateBorrowRequest,
    createRentalManually,
    processStatusTransitions,
    cancelRentalOrder,
    redoRentalOrder
} from '../../lib/orders';

// Dashboard View Component
const DashboardView: React.FC = () => {
    // Calculate car rental status
    const getCarRentalStatus = () => {
        const activeOrders = orders.filter(order =>
            order.status === 'Paid' || order.status === 'Pending'
        );

        const rentedCarIds = new Set(
            activeOrders.map(order => parseInt(order.carId))
        );

        const freeCars = cars.filter(car => !rentedCarIds.has(car.id));
        const rentedCars = cars.filter(car => rentedCarIds.has(car.id));

        return { freeCars, rentedCars };
    };

    const { freeCars, rentedCars } = getCarRentalStatus();

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            {/* Top stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CardStats
                    title="Total Sales"
                    value="2,114.40 MDL"
                    trend="up"
                    trendValue="2.4%"
                    valueSize="md"
                    spark={(
                        // @ts-ignore - recharts type compatibility issue
                        <ResponsiveContainer width="100%" height={48}>
                            {/* @ts-ignore */}
                            <LineChart data={sparkData}>
                                {/* @ts-ignore */}
                                <Line dataKey="y" stroke="#EF4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <CardStats
                    title="Total Orders"
                    value={24}
                    trend="up"
                    trendValue="8.6%"
                    spark={(
                        // @ts-ignore - recharts type compatibility issue
                        <ResponsiveContainer width="100%" height={48}>
                            {/* @ts-ignore */}
                            <LineChart data={sparkData}>
                                {/* @ts-ignore */}
                                <Line dataKey="y" stroke="#10B981" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <div className="hidden md:block">
                    <CardStats
                        title="Avg Order Value"
                        value="88.10 MDL"
                        trend="up"
                        trendValue="6.0%"
                        spark={(
                            // @ts-ignore - recharts type compatibility issue
                            <ResponsiveContainer width="100%" height={48}>
                                {/* @ts-ignore */}
                                <LineChart data={sparkData}>
                                    {/* @ts-ignore */}
                                    <Line dataKey="y" stroke="#9CA3AF" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    />
                </div>
                <CardStats
                    title="Fleet Status"
                    value={`${freeCars.length}/${cars.length}`}
                    subtitle={
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-400">{freeCars.length} Available</span>
                            <span className="text-red-400">{rentedCars.length} Rented</span>
                        </div>
                    }
                />
            </div>

            {/* Cars Rental Overview */}
            <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Fleet Status</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span><span className="font-semibold text-emerald-400">{freeCars.length}</span> Available</span>
                        <span className="text-gray-500">•</span>
                        <span><span className="font-semibold text-red-400">{rentedCars.length}</span> Rented</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Free Cars */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Available</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {freeCars.length > 0 ? (
                                freeCars.map((car) => (
                                    <div
                                        key={car.id}
                                        className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                    >
                                        <img
                                            src={(car as any).image || car.image_url || ''}
                                            alt={(car as any).name || `${car.make} ${car.model}`}
                                            className="w-12 h-12 object-cover rounded-md"
                                        />
                                        <p className="text-sm font-medium text-white truncate flex-1">{(car as any).name || `${car.make} ${car.model}`}</p>
                                        <button className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-semibold rounded-lg transition-all flex-shrink-0">
                                            Book
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm">—</div>
                            )}
                        </div>
                    </div>

                    {/* Rented Cars */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">Rented</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {rentedCars.length > 0 ? (
                                rentedCars.map((car) => {
                                    const carOrder = orders.find(order =>
                                        parseInt(order.carId) === car.id &&
                                        (order.status === 'Paid' || order.status === 'Pending')
                                    );
                                    return (
                                        <div
                                            key={car.id}
                                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <img
                                                src={(car as any).image || car.image_url || ''}
                                                alt={(car as any).name || `${car.make} ${car.model}`}
                                                className="w-12 h-12 object-cover rounded-md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{(car as any).name || `${car.make} ${car.model}`}</p>
                                                <p className="text-xs text-gray-400 truncate">
                                                    Until {carOrder?.returnDate}
                                                </p>
                                            </div>
                                            <button className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0">
                                                View
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-gray-400 text-sm">—</div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sales chart */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <SalesChartCard totalSales={8422.6} change="↑ 3.2% vs last 30 days" data={mainChart} />
                </motion.div>

                {/* Most Rented Cars */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <div>
                        <div className="mb-6">
                            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">Top Performers</p>
                            <h3 className="text-3xl md:text-4xl font-bold text-white">Most Rented</h3>
                        </div>

                        <div className="space-y-4">
                            {(() => {
                                // Calculate rental counts and revenue per car
                                const carStats = cars.map(car => {
                                    const carOrders = orders.filter(order =>
                                        parseInt(order.carId) === car.id &&
                                        (order.status === 'Paid' || order.status === 'Pending')
                                    );
                                    const revenue = carOrders.reduce((sum, order) => {
                                        const amount = (order as any).amount || parseFloat(order.total_amount || '0');
                                        return sum + (typeof amount === 'number' ? amount : parseFloat(amount.toString()));
                                    }, 0);
                                    return {
                                        ...car,
                                        rentals: carOrders.length,
                                        revenue: revenue
                                    };
                                }).filter(car => car.rentals > 0)
                                    .sort((a, b) => b.revenue - a.revenue)
                                    .slice(0, 5);

                                const maxRevenue = Math.max(...carStats.map(c => c.revenue), 1);

                                return carStats.map((car, index) => (
                                    <div key={car.id} className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <span className="text-sm font-bold text-gray-400 w-6">{index + 1}</span>
                                                <img
                                                    src={(car as any).image || car.image_url || ''}
                                                    alt={(car as any).name || `${car.make} ${car.model}`}
                                                    className="w-10 h-10 object-cover rounded-md"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{(car as any).name || `${car.make} ${car.model}`}</p>
                                                    <p className="text-xs text-gray-400">{car.rentals} rental{car.rentals > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-white">{car.revenue.toFixed(0)} MDL</span>
                                        </div>
                                        <div className="relative h-2 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="absolute inset-y-0 left-0 bg-gradient-to-r from-gray-400 to-gray-500 rounded-full"
                                                style={{ width: `${(car.revenue / maxRevenue) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};




// Orders View Component
const OrdersView: React.FC = () => {
    return <OrdersViewSection />
};

// Order Details View Component
const OrderDetailsView: React.FC<{ orderId: string }> = ({ orderId }) => {
    const navigate = useNavigate();
    const [ordersList, setOrdersList] = useState<OrderDisplay[]>([]);
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    const loadOrders = async () => {
        try {
            const { fetchRentalsOnly } = await import('../../lib/orders');
            const data = await fetchRentalsOnly(cars);
            const rentalsOnly = data.filter(order => order.type === 'rental');
            setOrdersList(rentalsOnly);
        } catch (error) {
            console.error('Failed to load orders:', error);
        }
    };

    useEffect(() => {
        loadOrders();
    }, []);

    const handleCancelOrder = async () => {
        const order = ordersList.find((o) => o.id === orderId);
        if (!order) return;
        if (!window.confirm(`Are you sure you want to cancel this order?`)) {
            return;
        }

        setIsProcessing(true);
        try {
            const result = await cancelRentalOrder(order.id.toString());
            if (result.success) {
                alert('Order cancelled successfully!');
                await loadOrders();
                // Navigate back to orders list
                navigate('/admin?section=orders');
            } else {
                alert(`Failed to cancel order: ${result.error}`);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert('An error occurred while cancelling the order.');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRedoOrder = async () => {
        const order = ordersList.find((o) => o.id === orderId);
        if (!order) return;
        if (!window.confirm(`Are you sure you want to restore this cancelled order?`)) {
            return;
        }

        setIsProcessing(true);
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
            setIsProcessing(false);
        }
    };

    const order = ordersList.find((o) => o.id === orderId);
    const car = order ? cars.find(c => c.id.toString() === order.carId) : null;
    const [selectedImage, setSelectedImage] = useState<string | undefined>((car as any)?.image || car?.image_url);

    useEffect(() => {
        if (!order || !car) {
            if (ordersList.length > 0) {
                navigate('/admin?section=orders');
            }
        } else {
            setSelectedImage((car as any).image || car.image_url || '');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [orderId, order, car, navigate, ordersList.length]);

    const handleDownloadContract = async () => {
        if (!order || !car) {
            alert('Order or car information not found. Cannot generate contract.');
            return;
        }

        console.log('Starting contract generation...', { order, car });
        setIsGeneratingContract(true);
        try {
            await generateContractFromOrder(
                order,
                car,
                undefined,
                {
                    customerPhone: order.customerPhone || '',
                } as any
            );
            console.log('Contract generation completed successfully');
        } catch (error) {
            console.error('Error generating contract:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            alert(`Failed to generate contract: ${errorMessage}\n\nPlease check the browser console for more details.`);
        } finally {
            setIsGeneratingContract(false);
        }
    };

    if (!order || !car) return null;

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8"
        >
            {/* LEFT COLUMN: Order + Car Info */}
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
                            src={selectedImage}
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
                    <h2 className="text-xl font-bold text-white">Booking Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                                <span className="text-white text-sm font-medium">{new Date(order.startDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{order.startTime || '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                                <span className="text-white text-sm font-medium">{new Date(order.endDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{order.endTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rental Days</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(order.startDate, order.endDate)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Price</p>
                            <span className="text-white text-lg font-bold">{order.amount > 0 ? `${order.amount} MDL` : `${getDateDiffInDays(order.startDate, order.endDate) * car.pricePerDay} MDL`}</span>
                        </div>
                    </div>

                    {car.features?.length > 0 && (
                        <>
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-lg font-bold text-white mb-4">Additional Features</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {car.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2 text-gray-300 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Customer Info */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Customer</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                            C
                        </div>
                        <div>
                            <div className="text-white font-semibold">{order.customerName}</div>
                            <div className="text-gray-300 text-sm">{order.customerEmail}</div>
                            {order.customerPhone && (
                                <div className="text-gray-300 text-sm mt-1">{order.customerPhone}</div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Payment & Status */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Payment</h2>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-gray-400 text-sm uppercase tracking-wide">Amount Paid</span>
                            <div className="text-white font-bold text-2xl">{order.amount} MDL</div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl
                            ${order.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' :
                                order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                                    'bg-red-500/20 text-red-300 border-red-500/50'}`}>
                            {order.status}
                        </div>
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
                        onClick={handleDownloadContract}
                        disabled={isGeneratingContract}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isGeneratingContract ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                <FileText className="w-4 h-4" />
                                Download Contract
                            </>
                        )}
                    </button>
                    <button
                        className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg"
                        onClick={() => navigate(`/admin?section=orders&orderId=${order.id}&edit=true`)}
                    >
                        Edit Order
                    </button>
                    {order.status !== 'CANCELLED' && (
                        <button
                            className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleCancelOrder}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <X className="w-4 h-4" />
                                    Cancel Order
                                </>
                            )}
                        </button>
                    )}
                    {order.status === 'CANCELLED' && (
                        <button
                            className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={handleRedoOrder}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4" />
                                    Undo Cancel
                                </>
                            )}
                        </button>
                    )}
                </motion.div>
            </aside>
        </motion.div>
    );
};

// Cars Management View Component
const CarsView: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price' | 'year' | 'status' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCar, setEditingCar] = useState<CarType | null>(null);
    const [localCars, setLocalCars] = useState<CarType[]>(cars);

    // Get car status for sorting
    const getCarStatus = (car: CarType): number => {
        const isRented = orders.some(order =>
            parseInt(order.carId) === car.id &&
            (order.status === 'Paid' || order.status === 'Pending')
        );
        // 0 = Available, 1 = Reserved, 2 = Rented (lower number = higher priority)
        if (isRented) return 2;
        if (car.availability) return 1;
        return 0;
    };

    // Filter and sort cars
    const filteredCars = useMemo(() => {
        let filtered = localCars.filter(car => {
            const carName = (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || '';
            const matchesSearch = carName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || car.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        // Sort based on selected field
        filtered.sort((a, b) => {
            if (sortBy === 'price') {
                // Sort by price only
                const diff = a.pricePerDay - b.pricePerDay;
                return sortOrder === 'asc' ? diff : -diff;
            } else if (sortBy === 'year') {
                // Sort by year only
                const diff = a.year - b.year;
                return sortOrder === 'asc' ? diff : -diff;
            } else if (sortBy === 'status') {
                // Sort by status only
                const statusA = getCarStatus(a);
                const statusB = getCarStatus(b);
                const diff = statusA - statusB;
                return sortOrder === 'asc' ? diff : -diff;
            } else {
                // Default: sort by availability first (available cars first)
                const statusA = getCarStatus(a);
                const statusB = getCarStatus(b);
                return statusA - statusB; // Available (0) comes before Reserved (1) and Rented (2)
            }
        });

        return filtered;
    }, [localCars, searchQuery, filterCategory, sortBy, sortOrder]);

    const handleSort = (field: 'price' | 'year' | 'status') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    const handleAddCar = () => {
        setEditingCar(null);
        setShowAddModal(true);
    };

    const handleEditCar = (car: CarType) => {
        setEditingCar(car);
        setSearchParams({ section: 'cars', carId: car.id.toString() });
    };

    const handleDeleteCar = (carId: number) => {
        if (window.confirm('Are you sure you want to delete this car?')) {
            setLocalCars(prev => prev.filter(c => c.id !== carId));
        }
    };

    const handleSaveCar = (carData: Partial<CarType>): number | void => {
        if (editingCar) {
            // Update existing car - don't modify availability, it's managed by the system
            const { availability, ...dataToUpdate } = carData;
            setLocalCars(prev => prev.map(c => c.id === editingCar.id ? { ...c, ...dataToUpdate } as CarType : c));
            setShowAddModal(false);
            setEditingCar(null);
            setSearchParams({ section: 'cars' });
        } else {
            // Add new car
            const newId = Math.max(...localCars.map(c => c.id), 0) + 1;
            const newCar: CarType = {
                id: newId,
                name: carData.name || '',
                category: carData.category || 'luxury',
                image: (carData as any).image || carData.image_url || '',
                photo_gallery: (carData as any).photoGallery || carData.photo_gallery || [],
                price_per_day: (carData as any).pricePerDay || carData.price_per_day || 0,
                year: carData.year || new Date().getFullYear(),
                seats: carData.seats || 5,
                transmission: carData.transmission || 'Automatic',
                body: carData.body || 'Sedan',
                fuelType: carData.fuelType || 'gasoline',
                drivetrain: carData.drivetrain || '',
                features: carData.features || [],
                rating: carData.rating || 0,
                reviews: carData.reviews || 0,
                availability: 'Available', // Set to "Available" by default for new cars
                mileage: carData.mileage,
                fuelConsumption: carData.fuelConsumption,
                power: carData.power,
                acceleration: carData.acceleration,
                description: carData.description,
                longDescription: carData.longDescription,
            };
            setLocalCars(prev => [...prev, newCar]);
            // Don't close modal or reset - let the modal handle the success state
            return newId;
        }
    };

    // If carId is in URL, show car details/edit view
    if (carId) {
        const car = localCars.find(c => c.id.toString() === carId);
        if (car) {
            return <CarDetailsEditView car={car} onSave={handleSaveCar} onCancel={() => setSearchParams({ section: 'cars' })} />;
        }
    }

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Cars Table Card */}
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex flex-col gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">All Cars</h2>
                            </div>
                            <button
                                onClick={handleAddCar}
                                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                            >
                                <Plus className="w-4 h-4" />
                                Add New Car
                            </button>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search cars..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Sort Controls */}
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort by:</span>
                                <button
                                    onClick={() => handleSort('price')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'price'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Price
                                    {sortBy === 'price' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                    {sortBy !== 'price' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
                                </button>
                                <button
                                    onClick={() => handleSort('year')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'year'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Year
                                    {sortBy === 'year' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                    {sortBy !== 'year' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
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
                                            setSortOrder('asc');
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
                                    Car
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('price')}
                                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                        Price/Day
                                        {sortBy === 'price' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                    <button
                                        onClick={() => handleSort('year')}
                                        className="flex items-center gap-1.5 hover:text-white transition-colors"
                                    >
                                        Year
                                        {sortBy === 'year' ? (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                        ) : (
                                            <ArrowUpDown className="w-3 h-3 opacity-50" />
                                        )}
                                    </button>
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
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {filteredCars.length > 0 ? (
                                filteredCars.map((car) => {
                                    const isRented = orders.some(order =>
                                        parseInt(order.carId) === car.id &&
                                        (order.status === 'Paid' || order.status === 'Pending')
                                    );
                                    return (
                                        <tr
                                            key={car.id}
                                            className="hover:bg-white/5 transition-colors cursor-pointer"
                                            onClick={() => handleEditCar(car)}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={(car as any).image || car.image_url || ''}
                                                        alt={(car as any).name || `${car.make} ${car.model}`}
                                                        className="w-12 h-12 object-cover rounded-md border border-white/10"
                                                    />
                                                    <div>
                                                        <p className="text-white font-semibold">{(car as any).name || `${car.make} ${car.model}`}</p>
                                                        <p className="text-gray-400 text-xs">{car.body} · {car.seats} seats</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-semibold bg-white/10 text-gray-300 rounded capitalize">
                                                    {car.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-semibold">{(car as any).pricePerDay || car.price_per_day} MDL</td>
                                            <td className="px-6 py-4 text-gray-300">{car.year}</td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl ${isRented
                                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                                        : car.availability
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                        }`}
                                                >
                                                    {isRented ? 'Rented' : car.availability ? 'Reserved' : 'Available'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleEditCar(car)}
                                                        className="p-2 text-white hover:text-gray-300 transition-colors"
                                                        title="Edit"
                                                    >
                                                        {/* @ts-ignore - react-icons type compatibility */}
                                                        <LuPencil className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteCar(car.id)}
                                                        className="p-2 text-red-300 hover:text-red-200 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        {searchQuery || filterCategory !== 'all' ? 'No cars found matching your filters' : 'No cars available'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Car Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <CarFormModal
                        car={editingCar}
                        onSave={handleSaveCar}
                        onClose={() => {
                            setShowAddModal(false);
                            setEditingCar(null);
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Car Details/Edit View Component
interface CarDetailsEditViewProps {
    car: CarType;
    onSave: (carData: Partial<CarType>) => void;
    onCancel: () => void;
}

const CarDetailsEditView: React.FC<CarDetailsEditViewProps> = ({ car, onSave, onCancel }) => {
    const [formData, setFormData] = useState<Partial<CarType>>(car);
    const [newFeature, setNewFeature] = useState('');
    const [newGalleryImage, setNewGalleryImage] = useState('');
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };

    // Placeholder function for uploading main image to Supabase
    const handleMainImageUpload = async (file: File) => {
        setUploadingMainImage(true);
        try {
            // TODO: Implement Supabase storage upload
            // const { data, error } = await supabase.storage
            //     .from('car-images')
            //     .upload(`main/${Date.now()}-${file.name}`, file);
            // if (error) throw error;
            // const { data: { publicUrl } } = supabase.storage
            //     .from('car-images')
            //     .getPublicUrl(data.path);
            // setFormData(prev => ({ ...prev, image: publicUrl }));

            // Temporary: Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, image: objectUrl }));
            alert('Image upload will be implemented with Supabase storage');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploadingMainImage(false);
        }
    };

    // Placeholder function for uploading gallery image to Supabase
    const handleGalleryImageUpload = async (file: File) => {
        setUploadingGalleryImage(true);
        try {
            // TODO: Implement Supabase storage upload
            // const { data, error } = await supabase.storage
            //     .from('car-images')
            //     .upload(`gallery/${Date.now()}-${file.name}`, file);
            // if (error) throw error;
            // const { data: { publicUrl } } = supabase.storage
            //     .from('car-images')
            //     .getPublicUrl(data.path);
            // setFormData(prev => ({
            //     ...prev,
            //     photoGallery: [...(prev.photoGallery || []), publicUrl]
            // }));

            // Temporary: Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            setFormData(prev => ({
                ...prev,
                photo_gallery: [...((prev as any).photoGallery || prev.photo_gallery || []), objectUrl]
            }));
            alert('Image upload will be implemented with Supabase storage');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploadingGalleryImage(false);
        }
    };

    const addFeature = () => {
        if (newFeature.trim()) {
            setFormData(prev => ({
                ...prev,
                features: [...(prev.features || []), newFeature.trim()]
            }));
            setNewFeature('');
        }
    };

    const removeFeature = (index: number) => {
        setFormData(prev => ({
            ...prev,
            features: prev.features?.filter((_, i) => i !== index) || []
        }));
    };

    const addGalleryImage = () => {
        if (newGalleryImage.trim()) {
            setFormData(prev => ({
                ...prev,
                photo_gallery: [...((prev as any).photoGallery || prev.photo_gallery || []), newGalleryImage.trim()]
            }));
            setNewGalleryImage('');
        }
    };

    const removeGalleryImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photo_gallery: ((prev as any).photoGallery || prev.photo_gallery || []).filter((_: any, i: number) => i !== index)
        }));
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Basic Information */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Basic Information</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Car Name</label>
                            <input
                                type="text"
                                value={(formData as any).name || ''}
                                onChange={(e) => setFormData(prev => {
                                    const updated = { ...prev };
                                    (updated as any).name = e.target.value;
                                    return updated;
                                })}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
                                <input
                                    type="number"
                                    value={formData.year || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Seats</label>
                                <input
                                    type="number"
                                    value={formData.seats || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
                            <select
                                value={formData.category || 'luxury'}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CarType['category'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            >
                                <option value="suv">SUV</option>
                                <option value="sports">Sports</option>
                                <option value="luxury">Luxury</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Price Per Day (MDL)</label>
                            <input
                                type="number"
                                value={formData.pricePerDay || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            />
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">Specifications</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Body Type</label>
                            <select
                                value={formData.body || 'Sedan'}
                                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value as CarType['body'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            >
                                <option value="Coupe">Coupe</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Transmission</label>
                            <select
                                value={formData.transmission || 'Automatic'}
                                onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value as CarType['transmission'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            >
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Fuel Type</label>
                            <select
                                value={formData.fuelType || 'gasoline'}
                                onChange={(e) => setFormData(prev => ({ ...prev, fuelType: e.target.value as CarType['fuelType'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            >
                                <option value="gasoline">Gasoline</option>
                                <option value="diesel">Diesel</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="electric">Electric</option>
                                <option value="petrol">Petrol</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Drivetrain</label>
                            <input
                                type="text"
                                value={formData.drivetrain || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, drivetrain: e.target.value }))}
                                placeholder="e.g., AWD, RWD, FWD"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Images</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Main Image</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={formData.image || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                placeholder="Image URL or upload file"
                                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                                required
                            />
                            <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleMainImageUpload(file);
                                    }}
                                    className="hidden"
                                    disabled={uploadingMainImage}
                                />
                            </label>
                        </div>
                        {uploadingMainImage && (
                            <p className="text-xs text-gray-400 mb-2">Uploading image...</p>
                        )}
                        {formData.image && (
                            <img src={formData.image} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded-lg border border-white/10" />
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Photo Gallery</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={newGalleryImage}
                                onChange={(e) => setNewGalleryImage(e.target.value)}
                                placeholder="Image URL or upload file"
                                className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                            />
                            <button
                                type="button"
                                onClick={addGalleryImage}
                                className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                                disabled={!newGalleryImage.trim()}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Upload</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleGalleryImageUpload(file);
                                    }}
                                    className="hidden"
                                    disabled={uploadingGalleryImage}
                                />
                            </label>
                        </div>
                        {uploadingGalleryImage && (
                            <p className="text-xs text-gray-400 mb-2">Uploading image...</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                            {((formData as any).photoGallery || formData.photo_gallery || []).map((url: string, index: number) => (
                                <div key={index} className="relative group">
                                    <img src={url} alt={`Gallery ${index + 1}`} className="w-24 h-16 object-cover rounded-lg border border-white/10" />
                                    <button
                                        type="button"
                                        onClick={() => removeGalleryImage(index)}
                                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Features</h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            placeholder="Add feature"
                            className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                        />
                        <button
                            type="button"
                            onClick={addFeature}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {formData.features?.map((feature, index) => (
                            <span
                                key={index}
                                className="flex items-center gap-2 px-3 py-1 bg-white/10 border border-white/20 rounded-lg text-white text-sm"
                            >
                                {feature}
                                <button
                                    type="button"
                                    onClick={() => removeFeature(index)}
                                    className="hover:text-red-300 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Status & Ratings */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Status & Ratings</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Rating</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={formData.rating || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Reviews Count</label>
                            <input
                                type="number"
                                value={formData.reviews || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, reviews: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 justify-end">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

// Car Form Modal Component
interface CarFormModalProps {
    car: CarType | null;
    onSave: (carData: Partial<CarType>) => number | void;
    onClose: () => void;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ car, onSave, onClose }) => {
    const [, setSearchParams] = useSearchParams();
    const [formData, setFormData] = useState<Partial<CarType>>(
        car || {
            name: '',
            category: 'luxury',
            image: '',
            pricePerDay: 0,
            year: new Date().getFullYear(),
            seats: 5,
        }
    );
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [carAdded, setCarAdded] = useState(false);
    const [newCarId, setNewCarId] = useState<number | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!car) {
            // Adding new car
            const carId = onSave(formData);
            if (typeof carId === 'number') {
                setNewCarId(carId);
                setCarAdded(true);
            }
        } else {
            // Editing existing car
            onSave(formData);
            onClose();
        }
    };

    const handleContinue = () => {
        if (newCarId) {
            setSearchParams({ section: 'cars', carId: newCarId.toString() });
            onClose();
        }
    };

    // Placeholder function for uploading main image to Supabase
    const handleMainImageUpload = async (file: File) => {
        setUploadingMainImage(true);
        try {
            // TODO: Implement Supabase storage upload
            // const { data, error } = await supabase.storage
            //     .from('car-images')
            //     .upload(`main/${Date.now()}-${file.name}`, file);
            // if (error) throw error;
            // const { data: { publicUrl } } = supabase.storage
            //     .from('car-images')
            //     .getPublicUrl(data.path);
            // setFormData(prev => ({ ...prev, image: publicUrl }));

            // Temporary: Create object URL for preview
            const objectUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, image: objectUrl }));
            alert('Image upload will be implemented with Supabase storage');
        } catch (error) {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        } finally {
            setUploadingMainImage(false);
        }
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
                {/* Header */}
                <div className="sticky top-0 border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Add New Car</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Create a new vehicle entry in the fleet
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {!carAdded ? (
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Basic Information */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <LiaCarSideSolid className="w-5 h-5" />
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Car Name *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).name || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).name = e.target.value;
                                            return updated;
                                        })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Category *</label>
                                    <select
                                        value={formData.category || 'luxury'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CarType['category'] }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    >
                                        <option value="suv">SUV</option>
                                        <option value="sports">Sports</option>
                                        <option value="luxury">Luxury</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Year *</label>
                                    <input
                                        type="number"
                                        value={formData.year || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Seats *</label>
                                    <input
                                        type="number"
                                        value={formData.seats || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Price Per Day (MDL) *</label>
                                    <input
                                        type="number"
                                        value={formData.pricePerDay || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, pricePerDay: parseFloat(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                Main Image
                            </h3>
                            <div>
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={formData.image || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                                        placeholder="Image URL or upload file"
                                        className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                    <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Upload className="w-4 h-4" />
                                        <span className="text-sm font-medium">Upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleMainImageUpload(file);
                                            }}
                                            className="hidden"
                                            disabled={uploadingMainImage}
                                        />
                                    </label>
                                </div>
                                {uploadingMainImage && (
                                    <p className="text-xs text-gray-400 mb-2">Uploading image...</p>
                                )}
                                {((formData as any).image || formData.image_url) && (
                                    <img src={(formData as any).image || formData.image_url || ''} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded-lg border border-white/10" />
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
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
                                Add Car
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 text-center space-y-4">
                        <div className="text-green-400 mb-4">
                            <CheckCircle className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-white">Car Added Successfully!</h3>
                        <p className="text-gray-300">You can now add more details in the edit section.</p>
                        <div className="flex gap-4 justify-center pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={handleContinue}
                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                            >
                                Continue
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </motion.div>
        </motion.div>,
        document.body
    );
};

const CalendarView: React.FC = () => {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Calendar Card */}
            <motion.div
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg overflow-hidden"
            >
                <div className="px-6 py-4 border-b border-white/10">
                    <h2 className="text-xl font-bold text-white">Booking Calendar</h2>
                </div>
                <div className="p-6">
                    <CalendarPage viewMode='admin' />
                </div>
            </motion.div>
        </motion.div>
    );
};

const UsersView: React.FC = () => (
    <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <Users />
    </motion.div>
);

// Requests View Component
const RequestsView: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestId = searchParams.get('requestId');
    const [requests, setRequests] = useState<OrderDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'pickup' | 'return' | 'amount' | 'status' | null>('pickup');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showRejected, setShowRejected] = useState(false);
    const [showAddRentalModal, setShowAddRentalModal] = useState(false);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<OrderDisplay | null>(null);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<OrderDisplay | null>(null);

    useEffect(() => {
        loadRequests();
        
        // Process status transitions on mount
        processStatusTransitions(cars).then(() => {
            // Reload requests after processing to reflect changes
            loadRequests();
        });
    }, []);

    // Periodically check and process status transitions (every 60 seconds)
    useEffect(() => {
        const interval = setInterval(async () => {
            const result = await processStatusTransitions(cars);
            if (result.success && (result.executed > 0 || result.completed > 0)) {
                // Reload requests if any were processed
                loadRequests();
            }
        }, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Reload requests when requestId changes to ensure we have the latest data
        if (requestId) {
            loadRequests();
        }
    }, [requestId]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            // Process status transitions before loading to ensure data is up-to-date
            await processStatusTransitions(cars);
            const data = await fetchBorrowRequestsForDisplay(cars);
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request: OrderDisplay) => {
        if (!window.confirm(`Accept request from ${request.customerName} for ${request.carName}?`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await acceptBorrowRequest(request.id.toString(), cars);
            if (result.success) {
                alert('Request accepted! Rental created successfully.');
                await loadRequests();
                // Optionally navigate to the created rental
                if (result.rentalId) {
                    navigate(`/admin?section=orders&orderId=${result.rentalId}`);
                }
            } else {
                alert(`Failed to accept request: ${result.error}`);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            alert('An error occurred while accepting the request.');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleReject = async (request: OrderDisplay) => {
        const reason = window.prompt(`Reject request from ${request.customerName}? (Optional reason):`);
        if (reason === null) return; // User cancelled

        setProcessingRequest(request.id.toString());
        try {
            const result = await rejectBorrowRequest(request.id.toString(), reason || undefined);
            if (result.success) {
                alert('Request rejected.');
                await loadRequests();
            } else {
                alert(`Failed to reject request: ${result.error}`);
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            alert('An error occurred while rejecting the request.');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleUndoReject = async (request: OrderDisplay) => {
        if (!window.confirm(`Restore request from ${request.customerName} for ${request.carName} to pending?`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await undoRejectBorrowRequest(request.id.toString());
            if (result.success) {
                alert('Request restored to pending.');
                await loadRequests();
            } else {
                alert(`Failed to restore request: ${result.error}`);
            }
        } catch (error) {
            console.error('Error undoing reject request:', error);
            alert('An error occurred while restoring the request.');
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleEdit = (request: OrderDisplay) => {
        setEditingRequest(request);
        setShowEditModal(true);
    };

    const handleSort = (field: 'pickup' | 'return' | 'amount' | 'status') => {
        if (sortBy === field) {
            // Toggle sort order if clicking the same field
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new sort field with ascending order
            setSortBy(field);
            setSortOrder('asc');
        }
    };

    // Calculate total price for a request (same logic as modal)
    const calculateRequestTotalPrice = useCallback((request: OrderDisplay): number => {
        const car = cars.find(c => c.id.toString() === request.carId);
        if (!car) return request.amount || 0;

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

        const startDate = new Date(request.pickupDate);
        const endDate = new Date(request.returnDate);
        
        const pickupTime = formatTime(request.pickupTime);
        const returnTime = formatTime(request.endTime);
        const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
        const [returnHour, returnMin] = returnTime.split(':').map(Number);
        
        const startDateTime = new Date(startDate);
        startDateTime.setHours(pickupHour, pickupMin, 0, 0);
        
        const endDateTime = new Date(endDate);
        endDateTime.setHours(returnHour, returnMin, 0, 0);
        
        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;

        const rentalDays = days;
        const totalDays = days + (hours / 24);
        
        // Base price calculation
        let basePrice = 0;
        
        if (rentalDays >= 8) {
            basePrice = car.pricePerDay * 0.96 * rentalDays;
        } else if (rentalDays >= 4) {
            basePrice = car.pricePerDay * 0.98 * rentalDays;
        } else {
            basePrice = car.pricePerDay * rentalDays;
        }
        
        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * car.pricePerDay;
            basePrice += hoursPrice;
        }
        
        // Calculate additional costs from options
        const options = (request as any).options;
        let parsedOptions: any = {};
        
        if (options) {
            if (typeof options === 'string') {
                try {
                    parsedOptions = JSON.parse(options);
                } catch (e) {
                    parsedOptions = {};
                }
            } else {
                parsedOptions = options;
            }
        }
        
        let additionalCosts = 0;
        const baseCarPrice = car.pricePerDay;
        
        // Percentage-based options
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
    }, []);

    const filteredRequests = useMemo(() => {
        let filtered = requests.filter(request => {
            const matchesSearch = 
                request.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.carName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                request.customerEmail?.toLowerCase().includes(searchQuery.toLowerCase());
            
            // When showRejected is true, only show rejected requests
            // When showRejected is false, hide rejected requests
            const matchesRejectedFilter = showRejected 
                ? request.status === 'REJECTED'
                : request.status !== 'REJECTED';
            
            return matchesSearch && matchesRejectedFilter;
        });

        // Sort based on selected field
        if (sortBy) {
            filtered.sort((a, b) => {
                let diff = 0;
                if (sortBy === 'pickup') {
                    const dateA = new Date(a.pickupDate).getTime();
                    const dateB = new Date(b.pickupDate).getTime();
                    diff = dateA - dateB;
                } else if (sortBy === 'return') {
                    const dateA = new Date(a.returnDate).getTime();
                    const dateB = new Date(b.returnDate).getTime();
                    diff = dateA - dateB;
                } else if (sortBy === 'amount') {
                    const amountA = calculateRequestTotalPrice(a);
                    const amountB = calculateRequestTotalPrice(b);
                    diff = amountA - amountB;
                } else if (sortBy === 'status') {
                    const statusOrder = { 'PENDING': 0, 'APPROVED': 1, 'REJECTED': 2 };
                    const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 3;
                    const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 3;
                    diff = statusA - statusB;
                }
                return sortOrder === 'asc' ? diff : -diff;
            });
        } else {
            // Default: sort by pickup date (ascending)
            filtered.sort((a, b) => {
                const dateA = new Date(a.pickupDate).getTime();
                const dateB = new Date(b.pickupDate).getTime();
                return dateA - dateB;
            });
        }

        return filtered;
    }, [requests, searchQuery, sortBy, sortOrder, showRejected, calculateRequestTotalPrice]);

    // If requestId is in URL, show request details view
    if (requestId) {
        const request = requests.find(r => r.id.toString() === requestId);
        if (request) {
            return <RequestDetailsView request={request} onBack={() => setSearchParams({ section: 'requests' })} onAccept={handleAccept} onReject={handleReject} onUndoReject={handleUndoReject} />;
        }
    }

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
                <div className="px-6 py-4 border-b border-white/10">
                    <div className="flex flex-col gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl font-bold text-white">Rental Requests</h2>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <button
                                    onClick={() => setShowRejected(!showRejected)}
                                    className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${
                                        showRejected
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/60'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                    }`}
                                >
                                    {showRejected ? 'Hide Rejected' : 'Show Rejected'}
                                </button>
                                <button
                                    onClick={() => setShowAddRentalModal(true)}
                                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-sm whitespace-nowrap flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Create New Rental
                                </button>
                            </div>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            {/* Search */}
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <input
                                        type="text"
                                        placeholder="Search requests..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Filter and Sort Buttons */}
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sort by:</span>
                                <button
                                    onClick={() => handleSort('pickup')}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${sortBy === 'pickup'
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    Pickup Date
                                    {sortBy === 'pickup' && (
                                        sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                    )}
                                    {sortBy !== 'pickup' && <ArrowUpDown className="w-3 h-3 opacity-50" />}
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
                                            setSortOrder('asc');
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
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-white/10">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Customer
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Car
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Pickup
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Return
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/10">
                                {filteredRequests.length > 0 ? (
                                    filteredRequests.map((request) => {
                                        const getInitials = (name: string) => {
                                            const parts = name.trim().split(' ');
                                            if (parts.length >= 2) {
                                                return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                                            }
                                            return name.substring(0, 2).toUpperCase();
                                        };

                                        return (
                                            <tr
                                                key={request.id}
                                                className="border-b border-white/10 hover:bg-white/5 transition cursor-pointer"
                                                onClick={() => {
                                                    setSelectedRequest(request);
                                                    setShowRequestDetailsModal(true);
                                                }}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                            {getInitials(request.customerName || 'U')}
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="font-semibold text-white text-sm truncate">{request.customerName}</span>
                                                            {request.customerEmail && (
                                                                <span className="text-gray-400 text-xs truncate">{request.customerEmail}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={request.avatar}
                                                            alt={request.carName}
                                                            className="w-10 h-10 object-cover rounded-md border border-white/10 flex-shrink-0"
                                                        />
                                                        <span className="text-white font-medium text-sm">{request.carName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{new Date(request.pickupDate).toLocaleDateString()}</span>
                                                        <span className="text-gray-400 text-xs">{request.pickupTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-white text-sm font-medium">{new Date(request.returnDate).toLocaleDateString()}</span>
                                                        <span className="text-gray-400 text-xs">{request.returnTime}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-white font-semibold text-sm">
                                                        {calculateRequestTotalPrice(request).toLocaleString()} MDL
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${
                                                            request.status === 'PENDING'
                                                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                                : request.status === 'APPROVED'
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                        }`}
                                                    >
                                                        {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            {searchQuery ? 'No requests found matching your search' : 'No requests available'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add Rental Modal */}
            {showAddRentalModal && (
                <CreateRentalModal
                    onSave={async (rentalData) => {
                        try {
                            const result = await createRentalManually(
                                rentalData.userId || '',
                                rentalData.carId || '',
                                rentalData.startDate || '',
                                rentalData.startTime || '',
                                rentalData.endDate || '',
                                rentalData.endTime || '',
                                rentalData.amount || 0,
                                cars
                            );
                            if (result.success) {
                                alert('Rental created successfully!');
                                setShowAddRentalModal(false);
                                // Navigate to orders section
                                navigate('/admin?section=orders');
                            } else {
                                alert(`Failed to create rental: ${result.error}`);
                            }
                        } catch (error) {
                            console.error('Error creating rental:', error);
                            alert('An error occurred while creating the rental.');
                        }
                    }}
                    onClose={() => setShowAddRentalModal(false)}
                />
            )}

            {/* Request Details Modal */}
            {showRequestDetailsModal && selectedRequest && (
                <RequestDetailsModal
                    request={selectedRequest}
                    onClose={() => {
                        setShowRequestDetailsModal(false);
                        setSelectedRequest(null);
                    }}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onUndoReject={handleUndoReject}
                    onEdit={handleEdit}
                    isProcessing={processingRequest === selectedRequest.id.toString()}
                />
            )}

            {/* Edit Request Modal */}
            {showEditModal && editingRequest && (
                <EditRequestModal
                    request={editingRequest}
                    onSave={async (updatedData) => {
                        try {
                            const result = await updateBorrowRequest(editingRequest.id.toString(), updatedData);
                            if (result.success) {
                                alert('Request updated successfully!');
                                setShowEditModal(false);
                                setEditingRequest(null);
                                await loadRequests();
                            } else {
                                alert(`Failed to update request: ${result.error}`);
                            }
                        } catch (error) {
                            console.error('Error updating request:', error);
                            alert('An error occurred while updating the request.');
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

// Request Details Modal Component
interface RequestDetailsModalProps {
    request: OrderDisplay;
    onClose: () => void;
    onAccept: (request: OrderDisplay) => void;
    onReject: (request: OrderDisplay) => void;
    onUndoReject?: (request: OrderDisplay) => void;
    onEdit?: (request: OrderDisplay) => void;
    isProcessing?: boolean;
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ request, onClose, onAccept, onReject, onUndoReject, onEdit, isProcessing = false }) => {
    const car = cars.find(c => c.id.toString() === request.carId);
    if (!car) return null;

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const formatTime = (timeString: string): string => {
        if (!timeString) return '00:00';
        // Convert to 24-hour format if needed
        if (timeString.includes('AM') || timeString.includes('PM')) {
            const [time, period] = timeString.split(' ');
            const [hours, minutes] = time.split(':');
            let hour24 = parseInt(hours);
            if (period === 'PM' && hour24 !== 12) hour24 += 12;
            if (period === 'AM' && hour24 === 12) hour24 = 0;
            return `${String(hour24).padStart(2, '0')}:${minutes || '00'}`;
        }
        // If already in HH:MM format, ensure it's padded
        if (timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':');
            return `${String(parseInt(hours)).padStart(2, '0')}:${minutes || '00'}`;
        }
        return '00:00';
    };

    const startDate = new Date(request.pickupDate);
    const endDate = new Date(request.returnDate);
    
    // Parse times and combine with dates for accurate calculation
    const pickupTime = formatTime(request.pickupTime);
    const returnTime = formatTime(request.endTime);
    const [pickupHour, pickupMin] = pickupTime.split(':').map(Number);
    const [returnHour, returnMin] = returnTime.split(':').map(Number);
    
    const startDateTime = new Date(startDate);
    startDateTime.setHours(pickupHour, pickupMin, 0, 0);
    
    const endDateTime = new Date(endDate);
    endDateTime.setHours(returnHour, returnMin, 0, 0);
    
    const diffTime = endDateTime.getTime() - startDateTime.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const days = diffDays;
    const hours = diffHours >= 0 ? diffHours : 0; // Ensure hours is never negative

    // Calculate pricing using same system as Calculator.tsx
    const rentalDays = days; // Use full days for discount calculation (same as Calculator)
    const totalDays = days + (hours / 24); // Use total days for final calculation
    
    // Base price calculation (same as Calculator.tsx)
    let basePrice = 0;
    let discountPercent = 0;
    
    if (rentalDays >= 8) {
        discountPercent = 4;
        basePrice = car.pricePerDay * 0.96 * rentalDays; // -4%
    } else if (rentalDays >= 4) {
        discountPercent = 2;
        basePrice = car.pricePerDay * 0.98 * rentalDays; // -2%
    } else {
        basePrice = car.pricePerDay * rentalDays;
    }
    
    // Add hours portion (hours are charged at full price, no discount)
    if (hours > 0) {
        const hoursPrice = (hours / 24) * car.pricePerDay;
        basePrice += hoursPrice;
    }
    
    // Calculate additional costs from options (same as Calculator.tsx)
    const options = (request as any).options;
    let parsedOptions: any = {};
    
    if (options) {
        if (typeof options === 'string') {
            try {
                parsedOptions = JSON.parse(options);
            } catch (e) {
                parsedOptions = {};
            }
        } else {
            parsedOptions = options;
        }
    }
    
    let additionalCosts = 0;
    const baseCarPrice = car.pricePerDay;
    
    // Percentage-based options (calculated as percentage of base car price * totalDays)
    // These should be calculated on the total rental period (days + hours)
    if (parsedOptions.unlimitedKm) {
        additionalCosts += baseCarPrice * totalDays * 0.5; // 50%
    }
    if (parsedOptions.speedLimitIncrease) {
        additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
    }
    if (parsedOptions.tireInsurance) {
        additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
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
    const pricePerDay = totalDays > 0 ? Math.round(totalPrice / totalDays) : car.pricePerDay;

    // Get customer information - prefer separate fields, fallback to parsing name
    const firstName = request.customerFirstName || request.customerName?.split(' ')[0] || '';
    const lastName = request.customerLastName || request.customerName?.split(' ').slice(1).join(' ') || '';
    const age = request.customerAge || undefined;

    return createPortal(
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 1 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-2 md:p-4"
            onClick={onClose}
            style={{ zIndex: 10000 }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg md:rounded-xl shadow-lg max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto"
                style={{ pointerEvents: 'auto' }}
            >
                {/* Header */}
                <div className="sticky top-0 border-b border-white/20 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                    <div>
                        <h2 className="text-xl md:text-2xl font-bold text-white">Cerere de închiriere</h2>
                        <p className="text-gray-400 text-sm md:text-sm mt-1">{(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 md:p-6 space-y-4 md:space-y-6">
                    {/* Rental Period */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Perioada închirierii</h3>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-300 text-sm md:text-base">
                                    {days} zile{days !== 1 ? '' : ''}, {hours} ore{hours !== 1 ? '' : ''}
                                </span>
                            </div>
                            
                            {/* Discount indicator */}
                            {discountPercent > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-2.5 md:p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl"
                                >
                                    <div className="flex items-center gap-2 text-emerald-400 text-xs md:text-sm font-semibold">
                                        <div className="p-1 bg-emerald-500/20 rounded-lg flex-shrink-0">
                                            <Check className="w-3 h-3 text-emerald-400" />
                                        </div>
                                        <span>
                                            {discountPercent === 4 
                                                ? 'Reducere de 4% pentru 8+ zile'
                                                : 'Reducere de 2% pentru 4+ zile'
                                            }
                                        </span>
                                    </div>
                                </motion.div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-3 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Data preluării</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDate(request.pickupDate)}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">ora {formatTime(request.pickupTime)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Data returnării</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDate(request.returnDate)}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">ora {formatTime(request.endTime)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Date de contact</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Prenume</label>
                                <p className="text-white font-medium text-sm md:text-base">{firstName || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Nume</label>
                                <p className="text-white font-medium text-sm md:text-base">{lastName || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Vârstă</label>
                                <p className="text-white font-medium text-sm md:text-base">{age ? `${age}` : '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">Telefon</label>
                                {request.customerPhone ? (
                                    <a 
                                        href={`tel:${request.customerPhone.replace(/\s/g, '')}`}
                                        className="text-white font-medium text-sm md:text-base hover:text-emerald-400 transition-colors"
                                    >
                                        {request.customerPhone}
                                    </a>
                                ) : (
                                    <p className="text-white font-medium text-sm md:text-base">🇲🇩 +373</p>
                                )}
                            </div>
                            {request.customerEmail && (
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">E-mail (opțional)</label>
                                    <p className="text-white text-sm md:text-base">{request.customerEmail}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rental Options */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">Opțiuni de închiriere</h3>
                        
                        {/* Parse options from request */}
                        {(() => {
                            const options = (request as any).options;
                            let parsedOptions: any = {};
                            
                            if (options) {
                                if (typeof options === 'string') {
                                    try {
                                        parsedOptions = JSON.parse(options);
                                    } catch (e) {
                                        parsedOptions = {};
                                    }
                                } else {
                                    parsedOptions = options;
                                }
                            }
                            
                            const selectedOptions: Array<{ label: string; price: string; category: string }> = [];
                            
                            // Pickup and Return
                            if (parsedOptions.pickupAtAddress) {
                                selectedOptions.push({ label: 'Preluarea la adresă', price: 'Cost separat', category: 'pickup-return' });
                            }
                            if (parsedOptions.returnAtAddress) {
                                selectedOptions.push({ label: 'Returnarea la adresă', price: 'Cost separat', category: 'pickup-return' });
                            }
                            
                            // Limits
                            if (parsedOptions.unlimitedKm) {
                                selectedOptions.push({ label: 'Kilometraj nelimitat', price: '+50%', category: 'limits' });
                            }
                            if (parsedOptions.speedLimitIncrease) {
                                selectedOptions.push({ label: 'Creșterea limitei de viteză', price: '+20%', category: 'limits' });
                            }
                            
                            // VIP Services
                            if (parsedOptions.personalDriver) {
                                selectedOptions.push({ label: 'Șofer personal', price: '800 MDL/zi', category: 'vip' });
                            }
                            if (parsedOptions.priorityService) {
                                selectedOptions.push({ label: 'Priority Service', price: '1 000 MDL/zi', category: 'vip' });
                            }
                            
                            // Insurance
                            if (parsedOptions.tireInsurance) {
                                selectedOptions.push({ label: 'Asigurare anvelope & parbriz', price: '+20%', category: 'insurance' });
                            }
                            
                            // Additional
                            if (parsedOptions.childSeat) {
                                selectedOptions.push({ label: 'Scaun auto pentru copii', price: '100 MDL/zi', category: 'additional' });
                            }
                            if (parsedOptions.simCard) {
                                selectedOptions.push({ label: 'Cartelă SIM cu internet', price: '100 MDL/zi', category: 'additional' });
                            }
                            if (parsedOptions.roadsideAssistance) {
                                selectedOptions.push({ label: 'Asistență rutieră', price: '500 MDL/zi', category: 'additional' });
                            }
                            
                            if (selectedOptions.length === 0) {
                                return (
                                    <div className="text-center py-6 md:py-8">
                                        <p className="text-gray-400 text-sm">Nu au fost selectate opțiuni suplimentare</p>
                                    </div>
                                );
                            }
                            
                            return (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 md:gap-3">
                                    {selectedOptions.map((option, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 md:p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 md:gap-3">
                                                <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                                                <span className="text-white text-sm font-medium">{option.label}</span>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${
                                                option.price.includes('%') 
                                                    ? 'text-emerald-400 bg-emerald-400/10' 
                                                    : 'text-gray-300 bg-white/5'
                                            }`}>
                                                {option.price}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Comment - Only show if comment exists */}
                    {((request as any).comment || (request as any).customerComment) && (
                        <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                            <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Comentariu (opțional)</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{(request as any).comment || (request as any).customerComment}</p>
                        </div>
                    )}

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">Detalii preț</h3>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">Preț pe zi</span>
                                <span className="text-white font-medium">{car.pricePerDay} MDL</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">Număr zile</span>
                                <span className="text-white font-medium">{rentalDays}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex items-center justify-between text-sm text-emerald-400">
                                    <span>Reducere</span>
                                    <span className="font-medium">-{discountPercent}%</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white font-medium">Preț de bază</span>
                                    <span className="text-white font-medium">{Math.round(basePrice).toLocaleString()} MDL</span>
                                </div>
                            </div>
                            
                            {additionalCosts > 0 && (
                                <>
                                    <div className="pt-2 md:pt-3 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-2 md:mb-3">Servicii suplimentare</h4>
                                        <div className="space-y-1.5 md:space-y-2 text-sm">
                                            {parsedOptions.unlimitedKm && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Kilometraj nelimitat</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(baseCarPrice * totalDays * 0.5).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.speedLimitIncrease && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.tireInsurance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                    <span className="text-white font-medium">
                                                        {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                    </span>
                                                </div>
                                            )}
                                            {parsedOptions.personalDriver && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Șofer personal</span>
                                                    <span className="text-white font-medium">{800 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.priorityService && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Priority Service</span>
                                                    <span className="text-white font-medium">{1000 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.childSeat && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Scaun auto pentru copii</span>
                                                    <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.simCard && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                    <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            {parsedOptions.roadsideAssistance && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-300">Asistență rutieră</span>
                                                    <span className="text-white font-medium">{500 * rentalDays} MDL</span>
                                                </div>
                                            )}
                                            <div className="pt-1.5 md:pt-2 border-t border-white/10">
                                                <div className="flex justify-between font-medium text-sm">
                                                    <span className="text-white">Total servicii</span>
                                                    <span className="text-white">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            <div className="pt-2 md:pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-white font-bold text-base md:text-lg">Total</span>
                                <span className="text-white font-bold text-lg md:text-xl">{Math.round(totalPrice).toLocaleString()} MDL</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {request.status === 'PENDING' && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onAccept(request);
                                    onClose();
                                }}
                                disabled={isProcessing}
                                className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Accept Request
                                    </>
                                )}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReject(request);
                                    onClose();
                                }}
                                disabled={isProcessing}
                                className="flex-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4" />
                                        Reject Request
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    {request.status === 'REJECTED' && (onUndoReject || onEdit) && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            {onUndoReject && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onUndoReject(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            Undo Reject
                                        </>
                                    )}
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Request
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// Request Details View Component
interface RequestDetailsViewProps {
    request: OrderDisplay;
    onBack: () => void;
    onAccept: (request: OrderDisplay) => void;
    onReject: (request: OrderDisplay) => void;
    onUndoReject?: (request: OrderDisplay) => void;
    onEdit?: (request: OrderDisplay) => void;
}

const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ request, onBack, onAccept, onReject, onUndoReject, onEdit }) => {
    const car = cars.find(c => c.id.toString() === request.carId);
    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image);

    useEffect(() => {
        if (car) {
            setSelectedImage(car.image);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [car]);

    if (!car) return null;

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
                            src={selectedImage}
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
                    <h2 className="text-xl font-bold text-white">Request Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                                <span className="text-white text-sm font-medium">{new Date(request.pickupDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{request.pickupTime || '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                                <span className="text-white text-sm font-medium">{new Date(request.returnDate).toLocaleDateString()}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{request.endTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rental Days</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(request.pickupDate, request.returnDate)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Estimated Price</p>
                            <span className="text-white text-lg font-bold">{request.amount ? `${request.amount} MDL` : '—'}</span>
                        </div>
                    </div>
                </motion.div>

                {/* Customer Info */}
                <motion.div
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Customer</h2>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xl shadow-lg flex-shrink-0">
                            {request.customerName?.[0]?.toUpperCase() || 'C'}
                        </div>
                        <div>
                            <div className="text-white font-semibold">{request.customerName}</div>
                            <div className="text-gray-300 text-sm">{request.customerEmail}</div>
                            {request.customerPhone && (
                                <div className="text-gray-300 text-sm mt-1">{request.customerPhone}</div>
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
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl ${
                                request.status === 'PENDING'
                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                    : request.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                            }`}
                        >
                            {request.status}
                        </span>
                        {request.createdAt && (
                            <span className="text-gray-400 text-sm">
                                Requested on {new Date(request.createdAt).toLocaleDateString()}
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
                        className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg"
                    >
                        Back to Requests
                    </button>
                    {request.status === 'PENDING' && (
                        <>
                            <button
                                onClick={() => onAccept(request)}
                                className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Accept Request
                            </button>
                            <button
                                onClick={() => onReject(request)}
                                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                            >
                                <X className="w-4 h-4" />
                                Reject Request
                            </button>
                        </>
                    )}
                    {request.status === 'REJECTED' && (onUndoReject || onEdit) && (
                        <div className="flex flex-col sm:flex-row gap-2">
                            {onUndoReject && (
                                <button
                                    onClick={() => onUndoReject(request)}
                                    className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 hover:border-emerald-500/60 text-emerald-300 hover:text-emerald-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Undo Reject
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(request)}
                                    className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 hover:border-blue-500/60 text-blue-300 hover:text-blue-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Request
                                </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </aside>
        </motion.div>
    );
};

// Create Rental Modal Component
interface CreateRentalModalProps {
    onSave: (rentalData: Partial<OrderDisplay>) => void;
    onClose: () => void;
}

// Country codes for phone selector
const COUNTRY_CODES = [
    { code: '+373', flag: '🇲🇩', country: 'Moldova' },
    { code: '+40', flag: '🇷🇴', country: 'Romania' },
    { code: '+380', flag: '🇺🇦', country: 'Ukraine' },
    { code: '+7', flag: '🇷🇺', country: 'Russia' },
    { code: '+1', flag: '🇺🇸', country: 'USA' },
    { code: '+44', flag: '🇬🇧', country: 'UK' },
    { code: '+49', flag: '🇩🇪', country: 'Germany' },
    { code: '+33', flag: '🇫🇷', country: 'France' },
    { code: '+39', flag: '🇮🇹', country: 'Italy' },
    { code: '+34', flag: '🇪🇸', country: 'Spain' },
    { code: '+32', flag: '🇧🇪', country: 'Belgium' },
    { code: '+31', flag: '🇳🇱', country: 'Netherlands' },
    { code: '+41', flag: '🇨🇭', country: 'Switzerland' },
    { code: '+43', flag: '🇦🇹', country: 'Austria' },
    { code: '+48', flag: '🇵🇱', country: 'Poland' },
    { code: '+420', flag: '🇨🇿', country: 'Czech Republic' },
    { code: '+36', flag: '🇭🇺', country: 'Hungary' },
    { code: '+359', flag: '🇧🇬', country: 'Bulgaria' },
    { code: '+30', flag: '🇬🇷', country: 'Greece' },
    { code: '+90', flag: '🇹🇷', country: 'Turkey' },
];

const CreateRentalModal: React.FC<CreateRentalModalProps> = ({ onSave, onClose }) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    const [formData, setFormData] = useState<Partial<OrderDisplay> & { 
        firstName?: string;
        lastName?: string;
        age?: string;
        comment?: string;
    }>({
        customerName: '',
        customerFirstName: '',
        customerLastName: '',
        customerEmail: '',
        customerPhone: '',
        customerAge: '',
        carId: '',
        carName: '',
        startDate: today.toISOString().split('T')[0],
        startTime: '09:00',
        endDate: tomorrow.toISOString().split('T')[0],
        endTime: '17:00',
        status: 'ACTIVE',
        amount: 0,
        userId: '',
        firstName: '',
        lastName: '',
        age: '',
        comment: '',
    });

    const [selectedCountryCode, setSelectedCountryCode] = useState(COUNTRY_CODES[0]);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);

    // Calendar state
    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);
    const [showPickupTime, setShowPickupTime] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);
    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>({
        pickup: today,
        return: tomorrow
    });

    // Refs for click outside detection
    const pickupCalendarRef = React.useRef<HTMLDivElement>(null);
    const returnCalendarRef = React.useRef<HTMLDivElement>(null);
    const pickupTimeRef = React.useRef<HTMLDivElement>(null);
    const returnTimeRef = React.useRef<HTMLDivElement>(null);

    // Helper functions
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const generateCalendarDays = (date: Date): (string | null)[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days: (string | null)[] = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            if (currentDate.getMonth() === month) {
                days.push(currentDate.toISOString().split('T')[0]);
            } else {
                days.push(null);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    const generateHours = (): string[] => {
        const hours: string[] = [];
        for (let h = 0; h < 24; h++) {
            hours.push(`${String(h).padStart(2, '0')}:00`);
            hours.push(`${String(h).padStart(2, '0')}:30`);
        }
        return hours;
    };

    const [options, setOptions] = useState({
        pickupAtAddress: false,
        returnAtAddress: false,
        unlimitedKm: false,
        speedLimitIncrease: false,
        personalDriver: false,
        priorityService: false,
        tireInsurance: false,
        childSeat: false,
        simCard: false,
        roadsideAssistance: false
    });

    const calculateAmount = () => {
        if (!formData.startDate || !formData.endDate || !formData.carId) return 0;
        const selectedCar = cars.find(c => c.id.toString() === formData.carId);
        if (!selectedCar) return 0;

        // Calculate days and hours
        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const startTime = formData.startTime || '09:00';
        const endTime = formData.endTime || '17:00';
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHour, endMin, 0, 0);
        
        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;
        const rentalDays = days;
        const totalDays = days + (hours / 24);
        
        // Base price calculation (same as Calculator.tsx and Admin)
        let basePrice = 0;
        
        if (rentalDays >= 8) {
            basePrice = selectedCar.pricePerDay * 0.96 * rentalDays; // -4% discount
        } else if (rentalDays >= 4) {
            basePrice = selectedCar.pricePerDay * 0.98 * rentalDays; // -2% discount
        } else {
            basePrice = selectedCar.pricePerDay * rentalDays;
        }
        
        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * selectedCar.pricePerDay;
            basePrice += hoursPrice;
        }
        
        // Calculate additional costs from options
        let additionalCosts = 0;
        const baseCarPrice = selectedCar.pricePerDay;
        
        // Percentage-based options (calculated on totalDays)
        if (options.unlimitedKm) {
            additionalCosts += baseCarPrice * totalDays * 0.5; // 50%
        }
        if (options.speedLimitIncrease) {
            additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
        }
        if (options.tireInsurance) {
            additionalCosts += baseCarPrice * totalDays * 0.2; // 20%
        }
        
        // Fixed daily costs
        if (options.personalDriver) {
            additionalCosts += 800 * rentalDays;
        }
        if (options.priorityService) {
            additionalCosts += 1000 * rentalDays;
        }
        if (options.childSeat) {
            additionalCosts += 100 * rentalDays;
        }
        if (options.simCard) {
            additionalCosts += 100 * rentalDays;
        }
        if (options.roadsideAssistance) {
            additionalCosts += 500 * rentalDays;
        }
        
        // Total price = base price + additional costs
        return Math.round(basePrice + additionalCosts);
    };

    useEffect(() => {
        const amount = calculateAmount();
        setFormData(prev => ({ ...prev, amount }));
    }, [formData.startDate, formData.endDate, formData.startTime, formData.endTime, formData.carId, options]);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.country-code-dropdown-container')) {
                setShowCountryCodeDropdown(false);
            }
            if (pickupCalendarRef.current && !pickupCalendarRef.current.contains(event.target as Node)) {
                setShowPickupCalendar(false);
            }
            if (returnCalendarRef.current && !returnCalendarRef.current.contains(event.target as Node)) {
                setShowReturnCalendar(false);
            }
            if (pickupTimeRef.current && !pickupTimeRef.current.contains(event.target as Node)) {
                setShowPickupTime(false);
            }
            if (returnTimeRef.current && !returnTimeRef.current.contains(event.target as Node)) {
                setShowReturnTime(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCountryCodeDropdown]);

    // Sync calendar month with selected dates
    useEffect(() => {
        if (formData.startDate) {
            setCalendarMonth(prev => ({ ...prev, pickup: new Date(formData.startDate || '') }));
        }
    }, [formData.startDate]);

    useEffect(() => {
        if (formData.endDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(formData.endDate || '') }));
        } else if (formData.startDate) {
            const nextMonth = new Date(formData.startDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setCalendarMonth(prev => ({ ...prev, return: nextMonth }));
        }
    }, [formData.endDate, formData.startDate]);

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
        if (!formData.firstName || !formData.lastName || !formData.age || !formData.customerPhone || !formData.carId || !formData.startDate || !formData.endDate) {
            alert('Please fill in all required fields (First Name, Last Name, Age, Phone, Car, Dates)');
            return;
        }
        
        // Combine firstName and lastName into customerName
        const customerName = `${formData.firstName} ${formData.lastName}`;
        
        // Include country code in phone number
        const fullPhoneNumber = `${selectedCountryCode.code} ${formData.customerPhone}`.trim();
        
        // For manual creation, we'll use a placeholder userId - in production, you'd look up or create the user
        if (!formData.userId) {
            formData.userId = `manual-${Date.now()}`;
        }
        
        // Prepare data with all fields including options
        const rentalData = {
            ...formData,
            customerName,
            customerFirstName: formData.firstName,
            customerLastName: formData.lastName,
            customerAge: formData.age,
            customerPhone: fullPhoneNumber,
            options: options,
            comment: formData.comment || undefined,
        };
        
        onSave(rentalData);
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
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            >
                <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1C1C1C' }}>
                    <h2 className="text-xl font-bold text-white">Create New Rental</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Date de contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prenume *</label>
                                <input
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nume *</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Vârstă *</label>
                                <input
                                    type="number"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
                                    min="18"
                                    max="100"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 country-code-dropdown-container">
                                        <button
                                            type="button"
                                            onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                                            className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                        >
                                            <span>{selectedCountryCode.flag}</span>
                                            <span>{selectedCountryCode.code}</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {showCountryCodeDropdown && (
                                            <div className="absolute top-full left-0 mt-1 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 min-w-[200px]" style={{ backgroundColor: '#343434' }}>
                                                {COUNTRY_CODES.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCountryCode(country);
                                                            setShowCountryCodeDropdown(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                                                    >
                                                        <span>{country.flag}</span>
                                                        <span className="flex-1 text-left">{country.country}</span>
                                                        <span className="text-gray-400">{country.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.customerPhone || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        placeholder="000 00 000"
                                        className="w-full pl-[100px] pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-300 mb-2">E-mail (opțional)</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    placeholder="email@mail.com"
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Car Selection */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Selectare automobil</h3>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Automobil *</label>
                            <select
                                value={formData.carId || ''}
                                onChange={(e) => handleCarChange(e.target.value)}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                required
                            >
                                <option value="">Select a car</option>
                                {cars.map(car => (
                                    <option key={car.id} value={car.id.toString()}>
                                        {(car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car'} - {((car as any)?.pricePerDay || car.price_per_day || 0)} MDL/day
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Rental Dates */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Perioada închirierii</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pickup Date */}
                            <div className="relative" ref={pickupCalendarRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data preluării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPickupCalendar(!showPickupCalendar);
                                        setShowReturnCalendar(false);
                                        setShowPickupTime(false);
                                        setShowReturnTime(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.startDate 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{formData.startDate ? formatDate(formData.startDate) : 'Data primirii'}</span>
                                </button>
                                <AnimatePresence>
                                    {showPickupCalendar && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 min-w-[280px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.pickup);
                                                        newDate.setMonth(newDate.getMonth() - 1);
                                                        setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <div className="text-sm font-medium text-white">
                                                    {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.pickup);
                                                        newDate.setMonth(newDate.getMonth() + 1);
                                                        setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                    <div key={day} className="text-gray-400 font-medium">{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {generateCalendarDays(calendarMonth.pickup).map((day, index) => {
                                                    if (!day) return <div key={index}></div>;
                                                    
                                                    const dayDate = new Date(day);
                                                    const dayString = day;
                                                    const isSelected = dayString === formData.startDate;
                                                    const isPast = dayString < today.toISOString().split('T')[0];

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${
                                                                isPast ? 'text-gray-600 cursor-not-allowed' : 'text-white'
                                                            } ${
                                                                isSelected
                                                                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                    : !isPast
                                                                        ? 'hover:bg-white/20'
                                                                        : ''
                                                            }`}
                                                            onClick={() => {
                                                                if (!isPast) {
                                                                    setFormData(prev => ({ ...prev, startDate: day }));
                                                                    setShowPickupCalendar(false);
                                                                    if (formData.endDate && day >= formData.endDate) {
                                                                        const newReturnDate = new Date(day);
                                                                        newReturnDate.setDate(newReturnDate.getDate() + 1);
                                                                        setFormData(prev => ({ ...prev, endDate: newReturnDate.toISOString().split('T')[0] }));
                                                                    }
                                                                    // Auto-open pickup time picker after selecting date
                                                                    setTimeout(() => {
                                                                        setShowPickupTime(true);
                                                                    }, 100);
                                                                }
                                                            }}
                                                        >
                                                            {dayDate.getDate()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Pickup Time */}
                            <div className="relative" ref={pickupTimeRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ora preluării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPickupTime(!showPickupTime);
                                        setShowReturnTime(false);
                                        setShowPickupCalendar(false);
                                        setShowReturnCalendar(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.startTime 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>{formData.startTime || '__ : __'}</span>
                                </button>
                                <AnimatePresence>
                                    {showPickupTime && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="grid grid-cols-2 gap-1">
                                                {generateHours().map((hour) => (
                                                    <button
                                                        key={hour}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, startTime: hour }));
                                                            setShowPickupTime(false);
                                                            // Auto-open return date picker after selecting time
                                                            setTimeout(() => {
                                                                setShowReturnCalendar(true);
                                                            }, 100);
                                                        }}
                                                        className={`px-3 py-2 text-xs rounded transition-colors ${
                                                            formData.startTime === hour
                                                                ? 'bg-red-500 text-white font-medium'
                                                                : 'text-white hover:bg-white/20'
                                                        }`}
                                                    >
                                                        {hour}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Return Date */}
                            <div className="relative" ref={returnCalendarRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data returnării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReturnCalendar(!showReturnCalendar);
                                        setShowPickupCalendar(false);
                                        setShowPickupTime(false);
                                        setShowReturnTime(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.endDate 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{formData.endDate ? formatDate(formData.endDate) : 'Data returnării'}</span>
                                </button>
                                <AnimatePresence>
                                    {showReturnCalendar && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 min-w-[280px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.return);
                                                        newDate.setMonth(newDate.getMonth() - 1);
                                                        setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                    </svg>
                                                </button>
                                                <div className="text-sm font-medium text-white">
                                                    {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const newDate = new Date(calendarMonth.return);
                                                        newDate.setMonth(newDate.getMonth() + 1);
                                                        setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                    }}
                                                    className="p-1 hover:bg-white/10 rounded transition-colors"
                                                >
                                                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                                {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                    <div key={day} className="text-gray-400 font-medium">{day}</div>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-7 gap-1">
                                                {generateCalendarDays(calendarMonth.return).map((day, index) => {
                                                    if (!day) return <div key={index}></div>;
                                                    
                                                    const dayDate = new Date(day);
                                                    const dayString = day;
                                                    const isSelected = dayString === formData.endDate;
                                                    const minReturnDate = formData.startDate || today.toISOString().split('T')[0];
                                                    const isPast = dayString < minReturnDate;

                                                    return (
                                                        <div
                                                            key={index}
                                                            className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${
                                                                isPast ? 'text-gray-600 cursor-not-allowed' : 'text-white'
                                                            } ${
                                                                isSelected
                                                                    ? 'bg-red-500 text-white hover:bg-red-600 font-medium'
                                                                    : !isPast
                                                                        ? 'hover:bg-white/20'
                                                                        : ''
                                                            }`}
                                                            onClick={() => {
                                                                if (!isPast) {
                                                                    setFormData(prev => ({ ...prev, endDate: day }));
                                                                    setShowReturnCalendar(false);
                                                                    // Auto-open return time picker after selecting date
                                                                    setTimeout(() => {
                                                                        setShowReturnTime(true);
                                                                    }, 100);
                                                                }
                                                            }}
                                                        >
                                                            {dayDate.getDate()}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Return Time */}
                            <div className="relative" ref={returnTimeRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ora returnării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReturnTime(!showReturnTime);
                                        setShowPickupTime(false);
                                        setShowPickupCalendar(false);
                                        setShowReturnCalendar(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.endTime 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>{formData.endTime || '__ : __'}</span>
                                </button>
                                <AnimatePresence>
                                    {showReturnTime && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                            className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="grid grid-cols-2 gap-1">
                                                {generateHours().map((hour) => (
                                                    <button
                                                        key={hour}
                                                        type="button"
                                                        onClick={() => {
                                                            setFormData(prev => ({ ...prev, endTime: hour }));
                                                            setShowReturnTime(false);
                                                        }}
                                                        className={`px-3 py-2 text-xs rounded transition-colors ${
                                                            formData.endTime === hour
                                                                ? 'bg-red-500 text-white font-medium'
                                                                : 'text-white hover:bg-white/20'
                                                        }`}
                                                    >
                                                        {hour}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>

                    {/* Rental Options */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">
                            Opțiuni de închiriere
                        </h3>
                        
                        {/* Pickup and Return */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Preluarea și returnarea automobilului</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.pickupAtAddress}
                                        onChange={(e) => setOptions(prev => ({ ...prev, pickupAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.pickupAtAddress
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.pickupAtAddress && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">Preluarea la adresă</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Cost separat</div>
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.returnAtAddress}
                                        onChange={(e) => setOptions(prev => ({ ...prev, returnAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.returnAtAddress
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.returnAtAddress && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">Returnarea la adresă</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Cost separat</div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Limits */}
                        <div className="mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Limite</h4>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.unlimitedKm}
                                            onChange={(e) => setOptions(prev => ({ ...prev, unlimitedKm: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.unlimitedKm
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.unlimitedKm && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Kilometraj nelimitat</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+50%</span>
                                </label>
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.speedLimitIncrease}
                                            onChange={(e) => setOptions(prev => ({ ...prev, speedLimitIncrease: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.speedLimitIncrease
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.speedLimitIncrease && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Creșterea limitei de viteză</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+20%</span>
                                </label>
                            </div>
                        </div>

                        {/* VIP Services */}
                        <div className="mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Servicii VIP</h4>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.personalDriver}
                                            onChange={(e) => setOptions(prev => ({ ...prev, personalDriver: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.personalDriver
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.personalDriver && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Șofer personal</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded whitespace-nowrap">800 MDL/zi</span>
                                </label>
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.priorityService}
                                            onChange={(e) => setOptions(prev => ({ ...prev, priorityService: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.priorityService
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.priorityService && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Priority Service</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded whitespace-nowrap">1 000 MDL/zi</span>
                                </label>
                            </div>
                        </div>

                        {/* Insurance */}
                        <div className="mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Asigurare</h4>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.tireInsurance}
                                            onChange={(e) => setOptions(prev => ({ ...prev, tireInsurance: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.tireInsurance
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.tireInsurance && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Asigurare anvelope & parbriz</span>
                                    </div>
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">+20%</span>
                                </label>
                            </div>
                        </div>

                        {/* Additional */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Suplimentar</h4>
                            <div className="space-y-2">
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.childSeat}
                                            onChange={(e) => setOptions(prev => ({ ...prev, childSeat: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.childSeat
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.childSeat && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Scaun auto pentru copii</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded whitespace-nowrap">100 MDL/zi</span>
                                </label>
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.simCard}
                                            onChange={(e) => setOptions(prev => ({ ...prev, simCard: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.simCard
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.simCard && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Cartelă SIM cu internet</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded whitespace-nowrap">100 MDL/zi</span>
                                </label>
                                <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={options.roadsideAssistance}
                                            onChange={(e) => setOptions(prev => ({ ...prev, roadsideAssistance: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                            options.roadsideAssistance
                                                ? 'bg-red-500 border-red-500'
                                                : 'border-white/30 bg-transparent group-hover:border-white/50'
                                        }`}>
                                            {options.roadsideAssistance && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <span className="font-medium text-white text-sm">Asistență rutieră</span>
                                    </div>
                                    <span className="text-xs font-bold text-gray-300 bg-white/5 px-2 py-1 rounded whitespace-nowrap">500 MDL/zi</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Comentariu <span className="text-gray-400 font-normal">(opțional)</span></label>
                        <textarea
                            value={formData.comment || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                            rows={3}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 resize-none"
                            placeholder="Adăugați un comentariu (opțional)"
                        />
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Detalii preț</h3>
                        <div className="space-y-3">
                            {formData.carId && (() => {
                                const selectedCar = cars.find(c => c.id.toString() === formData.carId);
                                if (!selectedCar) return null;
                                
                                const startDate = new Date(formData.startDate || '');
                                const endDate = new Date(formData.endDate || '');
                                const startTime = formData.startTime || '09:00';
                                const endTime = formData.endTime || '17:00';
                                
                                const [startHour, startMin] = startTime.split(':').map(Number);
                                const [endHour, endMin] = endTime.split(':').map(Number);
                                
                                const startDateTime = new Date(startDate);
                                startDateTime.setHours(startHour, startMin, 0, 0);
                                
                                const endDateTime = new Date(endDate);
                                endDateTime.setHours(endHour, endMin, 0, 0);
                                
                                const diffTime = endDateTime.getTime() - startDateTime.getTime();
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                
                                const days = diffDays;
                                const hours = diffHours >= 0 ? diffHours : 0;
                                const rentalDays = days;
                                const totalDays = days + (hours / 24);
                                
                                let basePrice = 0;
                                let discountPercent = 0;
                                
                                if (rentalDays >= 8) {
                                    discountPercent = 4;
                                    basePrice = selectedCar.pricePerDay * 0.96 * rentalDays;
                                } else if (rentalDays >= 4) {
                                    discountPercent = 2;
                                    basePrice = selectedCar.pricePerDay * 0.98 * rentalDays;
                                } else {
                                    basePrice = selectedCar.pricePerDay * rentalDays;
                                }
                                
                                if (hours > 0) {
                                    const hoursPrice = (hours / 24) * selectedCar.pricePerDay;
                                    basePrice += hoursPrice;
                                }
                                
                                let additionalCosts = 0;
                                const baseCarPrice = selectedCar.pricePerDay;
                                
                                if (options.unlimitedKm) {
                                    additionalCosts += baseCarPrice * totalDays * 0.5;
                                }
                                if (options.speedLimitIncrease) {
                                    additionalCosts += baseCarPrice * totalDays * 0.2;
                                }
                                if (options.tireInsurance) {
                                    additionalCosts += baseCarPrice * totalDays * 0.2;
                                }
                                if (options.personalDriver) {
                                    additionalCosts += 800 * rentalDays;
                                }
                                if (options.priorityService) {
                                    additionalCosts += 1000 * rentalDays;
                                }
                                if (options.childSeat) {
                                    additionalCosts += 100 * rentalDays;
                                }
                                if (options.simCard) {
                                    additionalCosts += 100 * rentalDays;
                                }
                                if (options.roadsideAssistance) {
                                    additionalCosts += 500 * rentalDays;
                                }
                                
                                const totalPrice = basePrice + additionalCosts;
                                
                                return (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Preț pe zi</span>
                                            <span className="text-white font-medium">{selectedCar.pricePerDay.toLocaleString()} MDL</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Număr zile</span>
                                            <span className="text-white font-medium">{rentalDays}</span>

                                            
                                        </div>
                                        {discountPercent > 0 && (
                                            <div className="flex items-center justify-between text-sm text-emerald-400">
                                                <span>Reducere</span>
                                                <span className="font-medium">-{discountPercent}%</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-white/10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white font-medium">Preț de bază</span>
                                                <span className="text-white font-medium">{Math.round(basePrice).toLocaleString()} MDL</span>
                                            </div>
                                        </div>
                                        
                                        {additionalCosts > 0 && (
                                            <>
                                                <div className="pt-3 border-t border-white/10">
                                                    <h4 className="text-sm font-bold text-white mb-3">Servicii suplimentare</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {options.unlimitedKm && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Kilometraj nelimitat</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.5).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.speedLimitIncrease && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.tireInsurance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.personalDriver && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Șofer personal</span>
                                                                <span className="text-white font-medium">{800 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.priorityService && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Priority Service</span>
                                                                <span className="text-white font-medium">{1000 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.childSeat && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Scaun auto pentru copii</span>
                                                                <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.simCard && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                                <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.roadsideAssistance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asistență rutieră</span>
                                                                <span className="text-white font-medium">{500 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-2 border-t border-white/10">
                                                            <div className="flex justify-between font-medium">
                                                                <span className="text-white">Total servicii</span>
                                                                <span className="text-white">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                            <span className="text-white font-bold text-lg">Total</span>
                                            <span className="text-white font-bold text-xl">{Math.round(totalPrice).toLocaleString()} MDL</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
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
                            Create Rental
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>,
        document.body
    );
};

// Edit Request Modal Component
interface EditRequestModalProps {
    request: OrderDisplay;
    onSave: (updatedData: {
        car_id?: string;
        start_date?: string;
        start_time?: string;
        end_date?: string;
        end_time?: string;
        customer_name?: string;
        customer_email?: string;
        customer_phone?: string;
        customer_age?: string;
        comment?: string;
        options?: any;
    }) => void;
    onClose: () => void;
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ request, onSave, onClose }) => {
    // Parse existing request data
    const parsePhoneNumber = (phone: string | undefined): { code: string; number: string } => {
        if (!phone) return { code: '+373', number: '' };
        const match = phone.match(/^(\+\d+)\s*(.+)$/);
        if (match) {
            return { code: match[1], number: match[2] };
        }
        return { code: '+373', number: phone };
    };

    const phoneData = parsePhoneNumber(request.customerPhone);
    const initialCountryCode = COUNTRY_CODES.find(c => c.code === phoneData.code) || COUNTRY_CODES[0];
    
    // Parse customer name into first and last name
    const nameParts = (request.customerName || '').split(' ');
    const initialFirstName = request.customerFirstName || nameParts[0] || '';
    const initialLastName = request.customerLastName || nameParts.slice(1).join(' ') || '';

    // Parse options
    const requestOptions = (request as any).options;
    let initialOptions: any = {
        pickupAtAddress: false,
        returnAtAddress: false,
        unlimitedKm: false,
        speedLimitIncrease: false,
        personalDriver: false,
        priorityService: false,
        tireInsurance: false,
        childSeat: false,
        simCard: false,
        roadsideAssistance: false
    };
    
    if (requestOptions) {
        try {
            const parsed = typeof requestOptions === 'string' ? JSON.parse(requestOptions) : requestOptions;
            initialOptions = { ...initialOptions, ...parsed };
        } catch (e) {
            // Keep defaults
        }
    }

    const [formData, setFormData] = useState<Partial<OrderDisplay> & { 
        firstName?: string;
        lastName?: string;
        age?: string;
        comment?: string;
    }>({
        customerName: request.customerName || '',
        customerFirstName: initialFirstName,
        customerLastName: initialLastName,
        customerEmail: request.customerEmail || '',
        customerPhone: phoneData.number,
        customerAge: request.customerAge || '',
        carId: request.carId || '',
        carName: request.carName || '',
        startDate: request.pickupDate || '',
        startTime: request.pickupTime || '09:00',
        endDate: request.returnDate || '',
        endTime: (request as any).endTime || '17:00',
        status: (request.status || 'PENDING') as any,
        amount: request.amount || 0,
        userId: request.userId || '',
        firstName: initialFirstName,
        lastName: initialLastName,
        age: request.customerAge || '',
        comment: (request as any).comment || (request as any).customerComment || '',
    });

    const [selectedCountryCode, setSelectedCountryCode] = useState(initialCountryCode);
    const [showCountryCodeDropdown, setShowCountryCodeDropdown] = useState(false);
    const [options, setOptions] = useState(initialOptions);

    // Calendar state
    const [showPickupCalendar, setShowPickupCalendar] = useState(false);
    const [showReturnCalendar, setShowReturnCalendar] = useState(false);
    const [showPickupTime, setShowPickupTime] = useState(false);
    const [showReturnTime, setShowReturnTime] = useState(false);
    
    const startDateObj = formData.startDate ? new Date(formData.startDate) : new Date();
    const endDateObj = formData.endDate ? new Date(formData.endDate) : new Date();
    const [calendarMonth, setCalendarMonth] = useState<{ pickup: Date; return: Date }>({
        pickup: startDateObj,
        return: endDateObj
    });

    // Refs for click outside detection
    const pickupCalendarRef = React.useRef<HTMLDivElement>(null);
    const returnCalendarRef = React.useRef<HTMLDivElement>(null);
    const pickupTimeRef = React.useRef<HTMLDivElement>(null);
    const returnTimeRef = React.useRef<HTMLDivElement>(null);

    // Helper functions (same as CreateRentalModal)
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const generateCalendarDays = (date: Date): (string | null)[] => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const days: (string | null)[] = [];
        const currentDate = new Date(startDate);

        for (let i = 0; i < 42; i++) {
            if (currentDate.getMonth() === month) {
                days.push(currentDate.toISOString().split('T')[0]);
            } else {
                days.push(null);
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        return days;
    };

    const generateHours = (): string[] => {
        const hours: string[] = [];
        for (let h = 0; h < 24; h++) {
            hours.push(`${String(h).padStart(2, '0')}:00`);
            hours.push(`${String(h).padStart(2, '0')}:30`);
        }
        return hours;
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.country-code-dropdown-container')) {
                setShowCountryCodeDropdown(false);
            }
            if (pickupCalendarRef.current && !pickupCalendarRef.current.contains(target)) {
                setShowPickupCalendar(false);
            }
            if (returnCalendarRef.current && !returnCalendarRef.current.contains(target)) {
                setShowReturnCalendar(false);
            }
            if (pickupTimeRef.current && !pickupTimeRef.current.contains(target)) {
                setShowPickupTime(false);
            }
            if (returnTimeRef.current && !returnTimeRef.current.contains(target)) {
                setShowReturnTime(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Sync calendar month with selected dates
    useEffect(() => {
        if (formData.startDate) {
            setCalendarMonth(prev => ({ ...prev, pickup: new Date(formData.startDate || '') }));
        }
    }, [formData.startDate]);

    useEffect(() => {
        if (formData.endDate) {
            setCalendarMonth(prev => ({ ...prev, return: new Date(formData.endDate || '') }));
        } else if (formData.startDate) {
            const nextMonth = new Date(formData.startDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            setCalendarMonth(prev => ({ ...prev, return: nextMonth }));
        }
    }, [formData.endDate, formData.startDate]);

    const calculateAmount = () => {
        if (!formData.startDate || !formData.endDate || !formData.carId) return 0;
        const selectedCar = cars.find(c => c.id.toString() === formData.carId);
        if (!selectedCar) return 0;

        const startDate = new Date(formData.startDate);
        const endDate = new Date(formData.endDate);
        const startTime = formData.startTime || '09:00';
        const endTime = formData.endTime || '17:00';
        
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        
        const startDateTime = new Date(startDate);
        startDateTime.setHours(startHour, startMin, 0, 0);
        
        const endDateTime = new Date(endDate);
        endDateTime.setHours(endHour, endMin, 0, 0);
        
        const diffTime = endDateTime.getTime() - startDateTime.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        const days = diffDays;
        const hours = diffHours >= 0 ? diffHours : 0;
        const rentalDays = days;
        const totalDays = days + (hours / 24);
        
        let basePrice = 0;
        if (rentalDays >= 8) {
            basePrice = (selectedCar as any).pricePerDay * 0.96 * rentalDays;
        } else if (rentalDays >= 4) {
            basePrice = (selectedCar as any).pricePerDay * 0.98 * rentalDays;
        } else {
            basePrice = (selectedCar as any).pricePerDay * rentalDays;
        }
        
        if (hours > 0) {
            const hoursPrice = (hours / 24) * (selectedCar as any).pricePerDay;
            basePrice += hoursPrice;
        }
        
        const baseCarPrice = (selectedCar as any).pricePerDay;
        let additionalCosts = 0;
        
        if (options.unlimitedKm) {
            additionalCosts += baseCarPrice * totalDays * 0.5;
        }
        if (options.speedLimitIncrease) {
            additionalCosts += baseCarPrice * totalDays * 0.2;
        }
        if (options.tireInsurance) {
            additionalCosts += baseCarPrice * totalDays * 0.2;
        }
        if (options.personalDriver) {
            additionalCosts += 800 * rentalDays;
        }
        if (options.priorityService) {
            additionalCosts += 1000 * rentalDays;
        }
        if (options.childSeat) {
            additionalCosts += 100 * rentalDays;
        }
        if (options.simCard) {
            additionalCosts += 100 * rentalDays;
        }
        if (options.roadsideAssistance) {
            additionalCosts += 500 * rentalDays;
        }
        
        return Math.round(basePrice + additionalCosts);
    };

    const totalAmount = calculateAmount();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.age || !formData.customerPhone || !formData.carId || !formData.startDate || !formData.endDate) {
            alert('Please fill in all required fields');
            return;
        }
        
        const customerName = `${formData.firstName} ${formData.lastName}`;
        const fullPhoneNumber = `${selectedCountryCode.code} ${formData.customerPhone}`.trim();
        
        onSave({
            car_id: formData.carId,
            start_date: formData.startDate,
            start_time: formData.startTime,
            end_date: formData.endDate,
            end_time: formData.endTime,
            customer_name: customerName,
            customer_email: formData.customerEmail || undefined,
            customer_phone: fullPhoneNumber,
            customer_age: formData.age,
            comment: formData.comment || undefined,
            options: options
        });
    };

    const today = new Date().toISOString().split('T')[0];

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
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="sticky top-0 bg-white/10 backdrop-blur-xl border-b border-white/20 px-6 py-4 flex items-center justify-between" style={{ backgroundColor: '#1C1C1C' }}>
                    <h2 className="text-xl font-bold text-white">Edit Request</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Customer Information */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Date de contact</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Prenume *</label>
                                <input
                                    type="text"
                                    value={formData.firstName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value, customerFirstName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nume *</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value, customerLastName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Vârstă *</label>
                                <input
                                    type="number"
                                    min="18"
                                    max="100"
                                    value={formData.age || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value, customerAge: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Telefon *</label>
                                <div className="relative">
                                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-10 country-code-dropdown-container">
                                        <button
                                            type="button"
                                            onClick={() => setShowCountryCodeDropdown(!showCountryCodeDropdown)}
                                            className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm font-medium px-2 py-1 rounded hover:bg-white/10 transition-colors"
                                        >
                                            <span>{selectedCountryCode.flag}</span>
                                            <span>{selectedCountryCode.code}</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        {showCountryCodeDropdown && (
                                            <div className="absolute top-full left-0 mt-1 border border-white/20 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 min-w-[200px]" style={{ backgroundColor: '#343434' }}>
                                                {COUNTRY_CODES.map((country) => (
                                                    <button
                                                        key={country.code}
                                                        type="button"
                                                        onClick={() => {
                                                            setSelectedCountryCode(country);
                                                            setShowCountryCodeDropdown(false);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                                                    >
                                                        <span>{country.flag}</span>
                                                        <span className="flex-1 text-left">{country.country}</span>
                                                        <span className="text-gray-400">{country.code}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="tel"
                                        value={formData.customerPhone || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, customerPhone: e.target.value }))}
                                        placeholder="000 00 000"
                                        className="w-full pl-[120px] pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                        required
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">E-mail (opțional)</label>
                                <input
                                    type="email"
                                    value={formData.customerEmail || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Rental Dates - Same calendar implementation as CreateRentalModal */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Perioada închirierii</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Pickup Date */}
                            <div className="relative" ref={pickupCalendarRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data preluării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPickupCalendar(!showPickupCalendar);
                                        setShowReturnCalendar(false);
                                        setShowPickupTime(false);
                                        setShowReturnTime(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.startDate 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{formData.startDate ? formatDate(formData.startDate) : 'Data preluării'}</span>
                                </button>
                                {showPickupCalendar && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 min-w-[280px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.pickup);
                                                    newDate.setMonth(newDate.getMonth() - 1);
                                                    setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                }}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <div className="text-sm font-medium text-white">
                                                {calendarMonth.pickup.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.pickup);
                                                    newDate.setMonth(newDate.getMonth() + 1);
                                                    setCalendarMonth(prev => ({ ...prev, pickup: newDate }));
                                                }}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                            {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                <div key={day} className="text-gray-400 font-medium">{day}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {generateCalendarDays(calendarMonth.pickup).map((day, index) => {
                                                if (!day) return <div key={index}></div>;
                                                const dayDate = new Date(day);
                                                const isSelected = day === formData.startDate;
                                                const isPast = day < today;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${
                                                            isPast ? 'text-gray-500 cursor-not-allowed' : 'text-white'
                                                        } ${
                                                            isSelected
                                                                ? 'bg-red-500 text-white font-medium'
                                                                : !isPast
                                                                ? 'hover:bg-white/20'
                                                                : ''
                                                        }`}
                                                        onClick={() => {
                                                            if (!isPast) {
                                                                setFormData(prev => ({ ...prev, startDate: day }));
                                                                setShowPickupCalendar(false);
                                                                setTimeout(() => {
                                                                    setShowPickupTime(true);
                                                                }, 100);
                                                            }
                                                        }}
                                                    >
                                                        {dayDate.getDate()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Pickup Time */}
                            <div className="relative" ref={pickupTimeRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ora preluării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowPickupTime(!showPickupTime);
                                        setShowReturnTime(false);
                                        setShowPickupCalendar(false);
                                        setShowReturnCalendar(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.startTime 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>{formData.startTime || '__ : __'}</span>
                                </button>
                                {showPickupTime && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-2 gap-1">
                                            {generateHours().map((hour) => (
                                                <button
                                                    key={hour}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, startTime: hour }));
                                                        setShowPickupTime(false);
                                                        setTimeout(() => {
                                                            setShowReturnCalendar(true);
                                                        }, 100);
                                                    }}
                                                    className={`px-3 py-2 text-xs rounded transition-colors ${
                                                        formData.startTime === hour
                                                            ? 'bg-red-500 text-white font-medium'
                                                            : 'text-white hover:bg-white/20'
                                                    }`}
                                                >
                                                    {hour}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Return Date */}
                            <div className="relative" ref={returnCalendarRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Data returnării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReturnCalendar(!showReturnCalendar);
                                        setShowPickupCalendar(false);
                                        setShowPickupTime(false);
                                        setShowReturnTime(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.endDate 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Calendar className="w-4 h-4" />
                                    <span>{formData.endDate ? formatDate(formData.endDate) : 'Data returnării'}</span>
                                </button>
                                {showReturnCalendar && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 min-w-[280px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="flex items-center justify-between mb-3">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.return);
                                                    newDate.setMonth(newDate.getMonth() - 1);
                                                    setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                }}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                            <div className="text-sm font-medium text-white">
                                                {calendarMonth.return.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' })}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newDate = new Date(calendarMonth.return);
                                                    newDate.setMonth(newDate.getMonth() + 1);
                                                    setCalendarMonth(prev => ({ ...prev, return: newDate }));
                                                }}
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                            >
                                                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-7 gap-1 text-xs text-center mb-2">
                                            {['Du', 'Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ'].map(day => (
                                                <div key={day} className="text-gray-400 font-medium">{day}</div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7 gap-1">
                                            {generateCalendarDays(calendarMonth.return).map((day, index) => {
                                                if (!day) return <div key={index}></div>;
                                                const dayDate = new Date(day);
                                                const isSelected = day === formData.endDate;
                                                const minReturnDate = formData.startDate || today;
                                                const isPast = day < minReturnDate;

                                                return (
                                                    <div
                                                        key={index}
                                                        className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${
                                                            isPast ? 'text-gray-500 cursor-not-allowed' : 'text-white'
                                                        } ${
                                                            isSelected
                                                                ? 'bg-red-500 text-white font-medium'
                                                                : !isPast
                                                                ? 'hover:bg-white/20'
                                                                : ''
                                                        }`}
                                                        onClick={() => {
                                                            if (!isPast) {
                                                                setFormData(prev => ({ ...prev, endDate: day }));
                                                                setShowReturnCalendar(false);
                                                                setTimeout(() => {
                                                                    setShowReturnTime(true);
                                                                }, 100);
                                                            }
                                                        }}
                                                    >
                                                        {dayDate.getDate()}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Return Time */}
                            <div className="relative" ref={returnTimeRef}>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Ora returnării *</label>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowReturnTime(!showReturnTime);
                                        setShowPickupTime(false);
                                        setShowPickupCalendar(false);
                                        setShowReturnCalendar(false);
                                    }}
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${
                                        formData.endTime 
                                            ? 'border-white/30 text-white hover:border-white/50 bg-white/5' 
                                            : 'border-white/20 text-gray-400 hover:border-white/30 bg-white/5'
                                    }`}
                                >
                                    <Clock className="w-4 h-4" />
                                    <span>{formData.endTime || '__ : __'}</span>
                                </button>
                                {showReturnTime && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="absolute z-50 top-full left-0 mt-2 bg-[#343434] border border-white/20 rounded-lg shadow-lg p-3 max-h-[200px] overflow-y-auto min-w-[120px]"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="grid grid-cols-2 gap-1">
                                            {generateHours().map((hour) => (
                                                <button
                                                    key={hour}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData(prev => ({ ...prev, endTime: hour }));
                                                        setShowReturnTime(false);
                                                    }}
                                                    className={`px-3 py-2 text-xs rounded transition-colors ${
                                                        formData.endTime === hour
                                                            ? 'bg-red-500 text-white font-medium'
                                                            : 'text-white hover:bg-white/20'
                                                    }`}
                                                >
                                                    {hour}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Car Selection */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Selectare automobil</h3>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Automobil *</label>
                        <select
                            value={formData.carId || ''}
                            onChange={(e) => {
                                const selectedCar = cars.find(c => c.id.toString() === e.target.value);
                                setFormData(prev => ({
                                    ...prev,
                                    carId: e.target.value,
                                    carName: selectedCar ? ((selectedCar as any).name || `${selectedCar.make} ${selectedCar.model}`) : ''
                                }));
                            }}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50"
                            required
                        >
                            <option value="">Selectează automobil</option>
                            {cars.map((car) => (
                                <option key={car.id} value={car.id.toString()}>
                                    {(car as any).name || `${car.make} ${car.model}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Rental Options - Same as CreateRentalModal */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Opțiuni de închiriere</h3>
                        
                        {/* Pickup and Return */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Preluarea și returnarea automobilului</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.pickupAtAddress}
                                        onChange={(e) => setOptions(prev => ({ ...prev, pickupAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.pickupAtAddress
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.pickupAtAddress && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">Preluarea la adresă</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Cost separat</div>
                                    </div>
                                </div>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.returnAtAddress}
                                        onChange={(e) => setOptions(prev => ({ ...prev, returnAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.returnAtAddress
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.returnAtAddress && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <div>
                                        <div className="font-medium text-white text-sm">Returnarea la adresă</div>
                                        <div className="text-xs text-gray-400 mt-0.5">Cost separat</div>
                                    </div>
                                </div>
                            </label>
                        </div>

                        {/* Limits */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Limite</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.unlimitedKm}
                                        onChange={(e) => setOptions(prev => ({ ...prev, unlimitedKm: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.unlimitedKm
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.unlimitedKm && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Kilometraj nelimitat</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+50%</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.speedLimitIncrease}
                                        onChange={(e) => setOptions(prev => ({ ...prev, speedLimitIncrease: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.speedLimitIncrease
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.speedLimitIncrease && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Creșterea limitei de viteză</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+20%</span>
                            </label>
                        </div>

                        {/* VIP Services */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Servicii VIP</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.personalDriver}
                                        onChange={(e) => setOptions(prev => ({ ...prev, personalDriver: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.personalDriver
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.personalDriver && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Șofer personal</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">800 MDL/zi</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.priorityService}
                                        onChange={(e) => setOptions(prev => ({ ...prev, priorityService: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.priorityService
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.priorityService && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Priority Service</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">1 000 MDL/zi</span>
                            </label>
                        </div>

                        {/* Insurance */}
                        <div className="space-y-2 mb-5">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Asigurare</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.tireInsurance}
                                        onChange={(e) => setOptions(prev => ({ ...prev, tireInsurance: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.tireInsurance
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.tireInsurance && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Asigurare anvelope & parbriz</span>
                                </div>
                                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded">+20%</span>
                            </label>
                        </div>

                        {/* Additional */}
                        <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-gray-300 mb-3">Suplimentar</h4>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.childSeat}
                                        onChange={(e) => setOptions(prev => ({ ...prev, childSeat: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.childSeat
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.childSeat && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Scaun auto pentru copii</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">100 MDL/zi</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.simCard}
                                        onChange={(e) => setOptions(prev => ({ ...prev, simCard: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.simCard
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.simCard && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Cartelă SIM cu internet</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">100 MDL/zi</span>
                            </label>
                            <label className="flex items-center justify-between p-3 rounded-lg bg-transparent border border-white/10 hover:bg-white/10 cursor-pointer transition-all group">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={options.roadsideAssistance}
                                        onChange={(e) => setOptions(prev => ({ ...prev, roadsideAssistance: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${
                                        options.roadsideAssistance
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-white/30 bg-transparent group-hover:border-white/50'
                                    }`}>
                                        {options.roadsideAssistance && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="font-medium text-white text-sm">Asistență rutieră</span>
                                </div>
                                <span className="text-xs font-medium text-gray-300">500 MDL/zi</span>
                            </label>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Comentariu (opțional)</h3>
                        <textarea
                            value={formData.comment || ''}
                            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                            rows={4}
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 resize-none"
                            placeholder="Adăugați un comentariu (opțional)"
                        />
                    </div>

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                        <h3 className="text-lg font-bold text-white mb-4">Detalii preț</h3>
                        <div className="space-y-3">
                            {formData.carId && (() => {
                                const selectedCar = cars.find(c => c.id.toString() === formData.carId);
                                if (!selectedCar) return null;
                                
                                const startDate = new Date(formData.startDate || '');
                                const endDate = new Date(formData.endDate || '');
                                const startTime = formData.startTime || '09:00';
                                const endTime = formData.endTime || '17:00';
                                
                                const [startHour, startMin] = startTime.split(':').map(Number);
                                const [endHour, endMin] = endTime.split(':').map(Number);
                                
                                const startDateTime = new Date(startDate);
                                startDateTime.setHours(startHour, startMin, 0, 0);
                                
                                const endDateTime = new Date(endDate);
                                endDateTime.setHours(endHour, endMin, 0, 0);
                                
                                const diffTime = endDateTime.getTime() - startDateTime.getTime();
                                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                                const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                                
                                const days = diffDays;
                                const hours = diffHours >= 0 ? diffHours : 0;
                                const rentalDays = days;
                                const totalDays = days + (hours / 24);
                                
                                let basePrice = 0;
                                let discountPercent = 0;
                                
                                if (rentalDays >= 8) {
                                    discountPercent = 4;
                                    basePrice = (selectedCar as any).pricePerDay * 0.96 * rentalDays;
                                } else if (rentalDays >= 4) {
                                    discountPercent = 2;
                                    basePrice = (selectedCar as any).pricePerDay * 0.98 * rentalDays;
                                } else {
                                    basePrice = (selectedCar as any).pricePerDay * rentalDays;
                                }
                                
                                if (hours > 0) {
                                    const hoursPrice = (hours / 24) * (selectedCar as any).pricePerDay;
                                    basePrice += hoursPrice;
                                }
                                
                                let additionalCosts = 0;
                                const baseCarPrice = (selectedCar as any).pricePerDay;
                                
                                if (options.unlimitedKm) {
                                    additionalCosts += baseCarPrice * totalDays * 0.5;
                                }
                                if (options.speedLimitIncrease) {
                                    additionalCosts += baseCarPrice * totalDays * 0.2;
                                }
                                if (options.tireInsurance) {
                                    additionalCosts += baseCarPrice * totalDays * 0.2;
                                }
                                if (options.personalDriver) {
                                    additionalCosts += 800 * rentalDays;
                                }
                                if (options.priorityService) {
                                    additionalCosts += 1000 * rentalDays;
                                }
                                if (options.childSeat) {
                                    additionalCosts += 100 * rentalDays;
                                }
                                if (options.simCard) {
                                    additionalCosts += 100 * rentalDays;
                                }
                                if (options.roadsideAssistance) {
                                    additionalCosts += 500 * rentalDays;
                                }
                                
                                const totalPrice = basePrice + additionalCosts;
                                
                                return (
                                    <>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Preț pe zi</span>
                                            <span className="text-white font-medium">{(selectedCar as any).pricePerDay.toLocaleString()} MDL</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Număr zile</span>
                                            <span className="text-white font-medium">{rentalDays}</span>
                                        </div>
                                        {discountPercent > 0 && (
                                            <div className="flex items-center justify-between text-sm text-emerald-400">
                                                <span>Reducere</span>
                                                <span className="font-medium">-{discountPercent}%</span>
                                            </div>
                                        )}
                                        <div className="pt-2 border-t border-white/10">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-white font-medium">Preț de bază</span>
                                                <span className="text-white font-medium">{Math.round(basePrice).toLocaleString()} MDL</span>
                                            </div>
                                        </div>
                                        
                                        {additionalCosts > 0 && (
                                            <>
                                                <div className="pt-3 border-t border-white/10">
                                                    <h4 className="text-sm font-bold text-white mb-3">Servicii suplimentare</h4>
                                                    <div className="space-y-2 text-sm">
                                                        {options.unlimitedKm && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Kilometraj nelimitat</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.5).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.speedLimitIncrease && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Creșterea limitei de viteză</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.tireInsurance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asigurare anvelope & parbriz</span>
                                                                <span className="text-white font-medium">
                                                                    {Math.round(baseCarPrice * totalDays * 0.2).toLocaleString()} MDL
                                                                </span>
                                                            </div>
                                                        )}
                                                        {options.personalDriver && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Șofer personal</span>
                                                                <span className="text-white font-medium">{800 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.priorityService && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Priority Service</span>
                                                                <span className="text-white font-medium">{1000 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.childSeat && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Scaun auto pentru copii</span>
                                                                <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.simCard && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Cartelă SIM cu internet</span>
                                                                <span className="text-white font-medium">{100 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        {options.roadsideAssistance && (
                                                            <div className="flex justify-between">
                                                                <span className="text-gray-300">Asistență rutieră</span>
                                                                <span className="text-white font-medium">{500 * rentalDays} MDL</span>
                                                            </div>
                                                        )}
                                                        <div className="pt-2 border-t border-white/10">
                                                            <div className="flex justify-between font-medium">
                                                                <span className="text-white">Total servicii</span>
                                                                <span className="text-white">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                        
                                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                                            <span className="text-white font-bold text-lg">Total</span>
                                            <span className="text-white font-bold text-xl">{Math.round(totalPrice).toLocaleString()} MDL</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4 justify-end pt-4 border-t border-white/10">
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
                            Save Changes
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>,
        document.body
    );
};


export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const section = searchParams.get('section') || 'dashboard';
    const orderId = searchParams.get('orderId');
    const carId = searchParams.get('carId');
    const { signOut } = useAuth();
    const { i18n, t } = useTranslation();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [totalRequests, setTotalRequests] = useState<number>(0);

    // Close language dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.language-dropdown-container')) {
                setShowLanguageDropdown(false);
            }
        };

        if (showLanguageDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showLanguageDropdown]);

    // Fetch total requests count
    useEffect(() => {
        const loadRequestsCount = async () => {
            try {
                const data = await fetchBorrowRequestsForDisplay(cars);
                setTotalRequests(data.length);
            } catch (error) {
                console.error('Failed to load requests count:', error);
            }
        };
        loadRequestsCount();
        // Refresh count periodically or when section changes
        const interval = setInterval(loadRequestsCount, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [refreshKey]);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'requests', label: 'Requests', icon: FileText },
        { id: 'cars', label: 'Cars', icon: LiaCarSideSolid },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'users', label: 'Users', icon: UsersIcon },
    ];

    const handleSectionChange = (sectionId: string) => {
        setSearchParams({ section: sectionId });
    };

    const handleLogout = async () => {
        await signOut();
        navigate('/');
    };

    const handleBackToSite = () => {
        navigate('/');
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        // Force remount of view components by changing key
        setRefreshKey(prev => prev + 1);
        // Simulate refresh delay for visual feedback
        setTimeout(() => {
            setIsRefreshing(false);
        }, 1000);
    };

    const getPageTitle = () => {
        if (orderId) return `Order #${orderId}`;
        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return `Request #${requestId}`;
        }
        if (carId && section === 'cars') {
            const car = cars.find(c => c.id.toString() === carId);
            return car ? ((car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car') : 'Edit Car';
        }
        const item = menuItems.find(m => m.id === section);
        return item?.label || 'Dashboard';
    };

    const getPageDescription = () => {
        if (orderId) return 'View and manage order details';
        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return 'View and manage rental request details';
        }
        if (carId && section === 'cars') {
            return 'Modify car details and settings';
        }
        switch (section) {
            case 'dashboard':
                return 'Welcome back! Here\'s what\'s happening today.';
            case 'requests':
                return 'Manage customer rental requests and approvals';
            case 'orders':
                return 'Manage all rental orders and bookings';
            case 'cars':
                return 'Manage your vehicle fleet';
            case 'calendar':
                return 'View and manage bookings calendar';
            case 'users':
                return 'Manage user accounts and permissions';
            default:
                return '';
        }
    };

    const renderContent = () => {
        if (orderId) {
            return <OrderDetailsView orderId={orderId} />;
        }

        switch (section) {
            case 'dashboard':
                return <DashboardView key={refreshKey} />;
            case 'requests':
                return <RequestsView key={refreshKey} />;
            case 'orders':
                return <OrdersView key={refreshKey} />;
            case 'cars':
                return <CarsView key={refreshKey} />;
            case 'calendar':
                return <CalendarView key={refreshKey} />;
            case 'users':
                return <UsersView key={refreshKey} />;
            default:
                return <DashboardView key={refreshKey} />;
        }
    };

    return (
        <>
            <style>{`
                * {
                    scrollbar-width: none !important;
                    -ms-overflow-style: none !important;
                }
                *::-webkit-scrollbar {
                    display: none !important;
                }
                .mobile-nav-scroll::-webkit-scrollbar {
                    display: none !important;
                }
                .mobile-nav-scroll {
                    -webkit-overflow-scrolling: touch;
                }
            `}</style>

            <div className="relative min-h-screen">
                {/* Background Image - Lowest layer */}
                <div
                    className="fixed inset-0 bg-cover bg-center bg-fixed"
                    style={{ backgroundImage: "url('/LevelAutoRental/bg-hero.jpg')", zIndex: 0 }}
                ></div>
                {/* Dark Overlay - Over the background but under all content */}
                <div className="fixed inset-0 bg-black/70" style={{ zIndex: 1 }}></div>

                <div className="relative flex flex-col lg:flex-row min-h-screen" style={{ zIndex: 10 }}>
                    {/* Sidebar */}
                    <div className="w-full lg:w-72 lg:sticky lg:top-0 lg:h-screen bg-white/10 backdrop-blur-xl border-b lg:border-b-0 lg:border-r border-white/20 flex flex-col shadow-lg">
                        {/* Logo Section */}
                        <div className="p-6 border-b border-white/20">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 flex items-center justify-center">
                                    <img
                                        src="/LevelAutoRental/logo-LVL-white.png"
                                        alt="LVL Logo"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                                <div className="flex items-center justify-between w-full">
                                    <div>
                                        <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                                        <p className="text-xs text-gray-300">Level Auto Rental</p>
                                    </div>
                                    {/* Mobile Refresh and Settings */}
                                    <div className="lg:hidden flex items-center gap-2">
                                        {/* Mobile Refresh Button */}
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20 disabled:opacity-50"
                                            title="Refresh data"
                                        >
                                            <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                        {/* Mobile Settings Button */}
                                        <button
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                            title="Settings"
                                        >
                                            <SettingsIcon className="w-4 h-4 text-white" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation */}
                        <nav
                            className="flex-1 p-4 space-y-2 pt-6 overflow-x-auto lg:overflow-y-auto lg:overflow-x-visible mobile-nav-scroll"
                            style={{
                                scrollbarWidth: 'none',
                                msOverflowStyle: 'none'
                            }}
                        >
                            <div className="flex lg:flex-col space-x-3 lg:space-x-0 lg:space-y-2 pb-2 lg:pb-0">
                                {menuItems.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = section === item.id;
                                    const showBadge = item.id === 'requests' && totalRequests > 0;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSectionChange(item.id)}
                                            className={`flex-shrink-0 lg:w-full flex flex-col lg:flex-row items-center justify-center lg:justify-start space-y-1 lg:space-y-0 lg:space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative ${isActive
                                                ? 'bg-red-500/20 text-white border border-red-500/50'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                                }`}
                                        >
                                            <div className="relative">
                                                <Icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-red-400' : 'text-gray-400 group-hover:text-white'}`} />
                                                {showBadge && (
                                                    <span className={`lg:hidden absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                                                        isActive 
                                                            ? 'bg-red-500 text-white' 
                                                            : 'bg-yellow-500 text-gray-900'
                                                    }`}>
                                                        {totalRequests > 99 ? '99+' : totalRequests}
                                                    </span>
                                                )}
                                            </div>
                                            <span className="text-xs lg:text-sm flex items-center justify-between w-full">
                                                <span>{item.label}</span>
                                                {showBadge && (
                                                    <span className={`hidden lg:flex ml-auto min-w-[20px] h-5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${
                                                        isActive 
                                                            ? 'bg-red-500 text-white' 
                                                            : 'bg-yellow-500 text-gray-900'
                                                    }`}>
                                                        {totalRequests > 99 ? '99+' : totalRequests}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </nav>

                        {/* Bottom Section */}
                        <div className="mt-auto hidden lg:block flex-shrink-0">
                            <div className="px-4 pt-6 pb-4 border-t border-white/20 space-y-3">
                                {/* Current User */}
                                <div className="flex items-center space-x-3 px-1 pb-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                                        <span className="text-white font-semibold text-sm">V</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">Victorin</p>
                                        <p className="text-xs text-gray-300 truncate">admin@lvl.com</p>
                                    </div>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(true)}
                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                                        aria-label="Settings"
                                    >
                                        <SettingsIcon className="w-4 h-4 text-gray-300 hover:text-white" />
                                    </button>
                                </div>

                                {/* Back Button */}
                                <button
                                    onClick={handleBackToSite}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-white/10 border border-white/20 text-gray-200 text-sm font-medium rounded-lg hover:bg-white/20 hover:border-white/30 hover:text-white transition-all duration-200"
                                >
                                    <Home className="w-4 h-4" />
                                    <span>Back to Site</span>
                                </button>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium rounded-lg hover:bg-red-500/30 hover:border-red-500/60 hover:text-red-200 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Header */}
                        <div className="relative px-4 lg:px-8 py-6 lg:py-8 border-b border-white/20 bg-white/10 backdrop-blur-xl" style={{ zIndex: 1 }}>
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                        {getPageTitle()}
                                    </h1>
                                    <p className="text-gray-300 text-sm lg:text-base">
                                        {getPageDescription()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {/* Refresh Button - Desktop Only */}
                                    <button
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20 disabled:opacity-50"
                                        title="Refresh data"
                                    >
                                        <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8 relative z-0">
                            <motion.div
                                key={section}
                                initial={{ opacity: 1 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0 }}
                            >
                                {renderContent()}
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Settings Modal */}
            {isSettingsModalOpen && createPortal(
                <motion.div
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 1 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setIsSettingsModalOpen(false)}
                    style={{ zIndex: 10000 }}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl shadow-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                    >
                        {/* Header */}
                        <div className="sticky top-0 border-b border-white/20 px-6 py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <div>
                                <h2 className="text-2xl font-bold text-white">Settings</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    Manage your account settings and preferences
                                </p>
                            </div>
                            <button
                                onClick={() => setIsSettingsModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <Settings />
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </>
    );
};

