import React, { useEffect, useState, useMemo } from 'react';
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
    Car,
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
    Car as CarIcon,
    RefreshCw,
    Download,
    Loader2,
    FileText
} from 'lucide-react';
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

    useEffect(() => {
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
        loadOrders();
    }, []);

    const order = ordersList.find((o) => o.id === orderId);
    const car = order ? cars.find(c => c.id.toString() === order.carId) : null;
    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image);

    useEffect(() => {
        if (!order || !car) {
            if (ordersList.length > 0) {
            navigate('/admin?section=orders');
            }
        } else {
            setSelectedImage(car.image);
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
            const matchesSearch = car.name.toLowerCase().includes(searchQuery.toLowerCase());
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
                image: carData.image || '',
                photoGallery: carData.photoGallery || [],
                pricePerDay: carData.pricePerDay || 0,
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
                                                        src={car.image}
                                                        alt={car.name}
                                                        className="w-12 h-12 object-cover rounded-md border border-white/10"
                                                    />
                                                    <div>
                                                        <p className="text-white font-semibold">{car.name}</p>
                                                        <p className="text-gray-400 text-xs">{car.body} · {car.seats} seats</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-semibold bg-white/10 text-gray-300 rounded capitalize">
                                                    {car.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-white font-semibold">{car.pricePerDay} MDL</td>
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
                photoGallery: [...(prev.photoGallery || []), objectUrl]
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
                photoGallery: [...(prev.photoGallery || []), newGalleryImage.trim()]
            }));
            setNewGalleryImage('');
        }
    };

    const removeGalleryImage = (index: number) => {
        setFormData(prev => ({
            ...prev,
            photoGallery: prev.photoGallery?.filter((_, i) => i !== index) || []
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
                                value={formData.name || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                            {formData.photoGallery?.map((url, index) => (
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
                                <CarIcon className="w-5 h-5" />
                                Basic Information
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">Car Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                                {formData.image && (
                                    <img src={formData.image} alt="Preview" className="mt-2 w-32 h-20 object-cover rounded-lg border border-white/10" />
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

const CalendarView: React.FC = () => (
    <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <CalendarPage viewMode='admin' />
    </motion.div>
);

const UsersView: React.FC = () => (
    <motion.div
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
    >
        <Users />
    </motion.div>
);

const SettingsView: React.FC = () => (
    <motion.div
        initial={{ opacity: 1 }}
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
    const carId = searchParams.get('carId');
    const { signOut } = useAuth();
    const { i18n, t } = useTranslation();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

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

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'cars', label: 'Cars', icon: Car },
        { id: 'calendar', label: 'Calendar', icon: CalendarDays },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'users', label: 'Users', icon: UsersIcon },
        { id: 'settings', label: 'Settings', icon: SettingsIcon },
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
        if (carId && section === 'cars') {
            const car = cars.find(c => c.id.toString() === carId);
            return car ? car.name : 'Edit Car';
        }
        const item = menuItems.find(m => m.id === section);
        return item?.label || 'Dashboard';
    };

    const getPageDescription = () => {
        if (orderId) return 'View and manage order details';
        if (carId && section === 'cars') {
            return 'Modify car details and settings';
        }
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
                return <DashboardView key={refreshKey} />;
            case 'orders':
                return <OrdersView key={refreshKey} />;
            case 'cars':
                return <CarsView key={refreshKey} />;
            case 'calendar':
                return <CalendarView key={refreshKey} />;
            case 'users':
                return <UsersView key={refreshKey} />;
            case 'settings':
                return <SettingsView key={refreshKey} />;
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
                                    {/* Mobile Refresh and Language Selector */}
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
                                        {/* Mobile Language Selector */}
                                        <div className="relative language-dropdown-container">
                                        <button
                                            onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                        >
                                            <span
                                                className={`fi ${currentLanguage === 'en'
                                                    ? 'fi-gb'
                                                    : currentLanguage === 'ru'
                                                        ? 'fi-ru'
                                                        : 'fi-ro'
                                                    } w-5 h-4 rounded-sm`}
                                            ></span>
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        <AnimatePresence>
                                            {showLanguageDropdown && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                                    className="absolute top-full right-0 mt-2 border border-white/20 rounded-lg shadow-lg z-[9999] min-w-[140px]"
                                                    style={{ backgroundColor: '#1F1F20' }}
                                                >
                                                    {LANGUAGES.map(({ code, iconClass }) => (
                                                        <button
                                                            key={code}
                                                            onClick={() => {
                                                                i18n.changeLanguage(code);
                                                                setCurrentLanguage(code);
                                                                setShowLanguageDropdown(false);
                                                                localStorage.setItem("selectedLanguage", code);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                                                        >
                                                            <span className={iconClass}></span>
                                                            <span>{t(`languages.${code}`)}</span>
                                                        </button>
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        </div>
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
                                    {/* Desktop Language Selector */}
                                    <div className="hidden lg:block relative language-dropdown-container z-[100]">
                                    <button
                                        onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
                                        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                    >
                                        <span
                                            className={`fi ${currentLanguage === 'en'
                                                ? 'fi-gb'
                                                : currentLanguage === 'ru'
                                                    ? 'fi-ru'
                                                    : 'fi-ro'
                                                } w-5 h-4 rounded-sm`}
                                        ></span>
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    <AnimatePresence>
                                        {showLanguageDropdown && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="absolute top-full right-0 mt-2 border border-white/20 rounded-lg shadow-lg z-[9999] min-w-[160px]"
                                                style={{ zIndex: 9999, backgroundColor: '#1F1F20' }}
                                            >
                                                {LANGUAGES.map(({ code, iconClass }) => (
                                                    <button
                                                        key={code}
                                                        onClick={() => {
                                                            i18n.changeLanguage(code);
                                                            setCurrentLanguage(code);
                                                            setShowLanguageDropdown(false);
                                                            localStorage.setItem("selectedLanguage", code);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white hover:bg-white/20 transition-colors"
                                                    >
                                                        <span className={iconClass}></span>
                                                        <span>{t(`languages.${code}`)}</span>
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    </div>
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
        </>
    );
};

