import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { cars } from '../../data/cars';
import { sparkData, mainChart, orders } from '../../data/index';
import { OrdersTable } from '../../components/dashboard/OrderTable';
import { SalesChartCard } from '../../components/dashboard/Chart';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    ShoppingCart,
    Car,
    CalendarDays,
    Users as UsersIcon,
    Settings as SettingsIcon,
    LogOut,
    Home,
    Calendar,
    Clock,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';
import { getDateDiffInDays } from '../../utils/date';
import Settings from '../dashboard/settings/Settings';
import Users from '../dashboard/users/Users';
import { CardStats } from '../../components/dashboard/CardStats';
import CalendarPage from '../dashboard/calendar/CalendarPage';

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            {/* Top stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CardStats
                    title="Total Sales"
                    value="$2,114.40"
                    trend="up"
                    trendValue="2.4%"
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
                        value="$88.10"
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
                initial={{ opacity: 0, y: 20 }}
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
                                            src={car.image}
                                            alt={car.name}
                                            className="w-12 h-12 object-cover rounded-md"
                                        />
                                        <p className="text-sm font-medium text-white truncate flex-1">{car.name}</p>
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
                                                src={car.image}
                                                alt={car.name}
                                                className="w-12 h-12 object-cover rounded-md"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white truncate">{car.name}</p>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <SalesChartCard totalSales={8422.6} change="↑ 3.2% vs last 30 days" data={mainChart} />
                </motion.div>

                {/* Most Rented Cars */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
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
                                    const revenue = carOrders.reduce((sum, order) => sum + parseFloat(order.amount), 0);
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
                                                    src={car.image}
                                                    alt={car.name}
                                                    className="w-10 h-10 object-cover rounded-md"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-white truncate">{car.name}</p>
                                                    <p className="text-xs text-gray-400">{car.rentals} rental{car.rentals > 1 ? 's' : ''}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-white">${car.revenue.toFixed(0)}</span>
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
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="space-y-8"
        >
            {/* Orders Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
            >
                <OrdersTable title="All Orders" />
            </motion.div>

            {/* Large chart */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
            >
                <SalesChartCard totalSales={8422.6} change="↑ 3.2% vs last 30 days" data={mainChart} />
            </motion.div>
        </motion.div>
    );
};

// Order Details View Component
const OrderDetailsView: React.FC<{ orderId: string }> = ({ orderId }) => {
    const navigate = useNavigate();
    const order = orders.find((o) => o.id === orderId);
    const car = order ? cars[Math.floor(Math.random() * 5)] : null;
    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image);

    useEffect(() => {
        if (!order || !car) {
            navigate('/admin?section=orders');
        } else {
            setSelectedImage(car.image);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [orderId, order, car, navigate]);

    if (!order || !car) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8"
        >
            {/* LEFT COLUMN: Order + Car Info */}
            <div className="space-y-6">
                {/* Car Summary */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 hover:border-red-500/50 rounded-xl p-6 transition-all shadow-lg"
                >
                    <div className="flex items-center gap-4">
                        <img
                            src={selectedImage}
                            alt={car.name}
                            className="w-32 h-20 object-cover rounded-lg border border-white/20"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-white">{car.name}</h2>
                            <div className="text-sm text-gray-300">{car.transmission} · {car.seats} seats</div>
                        </div>
                    </div>
                </motion.div>

                {/* Booking Details */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
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
                                <span className="text-white text-sm font-medium">{order.pickupDate}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{order.pickupTime || '--:--'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Return</p>
                                <span className="text-white text-sm font-medium">{order.returnDate}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Clock className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                                <span className="text-white text-sm font-medium">{order.returnTime || '--:--'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Rental Days</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(order.pickupDate, order.returnDate)}</span>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Price</p>
                            <span className="text-white text-lg font-bold">{getDateDiffInDays(order.pickupDate, order.returnDate) * car.pricePerDay} MDL</span>
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
                    initial={{ opacity: 0, y: 20 }}
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
                            <div className="text-white font-semibold">{order.customer}</div>
                            <div className="text-gray-300 text-sm">{order.customerEmail}</div>
                        </div>
                    </div>
                </motion.div>

                {/* Payment & Status */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                    className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                >
                    <h2 className="text-xl font-bold text-white mb-4">Payment</h2>
                    <div className="flex justify-between items-center">
                        <div>
                            <span className="text-gray-400 text-sm uppercase tracking-wide">Amount Paid</span>
                            <div className="text-white font-bold text-2xl">${order.amount}</div>
                        </div>
                        <div className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl
                            ${order.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' :
                                order.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50' :
                                    'bg-red-500/20 text-red-300 border-red-500/50'}`}>
                            {order.status}
                        </div>
                    </div>
                </motion.div>

                {/* Notes */}
                {order.notes && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg"
                    >
                        <h2 className="text-xl font-bold text-white mb-4">Notes</h2>
                        <p className="text-gray-300 text-sm leading-relaxed">{order.notes}</p>
                    </motion.div>
                )}
            </div>

            {/* RIGHT COLUMN: Actions */}
            <aside className="lg:col-start-2">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4 }}
                    className="sticky top-24 space-y-3"
                >
                    <button
                        className="w-full bg-white/10 backdrop-blur-xl hover:bg-white/20 border border-white/20 hover:border-white/30 text-white font-semibold py-3 px-6 rounded-lg transition-all shadow-lg"
                        onClick={() => navigate(`/admin?section=orders&orderId=${order.id}&edit=true`)}
                    >
                        Edit Order
                    </button>
                    <button
                        className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl"
                        onClick={() => alert('Cancel order action')}
                    >
                        Cancel Order
                    </button>
                </motion.div>
            </aside>
        </motion.div>
    );
};

// Placeholder views for other sections
const CarsView: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-8 shadow-lg"
    >
        <h1 className="text-2xl font-bold text-white mb-4">Cars Management</h1>
        <p className="text-gray-300">Cars management coming soon...</p>
    </motion.div>
);

const CalendarView: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <CalendarPage />
    </motion.div>
);

const UsersView: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <Users />
    </motion.div>
);

const SettingsView: React.FC = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <Settings />
    </motion.div>
);

export const Admin: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const section = searchParams.get('section') || 'dashboard';
    const orderId = searchParams.get('orderId');

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'cars', label: 'Cars', icon: Car },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        { id: 'users', label: 'Users', icon: UsersIcon },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
    ];

    const handleSectionChange = (sectionId: string) => {
        setSearchParams({ section: sectionId });
    };

    const handleLogout = () => {
        // Add logout logic here
        navigate('/');
    };

    const handleBackToSite = () => {
        navigate('/');
    };

    const getPageTitle = () => {
        if (orderId) return `Order #${orderId}`;
        const item = menuItems.find(m => m.id === section);
        return item?.label || 'Dashboard';
    };

    const getPageDescription = () => {
        if (orderId) return 'View and manage order details';
        switch (section) {
            case 'dashboard':
                return 'Welcome back! Here\'s what\'s happening today.';
            case 'orders':
                return 'Manage all rental orders and bookings';
            case 'cars':
                return 'Manage your vehicle fleet';
            case 'calendar':
                return 'View and manage bookings calendar';
            case 'users':
                return 'Manage user accounts and permissions';
            case 'settings':
                return 'Configure your admin preferences';
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
                return <DashboardView />;
            case 'orders':
                return <OrdersView />;
            case 'cars':
                return <CarsView />;
            case 'calendar':
                return <CalendarView />;
            case 'users':
                return <UsersView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <DashboardView />;
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
                                <div>
                                    <h1 className="text-lg font-bold text-white">Admin Panel</h1>
                                    <p className="text-xs text-gray-300">Level Auto Rental</p>
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
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSectionChange(item.id)}
                                            className={`flex-shrink-0 lg:w-full flex flex-col lg:flex-row items-center justify-center lg:justify-start space-y-1 lg:space-y-0 lg:space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                                                ? 'bg-red-500/20 text-white border border-red-500/50'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                                }`}
                                        >
                                            <Icon className={`h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-red-400' : 'text-gray-400 group-hover:text-white'}`} />
                                            <span className="text-xs lg:text-sm">{item.label}</span>
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
                        <div className="px-4 lg:px-8 py-6 lg:py-8 border-b border-white/20 bg-white/10 backdrop-blur-xl">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">
                                        {getPageTitle()}
                                    </h1>
                                    <p className="text-gray-300 text-sm lg:text-base">
                                        {getPageDescription()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
                            <AnimatePresence>
                                <motion.div
                                    key={section}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {renderContent()}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

