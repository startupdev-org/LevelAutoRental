import React, { useMemo } from 'react';
import MonetizationOnOutlinedIcon from "@mui/icons-material/MonetizationOnOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { Card, Grid, Typography, Box, Stack } from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { cars } from '../../data/cars';

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

export const Dashboard: React.FC = () => {

    // Calculated stats
    const totalCars = cars.length;
    const totalReviews = cars.reduce((sum, car) => sum + (car.reviews || 0), 0);
    const avgPrice = Math.round((cars.reduce((sum, car) => sum + (car.pricePerDay || 0), 0) / Math.max(1, totalCars)));

    // Bar chart: cars per category
    const carsByCategory = useMemo(() => {
        const map: Record<string, number> = {};
        cars.forEach(car => {
            const key = car.category || 'Other';
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([category, count]) => ({ category, count }));
    }, []);

    // Line chart: price per car (small sample to avoid overcrowding)
    const priceTrend = useMemo(() => cars.slice(0, 12).map(car => ({ name: car.name.replace(/ .*/, ''), price: car.pricePerDay })), []);

    return (
        <div className="min-h-screen p-6 lg:p-8 max-w-[1400px] mx-auto">
            {/* Header */}
            <div className="mb-6">
                <Typography variant="h4" className="font-bold">Dashboard</Typography>
                <Typography variant="body2" color="textSecondary" className="text-gray-500 mt-1">
                    Snapshot of fleet performance, availability and recent additions.
                </Typography>
            </div>

            {/* Stats */}
            <Grid container spacing={3} className="mb-6">
                <Grid item xs={12} sm={6} md={3}>
                    <CardStats
                        title="Total Cars"
                        value={totalCars}
                        icon={<ShoppingBagOutlinedIcon />}
                        accent="bg-indigo-600"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <CardStats
                        title="Average Price / Day (€)"
                        value={`€${avgPrice}`}
                        icon={<MonetizationOnOutlinedIcon />}
                        accent="bg-green-600"
                    />
                </Grid>

                <Grid item xs={12} sm={6} md={3}>
                    <CardStats
                        title="Total Reviews"
                        value={totalReviews}
                        icon={<AccountCircleOutlinedIcon />}
                        accent="bg-rose-600"
                    />
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
        </div>
    );
};
