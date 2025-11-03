import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { cars } from '../../data/cars';
import { sparkData, mainChart, orders } from '../../data/index';
import { Sidebar } from '../../components/layout/Sidebar';
import { OrdersTable } from '../../components/dashboard/OrderTable';
import { SalesChartCard } from '../../components/dashboard/Chart';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Calendar, Clock } from 'lucide-react';
import { getDateDiffInDays } from '../../utils/date';

interface CardStatsProps {
    title: string;
    value: string | number;
    spark?: React.ReactNode;
    subtitle?: React.ReactNode;
    accent?: string;
}

const CardStats: React.FC<CardStatsProps> = ({ title, value, spark, subtitle }) => (
    <Card className="p-5 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between gap-4">
            <div>
                <p className="text-gray-400 block tracking-wider text-sm font-medium uppercase">{title}</p>
                <h4 className="font-extrabold mt-1 text-2xl sm:text-3xl text-gray-900">{value}</h4>
                {subtitle && <p className="mt-1 text-gray-500 text-sm sm:text-base">{subtitle}</p>}
            </div>
            {spark && <div className="w-32 h-12 flex items-center justify-end">{spark}</div>}
        </div>
    </Card>
);

// Dashboard View Component
const DashboardView: React.FC = () => {
    const totalCars = cars.length;
    const totalReviews = cars.reduce((s, c) => s + (c.reviews || 0), 0);
    const avgPrice = Math.round(cars.reduce((s, c) => s + (c.pricePerDay || 0), 0) / Math.max(1, totalCars));

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Welcome back, Victorin!
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                    </div>
                    <div className="flex items-center gap-2">
                        <Button className="bg-theme-500 hover:bg-theme-600 ml-1">
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Top stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <CardStats title="Sales" value="$2,114.40" subtitle={<span className="text-green-600">↑ 2.4%</span>} spark={
                    <ResponsiveContainer width="100%" height={36}>
                        <LineChart data={sparkData}>
                            <Line dataKey="y" stroke="#EF4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                } />
                <CardStats title="Orders" value={24} subtitle={<span className="text-green-600">↑ 8.6%</span>} spark={
                    <ResponsiveContainer width="100%" height={36}>
                        <LineChart data={sparkData}>
                            <Line dataKey="y" stroke="#EF4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                } />
                <CardStats title="Average Order Value" value="$88.10" subtitle={<span className="text-green-600">↑ 6.0%</span>} spark={
                    <ResponsiveContainer width="100%" height={36}>
                        <LineChart data={sparkData}>
                            <Line dataKey="y" stroke="#EF4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                } />
            </div>

            {/* Large chart */}
            <div className="col-span-1 md:col-span-3 mt-10 mb-10">
                <SalesChartCard totalSales={8422.6} change="↑ 3.2% vs last 30 days" data={mainChart} />
            </div>

            {/* Orders Table */}
            <div className="col-span-1 md:col-span-3 mt-10 mb-10">
                <OrdersTable title="Recent Orders" />
            </div>
        </>
    );
};

// Orders View Component
const OrdersView: React.FC = () => {
    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Rental Orders
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="hidden sm:block">
                    </div>
                    <div className="flex items-center gap-2">
                        <Button className="bg-theme-500 hover:bg-theme-600 ml-1">
                            Export
                        </Button>
                    </div>
                </div>
            </div>

            {/* Orders Table */}
            <div className="col-span-1 md:col-span-3 mt-10 mb-10">
                <OrdersTable title="All Orders" />
            </div>

            {/* Large chart */}
            <div className="col-span-1 md:col-span-3 mt-10 mb-10">
                <SalesChartCard totalSales={8422.6} change="↑ 3.2% vs last 30 days" data={mainChart} />
            </div>
        </>
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
        <>
            <div className="flex flex-col lg:grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">
                {/* LEFT COLUMN: Order + Car Info */}
                <div className="space-y-6">
                    <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>

                    {/* Car Summary */}
                    <div className="cursor-pointer flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <img
                            src={selectedImage}
                            alt={car.name}
                            className="w-32 h-20 object-cover rounded-md"
                        />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">{car.name}</h2>
                            <div className="text-sm text-gray-500">{car.transmission} · {car.seats} seats</div>
                        </div>
                    </div>

                    {/* Booking Details */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Booking Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-700 text-sm">Pickup: {order.pickupDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-700 text-sm">Pickup Time: {order.pickupTime || '--:--'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-700 text-sm">Return: {order.returnDate}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-500" />
                                <span className="text-gray-700 text-sm">Return Time: {order.returnTime || '--:--'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-700 text-sm">Rental Days: {getDateDiffInDays(order.pickupDate, order.returnDate)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-700 text-sm">Total Price: {getDateDiffInDays(order.pickupDate, order.returnDate) * car.pricePerDay} MDL</span>
                            </div>
                        </div>

                        {car.features?.length > 0 && (
                            <>
                                <h2 className="text-xl font-bold text-gray-900">Additional Features</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {car.features.map((feature, i) => (
                                        <div key={i} className="flex items-center gap-2">
                                            <span className="text-gray-700 text-sm">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Customer Info */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full overflow-hidden">
                                <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                                    C
                                </div>
                            </div>
                            <div>
                                <div className="text-gray-900 font-semibold">{order.customer}</div>
                                <div className="text-gray-500 text-sm">{order.customerEmail}</div>
                            </div>
                        </div>
                    </div>

                    {/* Payment & Status */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Payment</h2>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-gray-700 text-sm">Amount Paid</span>
                                <div className="text-gray-900 font-semibold text-lg">${order.amount}</div>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-sm font-semibold 
                                ${order.status === 'Paid' ? 'bg-green-100 text-green-700' : order.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {order.status}
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    {order.notes && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Notes</h2>
                            <p className="text-gray-700 text-sm">{order.notes}</p>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Actions */}
                <aside className="lg:col-start-2">
                    <div className="sticky top-24 space-y-3">
                        <button
                            className="w-full bg-theme-500 hover:bg-theme-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                            onClick={() => navigate(`/admin?section=orders&orderId=${order.id}&edit=true`)}
                        >
                            Edit Order
                        </button>
                        <button
                            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                            onClick={() => alert('Cancel order action')}
                        >
                            Cancel Order
                        </button>
                    </div>
                </aside>
            </div>
        </>
    );
};

// Placeholder views for other sections
const CarsView: React.FC = () => (
    <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Cars Management</h1>
        <p className="text-gray-600">Cars management coming soon...</p>
    </div>
);

const CalendarView: React.FC = () => (
    <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Calendar</h1>
        <p className="text-gray-600">Calendar view coming soon...</p>
    </div>
);

const UsersView: React.FC = () => (
    <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Users</h1>
        <p className="text-gray-600">Users management coming soon...</p>
    </div>
);

const SettingsView: React.FC = () => (
    <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-6">Settings</h1>
        <p className="text-gray-600">Settings coming soon...</p>
    </div>
);

export const Admin: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [searchParams] = useSearchParams();
    const section = searchParams.get('section') || 'dashboard';
    const orderId = searchParams.get('orderId');

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
        <div className="min-h-screen bg-gray-50 font-sans">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <main
                className="transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? 72 : 280, paddingTop: 32 }}
            >
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

