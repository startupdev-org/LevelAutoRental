import React, { useMemo } from 'react';
import { Card, Grid, Typography, Box, Stack, Avatar, IconButton } from '@mui/material';
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cars } from '../../data/cars';
import { Home, Briefcase, FileText, Calendar as Cal, Users, Settings, LogOut } from 'lucide-react';

// Card Component
interface CardStatsProps {
    title: string;
    value: string | number;
    icon?: React.ReactNode;
    accent?: string;
}

const CardStats: React.FC<CardStatsProps> = ({ title, value, icon, accent = 'bg-theme-500' }) => (
    <Card sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 1, borderRadius: 3 }} className="shadow-sm">
        <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
                <Typography variant="subtitle2" color="textSecondary" className="uppercase text-xs tracking-wide">
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

const Sidebar: React.FC = () => {
    const nav = [
        { key: 'dashboard', label: 'Dashboard', icon: <Home className="w-4 h-4" /> },
        { key: 'cars', label: 'Cars', icon: <Briefcase className="w-4 h-4" /> },
        { key: 'orders', label: 'Orders', icon: <FileText className="w-4 h-4" /> },
        { key: 'calendar', label: 'Calendar', icon: <Cal className="w-4 h-4" /> },
        { key: 'users', label: 'Users', icon: <Users className="w-4 h-4" /> },
        { key: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    ];

    return (
        // fixed on md+ so it stays on the left side of the viewport
        <aside className="hidden md:flex flex-col fixed left-0 top-0 w-72 h-screen bg-white border-r border-gray-100 z-40">
            <div className="px-6 py-6 flex items-center gap-3 border-b border-gray-100">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-theme-500 to-theme-700 flex items-center justify-center text-white font-bold">
                    L
                </div>
                <div>
                    <div className="text-sm font-bold text-gray-900">LevelAuto</div>
                    <div className="text-xs text-gray-400">Admin</div>
                </div>
            </div>

            <nav className="flex-1 overflow-auto px-3 py-6">
                <ul className="space-y-1">
                    {nav.map((n) => (
                        <li key={n.key}>
                            <button
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 ${n.key === 'dashboard' ? 'bg-gray-50 text-gray-900' : 'text-gray-600'
                                    }`}
                            >
                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
                                    {n.icon}
                                </span>
                                <span>{n.label}</span>
                            </button>
                        </li>
                    ))}
                </ul>

                <div className="mt-6 pt-4 border-t border-gray-100">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-3">Your teams</div>
                    <ul className="space-y-2">
                        <li>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-semibold">C</div>
                                <span>Catalog</span>
                            </button>
                        </li>
                        <li>
                            <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                                <div className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-xs font-semibold">W</div>
                                <span>Warpspeed</span>
                            </button>
                        </li>
                    </ul>
                </div>
            </nav>

            <div className="px-4 py-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                    <Avatar alt="Olivia" sx={{ width: 40, height: 40 }}>O</Avatar>
                    <div className="flex-1">
                        <div className="text-sm font-semibold text-gray-900">Olivia Rhye</div>
                        <div className="text-xs text-gray-500">olivia@levelauto.rent</div>
                    </div>
                    <IconButton size="small" className="text-gray-500">
                        <LogOut className="w-4 h-4" />
                    </IconButton>
                </div>
            </div>
        </aside>
    );
};

export const Dashboard: React.FC = () => {
    // Calculated stats
    const totalCars = cars.length;
    const totalReviews = cars.reduce((sum, car) => sum + (car.reviews || 0), 0);
    const avgPrice = Math.round((cars.reduce((sum, car) => sum + (car.pricePerDay || 0), 0) / Math.max(1, totalCars)));

    // Bar chart: cars per category
    const carsByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        cars.forEach(car => {
            const key = (car.category || 'Other');
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([category, count]) => ({ category, count }));
    }, []);

    // Line chart: price per car (small sample to avoid overcrowding)
    const priceTrend = useMemo(() => cars.slice(0, 12).map(car => ({ name: car.name.split(' ')[0], price: car.pricePerDay })), []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex gap-6">
                    <Sidebar />

                    <main className="flex-1 py-8">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <Typography variant="h4" className="font-bold">Dashboard</Typography>
                                <div className="text-sm text-gray-500 mt-1">Snapshot of fleet performance, availability and recent additions.</div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="text-sm text-gray-500">Jan 10, 2025 — Jan 16, 2025</div>
                                <button className="px-4 py-2 rounded-2xl bg-theme-500 text-white hover:bg-theme-600 transition">Export</button>
                            </div>
                        </div>

                        {/* Stats */}
                        <Grid container spacing={3} className="mb-6">
                            <Grid item xs={12} sm={6} md={3}>
                                <CardStats title="Total Cars" value={totalCars} icon={<ShoppingBagOutlinedIcon />} accent="bg-indigo-600" />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <CardStats title="Average Price / Day (€)" value={`€${avgPrice}`} icon={<MonetizationOnOutlinedIcon />} accent="bg-green-600" />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <CardStats title="Total Reviews" value={totalReviews} icon={<AccountCircleOutlinedIcon />} accent="bg-rose-600" />
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <CardStats title="Popular Locations" value={`${Array.from(new Set(cars.map(c => c.location))).slice(0, 2).join(', ') || '—'}`} icon={<PlaceOutlinedIcon />} accent="bg-yellow-600" />
                            </Grid>
                        </Grid>

                        {/* Charts */}
                        <Grid container spacing={3} className="mb-6">
                            <Grid item xs={12} md={6}>
                                <Card sx={{ p: 3 }} className="h-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <Typography variant="subtitle1" className="font-semibold">Cars by Category</Typography>
                                        <Typography variant="caption" color="textSecondary">last 12 months</Typography>
                                    </div>
                                    <div style={{ width: '100%', height: 260 }}>
                                        <ResponsiveContainer>
                                            <BarChart data={carsByCategory}>
                                                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <Card sx={{ p: 3 }} className="h-full">
                                    <div className="flex items-center justify-between mb-3">
                                        <Typography variant="subtitle1" className="font-semibold">Price Trend (sample)</Typography>
                                        <Typography variant="caption" color="textSecondary">recent models</Typography>
                                    </div>
                                    <div style={{ width: '100%', height: 260 }}>
                                        <ResponsiveContainer>
                                            <LineChart data={priceTrend}>
                                                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                                                <YAxis />
                                                <Tooltip />
                                                <Line type="monotone" dataKey="price" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Recent Cars */}
                        <div className="mb-6">
                            <Typography variant="h6" className="font-semibold mb-3">Recent Cars</Typography>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {cars.slice(0, 12).map(car => (
                                    <Card key={car.id} sx={{ p: 0, overflow: 'hidden' }} className="rounded-xl">
                                        <div className="relative">
                                            <img src={car.image} alt={car.name} className="w-full h-36 object-cover" />
                                            <span className="absolute left-3 top-3 bg-white/90 text-sm px-2 py-1 rounded-md border border-gray-200 font-medium">{car.year}</span>
                                        </div>
                                        <div className="p-3">
                                            <div className="flex items-center justify-between mb-1">
                                                <Typography variant="subtitle2" className="font-semibold">{car.name}</Typography>
                                                <div className="text-sm font-bold text-gray-800">€{car.pricePerDay}</div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm text-gray-500">
                                                <div>{car.seats} seats</div>
                                                <div className="capitalize">{car.transmission}</div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </div>

                        {/* Footer quick actions */}
                        <Box className="flex gap-3 mt-4 flex-wrap">
                            <Stack direction="row" spacing={2} className="w-full md:w-auto">
                                <button className="px-4 py-2 rounded-2xl bg-theme-500 text-white font-semibold hover:bg-theme-600 transition">
                                    Add Car
                                </button>
                                <button className="px-4 py-2 rounded-2xl bg-gray-100 text-gray-700 hover:bg-gray-200 transition">
                                    Export CSV
                                </button>
                            </Stack>
                        </Box>
                    </main>
                </div>
            </div>
        </div>
    );
};
