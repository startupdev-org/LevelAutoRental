import React from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';

interface CardStatsProps {
  title: string;
  value: string | number;
  subtitle?: React.ReactNode;
  spark?: any;
}

export const CardStats: React.FC<CardStatsProps> = ({ title, value, subtitle, spark }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 flex justify-between items-start">
      <div>
        <p className="text-xs font-semibold tracking-wider text-red-500 uppercase">{title}</p>
        <h3 className="mt-1 text-2xl md:text-3xl font-bold text-gray-800">{value}</h3>
        {subtitle && <p className="mt-1 text-sm text-gray-500">{subtitle}</p>}
      </div>
      {spark && <div className="w-32 h-12">{spark}</div>}
    </div>
  );
};
