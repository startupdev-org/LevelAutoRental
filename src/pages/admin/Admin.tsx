import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { sparkData, mainChart, orders } from '../../data/index';
import { fetchCars, fetchCarById, createCar, updateCar, deleteCar } from '../../lib/cars';
import { fetchImagesByCarName } from '../../lib/db/cars/cars';
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
    Edit,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    X as XIcon,
    HelpCircle
} from 'lucide-react';
import { LiaCarSideSolid } from 'react-icons/lia';
import { getDateDiffInDays } from '../../utils/date';
import Settings from '../dashboard/settings/AdminSettings';
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
    createBorrowRequest,
    processStatusTransitions,
    cancelRentalOrder,
    redoRentalOrder,
    fetchAllOrders
} from '../../lib/orders';
import { NotificationToaster, useNotification } from '../../components/ui/NotificationToaster';
import { supabaseAdmin } from '../../lib/supabase';
import { OrderDetailsModal } from '../../components/modals/OrderDetailsModal';

// Dashboard View Component
const DashboardView: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { showSuccess, showError } = useNotification();
    const [cars, setCars] = useState<CarType[]>([]);
    const [orders, setOrders] = useState<OrderDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<OrderDisplay | null>(null);
    const [processingOrder, setProcessingOrder] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const fetchedCars = await fetchCars();
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
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
                
                // Load orders after cars are loaded
                if (carsWithImages.length > 0) {
                    const fetchedOrders = await fetchAllOrders(carsWithImages);
                    setOrders(fetchedOrders);
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Calculate car rental status (based on database status field)
    const getCarRentalStatus = () => {
        // Log all car statuses for debugging
        console.log('[Dashboard] Car statuses:', cars.map(car => ({
            id: car.id,
            name: (car as any).name || `${car.make} ${car.model}`,
            status: car.status,
            statusLower: car.status?.toLowerCase()
        })));

        const freeCars = cars.filter(car => {
            // Normalize status: handle null, empty string, and different cases
            const rawStatus = car.status?.trim() || '';
            const carStatus = rawStatus.toLowerCase();
            
            // Consider available if status is null, empty, 'available', or not explicitly 'booked'/'borrowed'/'maintenance'
            return carStatus === '' || carStatus === 'available' || 
                   (carStatus !== 'booked' && carStatus !== 'borrowed' && carStatus !== 'maintenance' && carStatus !== 'deleted');
        });
        
        const rentedCars = cars.filter(car => {
            const rawStatus = car.status?.trim() || '';
            const carStatus = rawStatus.toLowerCase();
            // Handle both 'booked' and 'borrowed' as rented status
            return carStatus === 'booked' || carStatus === 'borrowed';
        });

        console.log(`[Dashboard] Free cars: ${freeCars.length}, Rented cars: ${rentedCars.length}`);

        return { freeCars, rentedCars };
    };

    const { freeCars, rentedCars } = getCarRentalStatus();

    // Calculate chart data from orders based on time period
    const calculateChartData = useMemo(() => {
        // Filter only rental orders (completed or active) for sales calculation
        const rentalOrders = orders.filter(order => 
            order.type === 'rental' && 
            (order.status === 'ACTIVE' || order.status === 'COMPLETED')
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
                    const amount = order.amount || parseFloat(order.total_amount) || 0;
                    return sum + amount;
                }, 0);
                
                // Baseline is 70% of average sales for visual reference
                const avgSales = rentalOrders.length > 0 
                    ? (rentalOrders.reduce((sum, o) => sum + (o.amount || parseFloat(o.total_amount) || 0), 0) / rentalOrders.length) * 0.7
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

    // Calculate statistics from orders
    const calculateStats = useMemo(() => {
        // Filter only rental orders (completed or active) for sales calculation
        const rentalOrders = orders.filter(order => 
            order.type === 'rental' && 
            (order.status === 'ACTIVE' || order.status === 'COMPLETED')
        );
        
        // Total sales: sum of all rental amounts
        const totalSales = rentalOrders.reduce((sum, order) => {
            const amount = order.amount || parseFloat(order.total_amount) || 0;
            return sum + amount;
        }, 0);
        
        // Total orders: count of rental orders only (not requests)
        const totalOrders = rentalOrders.length;
        
        // Average order price: total sales / number of rental orders
        const avgOrderPrice = rentalOrders.length > 0 
            ? totalSales / rentalOrders.length 
            : 0;
        
        // Format numbers with thousand separators
        const formatNumber = (num: number, decimals: number = 2) => {
            return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        };
        
        return {
            totalSales,
            totalOrders,
            avgOrderPrice,
            formattedTotalSales: formatNumber(totalSales),
            formattedAvgOrderPrice: formatNumber(avgOrderPrice)
        };
    }, [orders]);

    // Calculate sales and change for a specific period
    const calculatePeriodStats = useMemo(() => {
        const rentalOrders = orders.filter(order => 
            order.type === 'rental' && 
            (order.status === 'ACTIVE' || order.status === 'COMPLETED')
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

            const currentPeriodOrders = rentalOrders.filter(order => {
                if (!order.createdAt) return false;
                const orderDate = new Date(order.createdAt);
                return orderDate >= periodStart && orderDate <= now;
            });

            const previousPeriodOrders = rentalOrders.filter(order => {
                if (!order.createdAt) return false;
                const orderDate = new Date(order.createdAt);
                return orderDate >= previousPeriodStart && orderDate < previousPeriodEnd;
            });

            const currentSales = currentPeriodOrders.reduce((sum, order) => {
                const amount = order.amount || parseFloat(order.total_amount) || 0;
                return sum + amount;
            }, 0);

            const previousSales = previousPeriodOrders.reduce((sum, order) => {
                const amount = order.amount || parseFloat(order.total_amount) || 0;
                return sum + amount;
            }, 0);

            const change = previousSales > 0 
                ? ((currentSales - previousSales) / previousSales) * 100 
                : (currentSales > 0 ? 100 : 0);

            return {
                sales: currentSales,
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

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64"
            >
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </motion.div>
        );
    }

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
                    title={t('admin.dashboard.totalSales')}
                    value={`${calculateStats.formattedTotalSales} MDL`}
                    trend="up"
                    trendValue="2.4%"
                    valueSize="md"
                    spark={(
                        // @ts-ignore - recharts type compatibility issue
                        <ResponsiveContainer width="100%" height={36}>
                            {/* @ts-ignore */}
                            <LineChart data={sparkData}>
                                {/* @ts-ignore */}
                                <Line dataKey="y" stroke="#EF4444" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                />
                <CardStats
                    title={t('admin.dashboard.totalOrders')}
                    value={calculateStats.totalOrders}
                    trend="up"
                    trendValue="8.6%"
                    valueSize="md"
                    spark={(
                        // @ts-ignore - recharts type compatibility issue
                        <ResponsiveContainer width="100%" height={36}>
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
                        title={t('admin.dashboard.avgOrderValue')}
                        value={`${calculateStats.formattedAvgOrderPrice} MDL`}
                        trend="up"
                        trendValue="6.0%"
                        valueSize="md"
                        spark={(
                            // @ts-ignore - recharts type compatibility issue
                            <ResponsiveContainer width="100%" height={36}>
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
                    title={t('admin.dashboard.fleetStatus')}
                    value={`${freeCars.length}/${cars.length}`}
                    valueSize="md"
                    subtitle={
                        <div className="flex items-center gap-3 text-xs">
                            <span className="text-emerald-400">{freeCars.length} {t('admin.dashboard.available')}</span>
                            <span className="text-red-400">{rentedCars.length} {t('admin.dashboard.rented')}</span>
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
                    <h3 className="text-lg font-semibold text-white">{t('admin.dashboard.fleetStatus')}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-300">
                        <span><span className="font-semibold text-emerald-400">{freeCars.length}</span> {t('admin.dashboard.available')}</span>
                        <span className="text-gray-500">•</span>
                        <span><span className="font-semibold text-red-400">{rentedCars.length}</span> {t('admin.dashboard.rented')}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
                    {/* Free Cars */}
                    <div>
                        <h4 className="text-sm font-semibold text-white mb-3">{t('admin.dashboard.available')}</h4>
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
                                        <button 
                                            onClick={() => {
                                                navigate(`/admin?section=requests&carId=${car.id}`);
                                            }}
                                            className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300 text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                                        >
                                            {t('admin.dashboard.book')}
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
                        <h4 className="text-sm font-semibold text-white mb-3">{t('admin.dashboard.rented')}</h4>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {rentedCars.length > 0 ? (
                                rentedCars.map((car) => {
                                    const carOrder = orders.find(order =>
                                        parseInt(order.carId) === car.id &&
                                        (order.status === 'ACTIVE' || order.type === 'rental')
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
                                                    {carOrder?.returnDate ? (() => {
                                                        try {
                                                            const returnDate = new Date(carOrder.returnDate);
                                                            // Extract time from ISO string if returnTime is not available
                                                            let returnTime = carOrder.returnTime;
                                                            if (!returnTime && carOrder.returnDate.includes('T')) {
                                                                const timeMatch = carOrder.returnDate.match(/T(\d{2}:\d{2})/);
                                                                if (timeMatch) {
                                                                    returnTime = timeMatch[1];
                                                                }
                                                            }
                                                            returnTime = returnTime || '17:00';
                                                            
                                                            // Format date in Romanian format (e.g., "19 nov. 2025")
                                                            const formattedDate = returnDate.toLocaleDateString('ro-RO', { 
                                                                day: 'numeric', 
                                                                month: 'short', 
                                                                year: 'numeric' 
                                                            });
                                                            
                                                            // Format time (HH:MM)
                                                            const formattedTime = returnTime.includes(':') 
                                                                ? returnTime.split(':').slice(0, 2).join(':')
                                                                : returnTime;
                                                            
                                                            return `${t('admin.dashboard.until')} ${formattedDate}, ${formattedTime}`;
                                                        } catch (e) {
                                                            return `${t('admin.dashboard.until')} ${carOrder.returnDate}`;
                                                        }
                                                    })() : t('admin.dashboard.rented')}
                                                </p>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    if (carOrder) {
                                                        setSelectedOrder(carOrder);
                                                        setShowOrderDetailsModal(true);
                                                    }
                                                }}
                                                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold rounded-lg transition-all flex-shrink-0"
                                            >
                                                {t('admin.dashboard.view')}
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
                    <SalesChartCard 
                        allPeriodData={calculateChartData}
                        periodStats={calculatePeriodStats}
                    />
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
                            <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">{t('admin.dashboard.topPerformers')}</p>
                            <h3 className="text-3xl md:text-4xl font-bold text-white">{t('admin.dashboard.mostRented')}</h3>
                        </div>

                        <div className="space-y-4">
                            {(() => {
                                // Calculate rental counts and revenue per car
                                const carStats = cars.map(car => {
                                    const carOrders = orders.filter(order =>
                                        parseInt(order.carId) === car.id &&
                                        order.type === 'rental' &&
                                        (order.status === 'ACTIVE' || order.status === 'COMPLETED')
                                    );
                                    const revenue = carOrders.reduce((sum, order) => {
                                        const amount = order.amount || parseFloat(order.total_amount || '0');
                                        return sum + (typeof amount === 'number' ? amount : 0);
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
                                                    <p className="text-xs text-gray-400">{car.rentals} {car.rentals > 1 ? t('admin.dashboard.rentals') : t('admin.dashboard.rental')}</p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-bold text-white">{car.revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} MDL</span>
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

            {/* Order Details Modal */}
            <OrderDetailsModal
                isOpen={showOrderDetailsModal}
                onClose={() => {
                    setShowOrderDetailsModal(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
                orderNumber={selectedOrder?.id ? (typeof selectedOrder.id === 'number' ? selectedOrder.id : parseInt(selectedOrder.id.toString(), 10)) : undefined}
                onCancel={async (order) => {
                    if (!window.confirm(t('admin.orders.confirmCancelOrder'))) {
                        return;
                    }
                    setProcessingOrder(order.id.toString());
                    try {
                        const result = await cancelRentalOrder(order.id.toString());
                        if (result.success) {
                            showSuccess(t('admin.orders.orderCancelled'));
                            // Reload orders to update the dashboard
                            const fetchedOrders = await fetchAllOrders(cars);
                            setOrders(fetchedOrders);
                            setShowOrderDetailsModal(false);
                            setSelectedOrder(null);
                        } else {
                            showError(`${t('admin.orders.orderCancelFailed')} ${result.error}`);
                        }
                    } catch (error) {
                        console.error('Error cancelling order:', error);
                        showError(t('admin.orders.orderCancelErrorOccurred'));
                    } finally {
                        setProcessingOrder(null);
                    }
                }}
                onRedo={async (order) => {
                    if (!window.confirm(t('admin.orders.confirmRestoreOrder'))) {
                        return;
                    }
                    setProcessingOrder(order.id.toString());
                    try {
                        const result = await redoRentalOrder(order.id.toString());
                        if (result.success) {
                            showSuccess(t('admin.orders.orderRestored'));
                            // Reload orders to update the dashboard
                            const fetchedOrders = await fetchAllOrders(cars);
                            setOrders(fetchedOrders);
                            setShowOrderDetailsModal(false);
                            setSelectedOrder(null);
                        } else {
                            showError(`${t('admin.orders.orderRestoreFailed')} ${result.error}`);
                        }
                    } catch (error) {
                        console.error('Error restoring order:', error);
                        showError(t('admin.orders.orderRestoreErrorOccurred'));
                    } finally {
                        setProcessingOrder(null);
                    }
                }}
                isProcessing={processingOrder === selectedOrder?.id.toString()}
                cars={cars}
            />
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
    const { t } = useTranslation();
    const [ordersList, setOrdersList] = useState<OrderDisplay[]>([]);
    const [isGeneratingContract, setIsGeneratingContract] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cars, setCars] = useState<CarType[]>([]);

    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
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
            }
        };
        loadCars();
    }, []);

    const loadOrders = async () => {
        if (cars.length === 0) return;
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
        if (cars.length > 0) {
            loadOrders();
        }
    }, [cars]);

    const handleCancelOrder = async () => {
        const order = ordersList.find((o) => o.id === orderId);
        if (!order) return;
        if (!window.confirm(t('admin.orders.confirmCancelOrder'))) {
            return;
        }

        setIsProcessing(true);
        try {
            const result = await cancelRentalOrder(order.id.toString());
            if (result.success) {
                alert(t('admin.orders.orderCancelled'));
                await loadOrders();
                // Navigate back to orders list
                navigate('/admin?section=orders');
            } else {
                alert(`${t('admin.orders.orderCancelFailed')} ${result.error}`);
            }
        } catch (error) {
            console.error('Error cancelling order:', error);
            alert(t('admin.orders.orderCancelErrorOccurred'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRedoOrder = async () => {
        const order = ordersList.find((o) => o.id === orderId);
        if (!order) return;
        if (!window.confirm(t('admin.orders.confirmRestoreOrder'))) {
            return;
        }

        setIsProcessing(true);
        try {
            const result = await redoRentalOrder(order.id.toString());
            if (result.success) {
                alert(t('admin.orders.orderRestored'));
                await loadOrders();
            } else {
                alert(`${t('admin.orders.orderRestoreFailed')} ${result.error}`);
            }
        } catch (error) {
            console.error('Error restoring order:', error);
            alert(t('admin.orders.orderRestoreErrorOccurred'));
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
            alert(t('admin.orders.contractNotFound'));
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
            alert(`${t('admin.orders.contractGenerationFailed')}: ${errorMessage}\n\n${t('admin.orders.contractGenerationErrorDetails')}`);
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
                    <h2 className="text-xl font-bold text-white">{t('admin.orders.bookingInfo')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-white/5 rounded-lg p-3 border border-white/10">
                            <Calendar className="w-5 h-5 text-gray-300 flex-shrink-0" />
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wide">Pickup</p>
                                <span className="text-white text-sm font-medium">{new Date(order.pickupDate).toLocaleDateString()}</span>
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
                                <span className="text-white text-sm font-medium">{new Date(order.returnDate).toLocaleDateString()}</span>
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
                            <span className="text-white text-lg font-bold">{(order.amount ?? 0) > 0 ? `${order.amount} MDL` : `${getDateDiffInDays(order.pickupDate, order.returnDate) * car.price_per_day} MDL`}</span>
                        </div>
                    </div>

                    {car.features && Array.isArray(car.features) && car.features.length > 0 && (
                        <>
                            <div className="border-t border-white/10 pt-6">
                                <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.additionalFeatures')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {(car.features as string[] || []).map((feature, i) => (
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
                    <h2 className="text-xl font-bold text-white mb-4">{t('admin.orders.payment')}</h2>
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
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const carId = searchParams.get('carId');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'price' | 'year' | 'status' | null>(null);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCar, setEditingCar] = useState<CarType | null>(null);
    const [localCars, setLocalCars] = useState<CarType[]>([]);
    const [loading, setLoading] = useState(true);
    const { showSuccess, showError } = useNotification();

    // Fetch cars from Supabase and load images from storage
    useEffect(() => {
        const loadCars = async () => {
            try {
                setLoading(true);
                const fetchedCars = await fetchCars();
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
                        // Try name field first, then fall back to make + model
                        let carName = (car as any).name;
                        if (!carName || carName.trim() === '') {
                            carName = `${car.make} ${car.model}`;
                        }
                        console.log(`[Admin] Loading images for car: "${carName}" (make: "${car.make}", model: "${car.model}")`);
                        const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                        return {
                            ...car,
                            image_url: mainImage || car.image_url,
                            photo_gallery: photoGallery.length > 0 ? photoGallery : car.photo_gallery,
                        };
                    })
                );
                setLocalCars(carsWithImages);
            } catch (error) {
                console.error('Error loading cars:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCars();
    }, []);

    // Get car status for sorting (based on database status field)
    const getCarStatus = (car: CarType): number => {
        // Normalize status: handle null, empty string, and different cases
        const rawStatus = car.status?.trim() || '';
        const carStatus = rawStatus.toLowerCase();
        // 0 = Available, 1 = Maintenance, 2 = Booked/Borrowed (lower number = higher priority)
        if (carStatus === 'booked' || carStatus === 'borrowed') return 2;
        if (carStatus === 'maintenance') return 1;
        return 0; // Default to available for null/empty/unknown statuses
    };

    // Filter and sort cars
    const filteredCars = useMemo(() => {
        let filtered = localCars.filter(car => {
            // Hide cars with deleted status
            const rawStatus = car.status?.trim() || '';
            const carStatus = rawStatus.toLowerCase();
            if (carStatus === 'deleted') return false;

            const carName = (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || '';
            const matchesSearch = carName.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesCategory = filterCategory === 'all' || car.category === filterCategory;
            return matchesSearch && matchesCategory;
        });

        // Sort based on selected field
        filtered.sort((a, b) => {
            if (sortBy === 'price') {
                // Sort by price only
                const diff = a.price_per_day - b.price_per_day;
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

    const handleDeleteCar = async (carId: number) => {
        if (window.confirm(t('admin.cars.confirmDeleteCar'))) {
            try {
                // Soft delete: update status to 'deleted' instead of actually deleting
                await updateCar(carId, { status: 'deleted' });
                // Reload cars to get updated list (deleted cars will be filtered out)
                const fetchedCars = await fetchCars();
                setLocalCars(fetchedCars);
                showSuccess(t('admin.cars.carDeleted'));
            } catch (error) {
                console.error('Error deleting car:', error);
                showError(t('admin.cars.carDeleteError'));
            }
        }
    };

    const handleSaveCar = async (carData: Partial<CarType>): Promise<number | void> => {
        try {
            if (editingCar) {
                // Update existing car - map form fields to database fields
                const updateData: Partial<CarType> & { name?: string } = {
                    ...carData,
                    name: (carData as any).name,
                    image_url: (carData as any).image || carData.image_url,
                    photo_gallery: (carData as any).photoGallery || carData.photo_gallery,
                    price_per_day: (carData as any).pricePerDay || carData.price_per_day,
                    discount_percentage: (carData as any).discountPercentage !== undefined ? (carData as any).discountPercentage : carData.discount_percentage,
                    fuel_type: (carData as any).fuelType || carData.fuel_type,
                };
                const updatedCar = await updateCar(editingCar.id, updateData as Partial<CarType>);
                if (updatedCar) {
                    setLocalCars(prev => prev.map(c => c.id === editingCar.id ? updatedCar : c));
                    setShowAddModal(false);
                    setEditingCar(null);
                    // Success notification will be shown by the component
                }
            } else {
                // Add new car - map form fields to database fields
                // Ensure make and model are provided (required fields)
                const make = (carData as any).make || (carData as any).name?.split(' ')[0] || '';
                const model = (carData as any).model || (carData as any).name?.split(' ').slice(1).join(' ') || '';

                if (!make || !model) {
                    throw new Error('Make and Model are required fields');
                }

                const newCar = await createCar({
                    ...carData,
                    name: (carData as any).name,
                    make: make,
                    model: model,
                    image_url: (carData as any).image || carData.image_url,
                    photo_gallery: (carData as any).photoGallery || carData.photo_gallery,
                    price_per_day: (carData as any).pricePerDay || carData.price_per_day,
                    discount_percentage: (carData as any).discountPercentage !== undefined ? (carData as any).discountPercentage : carData.discount_percentage,
                    fuel_type: (carData as any).fuelType || carData.fuel_type,
                    status: 'available',
                } as Partial<CarType>);
                if (newCar) {
                    setLocalCars(prev => [...prev, newCar]);
                    // Success notification will be shown by the component
                    return newCar.id;
                }
            }
        } catch (error) {
            console.error('Error saving car:', error);
            // Error notification will be shown by the component
            throw error; // Re-throw to let the component handle it
        }
    };

    // Set editingCar when carId is in URL and car is found
    useEffect(() => {
        if (carId) {
            const car = localCars.find(c => c.id.toString() === carId);
            if (car && (!editingCar || editingCar.id !== car.id)) {
                setEditingCar(car);
            }
        } else {
            // Clear editingCar when no carId in URL
            if (editingCar) {
                setEditingCar(null);
            }
        }
    }, [carId, localCars]);

    // If carId is in URL, show car details/edit view
    if (carId) {
        const car = localCars.find(c => c.id.toString() === carId);
        if (car) {
            return (
                <CarDetailsEditView
                    car={car}
                    onSave={async (carData) => {
                        try {
                            await handleSaveCar(carData);
                            // Reload cars after update
                            const fetchedCars = await fetchCars();
                            setLocalCars(fetchedCars);
                            // Navigation will be handled by onCancel in CarDetailsEditView
                        } catch (error) {
                            // Error is already handled in handleSaveCar
                        }
                    }}
                    onCancel={() => setSearchParams({ section: 'cars' })}
                />
            );
        } else if (!loading) {
            // Car not found, go back to cars list
            setSearchParams({ section: 'cars' });
        }
    }

    if (loading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-center h-64"
            >
                <Loader2 className="w-8 h-8 animate-spin text-white" />
            </motion.div>
        );
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
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">{t('admin.cars.allCars')}</h2>
                            </div>
                            <button
                                onClick={handleAddCar}
                                className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2 w-full sm:w-auto"
                            >
                                <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                {t('admin.cars.addNew')}
                            </button>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            {/* Search */}
                            <div className="w-full md:flex-1 md:max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.placeholders.searchCars')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-xs md:text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Sort Controls */}
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                <span className="hidden md:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.cars.sortBy')}</span>
                                <span className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('admin.cars.sortBy')}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleSort('price')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'price'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.cars.price')}</span>
                                        {sortBy === 'price' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'price' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('year')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'year'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.cars.year')}</span>
                                        {sortBy === 'year' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'year' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('status')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'status'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.cars.status')}</span>
                                        {sortBy === 'status' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'status' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    {sortBy && (
                                        <button
                                            onClick={() => {
                                                setSortBy(null);
                                                setSortOrder('asc');
                                            }}
                                            className="px-2.5 md:px-3 py-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors whitespace-nowrap"
                                        >
                                            {t('admin.cars.clearSort')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards / Desktop Table */}
                {filteredCars.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden p-4 space-y-4">
                            {filteredCars.map((car) => {
                                const rawStatus = car.status?.trim() || '';
                                const carStatus = rawStatus.toLowerCase() || 'available';
                                const isBooked = carStatus === 'booked' || carStatus === 'borrowed';
                                const isMaintenance = carStatus === 'maintenance';
                                const basePrice = car.price_per_day || 0;
                                const discount = car.discount_percentage || 0;
                                const finalPrice = discount > 0 
                                    ? basePrice * (1 - discount / 100)
                                    : basePrice;

                                return (
                                    <div
                                        key={car.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => handleEditCar(car)}
                                    >
                                        {/* Header: Car Image, Name and Status */}
                                        <div className="flex items-start gap-3 mb-4">
                                            <img
                                                src={(car as any).image || car.image_url || ''}
                                                alt={(car as any).name || `${car.make} ${car.model}`}
                                                className="w-16 h-16 object-cover rounded-md border border-white/10 flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-white font-semibold text-sm mb-1 truncate">{(car as any).name || `${car.make} ${car.model}`}</h3>
                                                <p className="text-gray-400 text-xs mb-2">{car.body} · {car.seats} {t('admin.cars.seats')}</p>
                                                <span
                                                    className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl ${isBooked
                                                        ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                                        : isMaintenance
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                        }`}
                                                >
                                                    {(carStatus === 'booked' || carStatus === 'borrowed') ? t('admin.cars.statusBooked') : carStatus === 'maintenance' ? t('admin.cars.statusMaintenance') : t('admin.cars.statusAvailable')}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-white/10">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.cars.category')}</p>
                                                <p className="text-white text-sm font-medium capitalize">{car.category}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.cars.year')}</p>
                                                <p className="text-white text-sm font-medium">{car.year}</p>
                                            </div>
                                        </div>

                                        {/* Price and Actions */}
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.cars.pricePerDay')}</p>
                                                {discount > 0 ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-semibold text-sm">{finalPrice.toFixed(2)} MDL</span>
                                                        <span className="text-gray-400 text-xs line-through">{basePrice} MDL</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-white font-semibold text-sm">{basePrice} MDL</span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => handleEditCar(car)}
                                                    className="p-2 text-white hover:text-gray-300 transition-colors"
                                                    title={t('admin.common.edit')}
                                                >
                                                    {/* @ts-ignore - react-icons type compatibility */}
                                                    <LuPencil className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCar(car.id)}
                                                    className="p-2 text-red-300 hover:text-red-200 transition-colors"
                                                    title={t('admin.common.delete')}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.car')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.cars.category')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            <button
                                                onClick={() => handleSort('price')}
                                                className="flex items-center gap-1.5 hover:text-white transition-colors"
                                            >
                                                {t('admin.cars.pricePerDay')}
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
                                                {t('admin.cars.year')}
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
                                                {t('admin.cars.status')}
                                                {sortBy === 'status' ? (
                                                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                                                ) : (
                                                    <ArrowUpDown className="w-3 h-3 opacity-50" />
                                                )}
                                            </button>
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.cars.actions')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredCars.map((car) => {
                                        const rawStatus = car.status?.trim() || '';
                                        const carStatus = rawStatus.toLowerCase() || 'available';
                                        const isBooked = carStatus === 'booked' || carStatus === 'borrowed';
                                        const isMaintenance = carStatus === 'maintenance';
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
                                                            <p className="text-gray-400 text-xs">{car.body} · {car.seats} {t('admin.cars.seats')}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 text-xs font-semibold bg-white/10 text-gray-300 rounded capitalize">
                                                        {car.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {(() => {
                                                        const basePrice = car.price_per_day || 0;
                                                        const discount = car.discount_percentage || 0;
                                                        const finalPrice = discount > 0 
                                                            ? basePrice * (1 - discount / 100)
                                                            : basePrice;
                                                        
                                                        return (
                                                            <div className="flex flex-col">
                                                                {discount > 0 ? (
                                                                    <>
                                                                        <span className="text-white font-semibold">{finalPrice.toFixed(2)} MDL</span>
                                                                        <span className="text-gray-400 text-xs line-through">{basePrice} MDL</span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-white font-semibold">{basePrice} MDL</span>
                                                                )}
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">{car.year}</td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-xl ${isBooked
                                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                                            : isMaintenance
                                                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                            }`}
                                                    >
                                                        {(carStatus === 'booked' || carStatus === 'borrowed') ? t('admin.cars.statusBooked') : carStatus === 'maintenance' ? t('admin.cars.statusMaintenance') : t('admin.cars.statusAvailable')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleEditCar(car)}
                                                            className="p-2 text-white hover:text-gray-300 transition-colors"
                                                            title={t('admin.common.edit')}
                                                        >
                                                            {/* @ts-ignore - react-icons type compatibility */}
                                                            <LuPencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteCar(car.id)}
                                                            className="p-2 text-red-300 hover:text-red-200 transition-colors"
                                                            title={t('admin.common.delete')}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {searchQuery || filterCategory !== 'all' ? t('admin.cars.noCars') : t('admin.cars.noCars')}
                    </div>
                )}
            </div>

            {/* Add/Edit Car Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <CarFormModal
                        car={editingCar}
                        onSave={async (carData) => {
                            try {
                                const result = await handleSaveCar(carData);
                                // Reload cars after save
                                const fetchedCars = await fetchCars();
                                setLocalCars(fetchedCars);
                                return result;
                            } catch (error) {
                                throw error;
                            }
                        }}
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
    onSave: (carData: Partial<CarType>) => Promise<void>;
    onCancel: () => void;
}

const CarDetailsEditView: React.FC<CarDetailsEditViewProps> = ({ car, onSave, onCancel }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<CarType>>(car);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useNotification();
    const [newFeature, setNewFeature] = useState('');
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [uploadingGalleryImage, setUploadingGalleryImage] = useState(false);
    const [showImageGallery, setShowImageGallery] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    // Fetch fresh car data when component mounts
    useEffect(() => {
        const loadCar = async () => {
            try {
                const fetchedCar = await fetchCarById(car.id);
                if (fetchedCar) {
                    // Fetch images from storage
                    const carName = (fetchedCar as any).name || `${fetchedCar.make} ${fetchedCar.model}`;
                    const { mainImage, photoGallery } = await fetchImagesByCarName(carName);
                    
                    // Ensure name field is included
                    setFormData({
                        ...fetchedCar,
                        name: fetchedCar.name || '',
                        discountPercentage: fetchedCar.discount_percentage,
                        discount_percentage: fetchedCar.discount_percentage,
                        image_url: mainImage || fetchedCar.image_url,
                        photo_gallery: photoGallery.length > 0 ? photoGallery : fetchedCar.photo_gallery,
                    } as any);
                }
            } catch (error) {
                console.error('Error loading car:', error);
            }
        };
        loadCar();
    }, [car.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Map form data to database fields
            const carDataToSave: Partial<CarType> & { name?: string } = {
                ...formData,
                name: (formData as any).name,
                image_url: (formData as any).image || formData.image_url,
                photo_gallery: (formData as any).photoGallery || formData.photo_gallery,
                price_per_day: (formData as any).pricePerDay || formData.price_per_day,
                discount_percentage: (formData as any).discountPercentage !== undefined ? (formData as any).discountPercentage : formData.discount_percentage,
                fuel_type: (formData as any).fuelType || formData.fuel_type,
            };
            await onSave(carDataToSave as Partial<CarType>);
            // Show success notification
            showSuccess(t('admin.cars.carSaved'));
            // Close the edit view after a short delay to show the notification
            setTimeout(() => {
                onCancel();
            }, 500);
        } catch (error) {
            console.error('Error saving car:', error);
            showError('Failed to save car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Helper function to create folder name from car name
    const createFolderName = (carName: string): string => {
        return carName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Helper function to extract model part from car name for file naming
    // Example: "BMW X4" → "x4", "Mercedes C43" → "c43", "Mercedes CLS 350" → "cls-350"
    const getModelPart = (carName: string): string => {
        const parts = carName.trim().split(/\s+/);
        if (parts.length < 2) return 'car';
        // Take everything after the first word (make) as the model
        const modelParts = parts.slice(1);
        return modelParts
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Function for uploading main image to Supabase storage
    const handleMainImageUpload = async (file: File) => {
        setUploadingMainImage(true);
        try {
            const carName = (formData as any).name || (car as any).name || 'car';
            const folderName = createFolderName(carName);
            const modelPart = getModelPart(carName);
            const fileName = `${modelPart}-main.jpg`;
            const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('cars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Replace if exists
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('cars')
                .getPublicUrl(filePath);

            // Update form data with the public URL
            setFormData(prev => ({
                ...prev,
                image: publicUrl,
                image_url: publicUrl
            }));

            showSuccess(t('admin.cars.imageUploaded'));
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(t('admin.cars.imageUploadError'));
        } finally {
            setUploadingMainImage(false);
        }
    };

    // Function for uploading gallery image to Supabase storage
    const handleGalleryImageUpload = async (file: File) => {
        setUploadingGalleryImage(true);
        try {
            const carName = (formData as any).name || (car as any).name || 'car';
            const folderName = createFolderName(carName);
            const modelPart = getModelPart(carName);
            
            // Get existing gallery images to determine next number
            const currentGallery = (formData as any).photoGallery || formData.photo_gallery || [];
            // Try to find the highest number in existing gallery images
            let nextNumber = 2; // Start from 2 (1 would be the main image)
            if (currentGallery.length > 0) {
                const numbers = currentGallery
                    .map((url: string) => {
                        const match = url.match(/-(\d+)\.(jpg|jpeg|png)/i);
                        return match ? parseInt(match[1], 10) : 0;
                    })
                    .filter((n: number) => n > 0);
                if (numbers.length > 0) {
                    nextNumber = Math.max(...numbers) + 1;
                }
            }
            
            const fileName = `${modelPart}-${nextNumber}.jpg`;
            const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('cars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('cars')
                .getPublicUrl(filePath);

            // Update form data with the public URL (reuse currentGallery from above)
            setFormData(prev => ({
                ...prev,
                photoGallery: [...currentGallery, publicUrl],
                photo_gallery: [...currentGallery, publicUrl]
            }));

            showSuccess(t('admin.cars.galleryImageUploaded'));
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(t('admin.cars.imageUploadError'));
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
                        <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.basicInfo')}</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.carName')}</label>
                            <input
                                type="text"
                                value={(formData as any).name || (car as any).name || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    name: e.target.value
                                } as any))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.year')}</label>
                                <input
                                    type="number"
                                    value={formData.year || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.seats')}</label>
                                <input
                                    type="number"
                                    value={formData.seats || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.category')}</label>
                            <select
                                value={formData.category || 'luxury'}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CarType['category'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="suv">{t('admin.cars.categorySuv')}</option>
                                <option value="sports">{t('admin.cars.categorySports')}</option>
                                <option value="luxury">{t('admin.cars.categoryLuxury')}</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.pricePerDay')}</label>
                            <input
                                type="number"
                                value={(formData as any).pricePerDay || formData.price_per_day || ''}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    pricePerDay: parseFloat(e.target.value),
                                    price_per_day: parseFloat(e.target.value)
                                }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.discountPercentage')}</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={(formData as any).discountPercentage !== undefined ? (formData as any).discountPercentage : (formData.discount_percentage !== undefined ? formData.discount_percentage : '')}
                                onChange={(e) => {
                                    const discountValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                    setFormData(prev => ({
                                        ...prev,
                                        discountPercentage: discountValue,
                                        discount_percentage: discountValue
                                    }));
                                }}
                                placeholder="0"
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            />
                            <p className="text-xs text-gray-400 mt-1">{t('admin.cars.discountPercentageHint')}</p>
                            {(() => {
                                // Get base price - handle both naming conventions
                                const pricePerDay = (formData as any).pricePerDay;
                                const price_per_day = formData.price_per_day;
                                const basePriceValue = pricePerDay !== undefined && pricePerDay !== null
                                    ? pricePerDay
                                    : (price_per_day !== undefined && price_per_day !== null ? price_per_day : 0);
                                const basePrice = typeof basePriceValue === 'number' ? basePriceValue : parseFloat(String(basePriceValue)) || 0;
                                
                                // Get discount - handle both naming conventions and null/undefined
                                const discountPercentage = (formData as any).discountPercentage;
                                const discount_percentage = formData.discount_percentage;
                                const discountValue = discountPercentage !== undefined && discountPercentage !== null
                                    ? discountPercentage
                                    : (discount_percentage !== undefined && discount_percentage !== null ? discount_percentage : 0);
                                const discount = typeof discountValue === 'number' ? discountValue : parseFloat(String(discountValue)) || 0;
                                
                                // Check if we have valid values
                                const hasValidPrice = !isNaN(basePrice) && basePrice > 0;
                                const hasValidDiscount = !isNaN(discount) && discount > 0 && discount <= 100;
                                
                                if (hasValidPrice && hasValidDiscount) {
                                    const discountedPrice = basePrice * (1 - discount / 100);
                                    return (
                                        <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                            <p className="text-xs text-emerald-400 font-medium">
                                                {t('admin.cars.discountedPrice')}: {discountedPrice.toFixed(2)} MDL
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>

                    {/* Specifications */}
                    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                        <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.specifications')}</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.bodyType')}</label>
                            <select
                                value={formData.body || 'Sedan'}
                                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value as CarType['body'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="Coupe">Coupe</option>
                                <option value="Sedan">Sedan</option>
                                <option value="SUV">SUV</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.transmission')}</label>
                            <select
                                value={formData.transmission || 'Automatic'}
                                onChange={(e) => setFormData(prev => ({ ...prev, transmission: e.target.value as CarType['transmission'] }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="Automatic">Automatic</option>
                                <option value="Manual">Manual</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.fuelType')}</label>
                            <select
                                value={(formData as any).fuelType || formData.fuel_type || 'gasoline'}
                                onChange={(e) => setFormData(prev => ({
                                    ...prev,
                                    fuelType: e.target.value as CarType['fuel_type'],
                                    fuel_type: e.target.value as CarType['fuel_type']
                                }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            >
                                <option value="gasoline">Gasoline</option>
                                <option value="diesel">Diesel</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="electric">Electric</option>
                                <option value="petrol">Petrol</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.drivetrain')}</label>
                            <input
                                type="text"
                                value={formData.drivetrain || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, drivetrain: e.target.value }))}
                                placeholder={t('admin.placeholders.drivetrain')}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.images')}</h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.mainImage')}</label>
                        <div>
                            <label className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('admin.cars.uploadImage')}</span>
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
                            {uploadingMainImage && (
                                <p className="text-xs text-gray-400 mb-2">{t('admin.cars.uploadingImage')}</p>
                            )}
                            {(formData.image_url || (formData as any).image) && (
                                <div className="mt-2 inline-block relative group cursor-pointer" onClick={() => {
                                    setSelectedImageIndex(0);
                                    setShowImageGallery(true);
                                }}>
                                    <img src={formData.image_url || (formData as any).image} alt="Preview" className="h-20 object-contain rounded-lg border border-white/10" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs px-2 py-1 rounded-b-lg">
                                        {t('admin.cars.mainPhoto')}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.photoGallery')}</label>
                        <div className="flex gap-2 mb-2">
                            <label className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">{t('admin.cars.uploadImage')}</span>
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
                            {uploadingGalleryImage && (
                                <p className="text-xs text-gray-400 flex items-center">{t('admin.common.uploading')}</p>
                            )}
                        </div>
                        {((formData as any).photoGallery || formData.photo_gallery || []).length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {((formData as any).photoGallery || formData.photo_gallery || []).map((url: string, index: number) => (
                                    <div key={index} className="relative group inline-block">
                                        <img
                                            src={url}
                                            alt={`${t('admin.cars.gallery')} ${index + 1}`}
                                            className="h-20 object-contain rounded-lg border border-white/10 bg-white/5 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                setSelectedImageIndex(index + 1);
                                                setShowImageGallery(true);
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeGalleryImage(index);
                                            }}
                                            className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Features */}
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-6 shadow-lg space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.features')}</h3>
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                            placeholder={t('admin.placeholders.addFeature')}
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
                    <h3 className="text-lg font-bold text-white mb-4">{t('admin.cars.statusAndRatings')}</h3>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.rating')}</label>
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="5"
                                value={formData.rating || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, rating: parseFloat(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.reviewsCount')}</label>
                            <input
                                type="number"
                                value={formData.reviews || ''}
                                onChange={(e) => setFormData(prev => ({ ...prev, reviews: parseInt(e.target.value) }))}
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                        {t('admin.cars.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                {t('admin.cars.saving')}
                            </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {t('admin.common.save')}
                                </>
                            )}
                    </button>
                </div>
            </form>

            {/* Image Gallery Modal */}
            {showImageGallery && createPortal(
                <AnimatePresence>
                    {showImageGallery && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black z-[99999] flex items-center justify-center"
                            style={{ top: 0, left: 0, right: 0, bottom: 0, position: 'fixed' }}
                            onClick={() => setShowImageGallery(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                onClick={(e) => e.stopPropagation()}
                                className="relative w-full h-full flex flex-col"
                            >
                                {/* Header Bar */}
                                <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-3">
                                    <div className="flex items-center gap-3">
                                        {(() => {
                                            const allImages = [
                                                formData.image_url || (formData as any).image,
                                                ...((formData as any).photoGallery || formData.photo_gallery || [])
                                            ].filter(Boolean);

                                            if (allImages.length <= 1) return null;

                                            return (
                                                <span className="text-white/70 text-sm font-medium">
                                                    {selectedImageIndex + 1} of {allImages.length}
                                                </span>
                                            );
                                        })()}
                                        {selectedImageIndex === 0 && (
                                            <span className="px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                                                Main Photo
                                            </span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => setShowImageGallery(false)}
                                        className="p-2 hover:bg-white/10 text-white/80 hover:text-white rounded-lg transition-colors"
                                    >
                                        <XIcon className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Main Image Display */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
                                    {(() => {
                                        const allImages = [
                                            formData.image_url || (formData as any).image,
                                            ...((formData as any).photoGallery || formData.photo_gallery || [])
                                        ].filter(Boolean);
                                        const currentImage = allImages[selectedImageIndex];

                                        return currentImage ? (
                                            <div className="w-full h-full max-w-full max-h-[75vh] flex items-center justify-center">
                                                <img
                                                    src={currentImage}
                                                    alt={`Image ${selectedImageIndex + 1}`}
                                                    className="max-w-full max-h-[75vh] object-contain rounded-xl"
                                                />
                                            </div>
                                        ) : null;
                                    })()}

                                </div>

                                {/* Photo Grid */}
                                {(() => {
                                    const allImages = [
                                        formData.image_url || (formData as any).image,
                                        ...((formData as any).photoGallery || formData.photo_gallery || [])
                                    ].filter(Boolean);

                                    if (allImages.length <= 1) return null;

                                    return (
                                        <div className="absolute bottom-0 left-0 right-0 border-t border-white/10 bg-black/40 backdrop-blur-md">
                                            <div className="px-6 py-4">
                                                <div className="grid grid-cols-6 gap-3 max-w-4xl mx-auto">
                                                    {allImages.map((url: string, index: number) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setSelectedImageIndex(index)}
                                                            className={`relative transition-all ${selectedImageIndex === index
                                                                ? 'opacity-100'
                                                                : 'opacity-50 hover:opacity-80'
                                                                }`}
                                                        >
                                                            <img
                                                                src={url}
                                                                alt={`Thumbnail ${index + 1}`}
                                                                className={`w-full h-20 object-cover rounded-lg transition-all ${selectedImageIndex === index
                                                                    ? 'border-2 border-white'
                                                                    : 'border border-white/20'
                                                                    }`}
                                                            />
                                                            {index === 0 && (
                                                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border border-white/20"></div>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

// Car Form Modal Component
interface CarFormModalProps {
    car: CarType | null;
    onSave: (carData: Partial<CarType>) => Promise<number | void>;
    onClose: () => void;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ car, onSave, onClose }) => {
    const [, setSearchParams] = useSearchParams();
    const { t } = useTranslation();
    const [formData, setFormData] = useState<Partial<CarType>>(
        car || {
            name: '',
            category: 'luxury',
            image: '',
            pricePerDay: 0,
            year: new Date().getFullYear(),
            seats: 5,
        } as any
    );
    const [uploadingMainImage, setUploadingMainImage] = useState(false);
    const [carAdded, setCarAdded] = useState(false);
    const [newCarId, setNewCarId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useNotification();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (!car) {
                // Adding new car
                const carId = await onSave(formData);
                if (typeof carId === 'number') {
                    setNewCarId(carId);
                    setCarAdded(true);
                    showSuccess(t('admin.cars.carCreated'));
                    // Don't auto-close - let user click Continue or Close
                }
            } else {
                // Editing existing car
                await onSave(formData);
                showSuccess(t('admin.cars.carUpdated'));
                setTimeout(() => {
                    onClose();
                }, 500);
            }
        } catch (error) {
            console.error('Error saving car:', error);
            showError('Failed to save car. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleContinue = () => {
        if (newCarId) {
            setSearchParams({ section: 'cars', carId: newCarId.toString() });
            onClose();
        }
    };

    // Helper function to create folder name from car name
    const createFolderName = (carName: string): string => {
        return carName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Helper function to extract model part from car name for file naming
    // Example: "BMW X4" → "x4", "Mercedes C43" → "c43", "Mercedes CLS 350" → "cls-350"
    const getModelPart = (carName: string): string => {
        const parts = carName.trim().split(/\s+/);
        if (parts.length < 2) return 'car';
        // Take everything after the first word (make) as the model
        const modelParts = parts.slice(1);
        return modelParts
            .join('-')
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    };

    // Function for uploading main image to Supabase storage
    const handleMainImageUpload = async (file: File) => {
        setUploadingMainImage(true);
        try {
            const carName = (formData as any).name || 'car';
            const folderName = createFolderName(carName);
            const modelPart = getModelPart(carName);
            const fileName = `${modelPart}-main.jpg`;
            const filePath = `${folderName}/${fileName}`;

            // Upload to Supabase storage
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                .from('cars')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: true // Replace if exists
                });

            if (uploadError) {
                throw uploadError;
            }

            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('cars')
                .getPublicUrl(filePath);

            // Update form data with the public URL
            setFormData(prev => ({
                ...prev,
                image: publicUrl,
                image_url: publicUrl
            }));

            showSuccess(t('admin.cars.imageUploaded'));
        } catch (error) {
            console.error('Error uploading image:', error);
            showError(t('admin.cars.imageUploadError'));
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
                        <h2 className="text-2xl font-bold text-white">{t('admin.cars.addNew')}</h2>
                        <p className="text-gray-400 text-sm mt-1">
                            {t('admin.cars.addNewDescription')}
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
                                {React.createElement(LiaCarSideSolid as any, { className: "w-5 h-5" })}
                                {t('admin.cars.basicInfo')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.carName')} *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).name || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).name = e.target.value;
                                            return updated;
                                        })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.make')} *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).make || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).make = e.target.value;
                                            return updated;
                                        })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.model')} *</label>
                                    <input
                                        type="text"
                                        value={(formData as any).model || ''}
                                        onChange={(e) => setFormData(prev => {
                                            const updated = { ...prev };
                                            (updated as any).model = e.target.value;
                                            return updated;
                                        })}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.category')} *</label>
                                    <select
                                        value={formData.category || 'luxury'}
                                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as CarType['category'] }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    >
                                        <option value="suv">{t('admin.cars.categorySuv')}</option>
                                        <option value="sports">{t('admin.cars.categorySports')}</option>
                                        <option value="luxury">{t('admin.cars.categoryLuxury')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.year')} *</label>
                                    <input
                                        type="number"
                                        value={formData.year || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.seats')} *</label>
                                    <input
                                        type="number"
                                        value={formData.seats || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, seats: parseInt(e.target.value) }))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.pricePerDay')} *</label>
                                    <input
                                        type="number"
                                        value={(formData as any).pricePerDay || formData.price_per_day || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, price_per_day: parseFloat(e.target.value), pricePerDay: parseFloat(e.target.value) } as any))}
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">{t('admin.cars.discountPercentage')}</label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={(formData as any).discountPercentage !== undefined ? (formData as any).discountPercentage : (formData.discount_percentage !== undefined ? formData.discount_percentage : '')}
                                        onChange={(e) => {
                                            const discountValue = e.target.value === '' ? undefined : parseFloat(e.target.value);
                                            setFormData(prev => ({
                                                ...prev,
                                                discountPercentage: discountValue,
                                                discount_percentage: discountValue
                                            } as any));
                                        }}
                                        placeholder="0"
                                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    />
                                    <p className="text-xs text-gray-400 mt-1">{t('admin.cars.discountPercentageHint')}</p>
                                    {(() => {
                                        // Get base price - handle both naming conventions
                                        const pricePerDay = (formData as any).pricePerDay;
                                        const price_per_day = formData.price_per_day;
                                        const basePriceValue = pricePerDay !== undefined && pricePerDay !== null
                                            ? pricePerDay
                                            : (price_per_day !== undefined && price_per_day !== null ? price_per_day : 0);
                                        const basePrice = typeof basePriceValue === 'number' ? basePriceValue : parseFloat(String(basePriceValue)) || 0;
                                        
                                        // Get discount - handle both naming conventions and null/undefined
                                        const discountPercentage = (formData as any).discountPercentage;
                                        const discount_percentage = formData.discount_percentage;
                                        const discountValue = discountPercentage !== undefined && discountPercentage !== null
                                            ? discountPercentage
                                            : (discount_percentage !== undefined && discount_percentage !== null ? discount_percentage : 0);
                                        const discount = typeof discountValue === 'number' ? discountValue : parseFloat(String(discountValue)) || 0;
                                        
                                        // Check if we have valid values
                                        const hasValidPrice = !isNaN(basePrice) && basePrice > 0;
                                        const hasValidDiscount = !isNaN(discount) && discount > 0 && discount <= 100;
                                        
                                        if (hasValidPrice && hasValidDiscount) {
                                            const discountedPrice = basePrice * (1 - discount / 100);
                                            return (
                                                <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                                                    <p className="text-xs text-emerald-400 font-medium">
                                                        {t('admin.cars.discountedPrice')}: {discountedPrice.toFixed(2)} MDL
                                                    </p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    })()}
                                </div>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Upload className="w-5 h-5" />
                                {t('admin.cars.mainImage')}
                            </h3>
                            <div>
                                <label className="inline-block px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mb-2">
                                    <Upload className="w-4 h-4" />
                                    <span className="text-sm font-medium">{t('admin.cars.uploadImage')}</span>
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
                                {uploadingMainImage && (
                                    <p className="text-xs text-gray-400 mb-2">{t('admin.cars.uploadingImage')}</p>
                                )}
                                {((formData as any).image || formData.image_url) && (
                                    <div className="mt-2 inline-block">
                                        <img src={(formData as any).image || formData.image_url || ''} alt="Preview" className="h-20 object-contain rounded-lg border border-white/10" />
                                    </div>
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
                                {t('admin.cars.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        {t('admin.cars.saving')}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4" />
                                        {t('admin.cars.addCar')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="p-6 text-center space-y-4">
                        <div className="text-green-400 mb-4">
                            <CheckCircle className="w-16 h-16 mx-auto" />
                        </div>
                        <h3 className="text-xl font-bold text-white">{t('admin.cars.carAddedSuccess')}</h3>
                        <p className="text-gray-300">{t('admin.cars.carAddedDescription')}</p>
                        <div className="flex gap-4 justify-center pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all"
                            >
                                {t('admin.cars.close')}
                            </button>
                            <button
                                type="button"
                                onClick={handleContinue}
                                className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                            >
                                {t('admin.cars.continue')}
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
    const { t } = useTranslation();
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
                    <h2 className="text-xl font-bold text-white">{t('admin.orders.bookingCalendar')}</h2>
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
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const requestId = searchParams.get('requestId');
    const carId = searchParams.get('carId');
    const { showSuccess, showError } = useNotification();
    const [requests, setRequests] = useState<OrderDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [cars, setCars] = useState<CarType[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'pickup' | 'return' | 'amount' | 'status' | null>('status');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [showRejected, setShowRejected] = useState(false);
    const [showAddRentalModal, setShowAddRentalModal] = useState(false);
    const [selectedCarIdForRental, setSelectedCarIdForRental] = useState<string | undefined>(undefined);
    const [processingRequest, setProcessingRequest] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<OrderDisplay | null>(null);
    const [showRequestDetailsModal, setShowRequestDetailsModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingRequest, setEditingRequest] = useState<OrderDisplay | null>(null);

    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
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
            }
        };
        loadCars();
    }, []);

    // Open modal if carId is in URL params
    useEffect(() => {
        if (carId && cars.length > 0) {
            setSelectedCarIdForRental(carId);
            setShowAddRentalModal(true);
            // Remove carId from URL to avoid reopening on refresh
            const newParams = new URLSearchParams(searchParams);
            newParams.delete('carId');
            setSearchParams(newParams, { replace: true });
        }
    }, [carId, cars.length, searchParams, setSearchParams]);

    useEffect(() => {
        if (cars.length > 0) {
            // Process status transitions first, then load requests once
            processStatusTransitions(cars).then(() => {
                loadRequests();
            });
        }
    }, [cars]);

    // Periodically check and process status transitions (every 60 seconds)
    useEffect(() => {
        if (cars.length === 0) return;

        const interval = setInterval(async () => {
            const result = await processStatusTransitions(cars);
            if (result.success && (result.executed > 0 || result.completed > 0)) {
                // Reload requests if any were processed
                loadRequests();
            }
        }, 60000); // Check every 60 seconds

        return () => clearInterval(interval);
    }, [cars]);

    useEffect(() => {
        // Reload requests when requestId changes to ensure we have the latest data
        if (requestId) {
            loadRequests();
        }
    }, [requestId]);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const data = await fetchBorrowRequestsForDisplay(cars);
            setRequests(data);
        } catch (error) {
            console.error('Failed to load requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAccept = async (request: OrderDisplay) => {
        if (!window.confirm(`${t('admin.requests.confirmAcceptRequest')} ${request.customerName} ${t('admin.requests.forCar')} ${request.carName}?`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await acceptBorrowRequest(request.id.toString(), cars);
            if (result.success) {
                showSuccess(t('admin.requests.requestAccepted'));
                await loadRequests();
                // Optionally navigate to the created rental
                if (result.rentalId) {
                    navigate(`/admin?section=orders&orderId=${result.rentalId}`);
                }
            } else {
                showError(`${t('admin.requests.requestAcceptFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error accepting request:', error);
            showError(t('admin.requests.requestAcceptErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleReject = async (request: OrderDisplay) => {
        const reason = window.prompt(`${t('admin.requests.confirmRejectRequest')} ${request.customerName}? ${t('admin.requests.rejectReasonPrompt')}`);
        if (reason === null) return; // User cancelled

        setProcessingRequest(request.id.toString());
        try {
            // If request is already APPROVED, use updateBorrowRequest instead
            if (request.status === 'APPROVED') {
                const result = await updateBorrowRequest(request.id.toString(), { status: 'REJECTED' } as any);
                if (result.success) {
                    showSuccess(t('admin.requests.requestRejected'));
                    await loadRequests();
                } else {
                    showError(`${t('admin.requests.requestRejectFailed')} ${result.error || t('admin.common.unknownError')}`);
                }
            } else {
                const result = await rejectBorrowRequest(request.id.toString(), reason || undefined);
                if (result.success) {
                    showSuccess(t('admin.requests.requestRejected'));
                    await loadRequests();
                } else {
                    showError(`${t('admin.requests.requestRejectFailed')} ${result.error || t('admin.common.unknownError')}`);
                }
            }
        } catch (error) {
            console.error('Error rejecting request:', error);
            showError(t('admin.requests.requestRejectErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleUndoReject = async (request: OrderDisplay) => {
        if (!window.confirm(`${t('admin.requests.confirmRestoreRequest')} ${request.customerName} ${t('admin.requests.forCar')} ${request.carName} ${t('admin.requests.toPending')}`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await undoRejectBorrowRequest(request.id.toString());
            if (result.success) {
                showSuccess(t('admin.requests.requestRestored'));
                await loadRequests();
            } else {
                showError(`${t('admin.requests.requestRestoreFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error undoing reject request:', error);
            showError(t('admin.requests.requestRestoreErrorOccurred'));
        } finally {
            setProcessingRequest(null);
        }
    };

    const handleSetToPending = async (request: OrderDisplay) => {
        if (!window.confirm(`${t('admin.requests.confirmSetToPending')} ${request.customerName} ${t('admin.requests.forCar')} ${request.carName} ${t('admin.requests.backToPending')}`)) {
            return;
        }

        setProcessingRequest(request.id.toString());
        try {
            const result = await updateBorrowRequest(request.id.toString(), { status: 'PENDING' } as any);
            if (result.success) {
                showSuccess(t('admin.requests.requestSetToPending'));
                await loadRequests();
            } else {
                showError(`${t('admin.requests.requestUpdateFailed')} ${result.error || t('admin.common.unknownError')}`);
            }
        } catch (error) {
            console.error('Error setting request to pending:', error);
            showError(t('admin.requests.requestUpdateErrorOccurred'));
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
        const returnTime = formatTime(request.returnTime);
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

        const rentalDays = days;
        const totalDays = days + (hours / 24);

        // Base price calculation
        let basePrice = 0;

        if (rentalDays >= 8) {
            basePrice = car.price_per_day * 0.96 * rentalDays;
        } else if (rentalDays >= 4) {
            basePrice = car.price_per_day * 0.98 * rentalDays;
        } else {
            basePrice = car.price_per_day * rentalDays;
        }

        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * car.price_per_day;
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
        const baseCarPrice = car.price_per_day;

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
                request.customerPhone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
            // Default: sort by status (ascending)
            const statusOrder = { 'PENDING': 0, 'APPROVED': 1, 'REJECTED': 2, 'EXECUTED': 3 };
            filtered.sort((a, b) => {
                const statusA = statusOrder[a.status as keyof typeof statusOrder] ?? 4;
                const statusB = statusOrder[b.status as keyof typeof statusOrder] ?? 4;
                return statusA - statusB;
            });
        }

        return filtered;
    }, [requests, searchQuery, sortBy, sortOrder, showRejected, calculateRequestTotalPrice]);

    // If requestId is in URL, show request details view
    if (requestId) {
        const request = requests.find(r => r.id.toString() === requestId);
        if (request) {
            return <RequestDetailsView request={request} onBack={() => setSearchParams({ section: 'requests' })} onAccept={handleAccept} onReject={handleReject} onUndoReject={handleUndoReject} onSetToPending={handleSetToPending} cars={cars} />;
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
                <div className="px-3 md:px-6 py-3 md:py-4 border-b border-white/10">
                    <div className="flex flex-col gap-3 md:gap-4">
                        {/* Title and Add Button Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            <div>
                                <h2 className="text-lg md:text-xl font-bold text-white">{t('admin.requests.rentalRequests')}</h2>
                            </div>
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowRejected(!showRejected)}
                                    className={`flex items-center justify-center gap-1.5 px-3 md:px-4 py-2 text-xs md:text-sm font-semibold rounded-lg border transition-all whitespace-nowrap ${showRejected
                                        ? 'bg-red-500/20 text-red-300 border-red-500/50 hover:bg-red-500/30 hover:border-red-500/60'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    {showRejected ? t('admin.requests.hideRejected') : t('admin.requests.showRejected')}
                                </button>
                                <button
                                    onClick={() => setShowAddRentalModal(true)}
                                    className="px-3 md:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 font-semibold rounded-lg hover:border-red-500/60 transition-all text-xs md:text-sm whitespace-nowrap flex items-center justify-center gap-2"
                                >
                                    <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                    {t('admin.requests.createRequest')}
                                </button>
                            </div>
                        </div>
                        {/* Search and Sort Row */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                            {/* Search */}
                            <div className="w-full md:flex-1 md:max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-2.5 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 md:w-4 md:h-4" />
                                    <input
                                        type="text"
                                        placeholder={t('admin.placeholders.searchRequests')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 md:pl-10 pr-3 md:pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 text-white text-xs md:text-sm placeholder-gray-400"
                                    />
                                </div>
                            </div>
                            {/* Filter and Sort Buttons */}
                            <div className="w-full md:w-auto flex flex-col md:flex-row items-stretch md:items-center gap-2">
                                <span className="hidden md:inline text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('admin.requests.sortBy')}</span>
                                <span className="md:hidden text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('admin.requests.sortBy')}</span>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        onClick={() => handleSort('pickup')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'pickup'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.requests.pickupDate')}</span>
                                        {sortBy === 'pickup' && (
                                            sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 flex-shrink-0" /> : <ArrowDown className="w-3 h-3 flex-shrink-0" />
                                        )}
                                        {sortBy !== 'pickup' && <ArrowUpDown className="w-3 h-3 opacity-50 flex-shrink-0" />}
                                    </button>
                                    <button
                                        onClick={() => handleSort('amount')}
                                        className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all flex-1 sm:flex-initial min-w-0 ${sortBy === 'amount'
                                            ? 'bg-red-500/20 text-red-300 border-red-500/50'
                                            : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:text-white'
                                            }`}
                                    >
                                        <span className="truncate">{t('admin.requests.amount')}</span>
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
                                            {t('admin.requests.clearSort')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Mobile Cards / Desktop Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
                    </div>
                ) : filteredRequests.length > 0 ? (
                    <>
                        {/* Mobile Card View */}
                        <div className="block md:hidden p-4 space-y-4">
                            {filteredRequests.map((request) => {
                                const getInitials = (name: string) => {
                                    const parts = name.trim().split(' ');
                                    if (parts.length >= 2) {
                                        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                                    }
                                    return name.substring(0, 2).toUpperCase();
                                };

                                return (
                                    <div
                                        key={request.id}
                                        className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition cursor-pointer"
                                        onClick={() => {
                                            setSelectedRequest(request);
                                            setShowRequestDetailsModal(true);
                                        }}
                                    >
                                        {/* Header: Customer and Status */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md">
                                                    {getInitials(request.customerName || 'U')}
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="font-semibold text-white text-sm truncate">{request.customerName}</span>
                                                    {request.customerPhone && (
                                                        <span className="text-gray-400 text-xs truncate">{request.customerPhone}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm flex-shrink-0 ${request.status === 'PENDING'
                                                    ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                    : request.status === 'APPROVED'
                                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                        : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                    }`}
                                            >
                                                {request.status === 'PENDING' ? t('admin.status.pending') : 
                                                 request.status === 'APPROVED' ? t('admin.status.approved') : 
                                                 request.status === 'REJECTED' ? t('admin.status.rejected') : 
                                                 request.status === 'EXECUTED' ? t('admin.status.executed') : 
                                                 request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                                            </span>
                                        </div>

                                        {/* Car Info */}
                                        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                            <img
                                                src={request.avatar}
                                                alt={request.carName}
                                                className="w-12 h-12 object-cover rounded-md border border-white/10 flex-shrink-0"
                                            />
                                            <span className="text-white font-medium text-sm flex-1">{request.carName}</span>
                                        </div>

                                        {/* Dates and Amount */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.pickup')}</p>
                                                <p className="text-white text-sm font-medium">{new Date(request.pickupDate).toLocaleDateString()}</p>
                                                <p className="text-gray-400 text-xs">{request.pickupTime}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-xs mb-1">{t('admin.requests.return')}</p>
                                                <p className="text-white text-sm font-medium">{new Date(request.returnDate).toLocaleDateString()}</p>
                                                <p className="text-gray-400 text-xs">{request.returnTime}</p>
                                            </div>
                                        </div>

                                        {/* Amount */}
                                        <div className="mt-4 pt-4 border-t border-white/10">
                                            <p className="text-gray-400 text-xs mb-1">{t('admin.requests.amount')}</p>
                                            <p className="text-white font-semibold text-base">
                                                {calculateRequestTotalPrice(request).toLocaleString()} MDL
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-white/10">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.customer')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.car')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.pickup')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.return')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.amount')}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                            {t('admin.requests.status')}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/10">
                                    {filteredRequests.map((request) => {
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
                                                            {request.customerPhone && (
                                                                <span className="text-gray-400 text-xs truncate">{request.customerPhone}</span>
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
                                                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-sm ${request.status === 'PENDING'
                                                            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                            : request.status === 'APPROVED'
                                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                                            }`}
                                                    >
                                                        {request.status === 'PENDING' ? t('admin.status.pending') : 
                                                         request.status === 'APPROVED' ? t('admin.status.approved') : 
                                                         request.status === 'REJECTED' ? t('admin.status.rejected') : 
                                                         request.status === 'EXECUTED' ? t('admin.status.executed') : 
                                                         request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-400">
                        {searchQuery ? t('admin.requests.noRequests') : t('admin.requests.noRequests')}
                    </div>
                )}
            </div>

            {/* Add Rental Modal */}
            {showAddRentalModal && (
                <CreateRentalModal
                    cars={cars}
                    initialCarId={selectedCarIdForRental}
                    onSave={async (rentalData) => {
                        try {
                            const result = await createBorrowRequest(
                                rentalData.carId || '',
                                rentalData.pickupDate || '',
                                rentalData.pickupTime || '',
                                rentalData.returnDate || '',
                                rentalData.returnTime || '',
                                rentalData.customerName || '',
                                rentalData.customerFirstName || '',
                                rentalData.customerLastName || '',
                                rentalData.customerEmail || '',
                                rentalData.customerPhone || '',
                                rentalData.customerAge ? String(rentalData.customerAge) : undefined,
                                (rentalData as any).comment,
                                (rentalData as any).options,
                                rentalData.amount
                            );
                            if (result.success) {
                                showSuccess('Request created successfully!');
                                setShowAddRentalModal(false);
                                setSelectedCarIdForRental(undefined);
                                await loadRequests();
                            } else {
                                showError(`Failed to create request: ${result.error || 'Unknown error'}`);
                            }
                        } catch (error) {
                            console.error('Error creating request:', error);
                            showError('An error occurred while creating the request.');
                        }
                    }}
                    onClose={() => {
                        setShowAddRentalModal(false);
                        setSelectedCarIdForRental(undefined);
                    }}
                />
            )}

            {/* Request Details Modal */}
            {showRequestDetailsModal && selectedRequest && (
                <RequestDetailsModal
                    cars={cars}
                    request={selectedRequest}
                    onClose={() => {
                        setShowRequestDetailsModal(false);
                        setSelectedRequest(null);
                    }}
                    onAccept={handleAccept}
                    onReject={handleReject}
                    onUndoReject={handleUndoReject}
                    onSetToPending={handleSetToPending}
                    onEdit={handleEdit}
                    isProcessing={processingRequest === selectedRequest.id.toString()}
                />
            )}

            {/* Edit Request Modal */}
            {showEditModal && editingRequest && (
                <EditRequestModal
                    cars={cars}
                    request={editingRequest}
                    onSave={async (updatedData) => {
                        try {
                            const result = await updateBorrowRequest(editingRequest.id.toString(), updatedData);
                            if (result.success) {
                                alert(t('admin.requests.requestUpdated'));
                                setShowEditModal(false);
                                setEditingRequest(null);
                                await loadRequests();
                            } else {
                                alert(`${t('admin.requests.requestUpdateFailed')} ${result.error}`);
                            }
                        } catch (error) {
                            console.error('Error updating request:', error);
                            alert(t('admin.requests.requestUpdateErrorOccurred'));
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
    onSetToPending?: (request: OrderDisplay) => void;
    onEdit?: (request: OrderDisplay) => void;
    isProcessing?: boolean;
    cars: CarType[];
}

const RequestDetailsModal: React.FC<RequestDetailsModalProps> = ({ request, onClose, onAccept, onReject, onUndoReject, onSetToPending, onEdit, isProcessing = false, cars }) => {
    const { t } = useTranslation();
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
    const returnTime = formatTime(request.returnTime);
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
    const hours = diffHours >= 0 ? diffHours : 0; // Ensure hours is never negative

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
    const baseCarPrice = car.price_per_day;

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
    const pricePerDay = totalDays > 0 ? Math.round(totalPrice / totalDays) : car.price_per_day;

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
                        <h2 className="text-xl md:text-2xl font-bold text-white">{t('admin.requestDetails.rentalRequest')}</h2>
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
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.rentalPeriod')}</h3>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-gray-300 text-sm md:text-base">
                                    {days} {t('admin.requestDetails.days')}{days !== 1 ? '' : ''}, {hours} {t('admin.requestDetails.hours')}{hours !== 1 ? '' : ''}
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
                                                ? t('admin.requestDetails.discount4Percent')
                                                : t('admin.requestDetails.discount2Percent')
                                            }
                                        </span>
                                    </div>
                                </motion.div>
                            )}

                            <div className="grid grid-cols-2 gap-3 md:gap-4 pt-2 md:pt-3 border-t border-white/10">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.requestDetails.pickupDate')}</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDate(request.pickupDate)}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{t('admin.requestDetails.atTime')} {formatTime(request.pickupTime)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.requestDetails.returnDate')}</p>
                                    <p className="text-white font-semibold text-sm md:text-base">{formatDate(request.returnDate)}</p>
                                    <p className="text-gray-400 text-xs md:text-sm">{t('admin.requestDetails.atTime')} {formatTime(request.returnTime)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.contactInformation')}</h3>
                        <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.firstName')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{firstName || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.lastName')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{lastName || '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.age')}</label>
                                <p className="text-white font-medium text-sm md:text-base">{age ? `${age}` : '—'}</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.phone')}</label>
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
                                    <label className="block text-xs text-gray-400 uppercase tracking-wide mb-1">{t('admin.form.emailOptional')}</label>
                                    <p className="text-white text-sm md:text-base">{request.customerEmail}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rental Options */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-4 md:mb-6">{t('admin.requestDetails.rentalOptions')}</h3>

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
                                        <p className="text-gray-400 text-sm">{t('admin.requestDetails.noOptionsSelected')}</p>
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
                                            <span className={`text-xs font-semibold px-2 py-1 rounded ${option.price.includes('%')
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
                            <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.commentOptional')}</h3>
                            <p className="text-gray-300 text-sm whitespace-pre-wrap">{(request as any).comment || (request as any).customerComment}</p>
                        </div>
                    )}

                    {/* Price Summary */}
                    <div className="bg-white/5 rounded-xl p-4 md:p-6 border border-white/10">
                        <h3 className="text-base md:text-lg font-bold text-white mb-3 md:mb-4">{t('admin.requestDetails.priceDetails')}</h3>
                        <div className="space-y-2 md:space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">{t('admin.requestDetails.pricePerDay')}</span>
                                <span className="text-white font-medium">{car.price_per_day} MDL</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-300">Durată</span>
                                <span className="text-white font-medium">
                                    {rentalDays} {rentalDays === 1 ? 'zi' : 'zile'}{hours > 0 ? `, ${hours} ${hours === 1 ? 'oră' : 'ore'}` : ''}
                                </span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="flex items-center justify-between text-sm text-emerald-400">
                                    <span>{t('admin.requestDetails.discount')}</span>
                                    <span className="font-medium">-{discountPercent}%</span>
                                </div>
                            )}
                            <div className="pt-2 border-t border-white/10">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-white font-medium">{t('admin.requestDetails.basePrice')}</span>
                                    <span className="text-white font-medium">{Math.round(basePrice).toLocaleString()} MDL</span>
                                </div>
                            </div>

                            {additionalCosts > 0 && (
                                <>
                                    <div className="pt-2 md:pt-3 border-t border-white/10">
                                        <h4 className="text-sm font-bold text-white mb-2 md:mb-3">{t('admin.requestDetails.additionalServices')}</h4>
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
                                                    <span className="text-white">{t('admin.requestDetails.totalServices')}</span>
                                                    <span className="text-white">{Math.round(additionalCosts).toLocaleString()} MDL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="pt-2 md:pt-3 border-t border-white/10 flex items-center justify-between">
                                <span className="text-white font-bold text-base md:text-lg">{t('admin.requestDetails.total')}</span>
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
                                        {t('admin.requestDetails.processing')}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        {t('admin.requestDetails.acceptRequest')}
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
                                        {t('admin.requestDetails.processing')}
                                    </>
                                ) : (
                                    <>
                                        <X className="w-4 h-4" />
                                        {t('admin.requestDetails.rejectRequest')}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                    {request.status === 'APPROVED' && (onReject || onSetToPending) && (
                        <div className="flex flex-col sm:flex-row gap-2 md:gap-3 pt-3 md:pt-4">
                            {onSetToPending && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onSetToPending(request);
                                        onClose();
                                    }}
                                    disabled={isProcessing}
                                    className="flex-1 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 hover:border-yellow-500/60 text-yellow-300 hover:text-yellow-200 font-semibold py-2.5 md:py-3 px-4 md:px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {t('admin.requestDetails.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            {t('admin.requestDetails.setToPending')}
                                        </>
                                    )}
                                </button>
                            )}
                            {onReject && (
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
                            )}
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
                                            {t('admin.requestDetails.processing')}
                                        </>
                                    ) : (
                                        <>
                                            <RefreshCw className="w-4 h-4" />
                                            {t('admin.requestDetails.undoReject')}
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
                                    {t('admin.requestDetails.editRequest')}
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
    onSetToPending?: (request: OrderDisplay) => void;
    onEdit?: (request: OrderDisplay) => void;
    cars: CarType[];
}

const RequestDetailsView: React.FC<RequestDetailsViewProps> = ({ request, onBack, onAccept, onReject, onUndoReject, onSetToPending, onEdit, cars }) => {
    const car = cars.find(c => c.id.toString() === request.carId);
    const [selectedImage, setSelectedImage] = useState<string | undefined>(car?.image_url ?? undefined);

    useEffect(() => {
        if (car) {
            setSelectedImage(car.image_url ?? undefined);
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
                                <span className="text-white text-sm font-medium">{request.returnTime || '--:--'}</span>
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
                            className={`px-4 py-2 rounded-lg text-sm font-semibold border backdrop-blur-xl ${request.status === 'PENDING'
                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                : request.status === 'APPROVED'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                    : 'bg-red-500/20 text-red-300 border-red-500/50'
                                }`}
                        >
                            {request.status.charAt(0) + request.status.slice(1).toLowerCase()}
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
                    {request.status === 'APPROVED' && (typeof onSetToPending !== 'undefined' || typeof onReject !== 'undefined') && (
                        <>
                            {onSetToPending && (
                                <button
                                    onClick={() => onSetToPending(request)}
                                    className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/50 hover:border-yellow-500/60 text-yellow-300 hover:text-yellow-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Set to Pending
                                </button>
                            )}
                            {onReject && (
                                <button
                                    onClick={() => onReject(request)}
                                    className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500/60 text-red-300 hover:text-red-200 font-semibold py-3 px-6 rounded-lg transition-all backdrop-blur-xl flex items-center justify-center gap-2"
                                >
                                    <X className="w-4 h-4" />
                                    Reject Request
                                </button>
                            )}
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
    cars: CarType[];
    initialCarId?: string;
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

const CreateRentalModal: React.FC<CreateRentalModalProps> = ({ onSave, onClose, cars, initialCarId }) => {
    const { t } = useTranslation();
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Find initial car if provided
    const initialCar = initialCarId ? cars.find(c => c.id.toString() === initialCarId) : null;

    const [formData, setFormData] = useState<Partial<OrderDisplay> & {
        firstName?: string;
        lastName?: string;
        age?: string;
        comment?: string;
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
    }>({
        customerName: '',
        customerFirstName: '',
        customerLastName: '',
        customerEmail: '',
        customerPhone: '',
        customerAge: '',
        carId: initialCarId || '',
        carName: initialCar ? ((initialCar as any)?.name || `${initialCar.make} ${initialCar.model}`) : '',
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

        // Get price with car discount applied first
        const basePricePerDay = (selectedCar as any).pricePerDay || selectedCar.price_per_day || 0;
        const carDiscount = (selectedCar as any).discount_percentage || selectedCar.discount_percentage || 0;
        const pricePerDay = carDiscount > 0 
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;

        // Base price calculation (same as Calculator.tsx and Admin) - using discounted price
        let basePrice = 0;

        if (rentalDays >= 8) {
            basePrice = pricePerDay * 0.96 * rentalDays; // -4% discount
        } else if (rentalDays >= 4) {
            basePrice = pricePerDay * 0.98 * rentalDays; // -2% discount
        } else {
            basePrice = pricePerDay * rentalDays;
        }

        // Add hours portion
        if (hours > 0) {
            const hoursPrice = (hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }

        // Calculate additional costs from options
        let additionalCosts = 0;
        const baseCarPrice = pricePerDay;

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
            carName: (selectedCar as any)?.name || '',
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.firstName || !formData.lastName || !formData.age || !formData.customerPhone || !formData.carId || !formData.startDate || !formData.endDate) {
            alert(t('admin.requests.fillRequiredFields'));
            return;
        }

        // Combine firstName and lastName into customerName
        const customerName = `${formData.firstName} ${formData.lastName}`;

        // Include country code in phone number
        const fullPhoneNumber = `${selectedCountryCode.code} ${formData.customerPhone}`.trim();

        // Calculate total amount
        const totalAmount = calculateAmount();

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
            amount: totalAmount,
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
                    <h2 className="text-xl font-bold text-white">{t('admin.requests.createNew')}</h2>
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nume *</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                                    placeholder={t('admin.placeholders.email')}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                required
                            >
                                <option value="">{t('admin.requests.selectACar')}</option>
                                {cars.map(car => {
                                    const basePrice = (car as any).pricePerDay || car.price_per_day || 0;
                                    const discount = (car as any).discount_percentage || car.discount_percentage || 0;
                                    const finalPrice = discount > 0 
                                        ? basePrice * (1 - discount / 100)
                                        : basePrice;
                                    const carName = (car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || 'Car';
                                    return (
                                        <option key={car.id} value={car.id.toString()}>
                                            {carName} - {finalPrice.toFixed(0)} MDL/zi{discount > 0 ? ` (-${discount}%)` : ''}
                                        </option>
                                    );
                                })}
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.startDate
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
                                                            className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isPast ? 'text-gray-600 cursor-not-allowed' : 'text-white'
                                                                } ${isSelected
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.startTime
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
                                                        className={`px-3 py-2 text-xs rounded transition-colors ${formData.startTime === hour
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.endDate
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
                                                            className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isPast ? 'text-gray-600 cursor-not-allowed' : 'text-white'
                                                                } ${isSelected
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.endTime
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
                                                        className={`px-3 py-2 text-xs rounded transition-colors ${formData.endTime === hour
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, pickupAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.pickupAtAddress
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, returnAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.returnAtAddress
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, unlimitedKm: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.unlimitedKm
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, speedLimitIncrease: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.speedLimitIncrease
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, personalDriver: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.personalDriver
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, priorityService: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.priorityService
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, tireInsurance: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.tireInsurance
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, childSeat: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.childSeat
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, simCard: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.simCard
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
                                            onChange={(e) => setOptions((prev: any) => ({ ...prev, roadsideAssistance: e.target.checked }))}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.roadsideAssistance
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

                                // Get price with car discount applied first
                                const basePricePerDay = (selectedCar as any).pricePerDay || selectedCar.price_per_day || 0;
                                const carDiscount = (selectedCar as any).discount_percentage || selectedCar.discount_percentage || 0;
                                const pricePerDay = carDiscount > 0 
                                    ? basePricePerDay * (1 - carDiscount / 100)
                                    : basePricePerDay;

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

                                // Apply rental duration discounts to already-discounted price
                                if (rentalDays >= 8) {
                                    discountPercent = 4;
                                    basePrice = pricePerDay * 0.96 * rentalDays;
                                } else if (rentalDays >= 4) {
                                    discountPercent = 2;
                                    basePrice = pricePerDay * 0.98 * rentalDays;
                                } else {
                                    basePrice = pricePerDay * rentalDays;
                                }

                                if (hours > 0) {
                                    const hoursPrice = (hours / 24) * pricePerDay;
                                    basePrice += hoursPrice;
                                }

                                let additionalCosts = 0;
                                const baseCarPrice = pricePerDay;

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
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-white font-medium">{pricePerDay.toFixed(0)} MDL</span>
                                                {carDiscount > 0 && (
                                                    <span className="text-gray-400 text-xs line-through">{basePricePerDay.toFixed(0)} MDL</span>
                                                )}
                                            </div>
                                        </div>
                                        {carDiscount > 0 && (
                                            <div className="flex items-center justify-between text-sm text-emerald-400">
                                                <span>Reducere mașină</span>
                                                <span className="font-medium">-{carDiscount}%</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Durată</span>
                                            <span className="text-white font-medium">
                                                {rentalDays} {rentalDays === 1 ? 'zi' : 'zile'}{hours > 0 ? `, ${hours} ${hours === 1 ? 'oră' : 'ore'}` : ''}
                                            </span>
                                        </div>
                                        {discountPercent > 0 && (
                                            <div className="flex items-center justify-between text-sm text-emerald-400">
                                                <span>Reducere durată</span>
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
                                                                <span className="text-gray-300">Serviciu prioritar</span>
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
                            {t('admin.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {t('admin.requests.createRental')}
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
    cars: CarType[];
}

const EditRequestModal: React.FC<EditRequestModalProps> = ({ request, onSave, onClose, cars }) => {
    const { t } = useTranslation();
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
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
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
        endTime: request.returnTime || '17:00',
        status: (request.status || 'PENDING') as any,
        amount: request.amount || 0,
        userId: request.userId || '',
        firstName: initialFirstName,
        lastName: initialLastName,
        age: request.customerAge ? String(request.customerAge) : '',
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

        // Get price with car discount applied first
        const basePricePerDay = (selectedCar as any).pricePerDay || selectedCar.price_per_day || 0;
        const carDiscount = (selectedCar as any).discount_percentage || selectedCar.discount_percentage || 0;
        const pricePerDay = carDiscount > 0 
            ? basePricePerDay * (1 - carDiscount / 100)
            : basePricePerDay;

        let basePrice = 0;
        if (rentalDays >= 8) {
            basePrice = pricePerDay * 0.96 * rentalDays;
        } else if (rentalDays >= 4) {
            basePrice = pricePerDay * 0.98 * rentalDays;
        } else {
            basePrice = pricePerDay * rentalDays;
        }

        if (hours > 0) {
            const hoursPrice = (hours / 24) * pricePerDay;
            basePrice += hoursPrice;
        }

        const baseCarPrice = pricePerDay;
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
            alert(t('admin.requests.fillRequiredFieldsShort'));
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
                    <h2 className="text-xl font-bold text-white">{t('admin.requests.editRequest')}</h2>
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Nume *</label>
                                <input
                                    type="text"
                                    value={formData.lastName || ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value, customerLastName: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 12px center',
                                    backgroundSize: '12px',
                                    paddingRight: '40px'
                                }}
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.startDate
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
                                                        className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isPast ? 'text-gray-500 cursor-not-allowed' : 'text-white'
                                                            } ${isSelected
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.startTime
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
                                                    className={`px-3 py-2 text-xs rounded transition-colors ${formData.startTime === hour
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.endDate
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
                                                        className={`w-8 h-8 flex items-center justify-center text-xs cursor-pointer rounded transition-colors ${isPast ? 'text-gray-500 cursor-not-allowed' : 'text-white'
                                                            } ${isSelected
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
                                    className={`w-full flex items-center justify-start gap-2 border rounded-xl py-3 px-3 transition-colors text-sm font-medium ${formData.endTime
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
                                                    className={`px-3 py-2 text-xs rounded transition-colors ${formData.endTime === hour
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
                            className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-red-500/50 appearance-none cursor-pointer"
                            style={{
                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                                backgroundRepeat: 'no-repeat',
                                backgroundPosition: 'right 12px center',
                                backgroundSize: '12px',
                                paddingRight: '40px'
                            }}
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, pickupAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.pickupAtAddress
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, returnAtAddress: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.returnAtAddress
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, unlimitedKm: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.unlimitedKm
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, speedLimitIncrease: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.speedLimitIncrease
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, personalDriver: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.personalDriver
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, priorityService: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.priorityService
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, tireInsurance: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.tireInsurance
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, childSeat: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.childSeat
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, simCard: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.simCard
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
                                        onChange={(e) => setOptions((prev: any) => ({ ...prev, roadsideAssistance: e.target.checked }))}
                                        className="sr-only"
                                    />
                                    <div className={`w-5 h-5 border-2 rounded transition-all flex items-center justify-center ${options.roadsideAssistance
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

                                // Get price with car discount applied first
                                const basePricePerDay = (selectedCar as any).pricePerDay || selectedCar.price_per_day || 0;
                                const carDiscount = (selectedCar as any).discount_percentage || selectedCar.discount_percentage || 0;
                                const pricePerDay = carDiscount > 0 
                                    ? basePricePerDay * (1 - carDiscount / 100)
                                    : basePricePerDay;

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

                                // Apply rental duration discounts to already-discounted price
                                if (rentalDays >= 8) {
                                    discountPercent = 4;
                                    basePrice = pricePerDay * 0.96 * rentalDays;
                                } else if (rentalDays >= 4) {
                                    discountPercent = 2;
                                    basePrice = pricePerDay * 0.98 * rentalDays;
                                } else {
                                    basePrice = pricePerDay * rentalDays;
                                }

                                if (hours > 0) {
                                    const hoursPrice = (hours / 24) * pricePerDay;
                                    basePrice += hoursPrice;
                                }

                                let additionalCosts = 0;
                                const baseCarPrice = pricePerDay;

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
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className="text-white font-medium">{pricePerDay.toFixed(0)} MDL</span>
                                                {carDiscount > 0 && (
                                                    <span className="text-gray-400 text-xs line-through">{basePricePerDay.toFixed(0)} MDL</span>
                                                )}
                                            </div>
                                        </div>
                                        {carDiscount > 0 && (
                                            <div className="flex items-center justify-between text-sm text-emerald-400">
                                                <span>Reducere mașină</span>
                                                <span className="font-medium">-{carDiscount}%</span>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-300">Durată</span>
                                            <span className="text-white font-medium">
                                                {rentalDays} {rentalDays === 1 ? 'zi' : 'zile'}{hours > 0 ? `, ${hours} ${hours === 1 ? 'oră' : 'ore'}` : ''}
                                            </span>
                                        </div>
                                        {discountPercent > 0 && (
                                            <div className="flex items-center justify-between text-sm text-emerald-400">
                                                <span>Reducere durată</span>
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
                                                                <span className="text-gray-300">Serviciu prioritar</span>
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
                            {t('admin.common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 hover:text-red-200 font-semibold rounded-lg transition-all backdrop-blur-xl flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {t('admin.common.save')}
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
    const { signOut, user, loading, isAdmin, roleLoaded, userProfile } = useAuth();
    const { i18n, t } = useTranslation();
    const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
    const [currentLanguage, setCurrentLanguage] = useState(i18n.language);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [totalRequests, setTotalRequests] = useState<number>(0);
    const [cars, setCars] = useState<CarType[]>([]);

    // Security check: If user is not admin, don't render anything
    // AdminProtectedRoute should handle showing 404, but this is a safety net
    if (!loading && roleLoaded && user && !isAdmin) {
        return null; // Don't render admin content, AdminProtectedRoute will show 404
    }

    // Fetch cars at top level
    useEffect(() => {
        const loadCars = async () => {
            try {
                const fetchedCars = await fetchCars();
                
                // Fetch images from storage for each car
                const carsWithImages = await Promise.all(
                    fetchedCars.map(async (car) => {
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
            }
        };
        loadCars();
    }, []);

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

    // Fetch total requests count (only PENDING status)
    useEffect(() => {
        if (cars.length === 0) return;
        const loadRequestsCount = async () => {
            try {
                const data = await fetchBorrowRequestsForDisplay(cars);
                // Only count requests with PENDING status
                const pendingRequests = data.filter(request => request.status === 'PENDING');
                setTotalRequests(pendingRequests.length);
            } catch (error) {
                console.error('Failed to load requests count:', error);
            }
        };
        loadRequestsCount();
        // Refresh count periodically or when section changes
        const interval = setInterval(loadRequestsCount, 30000); // Refresh every 30 seconds
        return () => clearInterval(interval);
    }, [refreshKey, cars]);

    // Force Romanian language for admin panel
    useEffect(() => {
        if (i18n.language !== 'ro') {
            i18n.changeLanguage('ro');
            localStorage.setItem('selectedLanguage', 'ro');
            setCurrentLanguage('ro');
        }
    }, [i18n]);

    const menuItems = [
        { id: 'dashboard', label: t('admin.menu.dashboard'), icon: LayoutDashboard },
        { id: 'requests', label: t('admin.menu.requests'), icon: FileText },
        { id: 'cars', label: t('admin.menu.cars'), icon: LiaCarSideSolid },
        { id: 'calendar', label: t('admin.menu.calendar'), icon: CalendarDays },
        { id: 'orders', label: t('admin.menu.orders'), icon: ShoppingCart },
        { id: 'users', label: t('admin.menu.users'), icon: UsersIcon },
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
        if (orderId) return t('admin.orderDetails.title', { id: orderId });
        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return t('admin.requestDetails.title', { id: requestId });
        }
        if (carId && section === 'cars') {
            const car = cars.find(c => c.id.toString() === carId);
            return car ? ((car as any)?.name || `${car.make || ''} ${car.model || ''}`.trim() || t('admin.cars.name')) : t('admin.carDetails.title');
        }
        const item = menuItems.find(m => m.id === section);
        return item?.label || t('admin.menu.dashboard');
    };

    const getPageDescription = () => {
        if (orderId) return t('admin.orderDetails.description');
        const requestId = searchParams.get('requestId');
        if (requestId && section === 'requests') {
            return t('admin.requestDetails.description');
        }
        if (carId && section === 'cars') {
            return t('admin.carDetails.description');
        }
        switch (section) {
            case 'dashboard':
                return t('admin.dashboard.title');
            case 'requests':
                return t('admin.requests.description');
            case 'orders':
                return t('admin.orders.description');
            case 'cars':
                return t('admin.cars.description');
            case 'calendar':
                return t('admin.calendar.description');
            case 'users':
                return t('admin.users.description');
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
            <NotificationToaster />
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
                /* Fix Safari dropdown styling */
                select {
                    -webkit-appearance: none !important;
                    -moz-appearance: none !important;
                    appearance: none !important;
                }
                select::-ms-expand {
                    display: none !important;
                }
                option {
                    background-color: #343434 !important;
                    color: #ffffff !important;
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
                                        <h1 className="text-lg font-bold text-white">{t('admin.title')}</h1>
                                        <p className="text-xs text-gray-300">{t('admin.subtitle')}</p>
                                    </div>
                                    {/* Mobile Refresh and Settings */}
                                    <div className="lg:hidden flex items-center gap-2">
                                        {/* Mobile Help Button */}
                                        <button
                                            onClick={() => setIsHelpModalOpen(true)}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                            title="Ajutor"
                                        >
                                            <HelpCircle className="w-4 h-4 text-white" />
                                        </button>
                                        {/* Mobile Refresh Button */}
                                        <button
                                            onClick={handleRefresh}
                                            disabled={isRefreshing}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20 disabled:opacity-50"
                                            title={t('admin.common.refresh')}
                                        >
                                            <RefreshCw className={`w-4 h-4 text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                        {/* Mobile Settings Button */}
                                        <button
                                            onClick={() => setIsSettingsModalOpen(true)}
                                            className="flex items-center px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                            title={t('admin.common.settings')}
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
                                                {Icon && React.createElement(Icon as any, { className: `h-5 w-5 flex-shrink-0 transition-colors duration-200 ${isActive ? 'text-red-400' : 'text-gray-400 group-hover:text-white'}` })}
                                                {showBadge && (
                                                    <span className={`lg:hidden absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${isActive
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
                                                    <span className={`hidden lg:flex ml-auto min-w-[20px] h-5 items-center justify-center rounded-full text-[10px] font-bold px-1.5 ${isActive
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
                                        <span className="text-white font-semibold text-sm">
                                            {userProfile?.first_name?.[0]?.toUpperCase() ||
                                                userProfile?.last_name?.[0]?.toUpperCase() ||
                                                user?.email?.[0]?.toUpperCase() ||
                                                'U'}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {userProfile?.first_name && userProfile?.last_name
                                                ? `${userProfile.first_name} ${userProfile.last_name}`
                                                : userProfile?.first_name ||
                                                userProfile?.last_name ||
                                                user?.email?.split('@')[0] ||
                                                'User'}
                                        </p>
                                        <p className="text-xs text-gray-300 truncate">
                                            {userProfile?.email || user?.email || 'No email'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => setIsSettingsModalOpen(true)}
                                        className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
                                        aria-label={t('admin.common.settings')}
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
                                    <span>{t('admin.common.backToSite')}</span>
                                </button>

                                {/* Logout Button */}
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-red-500/20 border border-red-500/50 text-red-300 text-sm font-medium rounded-lg hover:bg-red-500/30 hover:border-red-500/60 hover:text-red-200 transition-all duration-200"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span>{t('admin.common.signOut')}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Top Header */}
                        <div className="relative px-4 lg:px-8 py-6 lg:py-8 border-b border-white/20 backdrop-blur-xl" style={{ zIndex: 1 }}>
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
                                    {/* Help Button - Desktop Only */}
                                    <button
                                        onClick={() => setIsHelpModalOpen(true)}
                                        className="hidden lg:flex items-center space-x-2 px-3 py-2 text-sm font-medium transition-colors rounded-lg hover:bg-white/10 border border-white/20"
                                        title="Ghid utilizare"
                                    >
                                        <HelpCircle className="w-4 h-4 text-white" />
                                    </button>
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
                                <h2 className="text-2xl font-bold text-white">{t('admin.common.settings')}</h2>
                                <p className="text-gray-400 text-sm mt-1">
                                    {t('admin.settings.description')}
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

            {/* Help Modal */}
            {isHelpModalOpen && createPortal(
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    onClick={() => setIsHelpModalOpen(false)}
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
                        <div className="sticky top-0 border-b border-white/20 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-10" style={{ backgroundColor: '#1C1C1C' }}>
                            <h2 className="text-xl sm:text-2xl font-bold text-white">Ghid de Utilizare Admin</h2>
                            <button
                                onClick={() => setIsHelpModalOpen(false)}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 sm:p-6 space-y-4">
                            {/* Flow Diagram */}
                            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <ShoppingCart className="w-5 h-5 text-red-400" />
                                    <span>Cum funcționează sistemul?</span>
                                </h3>
                                <div className="space-y-3">
                                    {/* Step 1 */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-red-400 font-bold text-sm">1.</span>
                                            <h4 className="font-bold text-white text-sm">Clientul trimite cerere</h4>
                                        </div>
                                        <p className="text-gray-300 text-xs ml-5 leading-relaxed">
                                            Când un client vrea să închirieze o mașină, completează un formular pe site. 
                                            Cererea lui apare automat în secțiunea "Cereri" cu status "În așteptare". 
                                            Poți vedea ce mașină vrea, când o ia și când o aduce înapoi.
                                        </p>
                                    </div>
                                    {/* Step 2 */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-red-400 font-bold text-sm">2.</span>
                                            <h4 className="font-bold text-white text-sm">Aprobați cererea</h4>
                                        </div>
                                        <p className="text-gray-300 text-xs ml-5 leading-relaxed">
                                            După ce verifici că totul e în regulă, apasă butonul "Aprobă" pe cererea respectivă. 
                                            Sistemul va crea automat o comandă nouă în secțiunea "Comenzi" cand vine ziua de închiriere. 
                                            Dacă nu esti deacord cu cererea, poți respinge și clientul va primi notificare prin email.
                                        </p>
                                    </div>
                                    {/* Step 3 */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-red-400 font-bold text-sm">3.</span>
                                            <h4 className="font-bold text-white text-sm">Generați contractul</h4>
                                        </div>
                                        <p className="text-gray-300 text-xs ml-5 leading-relaxed">
                                            Mergi în secțiunea "Comenzi" și apasă pe comanda creată. 
                                            Acolo vei găsi butonul "Generează Contract" care creează un PDF cu toate detaliile. 
                                            Poți descărca contractul și să-l trimiți clientului sau să-l printezi.
                                        </p>
                                    </div>
                                    {/* Step 4 */}
                                    <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-red-400 font-bold text-sm">4.</span>
                                            <h4 className="font-bold text-white text-sm">Închirierea se finalizează</h4>
                                        </div>
                                        <p className="text-gray-300 text-xs ml-5 leading-relaxed">
                                            Când clientul aduce mașina înapoi, comanda se marchează automat ca "Finalizată". 
                                            Poți vedea toate comenzile finalizate în secțiunea "Comenzi" și să verifici istoricul 
                                            pentru a vedea cât a plătit fiecare client.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Sections Quick Guide */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {/* Dashboard */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <LayoutDashboard className="w-5 h-5 text-red-400" />
                                        <h4 className="font-bold text-white text-sm">Panou Principal</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Aici vezi rapid cât ai câștigat în total, câte comenzi ai avut și câte mașini sunt 
                                        disponibile momentan. Graficele arată cum merg vânzările pe perioade diferite. 
                                        E util să verifici aici zilnic pentru a vedea cum merge afacerea.
                                    </p>
                                </div>

                                {/* Cereri */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <ShoppingCart className="w-5 h-5 text-red-400" />
                                        <h4 className="font-bold text-white text-sm">Cereri</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Când clienții completează formularul pe site, cererile lor apar aici. 
                                        Vezi numele, telefonul, ce mașină vor și perioada. Poți apăsa pe fiecare cerere 
                                        pentru detalii complete, apoi decizi dacă o aprobi (creând o comandă) sau o respingi.
                                    </p>
                                </div>

                                {/* Comenzi */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileText className="w-5 h-5 text-red-400" />
                                        <h4 className="font-bold text-white text-sm">Comenzi</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Toate închirierile active și finalizate sunt aici. Când aprobi o cerere, 
                                        apare automat o comandă nouă. Apasă pe o comandă pentru a vedea toate detaliile, 
                                        să generezi contractul PDF sau să modifici statusul comenzii.
                                    </p>
                                </div>

                                {/* Mașini */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Car className="w-5 h-5 text-red-400" />
                                        <h4 className="font-bold text-white text-sm">Mașini</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Aici gestionezi toate mașinile din flotă. Poți adăuga mașini noi, modifica prețurile, 
                                        schimba descrierile sau actualiza imaginile. Când o mașină e în service sau nu mai e 
                                        disponibilă, poți marca statusul corespunzător. Clienții vor vedea doar mașinile disponibile.
                                    </p>
                                </div>

                                {/* Calendar */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <CalendarDays className="w-5 h-5 text-red-400" />
                                        <h4 className="font-bold text-white text-sm">Calendar</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Vezi toate rezervările pe un calendar lunar. Fiecare zi arată câte mașini sunt închiriate 
                                        și care. Poți filtra după marcă sau model pentru a vedea doar anumite mașini. 
                                        E foarte util când vrei să verifici rapid disponibilitatea pentru o anumită perioadă.
                                    </p>
                                </div>

                                {/* Utilizatori */}
                                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                                    <div className="flex items-center gap-2 mb-2">
                                        <UsersIcon className="w-5 h-5 text-red-400" />
                                        <h4 className="font-bold text-white text-sm">Utilizatori</h4>
                                    </div>
                                    <p className="text-gray-300 text-xs leading-relaxed">
                                        Lista cu toți clienții care au făcut conturi pe site. Vezi datele lor de contact, 
                                        câte închirieri au făcut și cât au cheltuit în total. Apasă pe un utilizator pentru 
                                        a vedea istoricul complet al comenzilor lui. E util când vrei să contactezi un client 
                                        sau să vezi dacă e client fidel.
                                    </p>
                                </div>
                            </div>

                            {/* Status Colors */}
                            <div className="bg-white/5 rounded-lg p-4 sm:p-6 border border-white/10">
                                <h3 className="text-base sm:text-lg font-bold text-white mb-3 flex items-center gap-2">
                                    <span className="text-xl">🎨</span>
                                    <span>Culorile statusurilor</span>
                                </h3>
                                <p className="text-gray-300 text-xs mb-3 leading-relaxed">
                                    Fiecare comandă sau cerere are o culoare care arată starea ei. 
                                    Asta te ajută să vezi rapid ce trebuie să faci fără să citești tot textul.
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                                        <span className="text-gray-300 text-xs">În așteptare</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-blue-500/20 border border-blue-500/50"></div>
                                        <span className="text-gray-300 text-xs">Activă</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                                        <span className="text-gray-300 text-xs">Finalizată</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-gray-500/20 border border-gray-500/50"></div>
                                        <span className="text-gray-300 text-xs">Anulată</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Tips */}
                            <div className="bg-white/5 rounded-lg p-4 border border-blue-500/20 pb-20">
                                <h3 className="text-base font-bold text-blue-300 mb-2 flex items-center gap-2">
                                    <span>💡</span>
                                    <span>Sfaturi</span>
                                </h3>
                                <div className="space-y-2 text-xs text-blue-200 leading-relaxed">
                                    <p>• Apasă pe orice card sau rând pentru a vedea toate detaliile. Nu trebuie să cauți prin meniuri</p>
                                    <p>• Când ai multe comenzi sau mașini, folosește căutarea de sus. Scrie numele clientului sau mașinii și găsești rapid ce cauți</p>
                                    <p>• Butonul de actualizare (refresh) reîncarcă toate datele. Folosește-l dacă ai impresia că nu vezi ultimele schimbări</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>,
                document.body
            )}
        </>
    );
};

