import React, { useMemo } from 'react';
import { cars } from '../../data/cars';
import { orders } from '../../data/index';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type OrdersTableProps = {
    title: string;
};

export const OrdersTable: React.FC<OrdersTableProps> = ({ title }) => {

    const navigate = useNavigate();

    return (
        <div className="overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <p className="text-gray-400 uppercase tracking-wider text-xs font-semibold mb-1">Orders</p>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer">All orders</span>
                    <span className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer">Paid</span>
                    <span className="px-3 py-1.5 text-xs font-semibold bg-white/5 border border-white/10 text-gray-300 rounded-lg hover:bg-white/10 hover:text-white transition-all cursor-pointer">Refunded</span>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-white/10">
                    <thead className="bg-white/5">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Order
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Customer
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                        {orders.map((o) => (
                            <tr key={o.id} className="cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => navigate(`/admin?section=orders&orderId=${o.id}`)}
                            >
                                <td className="px-6 py-4 text-white font-semibold">{o.id}</td>
                                <td className="px-6 py-4 text-gray-300 text-sm">{o.date}</td>
                                <td className="px-6 py-4">
                                    <span
                                        className={`px-3 py-1 rounded-lg text-xs font-semibold border backdrop-blur-xl ${o.status === 'Paid'
                                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                                            : o.status === 'Pending'
                                                ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'
                                                : 'bg-red-500/20 text-red-300 border-red-500/50'
                                            }`}
                                    >
                                        {o.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-white font-semibold">${o.amount}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="text-white font-medium">{o.customer}</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
