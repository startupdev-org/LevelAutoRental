import React, { useState, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';

type TimePeriod = '12M' | '30D' | '7D' | '24H' | 'WEEKS';

interface SalesChartCardProps {
    totalSales?: string | number;
    change?: string;
    data?: { day: number; sales: number; baseline: number }[];
    allPeriodData?: {
        '24H'?: { day: number; sales: number; baseline: number }[];
        '7D'?: { day: number; sales: number; baseline: number }[];
        '30D'?: { day: number; sales: number; baseline: number }[];
        'WEEKS'?: { day: number; sales: number; baseline: number }[];
        '12M'?: { day: number; sales: number; baseline: number }[];
    };
    periodStats?: {
        '24H'?: { sales: number; change: number; isPositive: boolean };
        '7D'?: { sales: number; change: number; isPositive: boolean };
        '30D'?: { sales: number; change: number; isPositive: boolean };
        'WEEKS'?: { sales: number; change: number; isPositive: boolean };
        '12M'?: { sales: number; change: number; isPositive: boolean };
    };
}

const generateChartData = (period: TimePeriod) => {
    // Seed for consistent random values
    const seed = 12345;
    const seededRandom = (index: number) => {
        const x = Math.sin(index * seed) * 10000;
        return x - Math.floor(x);
    };

    switch (period) {
        case '24H':
            // Hourly sales: $0-300 per hour (0-2 rentals per hour on average)
            // Lower during night (0-6), higher during day (9-18)
            return Array.from({ length: 24 }).map((_, i) => {
                const hour = i;
                const isNight = hour < 6 || hour > 22;
                const baseSales = isNight ? 20 : 120;
                const variation = Math.sin(i / 6) * 80;
                const random = seededRandom(i) * 60;
                return {
                    day: i + 1,
                    sales: Math.round(baseSales + variation + random),
                    baseline: Math.round(baseSales * 0.7 + variation * 0.5),
                };
            });
        case '7D':
            // Daily sales: $800-3500 per day (3-8 rentals per day)
            return Array.from({ length: 7 }).map((_, i) => {
                const dayOfWeek = i; // 0 = Monday
                const isWeekend = dayOfWeek >= 5; // Saturday, Sunday
                const baseSales = isWeekend ? 2500 : 1800;
                const variation = Math.sin(i / 2) * 400;
                const random = seededRandom(i) * 300;
                return {
                    day: i + 1,
                    sales: Math.round(baseSales + variation + random),
                    baseline: Math.round(baseSales * 0.75 + variation * 0.6),
                };
            });
        case '30D':
            // Daily sales: $1200-4500 per day (4-12 rentals per day)
            return Array.from({ length: 30 }).map((_, i) => {
                const dayOfWeek = i % 7;
                const isWeekend = dayOfWeek >= 5;
                const baseSales = isWeekend ? 3200 : 2200;
                const variation = Math.sin(i / 5) * 600;
                const random = seededRandom(i) * 400;
                return {
                    day: i + 1,
                    sales: Math.round(baseSales + variation + random),
                    baseline: Math.round(baseSales * 0.7 + variation * 0.5),
                };
            });
        case '12M':
            // Monthly sales: $35,000-85,000 per month
            return Array.from({ length: 12 }).map((_, i) => {
                const month = i; // 0 = January
                // Summer months (May-August) have higher sales
                const isPeakSeason = month >= 4 && month <= 7;
                const baseSales = isPeakSeason ? 65000 : 45000;
                const variation = Math.sin(i / 3) * 10000;
                const random = seededRandom(i) * 8000;
                return {
                    day: i + 1,
                    sales: Math.round(baseSales + variation + random),
                    baseline: Math.round(baseSales * 0.75 + variation * 0.6),
                };
            });
        case 'WEEKS':
            // Weekly sales: $8,000-25,000 per week
            return Array.from({ length: 12 }).map((_, i) => {
                const week = i;
                const isHolidayWeek = week === 0 || week === 11; // First and last weeks might be holiday weeks
                const baseSales = isHolidayWeek ? 20000 : 15000;
                const variation = Math.sin(i / 2) * 3000;
                const random = seededRandom(i) * 2000;
                return {
                    day: i + 1,
                    sales: Math.round(baseSales + variation + random),
                    baseline: Math.round(baseSales * 0.7 + variation * 0.5),
                };
            });
        default:
            return Array.from({ length: 30 }).map((_, i) => ({
                day: i + 1,
                sales: Math.round(2200 + Math.sin(i / 5) * 600),
                baseline: Math.round(1500 + Math.cos(i / 5) * 400),
            }));
    }
};

const calculateTotalSales = (data: { sales: number }[]) => {
    return data.reduce((sum, item) => sum + item.sales, 0);
};

const calculateChange = (period: TimePeriod, t: (key: string) => string) => {
    const changes: Record<TimePeriod, string> = {
        '24H': t('admin.dashboard.chart.change.24H'),
        '7D': t('admin.dashboard.chart.change.7D'),
        '30D': t('admin.dashboard.chart.change.30D'),
        '12M': t('admin.dashboard.chart.change.12M'),
        'WEEKS': t('admin.dashboard.chart.change.4W'),
    };
    return changes[period] || t('admin.dashboard.chart.change.default');
};

export const SalesChartCard: React.FC<SalesChartCardProps> = ({ 
    totalSales: initialTotalSales, 
    change: initialChange, 
    data: initialData,
    allPeriodData,
    periodStats
}) => {
    const { t } = useTranslation();
    const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30D');

    const chartData = useMemo(() => {
        // Use allPeriodData if provided (real data for all periods)
        if (allPeriodData && allPeriodData[selectedPeriod]) {
            return allPeriodData[selectedPeriod]!;
        }
        // Use provided data if available and period is 30D (default), otherwise generate based on period
        if (initialData && initialData.length > 0 && selectedPeriod === '30D') {
            return initialData;
        }
        // For WEEKS period, we need to generate weekly data from provided data if available
        if (selectedPeriod === 'WEEKS' && initialData && initialData.length > 0) {
            // Convert daily data to weekly data - show only last 4 weeks (28 days)
            const weeklyData: { day: number; sales: number; baseline: number }[] = [];
            const weeksToShow = 4;
            const daysToUse = Math.min(weeksToShow * 7, initialData.length);
            const dataToUse = initialData.slice(-daysToUse); // Get last N days
            
            for (let week = 0; week < weeksToShow; week++) {
                const weekStart = week * 7;
                const weekEnd = Math.min(weekStart + 7, dataToUse.length);
                const weekSales = dataToUse.slice(weekStart, weekEnd).reduce((sum, day) => sum + day.sales, 0);
                const weekBaseline = dataToUse.slice(weekStart, weekEnd).reduce((sum, day) => sum + day.baseline, 0);
                
                weeklyData.push({
                    day: week + 1,
                    sales: Math.round(weekSales),
                    baseline: Math.round(weekBaseline),
                });
            }
            
            return weeklyData;
        }
        return generateChartData(selectedPeriod);
    }, [selectedPeriod, initialData, allPeriodData]);

    const totalSales = useMemo(() => {
        // Use periodStats if provided (real data)
        if (periodStats && periodStats[selectedPeriod]) {
            return periodStats[selectedPeriod]!.sales;
        }
        // Use provided totalSales if available, otherwise calculate from chart data
        if (initialTotalSales !== undefined) {
            return typeof initialTotalSales === 'number' ? initialTotalSales : parseFloat(String(initialTotalSales).replace(/[^0-9.-]+/g, '')) || 0;
        }
        return calculateTotalSales(chartData);
    }, [chartData, initialTotalSales, selectedPeriod, periodStats]);

    const change = useMemo(() => {
        // Use periodStats if provided (real data)
        if (periodStats && periodStats[selectedPeriod]) {
            const stats = periodStats[selectedPeriod]!;
            const periodLabels: Record<TimePeriod, string> = {
                '24H': 'ultimele 24 ore',
                '7D': 'ultimele 7 zile',
                '30D': 'ultimele 30 zile',
                'WEEKS': 'ultimele 4 săptămâni',
                '12M': 'ultimele 12 luni'
            };
            return `${stats.isPositive ? '↑' : '↓'} ${Math.abs(stats.change).toFixed(1)}% față de ${periodLabels[selectedPeriod]}`;
        }
        // Use provided change if available, otherwise calculate based on period
        if (initialChange) {
            return initialChange;
        }
        return calculateChange(selectedPeriod, t);
    }, [selectedPeriod, initialChange, t, periodStats]);

    const formatTotalSales = (sales: number, period: TimePeriod) => {
        // Use MDL if we have actual data provided (allPeriodData or periodStats), otherwise use $
        const currency = (allPeriodData || periodStats || (initialData && initialData.length > 0)) ? 'MDL' : '$';
        
        if (period === '12M') {
            // For 12 months, show in thousands
            return `${currency === 'MDL' ? '' : currency}${(sales / 1000).toFixed(0)}K${currency === 'MDL' ? ' MDL' : ''}`;
        } else if (period === 'WEEKS') {
            // For weeks, show in thousands if > 1000
            if (sales >= 1000) {
                return `${currency === 'MDL' ? '' : currency}${(sales / 1000).toFixed(1)}K${currency === 'MDL' ? ' MDL' : ''}`;
            }
            return `${currency === 'MDL' ? '' : currency}${sales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${currency === 'MDL' ? ' MDL' : ''}`;
        } else if (period === '30D' || period === '7D') {
            // For daily periods, show in thousands if > 1000
            if (sales >= 1000) {
                return `${currency === 'MDL' ? '' : currency}${(sales / 1000).toFixed(1)}K${currency === 'MDL' ? ' MDL' : ''}`;
            }
            return `${currency === 'MDL' ? '' : currency}${sales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${currency === 'MDL' ? ' MDL' : ''}`;
        } else {
            // For 24H, show exact amount
            return `${currency === 'MDL' ? '' : currency}${sales.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}${currency === 'MDL' ? ' MDL' : ''}`;
        }
    };

    const getPeriodLabel = (period: TimePeriod) => {
        const labels: Record<TimePeriod, string> = {
            '24H': t('admin.dashboard.chart.periods.24H'),
            '7D': t('admin.dashboard.chart.periods.7D'),
            '30D': t('admin.dashboard.chart.periods.30D'),
            'WEEKS': t('admin.dashboard.chart.periods.4W'),
            '12M': t('admin.dashboard.chart.periods.12M'),
        };
        return labels[period];
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-gray-400 uppercase mb-1">{t('admin.dashboard.chart.sales')}</p>
                    <h3 className="text-3xl md:text-4xl font-bold text-white">
                        {formatTotalSales(totalSales, selectedPeriod)}
                    </h3>
                    <p className="mt-2 text-sm text-emerald-400 font-semibold">{change}</p>
                </div>

                <div className="flex items-center gap-2">
                    {(['12M', 'WEEKS', '30D', '7D', '24H'] as TimePeriod[]).map((period) => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                period === selectedPeriod
                                    ? 'bg-red-500/20 text-red-300 border border-red-500/50' 
                                    : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10 hover:text-white'
                            }`}
                        >
                            {getPeriodLabel(period)}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <LineChart data={chartData}>
                        <XAxis 
                            dataKey="day" 
                            tick={{ fontSize: 12, fill: '#D1D5DB' }} 
                            stroke="#374151"
                        />
                        <YAxis 
                            tick={{ fontSize: 12, fill: '#D1D5DB' }} 
                            stroke="#374151"
                        />
                        <Tooltip 
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                color: '#ffffff',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.3)',
                            }}
                        />
                        <Line type="monotone" dataKey="sales" stroke="#EF4444" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="baseline" stroke="#6B7280" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
