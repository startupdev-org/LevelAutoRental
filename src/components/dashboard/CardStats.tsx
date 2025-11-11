import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export interface CardStatsProps {
    title: string;
    value: string | number;
    spark?: React.ReactNode;
    subtitle?: React.ReactNode;
    trend?: 'up' | 'down';
    trendValue?: string;
    valueSize?: 'sm' | 'md' | 'lg';
}

export const CardStats: React.FC<CardStatsProps> = ({ title, value, spark, subtitle, trend, trendValue, valueSize = 'lg' }) => {
    const getValueSizeClass = () => {
        switch (valueSize) {
            case 'sm':
                return 'text-xl';
            case 'md':
                return 'text-2xl';
            case 'lg':
            default:
                return 'text-3xl';
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="relative group"
        >
            <div className="absolute inset-0 bg-red-500/10 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 hover:border-red-500/50 rounded-xl p-6 transition-all duration-300 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-gray-300 text-xs font-semibold uppercase tracking-wider mb-2">{title}</p>
                        <h4 className={`font-bold ${getValueSizeClass()} text-white mb-2 break-words`}>{value}</h4>
                    {trendValue && (
                        <div className="flex items-center gap-1.5">
                            {trend === 'up' ? (
                                <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                            ) : (
                                <ArrowDownRight className="w-4 h-4 text-red-400" />
                            )}
                            <span className={`text-sm font-semibold ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trendValue}
                            </span>
                        </div>
                    )}
                    {subtitle && <div className="mt-1 text-gray-300 text-sm">{subtitle}</div>}
                    </div>
                    {spark && (
                        <div className="w-32 h-16 flex items-center justify-end opacity-80">
                            {spark}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
