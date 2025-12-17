import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { sparkData } from '../../../data/index';
import { fetchCars } from '../../../lib/cars';
import { fetchImagesByCarName } from '../../../lib/db/cars/cars';
import { SalesChartCard } from '../../../components/dashboard/Chart';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { CardStats } from '../../../components/dashboard/CardStats';
import { Car as CarType } from '../../../types';
import { useTranslation } from 'react-i18next';
import { OrderDisplay } from '../../../lib/orders';
import {
    cancelRentalOrder,
    redoRentalOrder,
    fetchAllOrders
} from '../../../lib/orders';
import { useNotification } from '../../../components/ui/NotificationToaster';
import { RentalDetailsModal } from '../../../components/modals/OrderDetailsModal';

// Dashboard View Component
export const DashboardView: React.FC = () => {
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
        

        const freeCars = cars.filter(car => {
            // Normalize status: handle null, empty string, and different cases
            const rawStatus = car.status?.trim() || '';
            const carStatus = rawStatus.toLowerCase();

            // Check if car has active rental orders
            const hasActiveOrder = orders.some(order =>
                parseInt(order.carId) === parseInt(car.id, 10) &&
                (order.status === 'ACTIVE' || order.type === 'rental')
            );

            // Consider available if status is null, empty, 'available', or not explicitly 'ascuns'/'hidden'/'maintenance'/rented
            const isAvailableStatus = carStatus === '' || carStatus === 'available' ||
                (carStatus !== 'ascuns' && carStatus !== 'hidden' && carStatus !== 'maintenance' &&
                    carStatus !== 'deleted' && carStatus !== 'închiriat' && carStatus !== 'rented' && carStatus !== 'borrowed');

            // Car is free only if it has available status AND no active orders
            return isAvailableStatus && !hasActiveOrder;
        });

        const rentedCars = cars.filter(car => {
            const rawStatus = car.status?.trim() || '';
            const carStatus = rawStatus.toLowerCase();
            // Check if car has active rental orders OR status indicates it's rented
            const hasActiveOrder = orders.some(order =>
                parseInt(order.carId) === parseInt(car.id, 10) &&
                (order.status === 'ACTIVE' || order.type === 'rental')
            );
            return hasActiveOrder || carStatus === 'închiriat' || carStatus === 'rented' || carStatus === 'borrowed';
        });

        

        return { freeCars, rentedCars };
    };

    const { freeCars, rentedCars } = getCarRentalStatus();

    // Calculate chart data from orders based on time period
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
        // Filter only COMPLETED rental orders for sales calculation
        const rentalOrders = orders.filter(order =>
            order.type === 'rental' &&
            order.status === 'COMPLETED'
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
                        <ResponsiveContainer width="65%" height={36}>
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
                        <ResponsiveContainer width="65%" height={36}>
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
                            <ResponsiveContainer width="65%" height={36}>
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
                                                            const formattedDate = returnDate.toLocaleDateString(t('config.date'), {
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
                                        parseInt(order.carId) === parseInt(car.id, 10) &&
                                        order.type === 'rental' &&
                                        order.status === 'COMPLETED'
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

                                // If no cars with rentals, show empty state
                                if (carStats.length === 0) {
                                    return (
                                        <div className="text-center py-8 text-gray-400">
                                            <p className="text-sm">Nu există date disponibile</p>
                                        </div>
                                    );
                                }

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
            <RentalDetailsModal
                isOpen={showOrderDetailsModal}
                onClose={() => {
                    setShowOrderDetailsModal(false);
                    setSelectedOrder(null);
                }}
                order={selectedOrder}
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
            />
        </motion.div>
    );
};

