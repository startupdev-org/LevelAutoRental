import React, { useMemo, useState } from 'react';
import { Card, Grid, Typography, Box, Stack, Chip, Button } from '@mui/material';
import { Menu, X } from 'lucide-react';
import { Table, TableHead, TableBody, TableRow, TableCell, Checkbox } from '@mui/material';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cars } from '../../data/cars';
import { format } from 'date-fns';
import { Sidebar } from '../../components/layout/Sidebar';

interface CardStatsProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    accent?: string;
}

const CardStats: React.FC<CardStatsProps> = ({ title, value, icon, accent = 'bg-indigo-600' }) => (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 3 }} className="shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
                <Typography variant="subtitle2" color="text.secondary" className="uppercase text-xs tracking-wide">
                    {title}
                </Typography>
                <Typography variant="h5" className="mt-1">{value}</Typography>
            </div>
            {icon && (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${accent}`}>
                    {icon}
                </div>
            )}
        </div>
    </Card>
);

const StatCard: React.FC<{ title: string; value: React.ReactNode; spark?: any; subtitle?: React.ReactNode }> = ({ title, value, spark, subtitle }) => (
    <Card className="p-5 shadow-sm rounded-2xl">
        <div className="flex items-start justify-between gap-3">
            <div>
                <div className="text-xs uppercase text-gray-500 font-medium">{title}</div>
                <div className="text-2xl font-bold mt-2">{value}</div>
                {subtitle && <div className="text-xs text-green-600 mt-1">{subtitle}</div>}
            </div>
            <div className="w-28 h-12">{spark}</div>
        </div>
    </Card>
);

export const Dashboard: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [range, setRange] = useState<'12M' | '30D' | '7D' | '24H'>('30D');


    // Stats
    const totalCars = cars.length;
    const totalReviews = cars.reduce((sum, car) => sum + (car.reviews || 0), 0);
    const avgPrice = Math.round(cars.reduce((sum, car) => sum + (car.pricePerDay || 0), 0) / Math.max(1, totalCars));

    // small spark data
    const sparkData = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({ x: i, y: Math.round(40 + Math.sin(i / 2) * 10 + i) })), []);

    const orders = useMemo(
        () =>
            cars.slice(0, 8).map((c, idx) => ({
                id: `#${26678 - idx}`,
                date: format(new Date(Date.now() - idx * 86400000), 'MMM dd, yyyy'),
                status: idx % 3 === 0 ? 'Paid' : idx % 3 === 1 ? 'Pending' : 'Refunded',
                amount: (c.pricePerDay * (1 + (idx % 3)))?.toFixed(2),
                customer: `Customer ${idx + 1}`,
                avatar: c.image,
            })),
        []
    );

    const mainChart = useMemo(
        () =>
            Array.from({ length: 30 }).map((_, i) => ({
                day: i + 1,
                sales: Math.round(2000 + Math.sin(i / 3) * 200 + i * 15),
                baseline: Math.round(1200 + Math.cos(i / 5) * 80 + i * 5),
            })),
        []
    );

    // Charts data
    const carsByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        cars.forEach(car => {
            const key = car.category || 'Other';
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([category, count]) => ({ category, count }));
    }, []);

    const priceTrend = useMemo(() => cars.slice(0, 12).map(car => ({ name: car.name.split(' ')[0], price: car.pricePerDay })), []);

    function setSidebarOpen(arg0: (s: any) => boolean) {
        throw new Error('Function not implemented.');
    }

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

            {/* Main content */}
            {/* Main area */}
            <div className={`transition-all duration-300`} style={{ marginLeft: sidebarCollapsed ? 72 : 280 }}>
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div>
                                <Typography variant="h4" className="font-bold">Welcome back, Olivia</Typography>
                                <div className="text-sm text-gray-500 mt-1">16 January, 2025</div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block">
                                <div className="bg-white border border-gray-100 rounded-full px-3 py-2 text-sm text-gray-600">Jan 10, 2025 — Jan 16, 2025</div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-2 rounded-full bg-white border border-gray-100 text-sm">Custom</button>
                                <Button variant="contained" className="bg-theme-500 hover:bg-theme-600">Export</Button>
                            </div>
                        </div>
                    </div>

                    {/* Top stat cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <StatCard title="Sales" value={`$2,114.40`} spark={<ResponsiveContainer width="100%" height={36}><LineChart data={sparkData}><Line dataKey="y" stroke="#7c3aed" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>} subtitle={<span className="text-green-600">↑ 2.4%</span>} />
                        <StatCard title="Orders" value={24} spark={<ResponsiveContainer width="100%" height={36}><LineChart data={sparkData}><Line dataKey="y" stroke="#7c3aed" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>} subtitle={<span className="text-green-600">↑ 8.6%</span>} />
                        <StatCard title="Average order value" value={`$88.10`} spark={<ResponsiveContainer width="100%" height={36}><LineChart data={sparkData}><Line dataKey="y" stroke="#7c3aed" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer>} subtitle={<span className="text-green-600">↑ 6.0%</span>} />
                    </div>

                    {/* Large chart card */}
                    <Card className="p-6 rounded-2xl mb-6 shadow-sm">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <div className="text-xs uppercase text-gray-500 font-medium">Sales</div>
                                <div className="text-2xl font-bold mt-2">$8,422.60</div>
                                <div className="text-sm text-green-600 mt-1">↑ 3.2% vs last 30 days</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {(['12M', '30D', '7D', '24H'] as const).map((r) => (
                                    <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-sm ${range === r ? 'bg-gray-100' : 'bg-white border border-gray-100'}`}>{r === '30D' ? '30 days' : r}</button>
                                ))}
                            </div>
                        </div>

                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <LineChart data={mainChart}>
                                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="sales" stroke="#7c3aed" strokeWidth={3} dot={false} />
                                    <Line type="monotone" dataKey="baseline" stroke="#c7c7c7" strokeWidth={2} dot={false} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Orders table */}
                    <Card className="p-6 rounded-2xl mb-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <Typography variant="h6" className="font-semibold">Orders</Typography>
                                <div className="text-sm text-green-600">↑ 8.6% vs last 30 days</div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Chip label="All orders" variant="outlined" />
                                <Chip label="Paid" variant="outlined" />
                                <Chip label="Refunded" variant="outlined" />
                            </div>
                        </div>

                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell padding="checkbox"><Checkbox /></TableCell>
                                    <TableCell>Order</TableCell>
                                    <TableCell>Date</TableCell>
                                    <TableCell>Status</TableCell>
                                    <TableCell>Amount</TableCell>
                                    <TableCell>Customer</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {orders.map((o) => (
                                    <TableRow key={o.id}>
                                        <TableCell padding="checkbox"><Checkbox /></TableCell>
                                        <TableCell>{o.id}</TableCell>
                                        <TableCell>{o.date}</TableCell>
                                        <TableCell>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${o.status === 'Paid' ? 'bg-green-50 text-green-700' : o.status === 'Pending' ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-700'}`}>{o.status}</span>
                                        </TableCell>
                                        <TableCell>${o.amount}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <img src={o.avatar} alt={o.customer} className="w-8 h-8 rounded-md object-cover" />
                                                <div>
                                                    <div className="text-sm font-medium">{o.customer}</div>
                                                    <div className="text-xs text-gray-500">—</div>
                                                </div>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Card>

                    {/* Footer quick actions */}
                    <Box className="flex gap-3 mt-4 flex-wrap">
                        <Button variant="contained" className="bg-theme-500 hover:bg-theme-600">Add Car</Button>
                        <Button variant="outlined">Export CSV</Button>
                    </Box>
                </div>
            </div>
        </div>
    );
};
