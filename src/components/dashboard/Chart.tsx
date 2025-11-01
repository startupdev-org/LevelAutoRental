import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

interface SalesChartCardProps {
    totalSales: string | number;
    change: string;
    data: { day: number; sales: number; baseline: number }[];
}

export const SalesChartCard: React.FC<SalesChartCardProps> = ({ totalSales, change, data }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">Sales</p>
                    <h3 className="mt-1 text-2xl md:text-3xl font-bold text-gray-800">${totalSales}</h3>
                    <p className="mt-1 text-sm text-green-600">{change}</p>
                </div>

                <div className="flex items-center gap-2">
                    {(['12M', '30D', '7D', '24H'] as const).map((r) => (
                        <button
                            key={r}
                            className={`px-3 py-1 rounded-full text-sm ${r === '30D' ? 'bg-gray-100 font-bold' : 'bg-white border border-gray-200'
                                }`}
                        >
                            {r === '30D' ? '30 days' : r}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ width: '100%', height: 320 }}>
                <ResponsiveContainer>
                    <LineChart data={data}>
                        <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#4B5563' }} />
                        <YAxis tick={{ fontSize: 12, fill: '#4B5563' }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="sales" stroke="#EF4444" strokeWidth={3} dot={false} />
                        <Line type="monotone" dataKey="baseline" stroke="#E5E7EB" strokeWidth={2} dot={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
