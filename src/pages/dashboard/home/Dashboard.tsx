import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { format } from 'date-fns';
import { cars } from '../../../data/cars';
import { sparkData, mainChart } from '../../../data/index';
import { Sidebar } from '../../../components/layout/Sidebar';
import { OrdersTable } from '../../../components/dashboard/OrderTable';
import { SalesChartCard } from '../../../components/dashboard/Chart';
import { getCurrentFormattedDate } from '../../../utils/date';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';

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

const RecentCarCard: React.FC<{ car: any }> = ({ car }) => (
    <Card className="overflow-hidden rounded-2xl shadow-sm hover:shadow-md transition">
        <div className="relative">
            <img src={car.image} alt={car.name} className="w-full h-44 object-cover" />
            <div className="absolute left-3 top-3 bg-white/90 px-2 py-1 rounded-md text-xs font-semibold border border-gray-100">
                {car.year}
            </div>
            <div className="absolute right-3 bottom-3 bg-black/60 text-white px-3 py-1 rounded-full text-sm font-semibold">
                €{car.pricePerDay}
            </div>
        </div>
        <div className="p-4">
            <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-semibold">{car.name}</div>
                <div className="text-xs text-gray-500">{car.seats} seats</div>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="capitalize">{car.transmission}</div>
                <div className="flex items-center gap-2">
                    <div className="text-yellow-500 font-semibold">★ {car.rating ?? '—'}</div>
                </div>
            </div>
        </div>
    </Card>
);

export const Dashboard: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    // Stats
    const totalCars = cars.length;
    const totalReviews = cars.reduce((s, c) => s + (c.reviews || 0), 0);
    const avgPrice = Math.round(cars.reduce((s, c) => s + (c.pricePerDay || 0), 0) / Math.max(1, totalCars));

    const orders = useMemo(
        () =>
            cars.slice(0, 8).map((c, idx) => ({
                id: `#${26678 - idx}`,
                date: format(new Date(Date.now() - idx * 86400000), 'MMM dd, yyyy'),
                status: idx % 3 === 0 ? 'Paid' : idx % 3 === 1 ? 'Pending' : 'Refunded',
                amount: (c.pricePerDay * (1 + (idx % 3))).toFixed(2),
                customer: `Customer ${idx + 1}`,
                avatar: c.image,
            })),
        []
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            <main
                className="transition-all duration-300"
                style={{ marginLeft: sidebarCollapsed ? 72 : 280, paddingTop: 32 }}
            >
                <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
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
                </div>
            </main>
        </div>
    );
};
